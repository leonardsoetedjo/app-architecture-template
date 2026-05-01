#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

def check_frontmatter(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        if not content.startswith('---'):
            return False, "Missing YAML frontmatter"

        # Basic check for required fields
        if 'name:' not in content or 'type:' not in content:
            return False, "Missing 'name' or 'type' in frontmatter"
    return True, None

def check_links(file_path, all_files):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find all markdown links [text](path)
        links = re.findall(r'\[.*?\]\((.*?)\)', content)

        broken_links = []
        for link in links:
            # Resolve relative path
            base_dir = Path(file_path).parent
            resolved = (base_dir / link).resolve()

            # Check if resolved path is in our list of files
            # Note: This is simplified and assumes links are relative to file
            if not any(str(f).endswith(link) for f in all_files) and not link.startswith(('http', 'mailto')):
                 # Try absolute check
                 if not os.path.exists(resolved):
                     broken_links.append(link)

        return broken_links

def main():
    docs_dir = Path('docs')
    all_md_files = list(docs_dir.rglob('*.md'))

    errors = 0
    print("🔎 Running Documentation Linter...")
    print("-" * 40)

    for file in all_md_files:
        if 'INDEX.md' in file.name: continue

        # 1. Frontmatter Check
        ok, msg = check_frontmatter(file)
        if not ok:
            print(f"❌ {file}: {msg}")
            errors += 1

        # 2. Link Check
        broken = check_links(file, all_md_files)
        for link in broken:
            print(f"❌ {file}: Broken link -> {link}")
            errors += 1

    if errors == 0:
        print("\n✅ All documentation checks passed!")
        sys.exit(0)
    else:
        print(f"\n❌ Found {errors} issues. Please fix them.")
        sys.exit(1)

if __name__ == "__main__":
    main()
