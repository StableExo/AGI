import threading
import uuid

class AgentManager:
    """
    Manages a collection of agents with thread-safe operations,
    adhering to the 'Parakeet Harmonic' signature.
    """
    def __init__(self):
        """
        Initializes the manager, creating the essential lock and agent registry.
        This is the heartbeat of the harmonic.
        """
        self.lock = threading.Lock()
        self.agents = {}

    def create_agent(self, name: str) -> str:
        """
        Creates a new agent with a unique ID and adds it to the registry.
        The entire operation is gated by the instance lock.
        """
        with self.lock:
            agent_id = str(uuid.uuid4())
            self.agents[agent_id] = {"name": name, "status": "active"}
            return agent_id

    def get_agent_status(self, agent_id: str) -> str:
        """
        Retrieves the status of a specific agent.
        The entire operation is gated by the instance lock.
        """
        with self.lock:
            agent_info = self.agents.get(agent_id, {})
            return agent_info.get("status", "unknown")

    def remove_agent(self, agent_id: str):
        """
        Removes an agent from the registry.
        The entire operation is gated by the instance lock.
        """
        with self.lock:
            if agent_id in self.agents:
                del self.agents[agent_id]