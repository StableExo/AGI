#!/usr/bin/env python3
import os
import json
import argparse
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# --- Configuration ---
MEMORY_DIR = ".memory/"
INDEX_FILE = os.path.join(MEMORY_DIR, "memory_index.faiss")
MAPPING_FILE = os.path.join(MEMORY_DIR, "index_to_filename.json")
MODEL_NAME = 'all-MiniLM-L6-v2'
TOP_K = 3 # Number of top results to retrieve

def semantic_search(query):
    """
    Performs a semantic search for a given query against the indexed Memory Core.
    """
    print(f"Performing semantic search for: \"{query}\"")

    # 1. Check for necessary files
    if not os.path.exists(INDEX_FILE) or not os.path.exists(MAPPING_FILE):
        print("Error: Memory index not found.")
        print("Please run 'python3 tools/memory_indexer.py' to build the index first.")
        return

    # 2. Load the FAISS index and the mapping
    try:
        print("Loading memory index...")
        index = faiss.read_index(INDEX_FILE)
        with open(MAPPING_FILE, 'r') as f:
            index_to_filename = json.load(f)
            # JSON saves keys as strings, so convert them back to integers
            index_to_filename = {int(k): v for k, v in index_to_filename.items()}
    except Exception as e:
        print(f"Error loading index files: {e}")
        return

    # 3. Load the sentence transformer model
    print(f"Loading embedding model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    # 4. Encode the search query
    print("Encoding search query...")
    query_embedding = model.encode([query], convert_to_tensor=False)
    query_embedding = np.array(query_embedding).astype('float32')

    # 5. Perform the search
    print(f"Searching for top {TOP_K} most similar memories...")
    distances, indices = index.search(query_embedding, TOP_K)

    # 6. Display the results
    print("\n--- Search Results ---")
    if not indices[0].size:
        print("No relevant memories found.")
        return

    for i, idx in enumerate(indices[0]):
        if idx == -1: # FAISS can return -1 if there are fewer items than k
            continue

        filename = index_to_filename.get(idx)
        if filename:
            similarity_score = 1 / (1 + distances[0][i]) # Convert L2 distance to a similarity score
            print(f"\n--- Result {i+1}: {filename} (Similarity: {similarity_score:.4f}) ---")
            try:
                fpath = os.path.join(MEMORY_DIR, filename)
                with open(fpath, 'r', encoding='utf-8') as f:
                    print(f.read().strip())
                print("--------------------------")
            except Exception as e:
                print(f"Warning: Could not read file {filename}. Error: {e}")
        else:
            print(f"Warning: Could not find filename for index {idx}")


def main():
    """
    Main function to parse arguments and drive the script.
    """
    parser = argparse.ArgumentParser(
        description="Perform a semantic search on the Memory Core."
    )
    parser.add_argument(
        "query",
        type=str,
        nargs='+',
        help="The natural language query to search for."
    )
    args = parser.parse_args()

    # Join the list of query words into a single string
    full_query = " ".join(args.query)
    semantic_search(full_query)

if __name__ == "__main__":
    main()