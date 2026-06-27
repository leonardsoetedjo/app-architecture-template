#!/usr/bin/env python3
"""
Add metadata frontmatter to documentation files lacking it.

Usage:
    python scripts/add-doc-frontmatter.py [--dry-run]

This script:
1. Finds all .md files in docs/ without frontmatter
2. Generates appropriate frontmatter based on file location and name
3. Prepends frontmatter to each file
4. Updates docs/.index.json

Run with --dry-run to preview changes without modifying files.
"""

import os
import sys
import glob
from pathlib import Path
from datetime import datetime

def extract_title(filepath):
    """Extract title from first H1 heading."""
    with open(filepath, 'r') as f:
        for line in f:
            if line.startswith('# '):
                return line[2:].strip()
    # Fallback: use filename
    return Path(filepath).stem.replace('-', ' ').title()

def determine_doc_type(filepath):
    """Determine document type based on path."""
    if '/01-standards/' in filepath:
        return 'Standard'
    elif '/02-adrs/' in filepath:
        return 'ADR'
    elif '/03-guidelines/' in filepath:
        return 'Guideline'
    elif '/04-templates/' in filepath:
        return 'Template'
    elif '/04-sops/' in filepath:
        return 'SOP'
    elif '/quick-start/' in filepath:
        return 'Quick Start Guide'
    elif '/architecture/' in filepath:
        return 'Architecture Document'
    else:
        return 'Documentation'

def generate_frontmatter(filepath):
    """Generate YAML frontmatter for a document."""
    title = extract_title(filepath)
    doc_type = determine_doc_type(filepath)
    
    # Extract number if present (for standards/SOPs)
    basename = Path(filepath).name
    number = None
    if basename[0].isdigit():
        number = basename.split('-')[0]
    
    fm = [
        '---',
        f'title: "{title}"',
        f'type: "{doc_type}"',
        f'created: "{datetime.now().strftime("%Y-%m-%d")}"',
    ]
    
    if number:
        fm.insert(2, f'number: "{number}"')
    
    # Add status based on content
    fm.append('status: "active"')
    fm.append('---')
    fm.append('')
    
    return '\n'.join(fm)

def main():
    docs_root = Path(__file__).parent.parent / 'docs'
    dry_run = '--dry-run' in sys.argv
    
    # Find all markdown files without frontmatter
    files_without_fm = []
    
    for filepath in glob.glob(str(docs_root / '**/*.md'), recursive=True):
        # Skip README and template files
        if 'README' in filepath or filepath.endswith('LIFECYCLE.md') or filepath.endswith('QUARTERLY_AUDIT.md'):
            continue
        
        with open(filepath, 'r') as f:
            content = f.read(10)
        
        if not content.startswith('---'):
            files_without_fm.append(filepath)
    
    if not files_without_fm:
        print("✅ All documentation files already have frontmatter!")
        return 0
    
    print(f"Found {len(files_without_fm)} files without frontmatter:\n")
    
    for filepath in sorted(files_without_fm):
        rel_path = filepath.replace(str(docs_root) + '/', '')
        fm = generate_frontmatter(filepath)
        
        if dry_run:
            print(f"  WOULD ADD to {rel_path}:")
            print(fm[:100] + '...')
            print()
        else:
            # Read existing content
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Prepend frontmatter
            new_content = fm + content
            
            # Write back
            with open(filepath, 'w') as f:
                f.write(new_content)
            
            print(f"  ✓ Added frontmatter to {rel_path}")
    
    if dry_run:
        print("\nRun without --dry-run to apply changes.")
    else:
        print(f"\n✅ Added frontmatter to {len(files_without_fm)} files.")
        print("Run 'python scripts/generate-doc-index.py' to update index.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
