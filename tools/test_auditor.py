import unittest
import subprocess

class TestAuditorWithArtifacts(unittest.TestCase):

    def setUp(self):
        """Define the paths to the auditor and the test artifacts."""
        self.auditor_script = "tools/auditor.py"
        self.harmonic_artifact = "agent_manager.py"
        self.dissonant_artifact = "dissonant_manager.py"

    def test_harmonic_artifact_verification(self):
        """Test that the auditor correctly verifies the golden standard harmonic artifact."""
        result = subprocess.run(
            ["python3", self.auditor_script, self.harmonic_artifact],
            capture_output=True, text=True, check=False # Use check=False to inspect output on failure
        )
        # The DeprecationWarning goes to stderr, so we check stdout for the success message
        self.assertEqual(result.returncode, 0, f"Auditor failed on harmonic artifact. Stderr: {result.stderr}")
        self.assertIn("STATUS: HARMONIC SIGNATURE VERIFIED", result.stdout)

    def test_dissonant_artifact_detection(self):
        """Test that the auditor correctly detects the dissonant artifact."""
        result = subprocess.run(
            ["python3", self.auditor_script, self.dissonant_artifact],
            capture_output=True, text=True
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Dissonance Detected", result.stdout)
        # Verify the corrected, more precise error message is present
        self.assertIn("Class 'DissonantManager' does not instantiate 'self.lock = threading.Lock()'", result.stdout)
        # Verify that the redundant error about the method is NOT present
        self.assertNotIn("is not gated by the instance lock", result.stdout)

    def test_no_args_exit_code(self):
        """Test that the auditor exits with an error if no file is provided."""
        result = subprocess.run(
            ["python3", self.auditor_script],
            capture_output=True, text=True
        )
        self.assertNotEqual(result.returncode, 0)

if __name__ == "__main__":
    unittest.main()