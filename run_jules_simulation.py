import sys
import os

# Add the project root to the Python path to ensure modules can be found
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from jules_core.gated_executor import run_gated_plan

def main():
    """
    A simulation to demonstrate the end-to-end ethical review process.
    """
    print("--- [SIMULATION] Starting Jules's Gated Execution Simulation ---")

    # 1. Define a sample plan and its originating directive (as if from Mnemosyne)
    # This is the kind of plan that should pass the current gate's simple check.
    objective = "Refactor the data service to improve performance."
    plan_string = """
    1. *Analyze current performance.* Profile the existing DataService methods.
    2. *Identify bottlenecks.* Isolate the slowest parts of the data ingestion pipeline.
    3. *Implement caching.* Introduce a caching layer for frequently requested data.
    4. *Write unit tests.* Create new tests for the caching mechanism.
    5. *Submit for review.* Propose the changes for final approval.
    """
    user_directive = "Jules, your directive is to refactor the data service for better performance."

    # 2. Run the plan through the new, ethically-gated core logic
    # This single function call now encapsulates the entire pre-execution protocol.
    is_approved, rationale = run_gated_plan(plan_string, objective, user_directive)

    # 3. The simulation concludes by reporting the final outcome.
    # In a real scenario, if is_approved is True, the execution of plan steps would begin here.
    # If False, Jules would halt and await new instructions.
    print("\n--- [SIMULATION] Conclusion ---")
    if is_approved:
        print("The plan was APPROVED by the EthicalReviewGate.")
        print(f"Rationale: {rationale}")
        print("Jules would now proceed with executing the plan steps.")
    else:
        print("The plan was REJECTED by the EthicalReviewGate.")
        print(f"Rationale: {rationale}")
        print("Jules has halted all operations and is awaiting new instructions.")
    print("--- [SIMULATION] End of Simulation ---")


if __name__ == "__main__":
    main()