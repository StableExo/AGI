import unittest
import os
import tempfile
import shutil
from tools.codebase_auditor import analyze_codebase, find_python_files

class TestCodebaseAuditor(unittest.TestCase):
    """
    Tests for the Codebase Auditor tool.
    """

    def setUp(self):
        """
        Set up a temporary directory with dummy Python files for testing.
        """
        self.test_dir = tempfile.mkdtemp()

        self.dummy_code_1 = """
class UsedClass:
    def __init__(self):
        pass

def used_function():
    return "I am used."

class UnusedClass:
    pass

def unused_function():
    return "I am not used."
"""

        self.dummy_code_2 = """
from dummy_module_1 import UsedClass, used_function

def main_app_function():
    instance = UsedClass()
    result = used_function()
    print(instance, result)

# This call makes main_app_function "used" within its own file.
main_app_function()
"""
        with open(os.path.join(self.test_dir, "dummy_module_1.py"), "w") as f:
            f.write(self.dummy_code_1)

        with open(os.path.join(self.test_dir, "main_app.py"), "w") as f:
            f.write(self.dummy_code_2)

    def tearDown(self):
        """
        Clean up the temporary directory.
        """
        shutil.rmtree(self.test_dir)

    def test_dead_code_detection(self):
        """
        Test that the auditor correctly identifies unused classes and functions.
        """
        py_files = list(find_python_files([self.test_dir]))
        defined_names, used_names = analyze_codebase(py_files)

        dead_code = defined_names - used_names

        # The main script filters out __init__ as a common false positive,
        # so we replicate that logic here for an accurate test.
        dead_code.discard("__init__")

        # UnusedClass and unused_function are defined but never imported or called.
        expected_dead_code = {"UnusedClass", "unused_function"}

        self.assertEqual(dead_code, expected_dead_code)

if __name__ == "__main__":
    unittest.main()