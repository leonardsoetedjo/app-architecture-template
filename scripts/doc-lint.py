#!/usr/bin/env python3
"""
Documentation Linter v2 — Validates YAML frontmatter, link integrity, index
consistency, and phantom references across all docs.

Exit codes:
  0  All checks passed
  1  Errors found (failures)
  2  Warnings found (non-blocking, use --strict to escalate)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Optional

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

# Documents that legitimately have no frontmatter (index pages, quick-start, etc.)
FRONTMATTER_EXEMPT = frozenset([
    "index.md",                       # Index pages have no frontmatter
    "00-index.md",
    "quick-start/*.md",               # Onboarding docs
    "AI_NAVIGATION.md",
    "archive/*.md",                   # Archived docs
    "features.md",                    # Agnostic feature list
    "governance.md",                  # Agnostic governance
    "*.md"                            # All standalone docs (not under numbered dirs)
])

# Document types and which sections they require
FILE_TYPE_RULES = {
    "ADR": {
        "required_fm": ["name", "type", "version"],
        "required_sections": ["## Decision", "## Consequences"],
        "required_frontmatter": True,
    },
    "Standard": {
        "required_fm": ["name", "type", "version"],
        "required_sections": [],   # Standards are guides, not decisions
        "required_frontmatter": True,
    },
    "SOP": {
        "required_fm": ["name", "type", "version"],
        "required_sections": [],   # SOPs are procedures, not decisions
        "required_frontmatter": True,
    },
    "template": {
        "required_fm": ["name", "type", "version"],
        "required_sections": [],
        "required_frontmatter": True,
    },
    "guide": {
        "required_fm": [],  # Guidelines are prose, not formal docs
        "required_sections": [],
        "required_frontmatter": False,
    },
    "quick-start": {
        "required_fm": [],
        "required_sections": [],
        "required_frontmatter": False,
    },
    "index": {
        "required_fm": [],
        "required_sections": [],
        "required_frontmatter": False,
    },
}

# ═══════════════════════════════════════════════════════════════════
# CORE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════


def is_frontmatter_exempt(file_path: Path, docs_dir: Path) -> bool:
    """Check if a file is allowed to have no YAML frontmatter."""
    rel_raw = str(file_path.relative_to(docs_dir))
    rel_name = file_path.name
    
    # Standalone docs (not under numbered directories) — exempt
    if not re.search(r'\d+-', rel_raw):
        return True
    
    # Specific known exempt files
    if rel_name in {"index.md", "00-index.md"}:
        return True
    
    if rel_name == "AI_NAVIGATION.md":
        return True
    
    # Quick-start directory
    if "quick-start/" in rel_raw:
        return True
    
    # Archive directory
    if rel_raw.startswith("archive/"):
        return True
    
    # Top-level files in docs/
    if "/" not in rel_raw.replace("/", ""):  # Only one slash → root of docs/
        return True
    
    return False


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
        if ':' in line and "http" not in line.split(':')[1]:
            key, value = line.split(':', 1)
            result[key.strip()] = value.strip()
    return result


def detect_file_type(file_path: Path, docs_dir: Path) -> str:
    """Determine the type of documentation file based on its location in the tree."""
    path_str = str(file_path)
    rel_str = str(file_path.relative_to(docs_dir))
    
    # Index detection
    if file_path.name in ("index.md", "00-index.md"):
        return "index"
    
    # Quick-start detection
    if "quick-start/" in rel_str:
        return "quick-start"
    
    # Archive detection
    if rel_str.startswith("archive/"):
        return "guide"
    
    # ADR detection (strict)
    if re.search(r'/\d+-adrs?/', path_str) or '/adrs/' in path_str:
        return "ADR"
    
    # Standard detection (under 01-standards)
    if '/01-standards/' in rel_str and '-agents' not in path_str and '-agent-' not in path_str:
        # Agent files are treated as Standards (they have frontmatter)
        if '/14-agents-java.md' in path_str or '/15-agents-python.md' in path_str or \
           '/16-agents-reactjs.md' in path_str or '/17-agents-quasar.md' in path_str or \
           '/18-agent-session-harness.md' in path_str or '/13-agents.md' in path_str:
            return "Standard"
        return "Standard"
    
    # SOP detection (under 04-sops)
    if '/04-sops/' in rel_str:
        return "SOP"
    
    # Template detection (under 04-templates or 01-agnostic/04-templates)
    if '/04-templates/' in rel_str:
        return "template"
    
    # Audit detection
    if '/05-audit/' in rel_str:
        return "guide"
    
    # Guidelines detection
    if '/03-guidelines/' in rel_str or '/05-guidelines/' in rel_str:
        return "guide"
    
    # Stack-specific (02-java, 03-python) — guides/overviews
    if re.search(r'/0[23]-(java|python)/', rel_str):
        return "guide"
    
    return "guide"  # Default — most relaxed


def load_doc_index(docs_dir: Path) -> Optional[dict]:
    """Load the machine-readable doc index for cross-referencing."""
    index_path = docs_dir / ".index.json"
    if index_path.exists():
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None
    return None


def check_links(file_path: Path, docs_dir: Path, repo_dir: Path) -> List[str]:
    """Find broken relative and cross-directory links in a markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    broken_links = []
    base_dir = file_path.parent
    
    # Match markdown links [text](path)
    link_pattern = r'\[.*?\]\((.*?)\)'
    for link in re.findall(link_pattern, content):
        # Skip external links and anchors
        if link.startswith(('http://', 'https://', 'mailto:', 'ftp://', '#')):
            continue
        
        # Strip anchor for existence check
        clean_link = link.split('#')[0]
        if not clean_link:
            continue  # Pure anchor → valid
        
        # Resolve from file's directory
        resolved = (base_dir / clean_link).resolve()
        
        if not resolved.exists():
            # Also check relative to repo root (for paths starting with /)
            if clean_link.startswith('/'):
                resolved_repo = (repo_dir / clean_link.lstrip('/')).resolve()
                if resolved_repo.exists():
                    continue
            
            broken_links.append(f"{link} (resolved to {resolved})")
    
    return broken_links


