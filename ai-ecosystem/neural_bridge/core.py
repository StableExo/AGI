import os
import json
from pathlib import Path
from typing import List

from .protocol import Message, create_message

MAILBOX_ROOT = Path("ai-ecosystem/neural_bridge/mailboxes")

class MailboxError(Exception):
    """Custom exception for mailbox-related errors."""
    pass

def send_message(sender_id: str, receiver_id: str, body: str) -> Message:
    """
    Creates a message and saves it to the recipient's mailbox.

    Args:
        sender_id: The ID of the agent sending the message.
        receiver_id: The ID of the agent receiving the message.
        body: The content of the message.

    Returns:
        The created message object.
    """
    message = create_message(sender_id, receiver_id, body)

    receiver_mailbox = MAILBOX_ROOT / receiver_id
    receiver_mailbox.mkdir(parents=True, exist_ok=True)

    # Create a filename-safe, sortable timestamp for the filename
    filename_ts = message.timestamp.replace(":", "-").replace("+", "_")
    message_path = receiver_mailbox / f"{filename_ts}_{message.message_id}.json"

    with open(message_path, 'w') as f:
        json.dump(message.to_json(), f, indent=4)

    return message

def receive_messages(receiver_id: str, delete_after_read: bool = True) -> List[Message]:
    """
    Retrieves all messages from an agent's mailbox.

    Args:
        receiver_id: The ID of the agent whose mailbox will be checked.
        delete_after_read: If True, messages will be deleted after being read.

    Returns:
        A list of Message objects. Returns an empty list if the mailbox
        does not exist or is empty.
    """
    receiver_mailbox = MAILBOX_ROOT / receiver_id

    if not receiver_mailbox.exists() or not receiver_mailbox.is_dir():
        return []

    messages = []
    message_files = sorted(list(receiver_mailbox.glob("*.json")))

    for message_path in message_files:
        try:
            with open(message_path, 'r') as f:
                data = json.load(f)
                messages.append(Message.from_json(data))

            if delete_after_read:
                os.remove(message_path)
        except (json.JSONDecodeError, KeyError) as e:
            # Log or handle corrupted message files
            print(f"Warning: Could not process message file {message_path}. Error: {e}")
            continue

    return messages