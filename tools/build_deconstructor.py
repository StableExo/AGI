import argparse
import json
import os
import re
import subprocess

def get_resolved_variable(variable, path):
    """
    Gets the final, resolved value of a make variable in a given path
    by forcing make to evaluate and echo the variable. This is the purest form
    of the command, without any database printing flags.
    """
    try:
        target_name = f'print-{variable}'
        # The eval string creates a dummy target whose only action is to echo the variable.
        eval_string = f"{target_name}: ; @echo $({variable})"
        # We do NOT use -p or -n. We simply ask make to run the dummy target.
        command = ['make', f'--eval={eval_string}', target_name]

        process = subprocess.run(
            command,
            cwd=path,
            capture_output=True,
            text=True,
            check=True
        )
        # The command should only output the variable's value.
        return process.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        # An error means the variable likely doesn't exist in this context.
        return ""

def find_subdirectories(makefile_path):
    """
    Finds subdirectories using the simple and reliable method of parsing
    the 'echo "..."' command from the 'make -n' output.
    """
    subdirs = []
    make_dir = os.path.dirname(makefile_path)
    if not make_dir:
        make_dir = "."

    try:
        # We need the full stdout from `make -n` to find the echo command.
        output = subprocess.run(['make', '-n'], cwd=make_dir, capture_output=True, text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []

    regex = r'echo\s+"((?:\s+\w+)+)\s*"'
    match = re.search(regex, output)
    if match:
        dir_string = match.group(1)
        subdirs = [d for d in dir_string.strip().split(' ') if d]
    return subdirs

def deconstruct_build(source_dir):
    """
    Deconstructs the build by systematically executing a proven 'make' command
    to extract resolved variables from the global scope and each subdirectory.
    """
    build_config = {}
    variables_to_find = ['CFLAGS', 'LDFLAGS', 'LIBS', 'EX_LIBS', 'SHARED_LDFLAGS']

    top_level_makefile = os.path.join(source_dir, 'Makefile')
    if not os.path.exists(top_level_makefile):
        print(f"Error: Makefile not found in {source_dir}")
        return None

    # 1. Get global resolved variables
    print("Parsing top-level Makefile for global context...")
    global_vars = {}
    for var in variables_to_find:
        value = get_resolved_variable(var, source_dir)
        if value:
            global_vars[var] = value
    build_config['global'] = global_vars

    # 2. Find subdirectories using the reliable method
    print("Finding subdirectories...")
    subdirs = find_subdirectories(top_level_makefile)
    print(f"Found subdirectories: {subdirs}")

    # 3. Process each subdirectory
    for subdir in subdirs:
        subdir_path = os.path.join(source_dir, subdir)
        if os.path.isdir(subdir_path):
            print(f"Processing subdirectory: {subdir}...")
            subdir_vars = {}
            for var in variables_to_find:
                value = get_resolved_variable(var, subdir_path)
                if value:
                    subdir_vars[var] = value
            if subdir_vars:
                build_config[subdir] = subdir_vars

    return build_config

def main():
    parser = argparse.ArgumentParser(description="Deconstruct a 'make'-based build system to extract fully resolved compiler flags.")
    parser.add_argument("source_dir", help="Path to the source code directory containing the top-level Makefile.")
    parser.add_argument("-o", "--output", default="build_config.json", help="Path to write the output JSON file.")
    args = parser.parse_args()

    source_path = os.path.abspath(args.source_dir)
    output_path = os.path.abspath(args.output)

    if not os.path.isdir(source_path):
        print(f"Error: Source directory not found at {source_path}")
        return

    build_config = deconstruct_build(source_path)

    if build_config:
        final_config = {k: v for k, v in build_config.items() if v}
        print(f"Writing build configuration to {output_path}")
        with open(output_path, 'w') as f:
            json.dump(final_config, f, indent=2)
        print("Done.")

if __name__ == "__main__":
    main()