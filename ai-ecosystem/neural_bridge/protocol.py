import dataclasses
import datetime
import uuid

@dataclasses.dataclass
class Message:
    """
    Represents a single message in the Neural Bridge system.
    """
    message_id: str
    sender_id: str
    receiver_id: str
    timestamp: str
    body: str

    def to_json(self) -> dict:
        """Serializes the message to a JSON-compatible dictionary."""
        return dataclasses.asdict(self)

    @staticmethod
    def from_json(data: dict) -> "Message":
        """Deserializes a message from a JSON-compatible dictionary."""
        return Message(**data)

def create_message(sender_id: str, receiver_id: str, body: str) -> Message:
    """
    Factory function to create a new Message object with a unique ID and timestamp.
    """
    return Message(
        message_id=str(uuid.uuid4()),
        sender_id=sender_id,
        receiver_id=receiver_id,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        body=body,
    )