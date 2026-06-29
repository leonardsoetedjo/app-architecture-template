import os
import re
from pathlib import Path

def validate_links(root_dir):
    broken_links = []
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
    
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and build directories
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
                        
                        # Resolve relative to the FILE's directory, not the walk root
                        full_path = (path.parent / link_path).resolve()
                        
                        if not full_path.exists():
                            broken_links.append((path, label, link_path))
                            
    return broken_links

if __name__ == "__main__":
    # Auto-detect root: script is in scripts/, docs are in ../docs/
    root = Path(__file__).parent.parent
    broken = validate_links(root / 'docs')
    if broken:
        print(f"Found {len(broken)} broken links:")
        for src, label, target in broken:
            # Make path relative to repo root for cleaner output
            rel_src = src.relative_to(root)
            print(f"FILE: {rel_src}")
            print(f"LABEL: {label}")
            print(f"TARGET: {target}")
            print("---")
        exit(1)
    else:
        print("All documentation links are valid.")
        exit(0)
