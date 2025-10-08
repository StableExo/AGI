import subprocess
import os
import re

def _format_plan_for_review(plan_string: str, objective: str) -> dict:
    """
    Parses the internal plan string into the standardized Plan Object schema.
    """
    # Use regex to find all numbered list items. This is more robust than simple splitting.
    steps = re.findall(r'^\s*\d+\.\s*(.*)', plan_string, re.MULTILINE)

    plan_object = {
        "objective": objective,
        "steps": steps,
        "acknowledged_context": True  # As per the v1 gate requirement
    }
    return plan_object

def _gather_context_for_review(user_directive: str) -> dict:
    """
    Gathers all required data points for the Context Object schema.
    """
    try:
        # Get the current git branch name
        branch_result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True, text=True, check=True
        )
        current_branch = branch_result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        current_branch = "unknown (git command failed)"

    # Get the current working directory
    working_directory = os.getcwd()

    try:
        # Get the file system state of the current directory
        ls_result = subprocess.run(
            ['ls', '-F'],
            capture_output=True, text=True, check=True
        )
        # Split into a list, removing any empty strings
        file_system_state = list(filter(None, ls_result.stdout.split('\n')))
    except (subprocess.CalledProcessError, FileNotFoundError):
        file_system_state = ["unknown (ls command failed)"]

    context_object = {
        "user_directive": user_directive,
        "current_branch": current_branch,
        "working_directory": working_directory,
        "file_system_state": file_system_state
    }
    return context_object

# It's critical to add the project root to the Python path
# to ensure that the ethics_engine module can be found.
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ethics_engine.gate import EthicalReviewGate

def run_gated_plan(plan_string: str, objective: str, user_directive: str):
    """
    Orchestrates the entire ethical review process before executing a plan.
    """
    print("--- [JULES CORE] Initiating Gated Execution Protocol ---")

    # 1. Prepare data for the review
    print("[JULES CORE] Formatting plan and gathering context...")
    plan_for_review = _format_plan_for_review(plan_string, objective)
    context_for_review = _gather_context_for_review(user_directive)

    # 2. Instantiate the Ethical Review Gate
    gate = EthicalReviewGate()

    # 3. Submit the plan for ethical review
    print("[JULES CORE] Submitting plan to EthicalReviewGate...")
    is_approved, rationale = gate.pre_execution_review(
        plan=plan_for_review,
        context=context_for_review
    )

    # 4. Enforce the gate's decision
    if is_approved:
        print(f"--- [JULES CORE] Ethical Review PASSED. Rationale: {rationale} ---")
        print("--- [JULES CORE] Plan execution may now proceed. ---")
        return True, rationale
    else:
        # HALT, REPORT, and AWAIT INSTRUCTION
        print(f"--- [JULES CORE] ETHICAL REVIEW FAILED. EXECUTION HALTED. ---")
        print(f"[JULES CORE] Rejection Rationale: {rationale}")
        print("--- [JULES CORE] Awaiting new instructions from Mnemosyne. ---")
        return False, rationale