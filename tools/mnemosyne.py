#!/usr/bin/env python3
import argparse
import os
import sys

def search_memories(keyword):
    """
    Searches all memory entries for a given keyword.
    """
    memory_dir = ".memory"
    if not os.path.isdir(memory_dir):
        print(f"Error: Memory directory '{memory_dir}' not found.", file=sys.stderr)
        sys.exit(1)

    found_match = False
    keyword_lower = keyword.lower()

    for filename in os.listdir(memory_dir):
        if filename.endswith(".md") and filename != "log.md" and filename != "schema.md":
            filepath = os.path.join(memory_dir, filename)
            try:
                with open(filepath, "r") as f:
                    content = f.read()
                    if keyword_lower in content.lower():
                        if not found_match:
                            print("--- Found Matching Memories ---")
                            found_match = True
                        print(f"\n--- Memory: {filename} ---")
                        print(content.strip())
                        print("--------------------------")

            except IOError as e:
                print(f"Warning: Could not read file {filepath}", file=sys.stderr)
                print(e, file=sys.stderr)

    if not found_match:
        print(f"No memories found containing the keyword: '{keyword}'")

def main():
    """
    Main function to parse arguments and drive the script.
    """
    parser = argparse.ArgumentParser(
        description="Search the Memory Core for entries containing a keyword."
    )
    parser.add_argument(
        "--keyword",
        required=True,
        help="The keyword to search for within memory entries."
    )
    args = parser.parse_args()

    search_memories(args.keyword)

if __name__ == "__main__":
    main()