# tools/codebase_auditor.py
"""
A tool for programmatically analyzing the project's Python source code.

Initial Capability: Dead Code Detection
- Scans the codebase to identify and report unused functions and classes.
"""

import ast
import os

# Directories to be analyzed
TARGET_DIRECTORIES = [
    "builder-operations",
    "ethics_engine",
    "exploit_dev",
    "jules_core",
    "tools",
    "utils",
]

class CodeVisitor(ast.NodeVisitor):
    """
    An AST visitor that collects defined and used names.
    """
    def __init__(self):
        self.defined = set()
        self.used = set()

    def visit_FunctionDef(self, node):
        self.defined.add(node.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        self.defined.add(node.name)
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used.add(node.id)

    def visit_Attribute(self, node):
        # When we see an attribute access like 'x.y', we need to find the root 'x'
        # and consider it "used". We traverse down the attribute chain.
        current_node = node
        while isinstance(current_node, ast.Attribute):
            current_node = current_node.value
        if isinstance(current_node, ast.Name):
            self.used.add(current_node.id)
        self.generic_visit(node)


def find_python_files(directories):
    """Recursively finds all Python files in the given directories."""
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(".py"):
                    yield os.path.join(root, file)


def analyze_codebase(files):
    """
    Analyzes the Python files to find defined and used functions/classes.
    Returns two sets: one of defined names and one of used names.
    """
    visitor = CodeVisitor()
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as source:
            try:
                tree = ast.parse(source.read(), filename=file_path)
                visitor.visit(tree)
            except (SyntaxError, UnicodeDecodeError) as e:
                print(f"Warning: Could not parse {file_path}. Reason: {e}")
    return visitor.defined, visitor.used


def main():
    """
    Main function to run the codebase auditor.
    """
    print("Starting Codebase Auditor...")
    py_files = list(find_python_files(TARGET_DIRECTORIES))

    # Exclude this file itself from the analysis
    this_file = os.path.abspath(__file__)
    py_files = [f for f in py_files if os.path.abspath(f) != this_file]

    defined_names, used_names = analyze_codebase(py_files)

    # Dead code is the set of defined names that are never used.
    dead_code = defined_names - used_names

    # Filter out common false positives and test patterns.
    # - __init__: Special method, not called directly by name.
    # - main: Standard entry point for executable scripts.
    # - setUp, tearDown: Standard test fixture methods.
    # - Test*, test_*: Convention for test classes and methods discovered by runners.
    common_false_positives = {"__init__", "main", "setUp", "tearDown"}

    # We will build a new set of actual dead code, ignoring test-related code.
    truly_dead_code = set()
    for name in dead_code:
        if name in common_false_positives:
            continue
        if name.startswith("test_"):
            continue
        if name.startswith("Test"):
            continue
        truly_dead_code.add(name)

    if truly_dead_code:
        print("\nPotential Dead Code (Unused Functions/Classes):")
        for name in sorted(list(truly_dead_code)):
            print(f"- {name}")
    else:
        print("\nNo obvious dead code found.")

    print("\nCodebase Auditor finished.")

if __name__ == "__main__":
    main()