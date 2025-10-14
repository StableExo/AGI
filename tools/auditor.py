import ast
import sys
import threading

class HarmonicVisitor(ast.NodeVisitor):
    """
    An AST visitor that checks for the 'Parakeet Harmonic' signature in Python classes.
    """
    def __init__(self):
        self.errors = []
        self._current_class = None

    def visit_ClassDef(self, node):
        self._current_class = node.name
        has_init_lock = False
        public_methods = {}

        # First pass: find __init__ and all public methods
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                if item.name == '__init__':
                    has_init_lock = self._check_init_for_lock(item)
                elif not item.name.startswith('_'):
                    public_methods[item.name] = item

        # If no lock is found in __init__, that's a failure for the whole class.
        if not has_init_lock:
            self.errors.append(f"Dissonance Detected: Class '{self._current_class}' does not instantiate 'self.lock = threading.Lock()' in its __init__ method.")
            # The core heartbeat is missing. Do not proceed to check other methods for this class.
            self._current_class = None
            return # HALT traversal for this class

        # If the lock is present, proceed to check the gatekeeper rule for all public methods.
        for method_name, method_node in public_methods.items():
            if not self._is_gated_by_lock(method_node):
                self.errors.append(f"Dissonance Detected: Method '{method_name}' in class '{self._current_class}' is not gated by the instance lock.")

        # Continue traversal to find other classes in the file.
        self.generic_visit(node)
        self._current_class = None

    def _check_init_for_lock(self, init_node: ast.FunctionDef) -> bool:
        """Rule A: The __init__ method must instantiate threading.Lock."""
        for stmt in init_node.body:
            # Look for an assignment statement
            if not isinstance(stmt, ast.Assign):
                continue
            # Check for `self.lock`
            if len(stmt.targets) == 1 and isinstance(stmt.targets[0], ast.Attribute):
                attr = stmt.targets[0]
                if isinstance(attr.value, ast.Name) and attr.value.id == 'self' and attr.attr == 'lock':
                    # Check for `threading.Lock()`
                    if isinstance(stmt.value, ast.Call) and isinstance(stmt.value.func, ast.Attribute):
                        call_func = stmt.value.func
                        if (isinstance(call_func.value, ast.Name) and
                            call_func.value.id == 'threading' and
                            call_func.attr == 'Lock'):
                            return True
        return False

    def _is_gated_by_lock(self, method_node: ast.FunctionDef) -> bool:
        """Rule B: The entire method body must be a single `with self.lock:` block."""
        body = method_node.body

        # Account for a docstring, which is an Expr node with a Str value.
        if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, (ast.Str, ast.Constant)):
            # If there's a docstring, check the statements *after* it.
            body = body[1:]

        # The effective body must contain exactly one statement.
        if len(body) != 1:
            return False

        # That one statement must be a `With` statement.
        with_stmt = body[0]
        if not isinstance(with_stmt, ast.With):
            return False

        # The `with` item must be `self.lock`.
        if len(with_stmt.items) != 1:
            return False

        with_item = with_stmt.items[0].context_expr
        if (isinstance(with_item, ast.Attribute) and
            isinstance(with_item.value, ast.Name) and
            with_item.value.id == 'self' and
            with_item.attr == 'lock'):
            return True

        return False

def audit_file(filepath: str):
    """
    Parses a Python file and uses the HarmonicVisitor to check for dissonance.
    """
    try:
        with open(filepath, 'r') as f:
            source_code = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at '{filepath}'")
        sys.exit(1)
    except Exception as e:
        print(f"Error: Could not read file '{filepath}': {e}")
        sys.exit(1)

    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        print(f"Error: Could not parse file '{filepath}'. Invalid Python syntax: {e}")
        sys.exit(1)

    visitor = HarmonicVisitor()
    visitor.visit(tree)

    if visitor.errors:
        for error in visitor.errors:
            print(error)
        sys.exit(1)
    else:
        print("STATUS: HARMONIC SIGNATURE VERIFIED.")
        sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 tools/auditor.py <path_to_python_file>")
        sys.exit(1)

    target_file = sys.argv[1]
    audit_file(target_file)