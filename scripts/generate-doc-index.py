#!/usr/bin/env python3
"""
Generate documentation index from filesystem.

Scans docs/ directory and generates .index.json with:
- All standards with their numbers
- All SOPs with metadata
- Navigation links
- Gaps tracking

Usage:
    python scripts/generate-doc-index.py
"""

import json
import os
import glob
from pathlib import Path

def extract_frontmatter(filepath):
    """Extract YAML frontmatter from markdown file."""
    with open(filepath, 'r') as f:
        content = f.read(500)
    
    if not content.startswith('---'):
        return {}
    
    frontmatter = {}
    lines = content.split('\n')
    in_frontmatter = False
    
    for line in lines:
        if line.strip() == '---':
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter and ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip().strip('"')
    
    return frontmatter

def scan_standards(docs_root):
    """Scan standards directory and build index."""
    standards_path = os.path.join(docs_root, '01-agnostic/01-standards')
    files = sorted(glob.glob(os.path.join(standards_path, '[0-9][0-9]-*.md')))
    
    standards = {}
    for f in files:
        basename = os.path.basename(f)
        name = basename.split('-', 1)[1].replace('.md', '')
        key = name.replace('-', '_')
        standards[key] = f"docs/01-agnostic/01-standards/{basename}"
    
    return standards

def scan_sops(docs_root):
    """Scan SOPs directory and build index."""
    sops_path = os.path.join(docs_root, '04-sops')
    files = sorted(glob.glob(os.path.join(sops_path, '[0-9][0-9]-*.md')))
    
    sops = {}
    for f in files:
        basename = os.path.basename(f)
        num = basename.split('-')[0]
        name = basename.replace(f'{num}-', '').replace('.md', '')
        
        # Try to extract metadata from frontmatter
        fm = extract_frontmatter(f)
        
        sops[num] = {
            'file': f"docs/04-sops/{basename}",
            'task': fm.get('name', name.replace('-', ' ').title()),
            'layer': fm.get('layer', 'unknown')
        }
    
    return sops

def main():
    """Generate documentation index."""
    docs_root = Path(__file__).parent.parent / 'docs'
    output_path = docs_root / '.index.json'
    
    print(f"Scanning documentation in {docs_root}...")
    
    # Build index
    index = {
        'version': '2.0',
        'generated_at': '2026-06-27',
        'generator': 'scripts/generate-doc-index.py',
        'categories': {
            'standards': {
                'path': 'docs/01-agnostic/01-standards',
                'description': 'Core architectural standards'
            },
            'adrs': {
                'path': 'docs/01-agnostic/02-adrs',
                'description': 'Architectural Decision Records'
            },
            'guidelines': {
                'path': 'docs/01-agnostic/03-guidelines',
                'description': 'Practical patterns and how-to guides'
            },
            'templates': {
                'path': 'docs/01-agnostic/04-templates',
                'description': 'Reusable document templates'
            },
            'sops': {
                'path': 'docs/04-sops',
                'description': 'Standard Operating Procedures'
            }
        },
        'sources': {
            'architecture-docs': {
                'path': 'docs/01-agnostic',
                'extensions': ['.md'],
                'description': 'All standards, ADRs, guidelines, templates'
            },
            'sops': {
                'path': 'docs/04-sops',
                'extensions': ['.md'],
                'description': 'All standard operating procedures'
            }
        },
        'navigation': {
            'ai_agents_md': 'docs/AI_NAVIGATION.md',
            'root_agents_md': 'AGENTS.md',
            'sop_index': 'docs/04-sops/00-index.md',
            'adr_index': 'docs/01-agnostic/02-adrs/00-adr-index.md',
            'standards_index': 'docs/01-agnostic/00-index.md',
            'root_index': 'docs/00-index.md'
        },
        'standards': scan_standards(docs_root),
        'sops': scan_sops(docs_root),
        'adr_gaps': {
            '09': {
                'status': 'intentionally_skipped',
                'reason': 'Security decisions documented in standalone guides'
            }
        },
        'sop_gaps': {
            'alembic-migration': {
                'status': 'planned',
                'tracking_issue': 126,
                'description': 'Python Alembic migration SOP'
            }
        }
    }
    
    # Write index
    with open(output_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"✓ Generated {output_path}")
    print(f"  - {len(index['standards'])} standards")
    print(f"  - {len(index['sops'])} SOPs")
    print(f"  - {len(index['categories'])} categories")
    
    return 0

if __name__ == '__main__':
    exit(main())
