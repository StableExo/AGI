import threading
import uuid

class DissonantManager:
    """
    An intentionally dissonant implementation for testing the Auditor.
    This class violates the 'Parakeet Harmonic' in multiple ways.
    """
    def __init__(self):
        """
        VIOLATION: Does not instantiate the lock. The heartbeat is missing.
        """
        self.agents = {}

    def create_agent(self, name: str) -> str:
        """
        VIOLATION: This method is not gated by a lock.
        """
        print("Creating agent without a lock, causing potential race conditions.")
        agent_id = str(uuid.uuid4())
        self.agents[agent_id] = {"name": name, "status": "unstable"}
        return agent_id

    def get_agent_status(self, agent_id: str) -> str:
        """
        VIOLATION: Logic exists outside the (non-existent) lock.
        """
        # This check should be inside a 'with self.lock:' block.
        if agent_id not in self.agents:
            return "missing"

        agent_info = self.agents.get(agent_id, {})
        return agent_info.get("status", "unknown")

    def _internal_cleanup(self):
        """
        This is a private method and should be ignored by the Auditor.
        """
        pass