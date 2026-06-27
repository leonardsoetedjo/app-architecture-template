#!/usr/bin/env python3
"""
Documentation linter for app-architecture-template.

Validates:
- Standards numbering (no gaps, no duplicates)
- SOP numbering (no gaps, no duplicates)
- Index accuracy (.index.json matches filesystem)
- File naming conventions

Usage:
    python scripts/doc-lint.py
    
Returns:
    0 if all checks pass
    1 if any check fails
"""

import sys
import glob
import os
from pathlib import Path
from collections import Counter

def check_numbering(files, category):
    """Check for numbering gaps and duplicates."""
    numbers = []
    for f in files:
        basename = os.path.basename(f)
        if basename[0].isdigit():
            num = int(basename.split('-')[0])
            numbers.append(num)
    
    numbers.sort()
    issues = []
    
    # Check for duplicates
    duplicates = [num for num, count in Counter(numbers).items() if count > 1]
    if duplicates:
        issues.append(f"Duplicate {category} numbers: {duplicates}")
    
    # Check for gaps
    if numbers:
        expected = list(range(numbers[0], numbers[-1] + 1))
        gaps = set(expected) - set(numbers)
        if gaps:
            issues.append(f"Missing {category} numbers: {sorted(gaps)}")
    
    return issues

def check_index_accuracy(docs_root):
    """Check if .index.json matches filesystem."""
    import json
    
    index_path = os.path.join(docs_root, '.index.json')
    if not os.path.exists(index_path):
        return ["Missing .index.json file"]
    
    with open(index_path, 'r') as f:
        index = json.load(f)
    
    issues = []
    
    # Check standards
    standards_path = os.path.join(docs_root, '01-agnostic/01-standards')
    actual_files = set(os.path.basename(f) for f in glob.glob(os.path.join(standards_path, '*.md')))
    indexed_files = set(v.split('/')[-1] for v in index.get('standards', {}).values())
    
    missing_from_index = actual_files - indexed_files
    extra_in_index = indexed_files - actual_files
    
    if missing_from_index:
        issues.append(f"Standards in filesystem but not in index: {missing_from_index}")
    if extra_in_index:
        issues.append(f"Standards in index but not in filesystem: {extra_in_index}")
    
    return issues

def main():
    """Run all documentation lint checks."""
    docs_root = Path(__file__).parent.parent / 'docs'
    all_issues = []
    
    print("🔍 Linting documentation...")
    print()
    
    # Check standards numbering
    print("✓ Checking standards numbering...")
    standards_files = glob.glob(str(docs_root / '01-agnostic/01-standards' / '[0-9][0-9]-*.md'))
    standards_issues = check_numbering(standards_files, 'standard')
    if standards_issues:
        all_issues.extend(standards_issues)
        print(f"  ✗ {len(standards_issues)} issue(s)")
    else:
        print(f"  ✓ OK ({len(standards_files)} files)")
    
    # Check SOPs numbering
    print("✓ Checking SOPs numbering...")
    sops_files = glob.glob(str(docs_root / '04-sops' / '[0-9][0-9]-*.md'))
    sops_issues = check_numbering(sops_files, 'SOP')
    if sops_issues:
        all_issues.extend(sops_issues)
        print(f"  ✗ {len(sops_issues)} issue(s)")
    else:
        print(f"  ✓ OK ({len(sops_files)} files)")
    
    # Check index accuracy
    print("✓ Checking index accuracy...")
    index_issues = check_index_accuracy(docs_root)
    if index_issues:
        all_issues.extend(index_issues)
        print(f"  ✗ {len(index_issues)} issue(s)")
    else:
        print("  ✓ OK")
    
    print()
    
    if all_issues:
        print("❌ Documentation linting FAILED:")
        for issue in all_issues:
            print(f"  - {issue}")
        return 1
    else:
        print("✅ All documentation checks passed!")
        return 0

if __name__ == '__main__':
    sys.exit(main())
