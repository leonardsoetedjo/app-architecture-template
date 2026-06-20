#!/usr/bin/env python3
"""
Validate prompt templates in prompts/ follow Standard 27 structure.
Checks: [ROLE][CONTEXT][TASK][CONSTRAINTS][OUTPUT] all present and non-empty.

Usage:
  scripts/validate-prompts.py                   # validate all prompts/*.md
  scripts/validate-prompts.py prompts/foo.md    # validate single file
  scripts/validate-prompts.py --ci              # exit non-zero on any failure
"""

import sys
import os
import re
import argparse
import glob

REQUIRED_SECTIONS = ["Role", "Context", "Task", "Constraints", "Output"]


def validate_file(filepath: str) -> list[str]:
    errors = []
    text = open(filepath, encoding='utf-8').read()
    basename = os.path.basename(filepath)

    # Skip README.md
    if basename.lower() == "readme.md":
        return []

    # Must have version header
    if "## Version" not in text:
        errors.append(f"Missing ## Version section")

    # Must have changelog
    if "## Changelog" not in text:
        errors.append(f"Missing ## Changelog section")

    # Check each required section
    for section in REQUIRED_SECTIONS:
        pattern = rf"### {section}\s*(?:\n|$)"
        if not re.search(pattern, text):
            errors.append(f"Missing ### {section} section")
            continue

        # Section must have content (not empty)
        match = re.search(rf"### {section}\s*\n(.*?)(?=\n### |\n## |\Z)", text, re.DOTALL)
        if match:
            content = match.group(1).strip()
            if not content or content.startswith("["):
                errors.append(f"### {section} is empty or placeholder")

    # Role must be specific (not generic)
    role_match = re.search(r"### Role\s*\n(.*?)(?=\n### |\n## |\Z)", text, re.DOTALL)
    if role_match:
        role_text = role_match.group(1).strip()
        if "helpful assistant" in role_text.lower() or "ai assistant" in role_text.lower():
            errors.append(f"Role is too generic ('helpful assistant')")
        if len(role_text.split()) < 5:
            errors.append(f"Role is too short (< 5 words)")

    # Task must be imperative (starts with verb)
    task_match = re.search(r"### Task\s*\n(.*?)(?=\n### |\n## |\Z)", text, re.DOTALL)
    if task_match:
        task_text = task_match.group(1).strip()
        # First sentence should start with a verb
        first_sentence = task_text.split('.')[0]
        if not re.match(r"^[A-Z][a-zA-Z]+", first_sentence):
            errors.append(f"Task doesn't start with capitalized verb")

    # Constraints must be bulleted list
    constraints_match = re.search(r"### Constraints\s*\n(.*?)(?=\n### |\n## |\Z)", text, re.DOTALL)
    if constraints_match:
        constraints_text = constraints_match.group(1).strip()
        if not any(line.strip().startswith("- ") for line in constraints_text.split('\n')):
            errors.append(f"Constraints missing bullet list (- item)")

    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate prompt templates per Standard 27")
    parser.add_argument("files", nargs="*", help="Files to validate")
    parser.add_argument("--ci", action="store_true", help="Exit non-zero on failure")
    args = parser.parse_args()

    files = []
    if args.files:
        for pat in args.files:
            if '*' in pat or '?' in pat:
                files.extend(glob.glob(pat))
            else:
                files.append(pat)
    else:
        files = sorted(glob.glob("prompts/*.md"))

    if not files:
        print("  ℹ️  No prompt templates found in prompts/*.md")
        sys.exit(0)

    failed = False
    total = 0
    passed = 0

    print("=" * 60)
    print("Prompt Validation Gate (Standard 27 §5.3)")
    print("Checking: ROLE, CONTEXT, TASK, CONSTRAINTS, OUTPUT")
    print("=" * 60)
    print()

    for filepath in files:
        basename = os.path.basename(filepath)
        errors = validate_file(filepath)
        total += 1

        if not errors:
            print(f"  ✅ {basename:40s} PASSED")
            passed += 1
        else:
            failed = True
            print(f"  ❌ {basename:40s} FAILED")
            for err in errors:
                print(f"      - {err}")

    print()
    print(f"  Result: {passed}/{total} passed")
    print("=" * 60)

    if failed and args.ci:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
