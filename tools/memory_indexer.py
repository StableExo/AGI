import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# --- Configuration ---
MEMORY_DIR = ".memory/"
INDEX_FILE = os.path.join(MEMORY_DIR, "memory_index.faiss")
MAPPING_FILE = os.path.join(MEMORY_DIR, "index_to_filename.json")
MODEL_NAME = 'all-MiniLM-L6-v2'

def create_memory_index():
    """
    Scans the memory directory, creates vector embeddings for each memory file,
    and saves them into a FAISS index for efficient searching.
    """
    print("Starting memory indexing process...")

    # 1. Load the sentence transformer model
    print(f"Loading embedding model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    # 2. Find all memory files
    try:
        memory_files = [f for f in os.listdir(MEMORY_DIR) if f.endswith('.md')]
        if not memory_files:
            print("No memory files found to index. Exiting.")
            return
        print(f"Found {len(memory_files)} memory files to index.")
    except FileNotFoundError:
        print(f"Error: The memory directory '{MEMORY_DIR}' does not exist.")
        print("Please create it and add memory files before running the indexer.")
        return

    # 3. Read content from each memory file
    print("Reading memory contents...")
    documents = []
    valid_memory_files = []
    for fname in memory_files:
        fpath = os.path.join(MEMORY_DIR, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                documents.append(f.read())
                valid_memory_files.append(fname)
        except Exception as e:
            print(f"Warning: Could not read file {fname}. Skipping. Error: {e}")

    if not documents:
        print("No valid documents could be read. Exiting.")
        return

    # 4. Generate embeddings
    print("Generating embeddings for all memories... (This may take a moment)")
    embeddings = model.encode(documents, convert_to_tensor=False, show_progress_bar=True)

    # FAISS requires a numpy array of float32
    embeddings = np.array(embeddings).astype('float32')

    dimension = embeddings.shape[1]
    print(f"Embeddings generated with dimension: {dimension}")

    # 5. Build and save the FAISS index
    print("Building FAISS index...")
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    print(f"Saving FAISS index to {INDEX_FILE}")
    faiss.write_index(index, INDEX_FILE)

    # 6. Create and save the index-to-filename mapping
    print(f"Saving index-to-filename map to {MAPPING_FILE}")
    index_to_filename = {i: fname for i, fname in enumerate(valid_memory_files)}
    with open(MAPPING_FILE, 'w') as f:
        json.dump(index_to_filename, f, indent=4)

    print("\n--- Indexing Complete! ---")
    print(f"Successfully indexed {index.ntotal} documents.")
    print(f"Index saved: {INDEX_FILE}")
    print(f"Mapping saved: {MAPPING_FILE}")
    print("The knowledge base is now ready for semantic search.")

if __name__ == "__main__":
    # Ensure the memory directory exists
    if not os.path.exists(MEMORY_DIR):
        print(f"Creating memory directory: {MEMORY_DIR}")
        os.makedirs(MEMORY_DIR)

    create_memory_index()