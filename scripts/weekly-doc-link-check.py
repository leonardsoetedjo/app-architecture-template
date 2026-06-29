#!/usr/bin/env python3
"""
Weekly documentation link validation cron job.
Runs every Monday at 9am, reports broken links.

Schedule: 0 9 * * 1 (every Monday 9am)
"""

import os
import re
from pathlib import Path

def validate_links(root_dir):
    """Validate all markdown links in docs directory."""
    broken_links = []
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
    
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'target', '.git', '__pycache__', '.venv')]
        for file in files:
            if file.endswith('.md'):
                path = Path(root) / file
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    links = link_pattern.findall(content)
                    for label, link_path in links:
                        if link_path.startswith(('http://', 'https://', 'mailto:', '#')):
                            continue
                        full_path = (path.parent / link_path).resolve()
                        if not full_path.exists():
                            broken_links.append((path, label, link_path))
    return broken_links

def main():
    root = Path(__file__).parent.parent
    broken = validate_links(root / 'docs')
    
    if not broken:
        return "✅ All documentation links are valid."
    
    # Group by file for cleaner report
    by_file = {}
    for src, label, target in broken:
        rel_src = str(src.relative_to(root))
        if rel_src not in by_file:
            by_file[rel_src] = []
        by_file[rel_src].append((label, target))
    
    report = [f"## Documentation Link Check — {len(broken)} Broken Links Found\n"]
    
    for filepath, links in sorted(by_file.items())[:10]:  # Show first 10 files
        report.append(f"\n### `{filepath}`\n")
        for label, target in links[:5]:  # Show first 5 per file
            report.append(f"- **{label}** → `{target}`")
        if len(links) > 5:
            report.append(f"- ... and {len(links) - 5} more")
    
    if len(by_file) > 10:
        report.append(f"\n_... and {len(by_file) - 10} more files with broken links_")
    
    report.append("\n---\n**Fix:** Run `python3 scripts/validate-docs-links.py` for full report and fix paths.")
    
    return "\n".join(report)

if __name__ == "__main__":
    print(main())
