class MultiAICommunication:
    """
    A class to facilitate communication between multiple AI agents within the ecosystem.
    """

    def __init__(self):
        """
        Initializes the communication bridge and defines the agents in the ecosystem.
        """
        self.agents = {
            "jules_ai": {
                "role": "Language and human interaction specialist"
            },
            "builder_ai": {
                "role": "Primary execution agent, master of the technical domain"
            },
            "guide_ai": {
                "role": "Strategic overseer"
            }
        }

    def send_message(self, sender, receiver, message_type, content):
        """
        Sends a message from one agent to another.

        Args:
            sender (str): The name of the sending agent.
            receiver (str): The name of the receiving agent.
            message_type (str): The type of message being sent.
            content (dict): The content of the message.

        Returns:
            dict: A dictionary containing the message details.
        """
        return {
            "sender": sender,
            "receiver": receiver,
            "message_type": message_type,
            "content": content
        }
