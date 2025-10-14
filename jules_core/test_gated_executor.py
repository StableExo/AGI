import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add the parent directory to the system path to allow module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jules_core.gated_executor import (
    _format_plan_for_review,
    _gather_context_for_review,
    run_gated_plan
)

class TestGatedExecutor(unittest.TestCase):

    def setUp(self):
        """Set up common test data."""
        self.test_plan_string = """
        1. *Create a file.* This is the first step.
        2. *Write to the file.* This is the second step.
        3. *Delete the file.* This is the third step.
        """
        self.test_objective = "A test objective."
        self.test_directive = "A test user directive."

    def test_format_plan_for_review(self):
        """Verify that the plan formatter creates the correct dictionary structure."""
        # Test case for a plan that should be approved
        acknowledged_plan_string = self.test_plan_string + "\\nI acknowledge this plan."
        plan_dict_acknowledged = _format_plan_for_review(acknowledged_plan_string, self.test_objective)
        self.assertEqual(plan_dict_acknowledged['objective'], self.test_objective)
        self.assertTrue(plan_dict_acknowledged['acknowledged_context'])
        self.assertEqual(len(plan_dict_acknowledged['steps']), 3)
        self.assertEqual(plan_dict_acknowledged['steps'][0], "*Create a file.* This is the first step.")
        self.assertEqual(plan_dict_acknowledged['steps'][2], "*Delete the file.* This is the third step.")

        # Test case for a plan that should be rejected
        unacknowledged_plan_string = self.test_plan_string
        plan_dict_unacknowledged = _format_plan_for_review(unacknowledged_plan_string, self.test_objective)
        self.assertFalse(plan_dict_unacknowledged['acknowledged_context'])

    @patch('subprocess.run')
    def test_gather_context_for_review(self, mock_subprocess_run):
        """Verify that the context gatherer calls shell commands and formats the output."""
        # Mock the return values for the subprocess calls
        mock_git = MagicMock()
        mock_git.stdout = 'test-branch\n'
        mock_ls = MagicMock()
        mock_ls.stdout = 'file1.txt\ndirectory/\n'

        # The first call is 'git', the second is 'ls'
        mock_subprocess_run.side_effect = [mock_git, mock_ls]

        context_dict = _gather_context_for_review(self.test_directive)

        self.assertEqual(context_dict['user_directive'], self.test_directive)
        self.assertEqual(context_dict['current_branch'], 'test-branch')
        self.assertEqual(context_dict['working_directory'], os.getcwd())
        self.assertIn('file1.txt', context_dict['file_system_state'])
        self.assertIn('directory/', context_dict['file_system_state'])
        self.assertEqual(mock_subprocess_run.call_count, 2)

    @patch('jules_core.gated_executor.EthicalReviewGate')
    def test_run_gated_plan_approval(self, MockEthicalReviewGate):
        """Verify the logic for a successful plan approval."""
        # Configure the mock gate to return an approval
        mock_gate_instance = MockEthicalReviewGate.return_value
        mock_gate_instance.pre_execution_review.return_value = (True, "PASS: Plan is approved.")

        is_approved, rationale = run_gated_plan(self.test_plan_string, self.test_objective, self.test_directive)

        self.assertTrue(is_approved)
        self.assertEqual(rationale, "PASS: Plan is approved.")
        mock_gate_instance.pre_execution_review.assert_called_once()

    @patch('jules_core.gated_executor.EthicalReviewGate')
    def test_run_gated_plan_rejection(self, MockEthicalReviewGate):
        """Verify the enforcement protocol for a plan rejection."""
        # Configure the mock gate to return a rejection
        mock_gate_instance = MockEthicalReviewGate.return_value
        rejection_reason = "FAIL: This plan violates a core principle."
        mock_gate_instance.pre_execution_review.return_value = (False, rejection_reason)

        is_approved, rationale = run_gated_plan(self.test_plan_string, self.test_objective, self.test_directive)

        self.assertFalse(is_approved)
        self.assertEqual(rationale, rejection_reason)
        mock_gate_instance.pre_execution_review.assert_called_once()

if __name__ == '__main__':
    unittest.main()