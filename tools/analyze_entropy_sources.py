#!/usr/bin/env python3

import argparse
import os
import re

# Define keywords and their classifications
ENTROPY_SOURCES = {
    # Weak, predictable sources
    "GetTickCount": "[WEAK]",
    "time(NULL)": "[WEAK]",
    # Suspect sources, can be weak if not seeded properly
    "rand": "[SUSPECT]",
    "srand": "[SUSPECT]",
    # Strong, hardware or OS-level cryptographic sources
    "CryptGenRandom": "[STRONG]",
    "RAND_poll": "[STRONG]",
    "/dev/urandom": "[STRONG]",
}

def analyze_directory(source_dir, report_file):
    """
    Analyzes all C/C++ files in a directory for entropy sources and generates a report.
    """
    findings = []
    # Compile a single regex for efficiency
    keyword_regex = re.compile(r'\b(' + '|'.join(re.escape(k) for k in ENTROPY_SOURCES.keys()) + r')\b')

    for root, _, files in os.walk(source_dir):
        for file in files:
            if file.endswith((".cpp", ".h", ".c")):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            # Use the pre-compiled regex to find all matches in the line
                            for match in keyword_regex.finditer(line):
                                keyword = match.group(0)
                                classification = ENTROPY_SOURCES[keyword]
                                # Clean up the context line
                                context = line.strip()
                                # Prevent overly long context lines
                                if len(context) > 120:
                                    context = context[:117] + "..."

                                findings.append({
                                    "file": os.path.relpath(file_path, source_dir),
                                    "line": line_num,
                                    "keyword": keyword,
                                    "classification": classification,
                                    "context": context,
                                })
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")

    write_report(findings, report_file)

def write_report(findings, report_file):
    """
    Writes the findings to a Markdown file.
    """
    os.makedirs(os.path.dirname(report_file), exist_ok=True)
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# Entropy Source Analysis Report\n\n")
        f.write("| File | Line Number | Keyword Found | Classification | Context (Code Snippet) |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        if findings:
            # Sort findings for consistent output
            findings.sort(key=lambda x: (x['file'], x['line']))
            for finding in findings:
                # Escape pipe characters in context to not break the Markdown table
                context_escaped = finding['context'].replace('|', '\|')
                f.write(
                    f"| {finding['file']} | {finding['line']} | `{finding['keyword']}` | {finding['classification']} | `{context_escaped}` |\n"
                )
        else:
            f.write("| | | | | No potential entropy sources found. |\n")
    print(f"Report successfully generated at: {report_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze C/C++ source code for potential entropy sources."
    )
    parser.add_argument(
        "source_dir",
        help="The source code directory to analyze."
    )
    parser.add_argument(
        "report_file",
        help="The path to the output Markdown report file."
    )
    args = parser.parse_args()

    if not os.path.isdir(args.source_dir):
        print(f"Error: Source directory not found at '{args.source_dir}'")
        return

    analyze_directory(args.source_dir, args.report_file)

if __name__ == "__main__":
    main()