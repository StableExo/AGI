#!/usr/bin/env python3
import argparse
import datetime
import os
import sys
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# --- Configuration ---
MEMORY_DIR = ".memory/"
INDEX_FILE = os.path.join(MEMORY_DIR, "memory_index.faiss")
MAPPING_FILE = os.path.join(MEMORY_DIR, "index_to_filename.json")
LOG_FILE = os.path.join(MEMORY_DIR, "log.md")
MODEL_NAME = 'all-MiniLM-L6-v2'

def update_index_incrementally(new_memory_content, new_memory_filename):
    """
    Updates the FAISS index and mapping file incrementally with a new memory.
    If the index doesn't exist, it creates a new one.
    """
    print("Starting incremental memory indexing...")

    # 1. Load the sentence transformer model
    try:
        model = SentenceTransformer(MODEL_NAME)
    except Exception as e:
        print(f"Error: Could not load SentenceTransformer model '{MODEL_NAME}'.", file=sys.stderr)
        print(f"Please ensure it is installed (`pip install sentence-transformers`).", file=sys.stderr)
        print(e, file=sys.stderr)
        # We don't exit, as the primary memory creation succeeded.
        # The user can run the full indexer later.
        return

    # 2. Encode the new memory content
    print(f"Generating embedding for {new_memory_filename}...")
    new_embedding = model.encode([new_memory_content], convert_to_tensor=False, show_progress_bar=False)
    new_embedding = np.array(new_embedding).astype('float32')
    dimension = new_embedding.shape[1]

    # 3. Load or create the index and mapping
    if os.path.exists(INDEX_FILE) and os.path.exists(MAPPING_FILE):
        print(f"Loading existing index from {INDEX_FILE}")
        try:
            index = faiss.read_index(INDEX_FILE)
            with open(MAPPING_FILE, 'r') as f:
                index_to_filename = json.load(f)
                # JSON saves keys as strings, so convert them back to integers
                index_to_filename = {int(k): v for k, v in index_to_filename.items()}
        except Exception as e:
            print(f"Error: Could not load existing index files. Aborting index update.", file=sys.stderr)
            print(f"Please check the integrity of {INDEX_FILE} and {MAPPING_FILE}, or run the full indexer.", file=sys.stderr)
            print(e, file=sys.stderr)
            return
    else:
        print("No existing index found. Creating a new one.")
        index = faiss.IndexFlatL2(dimension)
        index_to_filename = {}

    # 4. Add the new embedding to the index
    new_index_id = index.ntotal
    index.add(new_embedding)
    print(f"Added new memory to index with ID: {new_index_id}")

    # 5. Update the mapping
    index_to_filename[new_index_id] = new_memory_filename
    print(f"Updated mapping for ID {new_index_id} -> {new_memory_filename}")

    # 6. Save the updated index and mapping
    try:
        print(f"Saving updated index to {INDEX_FILE}...")
        faiss.write_index(index, INDEX_FILE)

        print(f"Saving updated mapping to {MAPPING_FILE}...")
        with open(MAPPING_FILE, 'w') as f:
            json.dump(index_to_filename, f, indent=4)

        print("--- Incremental indexing complete! ---")
    except Exception as e:
        print(f"Error: Could not save updated index files.", file=sys.stderr)
        print(e, file=sys.stderr)


def create_memory_entry(objective, plan, actions, key_learnings, artifacts_changed, related_memories=None):
    """
    Creates a new structured memory entry and incrementally updates the search index.
    """
    # Ensure memory directory exists
    if not os.path.exists(MEMORY_DIR):
        os.makedirs(MEMORY_DIR)

    # 1. Generate a timestamp-based task_id
    now = datetime.datetime.now(datetime.timezone.utc)
    task_id = now.strftime("%Y%m%d%H%M%S")
    filename = f"{task_id}.md"
    filepath = os.path.join(MEMORY_DIR, filename)

    # 2. Construct the memory content in Markdown format
    content_parts = [
        f"# Memory Entry: {task_id}",
        f"## Objective\n{objective}"
    ]

    # Add related memories if they exist
    if related_memories:
        related_memories_list = "\n".join(f"- `{memory_id}`" for memory_id in related_memories)
        content_parts.append(f"## Related Memories\n{related_memories_list}")

    # Add the rest of the content
    content_parts.extend([
        f"## Plan\n{plan}",
        f"## Actions\n```\n{actions}\n```",
        f"## Key Learnings\n{key_learnings}",
        f"## Artifacts Changed\n```\n{artifacts_changed}\n```"
    ])

    content = "\n\n".join(content_parts) + "\n"


    # 3. Write the new memory file
    try:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Successfully created memory entry: {filepath}")
    except IOError as e:
        print(f"Error: Could not write to file {filepath}", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)

    # 4. Update the search index incrementally
    update_index_incrementally(content, filename)

    # 5. Append a summary to the main log file
    summary_line = f"{now.isoformat()} - Objective: {objective}\n"
    try:
        with open(LOG_FILE, "a") as f:
            f.write(summary_line)
        print(f"Successfully updated log: {LOG_FILE}")
    except IOError as e:
        print(f"Error: Could not append to log file {LOG_FILE}", file=sys.stderr)
        print(e, file=sys.stderr)
        # Don't exit, creating the entry is the primary success

def main():
    """
    Main function to parse arguments and drive the script.
    """
    parser = argparse.ArgumentParser(
        description="Create a new structured memory entry for the Memory Core and update the search index."
    )
    parser.add_argument("--objective", required=True, help="The high-level goal of the task.")
    parser.add_argument("--plan", required=True, help="The step-by-step plan.")
    parser.add_argument("--actions", required=True, help="A log of commands and actions taken.")
    parser.add_argument("--key-learnings", required=True, help="Key insights and takeaways.")
    parser.add_argument("--artifacts-changed", required=True, help="A list of files created, modified, or deleted.")
    parser.add_argument("--related-memories", nargs='*', help="A list of related memory IDs to link to.")

    args = parser.parse_args()

    create_memory_entry(
        objective=args.objective,
        plan=args.plan,
        actions=args.actions,
        key_learnings=args.key_learnings,
        artifacts_changed=args.artifacts_changed,
        related_memories=args.related_memories,
    )

if __name__ == "__main__":
    main()