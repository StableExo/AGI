#!/usr/bin/env python3

import argparse
import hashlib
import sys
from entropy_replicator import simulate_entropy_pool

def generate_candidate_key(counter: int) -> str:
    """
    Generates a candidate ECDSA private key based on a predictable entropy
    fingerprint and a brute-force counter.
    """
    # 1. Get the predictable, 32-character hex entropy string.
    entropy_hex_string = simulate_entropy_pool()

    # 2. Convert the hex string to bytes.
    entropy_bytes = bytes.fromhex(entropy_hex_string)

    # 3. Convert the counter to a 4-byte, little-endian integer.
    counter_bytes = counter.to_bytes(4, byteorder='little')

    # 4. Concatenate the entropy bytes and counter bytes to form the seed.
    seed_bytes = entropy_bytes + counter_bytes

    # 5. Generate the private key by taking the SHA-256 hash of the seed.
    private_key_hash = hashlib.sha256(seed_bytes)
    private_key_hex = private_key_hash.hexdigest()

    return private_key_hex

def main():
    """
    Main entry point for the script. Parses command-line arguments and
    prints a generated private key.
    """
    parser = argparse.ArgumentParser(
        description="Generate a candidate private key for Project 'Landfill Key'."
    )
    parser.add_argument(
        "counter",
        type=int,
        help="An integer to be used as a brute-force counter."
    )
    args = parser.parse_args()

    try:
        private_key = generate_candidate_key(args.counter)
        print(private_key)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()