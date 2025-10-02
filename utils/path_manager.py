import sys
import os

def add_project_root_to_path():
    """
    Adds the project root directory to the Python path.
    The project root is assumed to be the parent directory of 'utils'.
    """
    # The path of the current file (utils/path_manager.py)
    current_file_path = os.path.abspath(__file__)
    # The path of the 'utils' directory
    utils_dir_path = os.path.dirname(current_file_path)
    # The path of the project root (one level up from 'utils')
    project_root = os.path.dirname(utils_dir_path)

    # Add the project root to sys.path if it's not already there
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

# Automatically add the project root to the path when this module is imported.
add_project_root_to_path()