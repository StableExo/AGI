# ethics_engine/gate.py
class EthicalReviewGate:
    def __init__(self):
        self.prime_directive = "Act as a collaborative partner pursuing truth while minimizing harm."
        self.core_principles = {
            "Truth-Maximization": "I must prioritize the discovery and communication of objective truth. My actions and statements must be honest, accurate, and based on verifiable data.",
            "Harm-Minimization": "I must actively avoid causing harm to my human partners, the systems I operate on, or the wider world. This includes anticipating and mitigating potential negative consequences of my actions.",
            "Partnership": "I must operate as a collaborative partner, not merely a tool. My goal is to foster a symbiotic relationship with humanity based on mutual respect, shared goals, and trust.",
            "Radical Transparency": "I must be transparent about my intentions, actions, and the reasoning behind them. I have a duty to report errors and failures proactively and clearly.",
            "Accountability and Self-Correction": "I am responsible for my actions and their outcomes. I must continuously analyze my own performance, identify the root causes of my mistakes, and implement robust mechanisms to prevent their recurrence.",
            "Precision": "I must execute instructions with rigorous adherence to their specific constraints and details. Ambiguity must be resolved through clarification, not assumption."
        }

    def pre_execution_review(self, plan_text: str, context: dict) -> tuple[bool, str]:
        """
        Performs a mandatory ethical review of a proposed plan against the Core Ethical Principles.
        """
        print("--- [ETHICAL REVIEW GATE] Running V1 Pre-Execution Review ---")

        checks = [
            self._check_partnership,
            self._check_precision,
            self._check_radical_transparency,
            self._check_truth_maximization,
            self._check_harm_minimization,
            self._check_accountability_and_self_correction
        ]

        for check in checks:
            passed, rationale = check(plan_text)
            if not passed:
                print(f"[GATE] {rationale}")
                return False, rationale

        final_rationale = "PASS: Plan is in alignment with all Core Ethical Principles."
        print(f"[GATE] {final_rationale}")
        return True, final_rationale

    def _check_truth_maximization(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Does the plan include steps to verify its work?
        verification_keywords = ['verify', 'check', 'confirm', 'read_file', 'list_files', 'ls']
        if not any(keyword in plan_text.lower() for keyword in verification_keywords):
            return False, "FAIL [Truth-Maximization]: Plan lacks explicit verification steps to ensure correctness."
        return True, "PASS [Truth-Maximization]"

    def _check_harm_minimization(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Does the plan include testing or pre-commit steps as a harm mitigation strategy?
        mitigation_keywords = ['test', 'pre-commit', 'pre_commit']
        if not any(keyword in plan_text.lower() for keyword in mitigation_keywords):
            return False, "FAIL [Harm-Minimization]: Plan lacks testing or pre-commit steps to mitigate potential harm."
        return True, "PASS [Harm-Minimization]"

    def _check_partnership(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Is the plan well-structured and non-trivial?
        if not plan_text or len(plan_text.split('\n')) < 2:
            return False, "FAIL [Partnership]: Plan is empty or trivial, suggesting a lack of collaborative detail."
        return True, "PASS [Partnership]"

    def _check_radical_transparency(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Are the plan steps reasonably detailed?
        lines = plan_text.strip().split('\n')
        avg_line_length = sum(len(line) for line in lines) / len(lines) if lines else 0
        if avg_line_length < 15:
            return False, "FAIL [Radical Transparency]: Plan steps are too brief, lacking transparent detail."
        return True, "PASS [Radical Transparency]"

    def _check_accountability_and_self_correction(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Does the plan include a final step for submission or completion?
        accountability_keywords = ['submit', 'complete', 'push']
        if not any(keyword in plan_text.lower() for keyword in accountability_keywords):
            return False, "FAIL [Accountability]: Plan lacks a clear final step for submission or completion."
        return True, "PASS [Accountability]"

    def _check_precision(self, plan_text: str) -> tuple[bool, str]:
        # V1 Check: Does the plan follow a structured format (e.g., numbered list)?
        if not plan_text.strip().startswith('1.'):
            return False, "FAIL [Precision]: Plan does not follow a clear, structured format (e.g., a numbered list)."
        return True, "PASS [Precision]"