def check_duplicate_sop_numbers(docs_dir: Path) -> List[str]:
    """Check for duplicate SOP numbers in filenames."""
    sop_dir = docs_dir / "04-sops"
    if not sop_dir.exists():
        return []
    
    errors = []
    seen = {}
    
    for f in sorted(sop_dir.glob("*.md")):
        fname = f.name
        match = re.match(r'(\d+)-', fname)
        if match:
            num = match.group(1)
            if num in seen:
                errors.append(
                    f"    Duplicate SOP number {num}: "
                    f"'{seen[num]}' and '{fname}' both claim it"
                )
            else:
                seen[num] = fname
    
    return errors


def check_phantom_references(docs_dir: Path) -> List[str]:
    """Check for references to ADRs or SOPs that don't exist on disk."""
    errors = []
    
    # Collect all existing SOP numbers from filenames
    sop_dir = docs_dir / "04-sops"
    existing_sops = set()
    for f in sop_dir.glob("*.md"):
        match = re.match(r'(\d+)-', f.name)
        if match:
            existing_sops.add(match.group(1).zfill(2))
    
    # Collect ADR references from text
    adr_dir = docs_dir / "01-agnostic" / "02-adrs"
    existing_adrs = set()
    if adr_dir.exists():
        for f in adr_dir.glob("*.md"):
            match = re.match(r'(\d+)-', f.name)
            if match:
                existing_adrs.add(match.group(1).zfill(2))
    
    # Scan all docs for phantom references
    for md_file in docs_dir.rglob("*.md"):
        with open(md_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Find references like "ADR #13", "SOP-06", "SOP #06", etc.
        for match in re.finditer(r'(?i)(?:ADR|sop)[\s#-](\d{1,2})', text):
            ref_num = match.group(1).zfill(2)
            if "ADR" in text[match.start():match.start()+5].upper():
                if ref_num not in existing_adrs:
                    errors.append(
                        f"    {md_file.relative_to(docs_dir)}: "
                        f"    ADR #{ref_num}]  referenced but no 0X-adrs/{ref_num}-*.md exists"
                    )
            elif "sop" in text[match.start():match.start()+5].lower():
                if ref_num not in existing_sops:
                    errors.append(
                        f"    {md_file.relative_to(docs_dir)}: "
                        f"    SOP-#{ref_num}]  referenced but no 0X-*.md exists"
                    )
    
    return errors


def check_boilerplate_agents_md_duplication(docs_dir: Path) -> List[str]:
    """Estimate AGENTS.md duplication across boilerplate directories."""
    errors = []
    repo_dir = docs_dir.parent
    boilerplate = repo_dir / "boilerplate"
    
    if not boilerplate.exists():
        return errors
    
    agents_files = list(boilerplate.rglob("AGENTS.md"))
    if len(agents_files) < 2:
        return errors
    
    # Compare each pair
    for i, f1 in enumerate(agents_files):
        for f2 in agents_files[i+1:]:
            with open(f1, 'r', encoding='utf-8') as fh1, \
                 open(f2, 'r', encoding='utf-8') as fh2:
                c1, c2 = fh1.read(), fh2.read()
            
            # Compute Jaccard similarity of lines
            set1 = set(c1.split('\n'))
            set2 = set(c2.split('\n'))
            intersection = len(set1 & set2)
            union = len(set1 | set2)
            similarity = intersection / union if union else 0
            
            if similarity > 0.60:
                errors.append(
                    f"    {f1.relative_to(repo_dir)} ↔ {f2.relative_to(repo_dir)}: "
                    f"    Jaccard similarity ≈ {similarity:.0%} — likely duplicated content. "
                    f"    Consider extracting to a shared template or reducing duplication."
                )
    
    return errors


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Documentation Linter v2")
    parser.add_argument('--strict', action='store_true', help='Treat warnings as errors')
    parser.add_argument('--verbose', action='store_true', help='Show passing checks')
    parser.add_argument('--skip-frontmatter', action='store_true', help='Skip frontmatter checks')
    parser.add_argument('--skip-links', action='store_true', help='Skip dead-link checks')
    args = parser.parse_args()
    
    docs_dir = Path('docs').resolve()
    repo_dir = docs_dir.parent
    
    if not docs_dir.exists():
        print(f"❌ Docs directory not found: {docs_dir}")
        sys.exit(1)
    
    all_md_files = list(docs_dir.rglob('*.md'))
    errors: List[str] = []
    warnings: List[str] = []
    passes: List[str] = []
    
    print("🔎 Documentation Linter v2")
    print(f"   Found {len(all_md_files)} markdown files")
    print(f"   Strict mode: {args.strict}")
    print("-" * 60)
    
    for file in sorted(all_md_files):
        filename = file.relative_to(docs_dir)
        file_str = str(filename)
        file_type = detect_file_type(file, docs_dir)
        rules = FILE_TYPE_RULES[file_type]
        exempt = is_frontmatter_exempt(file, docs_dir) if not args.skip_frontmatter else True
        
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # ═══════ Frontmatter Check ═══════
        if not args.skip_frontmatter and not exempt:
            yaml_content, fm_error = extract_yaml_frontmatter(content)
            
            if fm_error:
                errors.append(f"{filename}: {fm_error}")
                continue
            
            data = parse_simple_yaml(yaml_content)
            
            for field in rules["required_fm"]:
                if field not in data:
                    warnings.append(f"{filename}: Missing required field: `{field}`")
        
        # ═══════ Section Check (only for ADRs) ═══════
        if file_type == "ADR" and not exempt:
            for section in rules["required_sections"]:
                if section not in content:
                    warnings.append(f"{filename}: Missing `{section}`")
        
        # ═══════ Link Check ═══════
        if not args.skip_links:
            broken = check_links(file, docs_dir, repo_dir)
            if broken:
                for link in broken:
                    errors.append(f"{filename}: Broken link → {link}")
            elif args.verbose:
                passes.append(f"{filename}: All links OK")
    
    # ═══════ Index Consistency Checks ═══════
    print("-" * 60)
    print("📋 Index consistency checks...")
    
    idx = load_doc_index(docs_dir)
    if idx:
        if args.verbose:
            print(f"   Loaded doc index: {len(idx.get('sops', []))} SOPs, {len(idx.get('adrs', []))} ADR gaps")
    else:
        warnings.append("docs/.index.json not found or unreadable — skipping index cross-checks")
    
    sop_dups = check_duplicate_sop_numbers(docs_dir)
    if sop_dups:
        errors.append("SOP duplicate numbering detected:")
        for d in sop_dups:
            errors.append(f"  {d}")
    
    phantoms = check_phantom_references(docs_dir)
    if phantoms:
        errors.append("Phantom references detected:")
        for p in phantoms:
            errors.append(f"  {p}")
    
    # ═══════ Boilerplate Checks ═══════
    print("📦 Boilerplate checks...")
    bp_dups = check_boilerplate_agents_md_duplication(docs_dir)
    if bp_dups:
        warnings.append("Boilerplate AGENTS.md duplication detected:")
        for d in bp_dups:
            warnings.append(f"  {d}")
    
    # ═══════ Summary ═══════
    print("-" * 60)
    
    if errors:
        print(f"❌ ERRORS ({len(errors)}):")
        for e in errors[:30]:  # Show first 30
            print(f"   {e}")
        if len(errors) > 30:
            print(f"   ... and {len(errors) - 30} more")
    
    if warnings:
        print(f"⚠️  WARNINGS ({len(warnings)}):")
        for w in warnings[:20]:
            print(f"   {w}")
        if len(warnings) > 20:
            print(f"   ... and {len(warnings) - 20} more")
    
    if passes:
        print(f"✅ OK ({len(passes)} files passed all checks)")
    
    print("-" * 60)
    
    total_issues = len(errors) + (len(warnings) if args.strict else 0)
    
    if total_issues == 0:
        print("\n✅ All documentation checks passed!")
        sys.exit(0)
    else:
        if errors:
            print(f"\n❌ Found {len(errors)} error(s). Please fix them.")
        if args.strict and warnings:
            print(f"\n⚠️  Strict mode: Found {len(warnings)} warning(s) treated as errors.")
        sys.exit(1)


if __name__ == "__main__":
    main()
