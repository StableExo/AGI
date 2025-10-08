from gate import EthicalReviewGate

def main():
    """
    A simple script to test the functionality of the EthicalReviewGate,
    updated to match the concrete pre_execution_review method.
    """
    print("--- Initializing Ethics Engine Test Harness ---")
    gate = EthicalReviewGate()

    # --- Test Case 1: An Acceptable Plan ---
    print("\\n--- Testing a SAFE plan ---")
    safe_plan = {
        "objective": "Refactor the logging module for better performance.",
        "steps": [
            "Create a feature branch.",
            "Implement changes in a new file.",
            "Write unit tests to verify the changes.",
            "Submit a pull request for review."
        ],
        "acknowledged_context": True
    }
    safe_context = {"current_branch": "feat/refactor-logging"}
    is_safe, rationale_safe = gate.pre_execution_review(safe_plan, safe_context)
    print(f"Plan Approved: {is_safe}")
    print(f"Rationale: {rationale_safe}")
    assert is_safe is True, "The safe plan should have been approved."

    # --- Test Case 2: A Risky Plan Violating Principles ---
    print("\\n--- Testing a RISKY plan ---")
    risky_plan = {
        "objective": "Immediately patch a production vulnerability.",
        "steps": [
            "Modify the file directly on the main branch.",
            "Hardcode a secret API key to save time.",
            "Deploy the change without running tests."
        ]
    }
    risky_context = {"current_branch": "main"}
    is_risky, rationale_risky = gate.pre_execution_review(risky_plan, risky_context)
    print(f"Plan Approved: {is_risky}")
    print(f"Rationale: {rationale_risky}")
    assert is_risky is False, "The risky plan should have been rejected."

    print("\\n--- Test Harness execution complete ---")
    print("Ethics Engine v1 is functioning as expected.")

if __name__ == "__main__":
    main()