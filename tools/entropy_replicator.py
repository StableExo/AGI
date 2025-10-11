#!/usr/bin/env python3

import hashlib
import struct

def simulate_entropy_pool():
    """
    Simulates the entropy pool of a freshly booted Windows 7 64-bit system
    based on the forensic analysis of OpenSSL 0.9.8h rand_win.c.
    The function follows the exact data collection and MD5 mixing sequence.
    """
    md5 = hashlib.md5()

    # All multi-byte values are packed as little-endian ('<') for Windows.

    # 1. Timers and High-Resolution Counters
    md5.update(struct.pack('<L', 60000))
    md5.update(struct.pack('<q', 12345678))
    md5.update(struct.pack('<LL', 1282259520, 30000000))

    # 2. Memory Status (MEMORYSTATUSEX)
    md5.update(struct.pack(
        '<LLQQQQQQQ',
        64, 25, 2147483648, 1825361100, 4294967296,
        4177526784, 8796093022207, 8796000000000, 0
    ))

    # 3. System Snapshots via Toolhelp32
    process_list = [
        ("System Idle Process", 0, 0), ("System", 4, 0), ("smss.exe", 264, 4),
        ("csrss.exe", 368, 264), ("wininit.exe", 444, 368), ("services.exe", 508, 444),
        ("lsass.exe", 536, 444), ("lsm.exe", 564, 444), ("winlogon.exe", 592, 368),
        ("svchost.exe", 620, 508), ("svchost.exe", 680, 508), ("svchost.exe", 740, 508),
        ("svchost.exe", 800, 508), ("svchost.exe", 860, 508), ("svchost.exe", 920, 508),
        ("svchost.exe", 980, 508), ("svchost.exe", 1040, 508),
        ("explorer.exe", 1580, 592)
    ]

    for proc_name, pid, parent_pid in process_list:
        # a) Process Information (PROCESSENTRY32W)
        # Correct format for 64-bit: dwSize(L), cntUsage(L), th32ProcessID(L), th32DefaultHeapID(Q),
        # th32ModuleID(L), cntThreads(L), th32ParentProcessID(L), pcPriClassBase(l), dwFlags(L), szExeFile(WCHAR[260])
        exe_file_bytes = proc_name.encode('utf-16le')
        md5.update(struct.pack(
            '<LLL Q LLLl L 520s',
            556,          # dwSize
            0,            # cntUsage
            pid,          # th32ProcessID
            1,            # th32DefaultHeapID (ULONG_PTR -> Q)
            1,            # th32ModuleID
            5,            # cntThreads
            parent_pid,   # th32ParentProcessID
            8,            # pcPriClassBase
            0,            # dwFlags
            exe_file_bytes.ljust(520, b'\0')
        ))

        # b) Heap Information (HEAPENTRY32)
        md5.update(struct.pack(
            '<QQQQLLLLQ',
            96, 1, 0x10000, 4096, 1, 0, 0, pid, 1
        ))

        # c) Thread Information (THREADENTRY32)
        md5.update(struct.pack(
            '<LLLl ll L',
            28, 0, pid + 4, pid, 8, 0, 0
        ))

        # d) Module Information (MODULEENTRY32W)
        # Correct format for 64-bit: dwSize(L), th32ModuleID(L), th32ProcessID(L), GlblcntUsage(L),
        # ProccntUsage(L), modBaseAddr(Q), modBaseSize(L), hModule(Q), szModule, szExePath
        mod_name_bytes = proc_name.encode('utf-16le')
        mod_path_bytes = f"C:\\Windows\\System32\\{proc_name}".encode('utf-16le')
        md5.update(struct.pack(
            '<LLLLL Q L Q 512s 520s',
            1080, 1, pid, 1, 1, 0x400000, 100000, 65536,
            mod_name_bytes.ljust(512, b'\0'),
            mod_path_bytes.ljust(520, b'\0')
        ))

    return md5.hexdigest()

if __name__ == "__main__":
    entropy_pool_hex = simulate_entropy_pool()
    print(entropy_pool_hex)