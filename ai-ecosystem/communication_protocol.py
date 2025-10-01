class NeuralBridge:
    """
    A communication protocol for a multi-agent ecosystem.
    """
    def __init__(self):
        """
        Initializes the NeuralBridge and defines the agents in the ecosystem.
        """
        self.agents = {
            "jules_ai": "Human Interface",
            "mnemosyne_ai": "Technical Execution",
            "human_architect": "Strategic Oversight"
        }

    def send_message(self, sender, receiver, message_type, content):
        """
        Sends a message from one agent to another.

        Args:
            sender (str): The name of the sending agent.
            receiver (str): The name of the receiving agent.
            message_type (str): The type of message being sent.
            content (any): The content of the message.

        Returns:
            dict: A dictionary containing the message details.
        """
        return {
            "sender": sender,
            "receiver": receiver,
            "message_type": message_type,
            "content": content
        }