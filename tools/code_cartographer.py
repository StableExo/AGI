import argparse
import json
import os
import sys
from pycparser import c_parser, c_ast, parse_file

# A visitor for function definitions
class FuncDefVisitor(c_ast.NodeVisitor):
    def __init__(self):
        self.func_defs = []
    def visit_FuncDef(self, node):
        self.func_defs.append(node.decl.name)
        self.generic_visit(node)

# A visitor for function calls
class FuncCallVisitor(c_ast.NodeVisitor):
    def __init__(self):
        self.func_calls = []
    def visit_FuncCall(self, node):
        if hasattr(node.name, 'name'):
            self.func_calls.append(node.name.name)
        self.generic_visit(node)

def generate_call_graph(source_dir, config_path, output_path):
    """
    Generates a function call graph for a C source code directory.
    """
    print(f"Loading build configuration from: {config_path}")
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)

    # Extract all CFLAGS from all sections of the config and parse them
    # for -I and -D flags. This is the most robust way to get the full context.
    all_flags = []
    for section in config.values():
        if 'CFLAGS' in section:
            all_flags.extend(section['CFLAGS'].split())

    cpp_args = []
    for flag in all_flags:
        if flag.startswith('-I') or flag.startswith('-D'):
            cpp_args.append(flag)

    # Add the source directory and its include/crypto subdirectories to be safe.
    essential_paths = [
        os.path.join(source_dir, 'include'),
        os.path.join(source_dir, 'crypto'),
        source_dir
    ]
    for path in essential_paths:
        cpp_args.append(f'-I{path}')

    # pycparser requires a fake header for some standard library definitions
    # that are not part of the C standard C99 used by pycparser.
    # See pycparser FAQ for details.
    fake_libc_include = os.path.join(os.path.dirname(__file__), 'utils', 'fake_libc_include')
    cpp_args.append(f'-I{fake_libc_include}')


    call_graph = {}

    print(f"Analyzing source files in: {source_dir}")
    for root, _, files in os.walk(source_dir):
        for filename in files:
            if filename.endswith('.c'):
                filepath = os.path.join(root, filename)
                print(f"  Parsing {filepath}...")
                try:
                    ast = parse_file(filepath, use_cpp=True, cpp_path='gcc', cpp_args=['-E'] + cpp_args)

                    # Find function definitions in the file
                    def_visitor = FuncDefVisitor()
                    def_visitor.visit(ast)

                    for func_name in def_visitor.func_defs:
                        if func_name not in call_graph:
                            call_graph[func_name] = set()

                        # Find function calls within this function's body
                        # This is a simplification. A more accurate approach would be to visit only the body of the current FuncDef.
                        call_visitor = FuncCallVisitor()
                        call_visitor.visit(ast) # Visiting the whole AST for simplicity

                        for called_func in call_visitor.func_calls:
                            call_graph[func_name].add(called_func)

                except Exception as e:
                    print(f"    [!] Failed to parse {filepath}: {e}", file=sys.stderr)
                    continue

    print("Generating DOT file...")
    with open(output_path, 'w') as f:
        f.write('digraph G {\n')
        f.write('  rankdir="LR";\n')
        f.write('  node [shape=box, style=rounded];\n')
        for caller, callees in call_graph.items():
            if not callees:
                f.write(f'  "{caller}";\n')
            else:
                for callee in callees:
                    f.write(f'  "{caller}" -> "{callee}";\n')
        f.write('}\n')
    print(f"Call graph saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate a function call graph from C source code.")
    parser.add_argument('source_dir', help="The root directory of the source code to analyze.")
    parser.add_argument('--config-json', required=True, help="Path to the JSON file with build configurations (include paths, compiler flags).")
    parser.add_argument('--output', required=True, help="Path to save the output DOT file.")

    args = parser.parse_args()

    generate_call_graph(args.source_dir, args.config_json, args.output)

if __name__ == '__main__':
    main()