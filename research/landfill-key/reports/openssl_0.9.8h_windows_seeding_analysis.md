# Forensic Analysis of OpenSSL v0.9.8h Windows Seeding

**Mission Objective:** To identify the exact mechanism of OpenSSL's interaction with the Windows entropy pool, specifically by tracing the `RAND_poll()` function.

**Date:** 2025-10-10

---

## 1. Executive Summary

The analysis of the OpenSSL v0.9.8h source code has successfully identified the Windows-specific implementation of the `RAND_poll()` function. The primary mechanism for entropy collection on the Windows platform is the **Windows Cryptographic API (CryptoAPI)**, specifically the `CryptGenRandom` function.

The system also gathers entropy from a variety of other system sources, including process/thread enumeration, GUI state, network statistics, and high-resolution timers, to supplement the cryptographic provider.

## 2. File Location

The relevant logic is contained entirely within the following file:

-   **File Path:** `crypto/rand/rand_win.c`

## 3. Primary Entropy Source: Windows CryptoAPI

The most critical finding is the use of `CryptGenRandom`, a function provided by the Windows operating system to generate cryptographically secure random data.

### 3.1. Code Snippet: `CryptGenRandom` Implementation

The following code snippet from `crypto/rand/rand_win.c` shows how OpenSSL dynamically loads `advapi32.dll` and calls `CryptAcquireContextW` to get a handle to a cryptographic provider, and then calls `CryptGenRandom` to generate random bytes.

```c
	if (advapi)
		{
		/*
		 * If it's available, then it's available in both ANSI
		 * and UNICODE flavors even in Win9x, documentation says.
		 * We favor Unicode...
		 */
		acquire = (CRYPTACQUIRECONTEXTW) GetProcAddress(advapi,
			"CryptAcquireContextW");
		gen = (CRYPTGENRANDOM) GetProcAddress(advapi,
			"CryptGenRandom");
		release = (CRYPTRELEASECONTEXT) GetProcAddress(advapi,
			"CryptReleaseContext");
		}

	if (acquire && gen && release)
		{
		/* poll the CryptoAPI PRNG */
                /* The CryptoAPI returns sizeof(buf) bytes of randomness */
		if (acquire(&hProvider, NULL, NULL, PROV_RSA_FULL,
			CRYPT_VERIFYCONTEXT))
			{
			if (gen(hProvider, sizeof(buf), buf) != 0)
				{
				RAND_add(buf, sizeof(buf), 0);
				good = 1;
#if 0
				printf("randomness from PROV_RSA_FULL\n");
#endif
				}
			release(hProvider, 0);
			}

		/* poll the Pentium PRG with CryptoAPI */
		if (acquire(&hProvider, 0, INTEL_DEF_PROV, PROV_INTEL_SEC, 0))
			{
			if (gen(hProvider, sizeof(buf), buf) != 0)
				{
				RAND_add(buf, sizeof(buf), sizeof(buf));
				good = 1;
#if 0
				printf("randomness from PROV_INTEL_SEC\n");
#endif
				}
			release(hProvider, 0);
			}
		}
```

### 3.2. Windows API Functions Called

-   **`LoadLibrary(TEXT("ADVAPI32.DLL"))`**: Loads the core Windows library containing the CryptoAPI functions.
-   **`GetProcAddress(...)`**: Retrieves the addresses of the required functions at runtime.
-   **`CryptAcquireContextW(...)`**: Acquires a handle to a Cryptographic Service Provider (CSP). The code attempts to use `PROV_RSA_FULL` and `PROV_INTEL_SEC`.
-   **`CryptGenRandom(...)`**: The core function that fills a buffer with cryptographically random bytes.
-   **`CryptReleaseContext(...)`**: Releases the handle to the CSP.

## 4. Secondary Entropy Sources

In addition to the primary CryptoAPI source, `RAND_poll()` gathers data from the following sources:

-   **Network Statistics:** via `NetStatisticsGet`.
-   **Toolhelp32 Snapshot:** Enumerates processes, threads, modules, and heaps via `CreateToolhelp32Snapshot`.
-   **GUI and User Interaction:** `GetForegroundWindow`, `GetCursorInfo`, `GetQueueStatus`.
-   **System Information:** `GlobalMemoryStatus`, `GetCurrentProcessId`.
-   **Timers:** `QueryPerformanceCounter`, `GetTickCount`, and the `rdtsc` instruction.

## 5. Conclusion

The `RAND_poll()` function in OpenSSL v0.9.8h on Windows is heavily reliant on the operating system's own cryptographic primitives (`CryptGenRandom`). The security of the initial seed is therefore directly tied to the quality of the Windows entropy pool and the implementation of the selected CSP. The additional data gathered from system state and user interaction serves as a secondary layer to augment the primary cryptographic source.