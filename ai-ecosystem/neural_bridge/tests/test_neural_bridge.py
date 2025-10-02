import os
import shutil
import pytest
import time
from pathlib import Path

# Add the ai-ecosystem directory to the python path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from neural_bridge.core import send_message, receive_messages, MAILBOX_ROOT
from neural_bridge.protocol import Message

TEST_SENDER = "test_sender"
TEST_RECEIVER = "test_receiver"
TEST_MAILBOX = MAILBOX_ROOT / TEST_RECEIVER

@pytest.fixture(autouse=True)
def cleanup_mailboxes():
    """Fixture to automatically clean up mailboxes before and after each test."""
    if MAILBOX_ROOT.exists():
        shutil.rmtree(MAILBOX_ROOT)
    MAILBOX_ROOT.mkdir(parents=True)
    yield
    if MAILBOX_ROOT.exists():
        shutil.rmtree(MAILBOX_ROOT)

def test_send_message_creates_file():
    """Verify that sending a message creates a new JSON file in the correct mailbox."""
    assert not TEST_MAILBOX.exists()

    send_message(TEST_SENDER, TEST_RECEIVER, "Hello, world!")

    assert TEST_MAILBOX.exists()
    files = list(TEST_MAILBOX.glob("*.json"))
    assert len(files) == 1

def test_receive_messages_retrieves_message():
    """Verify that a sent message can be correctly received."""
    body = "This is a test message."
    sent_message = send_message(TEST_SENDER, TEST_RECEIVER, body)

    messages = receive_messages(TEST_RECEIVER, delete_after_read=False)

    assert len(messages) == 1
    received_message = messages[0]

    assert received_message.message_id == sent_message.message_id
    assert received_message.sender_id == TEST_SENDER
    assert received_message.receiver_id == TEST_RECEIVER
    assert received_message.body == body

def test_receive_messages_deletes_by_default():
    """Verify that messages are deleted after being read by default."""
    send_message(TEST_SENDER, TEST_RECEIVER, "This should be deleted.")

    assert len(list(TEST_MAILBOX.glob("*.json"))) == 1

    receive_messages(TEST_RECEIVER)

    assert len(list(TEST_MAILBOX.glob("*.json"))) == 0

def test_receive_messages_from_empty_mailbox():
    """Verify that receiving from an empty mailbox returns an empty list."""
    messages = receive_messages(TEST_RECEIVER)
    assert messages == []

def test_receive_from_nonexistent_mailbox():
    """Verify that receiving from a mailbox that doesn't exist returns an empty list."""
    messages = receive_messages("non_existent_agent")
    assert messages == []

def test_multiple_messages_are_sorted_by_creation_time():
    """Verify that multiple messages are received in the order they were sent."""
    # Note: This relies on filesystem timestamps, which may not be perfectly reliable
    # on all systems. A more robust solution might embed the timestamp in the filename.
    # For this implementation, we assume file sorting is sufficient.
    msg1 = send_message(TEST_SENDER, TEST_RECEIVER, "First message")
    time.sleep(0.01) # Ensure timestamp difference
    msg2 = send_message(TEST_SENDER, TEST_RECEIVER, "Second message")

    messages = receive_messages(TEST_RECEIVER, delete_after_read=False)

    assert len(messages) == 2
    assert messages[0].message_id == msg1.message_id
    assert messages[1].message_id == msg2.message_id

def test_message_content_is_preserved():
    """Verify that the message body and metadata are correctly stored and retrieved."""
    body = "Complex content: { \"key\": [1, 2, \"value\"] }"
    sent_message = send_message(TEST_SENDER, TEST_RECEIVER, body)

    messages = receive_messages(TEST_RECEIVER)

    assert len(messages) == 1
    received_message = messages[0]

    assert received_message.body == body
    assert received_message.sender_id == sent_message.sender_id
    assert received_message.receiver_id == sent_message.receiver_id
    assert received_message.timestamp == sent_message.timestamp