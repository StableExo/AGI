import os
import subprocess
import unittest
import shutil
import json
import time

class TestScribeIntegration(unittest.TestCase):

    TEST_MEMORY_DIR = ".test_memory/"
    SCRIBE_PATH = "tools/scribe.py"
    MNEMOSYNE_PATH = "tools/mnemosyne.py"
    INDEXER_PATH = "tools/memory_indexer.py"

    def setUp(self):
        """Set up a clean environment for each test."""
        # Remove the test directory if it exists
        if os.path.exists(self.TEST_MEMORY_DIR):
            shutil.rmtree(self.TEST_MEMORY_DIR)
        # Create a fresh test directory
        os.makedirs(self.TEST_MEMORY_DIR)
        # Monkey-patch the configuration in the tools to use the test directory
        self._patch_tool_configs()

    def tearDown(self):
        """Clean up the environment after each test."""
        # Restore the original tool configurations
        self._restore_tool_configs()
        # Remove the test directory
        if os.path.exists(self.TEST_MEMORY_DIR):
            shutil.rmtree(self.TEST_MEMORY_DIR)

    def _patch_tool_configs(self):
        """Temporarily modify the tool scripts to use the test memory directory."""
        self._original_files = {}
        for tool_path in [self.SCRIBE_PATH, self.MNEMOSYNE_PATH, self.INDEXER_PATH]:
            with open(tool_path, 'r') as f:
                content = f.read()
                self._original_files[tool_path] = content
            # Replace the memory dir path with the test one
            updated_content = content.replace('MEMORY_DIR = ".memory/"', f'MEMORY_DIR = "{self.TEST_MEMORY_DIR}"')
            with open(tool_path, 'w') as f:
                f.write(updated_content)

    def _restore_tool_configs(self):
        """Restore the original content of the tool scripts."""
        for tool_path, original_content in self._original_files.items():
            with open(tool_path, 'w') as f:
                f.write(original_content)

    def test_scribe_creates_and_indexes_memory(self):
        """
        Verify that running scribe creates a memory file and an immediately searchable index.
        """
        # 1. Define the content for the new memory
        objective = "Test the self-indexing capability of the scribe tool"
        plan = "1. Run scribe. 2. Verify index. 3. Search with mnemosyne."
        actions = "python3 tools/scribe.py --objective='...'"
        learnings = "The key learning is that incremental indexing should work automatically."
        artifacts = "tools/scribe.py, .test_memory/"

        # 2. Run the enhanced scribe.py script
        cmd = [
            "python3", self.SCRIBE_PATH,
            "--objective", objective,
            "--plan", plan,
            "--actions", actions,
            "--key-learnings", learnings,
            "--artifacts-changed", artifacts
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # Assert that the scribe command ran successfully
        self.assertEqual(result.returncode, 0, f"Scribe script failed with output:\\n{result.stderr}")
        self.assertIn("Successfully created memory entry", result.stdout)
        self.assertIn("--- Incremental indexing complete! ---", result.stdout)

        # 3. Verify that the memory file, index, and mapping were created
        # We filter for timestamp-based filenames to ignore log.md
        memory_files = [f for f in os.listdir(self.TEST_MEMORY_DIR) if f.endswith('.md') and f.split('.')[0].isdigit()]
        self.assertEqual(len(memory_files), 1, "Expected exactly one timestamped memory file to be created.")

        index_file = os.path.join(self.TEST_MEMORY_DIR, "memory_index.faiss")
        mapping_file = os.path.join(self.TEST_MEMORY_DIR, "index_to_filename.json")
        self.assertTrue(os.path.exists(index_file), "FAISS index file was not created.")
        self.assertTrue(os.path.exists(mapping_file), "Index mapping file was not created.")

        # 4. Verify the contents of the mapping file
        with open(mapping_file, 'r') as f:
            mapping = json.load(f)
        self.assertEqual(len(mapping), 1, "Mapping file should contain exactly one entry.")
        self.assertEqual(list(mapping.values())[0], memory_files[0])

        # Give a moment for file system to settle before searching
        time.sleep(1)

        # 5. Use mnemosyne.py to search for the new memory
        search_query = "self-indexing scribe"
        search_cmd = ["python3", self.MNEMOSYNE_PATH, search_query]
        search_result = subprocess.run(search_cmd, capture_output=True, text=True)

        # Assert that the search command ran successfully
        self.assertEqual(search_result.returncode, 0, f"Mnemosyne script failed with output:\\n{search_result.stderr}")

        # 6. Verify that the search result contains the content of the new memory
        self.assertIn("--- Search Results ---", search_result.stdout)
        self.assertIn(objective, search_result.stdout, "The search result did not contain the new memory's objective.")
        self.assertIn(memory_files[0], search_result.stdout, "The search result did not reference the correct memory file.")

if __name__ == '__main__':
    unittest.main()