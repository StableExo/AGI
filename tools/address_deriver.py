import argparse
import hashlib
import sys

import base58
from ecdsa import SECP256k1, SigningKey

def derive_address(private_key_hex):
    """
    Derives a Bitcoin address from a private key.
    """
    # 1. Validate private key
    if not (len(private_key_hex) == 64 and all(c in '0123456789abcdefABCDEF' for c in private_key_hex)):
        print("Error: Private key must be a 64-character hexadecimal string.", file=sys.stderr)
        sys.exit(1)

    # 1. Decode the hex private key into bytes
    private_key_bytes = bytes.fromhex(private_key_hex)

    # 2. Derive the public key using ecdsa with the secp256k1 curve
    sk = SigningKey.from_string(private_key_bytes, curve=SECP256k1)
    vk = sk.get_verifying_key()
    # Get the uncompressed public key (starts with 0x04)
    public_key_bytes = vk.to_string("uncompressed")

    # 3. Perform SHA-256 hash on the public key
    sha256_hash = hashlib.sha256(public_key_bytes).digest()

    # 4. Perform RIPEMD-160 hash on the result
    ripemd160 = hashlib.new('ripemd160')
    ripemd160.update(sha256_hash)
    ripemd160_hash = ripemd160.digest()

    # 5. Add the Bitcoin version byte (0x00 for Mainnet)
    version_prefixed_hash = b'\x00' + ripemd160_hash

    # 6. Perform SHA-256 hash twice for the checksum
    checksum_hash_1 = hashlib.sha256(version_prefixed_hash).digest()
    checksum_hash_2 = hashlib.sha256(checksum_hash_1).digest()

    # 7. Take the first 4 bytes as the checksum
    checksum = checksum_hash_2[:4]

    # 8. Append the checksum to the version-prefixed hash
    binary_address = version_prefixed_hash + checksum

    # 9. Base58Check encode the binary address
    bitcoin_address = base58.b58encode(binary_address).decode('utf-8')

    return bitcoin_address

def main():
    """
    Main function to parse arguments and derive the address.
    """
    parser = argparse.ArgumentParser(description="Derive a Bitcoin address from a private key.")
    parser.add_argument("private_key", help="A 64-character hexadecimal private key.")
    args = parser.parse_args()

    address = derive_address(args.private_key)
    if address:
        print(address)

if __name__ == "__main__":
    main()