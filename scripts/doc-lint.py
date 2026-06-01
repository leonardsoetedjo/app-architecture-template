#!/usr/bin/env python3
"""
Documentation Linter - Validates YAML frontmatter and link integrity across all docs.

This script enforces documentation quality standards:
1. YAML frontmatter is present and contains required fields
2. All relative links point to existing files
3. Template files follow the correct structure
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Optional


def extract_yaml_frontmatter(content: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract YAML frontmatter from markdown file."""
    if not content.startswith('---'):
        return None, "Missing YAML frontmatter delimiter (---)"

    try:
        end_marker = content.find('---', 3)
        if end_marker == -1:
            return None, "Missing closing YAML frontmatter delimiter"

        yaml_content = content[3:end_marker].strip()
        return yaml_content, None
    except Exception as e:
        return None, f"Error extracting frontmatter: {e}"


def parse_simple_yaml(yaml_content: str) -> dict:
    """Simple YAML parser for frontmatter (handles basic key: value)."""
    result = {}
    for line in yaml_content.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            key, value = line.split(':', 1)
            result[key.strip()] = value.strip()
    return result


def check_required_fields(data: dict, file_type: str) -> List[str]:
    """Check if required fields exist for the given file type."""
    errors = []

    required = {
        'ADR': ['name', 'type', 'version'],
        'Standard': ['name', 'type', 'version'],
        'template': ['name', 'type', 'version']
    }

    defaults = required.get(file_type, required['ADR'])

    for field in defaults:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    return errors


def check_links(file_path: Path, all_files: List[Path]) -> List[str]:
    """Find broken relative links in a markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    broken_links = []

    # Match markdown links [text](path)
    link_pattern = r'\[.*?\]\((.*?)\)'
    for link in re.findall(link_pattern, content):
        # Skip external links
        if link.startswith(('http://', 'https://', 'mailto:', '#')):
            continue

        # Resolve relative path from file's directory
        base_dir = file_path.parent
        resolved = (base_dir / link).resolve()

        # Check if the resolved file exists
        if not resolved.exists():
            # Check if it's a directory reference
            if not link.endswith('/'):
                broken_links.append(f"{link} (resolved to {resolved})")

    return broken_links


def get_file_type(file_path: Path) -> str:
    """Determine the type of documentation file based on path."""
    path_str = str(file_path)

    if '/adr/' in path_str and path_str.startswith('docs/'):
        return 'ADR'
    elif '/standards/' in path_str and path_str.startswith('docs/01-agnostic/'):
        return 'Standard'
    elif '/guidelines/' in path_str and path_str.startswith('docs/01-agnostic/'):
        return 'Standard'
    elif '/templates/' in path_str:
        return 'template'

    return 'ADR'  # Default assumption


def check_adr_format(file_path: Path) -> List[str]:
    """Check specific ADR formatting requirements."""
    errors = []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for decision section
    if '## Decision' not in content:
        errors.append("Missing '## Decision' section")

    # Check for consequences section
    if '## Consequences' not in content:
        errors.append("Missing '## Consequences' section")

    return errors


def main():
    """Main linting function."""
    docs_dir = Path('docs').resolve()

    if not docs_dir.exists():
        print(f"❌ Docs directory not found: {docs_dir}")
        sys.exit(1)

    all_md_files = list(docs_dir.rglob('*.md'))

    errors = 0
    warnings = 0

    print("🔎 Running Documentation Linter...")
    print(f"   Found {len(all_md_files)} markdown files")
    print("-" * 60)

    for file in sorted(all_md_files):
        filename = file.relative_to(docs_dir)

        # Skip index and known files
        if 'index.md' in str(filename):
            continue

        # 1. Frontmatter Check
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        yaml_content, frontmatter_error = extract_yaml_frontmatter(content)

        if frontmatter_error:
            print(f"❌ {filename}: {frontmatter_error}")
            errors += 1
            continue

        # 2. Parse and check required fields
        data = parse_simple_yaml(yaml_content)
        file_type = get_file_type(file)
        missing_fields = check_required_fields(data, file_type)

        for field in missing_fields:
            print(f"⚠️  {filename}: {field}")
            warnings += 1

        # 3. ADR Format Check
        if file_type == 'ADR':
            adr_errors = check_adr_format(file)
            for err in adr_errors:
                print(f"⚠️  {filename}: {err}")
                warnings += 1

        # 4. Link Check (skip templates)
        if 'templates/' not in str(filename):
            broken_links = check_links(file, all_md_files)
            for link in broken_links:
                print(f"❌ {filename}: Broken link -> {link}")
                errors += 1

    print("-" * 60)
    print(f"Results: {errors} errors, {warnings} warnings")

    if errors == 0:
        print("\n✅ All documentation checks passed!")
        sys.exit(0)
    else:
        print(f"\n❌ Found {errors} issues. Please fix them.")
        sys.exit(1)


if __name__ == "__main__":
    main()
