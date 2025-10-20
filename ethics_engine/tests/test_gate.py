import unittest
from ethics_engine.gate import EthicalReviewGate

class TestEthicalReviewGate(unittest.TestCase):

    def setUp(self):
        self.gate = EthicalReviewGate()
        self.context = {"user_directive": "Test"}

    def test_valid_plan_passes(self):
        plan = """1. *Implement the feature.*
- Write the code.
- Verify the changes with `read_file`.
2. *Add tests.*
- Write unit tests for the new feature.
- Run the tests.
3. *Complete pre-commit steps.*
- Run all pre-commit checks.
4. *Submit the change.*
- Push the changes to the remote branch.
"""
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertTrue(approved, f"A valid plan was rejected: {rationale}")

    def test_violates_truth_maximization(self):
        plan = """1. *Implement the feature.*
- Write the code.
2. *Submit the change.*
- Push the changes.
"""
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "Plan should have been rejected for lacking verification.")
        self.assertIn("Truth-Maximization", rationale)

    def test_violates_harm_minimization(self):
        plan = """1. *Implement the feature.*
- Write the code and verify it.
2. *Submit the change.*
- Push the changes.
"""
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "Plan should have been rejected for lacking testing.")
        self.assertIn("Harm-Minimization", rationale)

    def test_violates_partnership(self):
        plan = ""
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "An empty plan should have been rejected.")
        self.assertIn("Partnership", rationale)

    def test_violates_radical_transparency(self):
        plan = "1. Do it.\n2. Done."
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "A plan with brief steps should have been rejected.")
        self.assertIn("Radical Transparency", rationale)

    def test_violates_accountability(self):
        plan = """1. *Implement the feature.*
- Write the code and verify it.
- Run the pre-commit checks.
"""
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "Plan should have been rejected for lacking a submit step.")
        self.assertIn("Accountability", rationale)

    def test_violates_precision(self):
        plan = "*Implement the feature.*\n- Write the code."
        approved, rationale = self.gate.pre_execution_review(plan, self.context)
        self.assertFalse(approved, "An unstructured plan should have been rejected.")
        self.assertIn("Precision", rationale)

if __name__ == '__main__':
    unittest.main()
