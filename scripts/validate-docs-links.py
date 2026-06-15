import os
import re
from pathlib import Path

def validate_links(root_dir):
    broken_links = []
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
    
    for root, dirs, files in os.walk(root_dir):
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
    root = "/opt/data/profiles/archie/workspace/app-architecture-template"
    broken = validate_links(root)
    if broken:
        print(f"Found {len(broken)} broken links:")
        for src, label, target in broken:
            print(f"FILE: {src}\nLABEL: {label}\nTARGET: {target}\n---")
        exit(1)
    else:
        print("All documentation links are valid.")
        exit(0)
