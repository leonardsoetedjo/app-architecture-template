#!/usr/bin/env python3
"""verify-rules-covered.py — Verify every rule in .agents.yml has test/config coverage.

Usage:
    ./scripts/verify-rules-covered.py                     # Strict mode — fails on orphans
    ./scripts/verify-rules-covered.py --report            # Print coverage map, no exit
    ./scripts/verify-rules-covered.py --stack java        # Check only one stack
    ./scripts/verify-rules-covered.py --dry-run           # Show what WOULD be checked

Exit codes:
    0 = all rules covered
    1 = orphan rules found
    2 = .agents.yml missing or unreadable
"""

import argparse
import glob
import os
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install: pip install pyyaml")
    sys.exit(2)


def extract_rules(data):
    """Schema-agnostic extraction of rule objects from parsed YAML.

    Walks the entire document tree and yields any dict that contains
    either 'id' or 'name' keys. This is forward-compatible: new sections
    added to .agents.yml are traversed automatically.
    """
    def walk(obj, path=""):
        if isinstance(obj, dict):
            if "id" in obj or "name" in obj:
                # Found a rule-like dict. Yield it.
                yield obj
            for key, val in obj.items():
                new_path = f"{path}/{key}" if path else key
                yield from walk(val, new_path)
        elif isinstance(obj, list):
            for item in obj:
                yield from walk(item, path)

    yield from walk(data)


def get_rule_identifier(rule):
    """Returns the stable identifier for a rule.

    Prefer 'id' (stable, never renamed). Fall back to 'name' (may change).
    If neither exists, returns a synthetic ID from the dict contents.
    """
    return rule.get("id", rule.get("name", f"anonymous_{hash(str(rule))}"))


def discover_stacks(boilerplate_dir="boilerplate"):
    """Auto-discover stacks from boilerplate/* subdirectories.

    A stack is any directory under boilerplate/ that contains an AGENTS.md.
    """
    stacks = set()
    for agents_md in Path(boilerplate_dir).glob("*/AGENTS.md"):
        stacks.add(agents_md.parent.name)
    return sorted(stacks)


def check_coverage(rule_id, stack, boilerplate_dir="boilerplate"):
    """Check if rule_id appears anywhere in a stack's source tree.

    Uses grep -rl for efficiency. Returns True if found, False if not.
    """
    stack_path = Path(boilerplate_dir) / stack
    if not stack_path.exists():
        return False

    # Grep recursively. Exclude binary files, node_modules, target, etc.
    result = subprocess.run(
        ["grep", "-rlI", rule_id, str(stack_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False

    # Filter out results from node_modules, target, etc.
    hits = [h for h in result.stdout.strip().split("\n") if h]
    for hit in hits:
        hit_path = Path(hit)
        excluded = any(part in {"node_modules", "target", "dist", ".git", "__pycache__", ".venv"}
                        for part in hit_path.parts)
        if not excluded:
            return True
    return False


def check_agents_md_reference(rule_id, stack, boilerplate_dir="boilerplate"):
    """Check if the stack's AGENTS.md mentions this rule_id.

    This catches the case where a rule exists in .agents.yml but the
    dispatch file hasn't been updated to reference it.
    """
    agents_file = Path(boilerplate_dir) / stack / "AGENTS.md"
    if not agents_file.exists():
        return False
    return rule_id in agents_file.read_text()


def main():
    parser = argparse.ArgumentParser(description="Verify rule coverage across stacks")
    parser.add_argument("--report", action="store_true", help="Print detailed coverage map")
    parser.add_argument("--stack", help="Check only one stack")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be checked")
    parser.add_argument("--agents-yml", default=".agents.yml", help="Path to .agents.yml")
    parser.add_argument("--boilerplate", default="boilerplate", help="Boilerplate directory")
    args = parser.parse_args()

    # --- Load .agents.yml ---
    agents_path = Path(args.agents_yml)
    if not agents_path.exists():
        print(f"ERROR: {agents_path} not found")
        sys.exit(2)

    with open(agents_path) as f:
        data = yaml.safe_load(f)

    # --- Extract all rules ---
    raw_rules = list(extract_rules(data))
    
    # Filter to rules with 'id' key (machine-tracked rules)
    # Rules with only 'name' are ignored (they're conventions, not machine-verifiable)
    rules = [r for r in raw_rules if "id" in r]
    rule_ids = set(get_rule_identifier(r) for r in rules)
    
    # Build map: rule_id -> applicable stacks
    rule_stacks = {}
    for r in rules:
        rid = get_rule_identifier(r)
        declared = r.get("stacks", [])
        if declared:
            rule_stacks[rid] = set(declared)
        else:
            # No stacks declared = cross-cutting = all stacks
            rule_stacks[rid] = None  # Marker: applies to all

    if not rules:
        print(f"WARNING: No machine-tracked rules (with 'id') found in {agents_path}")
        print("  Rules with only 'name' are treated as ambient conventions, not verified.")
        sys.exit(0)

    # --- Discover stacks ---
    stacks = ([args.stack] if args.stack else discover_stacks(args.boilerplate))
    if not stacks:
        print(f"WARNING: No stacks found in {args.boilerplate}/")
        sys.exit(0)

    print(f"Machine-tracked rules in {agents_path}: {len(rule_ids)}")
    for rid in sorted(rule_ids):
        applicable = rule_stacks[rid]
        scope = f"applies to: {', '.join(sorted(applicable))}" if applicable else "cross-cutting (all stacks)"
        print(f"  • {rid} ({scope})")
    print()
    print(f"Stacks discovered: {', '.join(stacks)}")
    print()

    if args.dry_run:
        print("DRY RUN: Would check the following:")
        for rid in sorted(rule_ids):
            applicable = rule_stacks[rid]
            targets = ([args.stack] if args.stack else (sorted(applicable) if applicable else stacks))
            for s in targets:
                print(f"  grep -r {rid} {args.boilerplate}/{s}/")
        sys.exit(0)

    # --- Coverage check ---
    orphans = []       # Rules with no coverage in any applicable stack
    stack_gaps = {}    # Rules missing in specific applicable stacks
    dispatch_gaps = [] # Rules not referenced in AGENTS.md for applicable stacks

    for rule in rules:
        rid = get_rule_identifier(rule)
        applicable = rule_stacks[rid]
        covered_anywhere = False

        # Determine which stacks this rule must cover
        if applicable:
            required = sorted(applicable)
        else:
            required = stacks
        
        for s in required:
            in_source = check_coverage(rid, s, args.boilerplate)
            in_agents = check_agents_md_reference(rid, s, args.boilerplate)

            if in_source:
                covered_anywhere = True
            else:
                stack_gaps.setdefault(rid, []).append(s)

            if not in_agents:
                dispatch_gaps.append((rid, s))

        if not covered_anywhere:
            orphans.append(rid)

    # --- Report ---
    if args.report:
        print("=" * 60)
        print("COVERAGE REPORT")
        print("=" * 60)
        print()
        for rid in sorted(rule_ids):
            applicable = rule_stacks[rid]
            targets = sorted(applicable) if applicable else stacks
            covered_in = []
            missing_in = []
            for s in targets:
                if check_coverage(rid, s, args.boilerplate):
                    covered_in.append(s)
                else:
                    missing_in.append(s)
            print(f"{rid}:")
            print(f"  Applies to: {', '.join(targets)}")
            print(f"  Covered: {', '.join(covered_in) or 'NONE'}")
            print(f"  Missing: {', '.join(missing_in) or 'NONE'}")
            print()
        sys.exit(0)

    # --- Failures ---
    failed = False

    if orphans:
        print(f"FAIL: {len(orphans)} rules with NO coverage in any applicable stack:")
        for rid in orphans:
            applicable = rule_stacks[rid]
            scope = f" (applies to: {', '.join(sorted(applicable))})" if applicable else " (cross-cutting)"
            print(f"  • {rid}{scope}")
        print("  Add tests, config files, or comments referencing these rule IDs.")
        failed = True
        print()

    if stack_gaps:
        # Only report gaps for rules that ARE covered somewhere (partial coverage)
        partial = [(rid, missing) for rid, missing in stack_gaps.items()
                   if rid not in orphans]
        if partial:
            print(f"WARNING: {len(partial)} rules missing in some applicable stacks:")
            for rid, missing in partial:
                applicable = rule_stacks[rid]
                scope = f" (applies to: {', '.join(sorted(applicable))})" if applicable else ""
                print(f"  • {rid}{scope} — missing in: {', '.join(missing)}")
            print("  Add implementation for the missing stacks or narrow the 'stacks' field.")
            print()

    if dispatch_gaps:
        # Filter: only warn if the rule claims to apply to that stack
        relevant = []
        for rid, s in dispatch_gaps:
            applicable = rule_stacks[rid]
            if applicable is None or s in applicable:
                relevant.append((rid, s))
        
        if relevant:
            # Filter to unique pairs
            unique = set(relevant)
            print(f"WARNING: {len(unique)} rule × stack pairs not in AGENTS.md dispatch:")
            for rid, s in sorted(unique):
                print(f"  • {rid} — not in {s}/AGENTS.md")
            print("  Add the rule ID to the dispatch file's rules table.")
            failed = True
            print()

    if not failed:
        print("PASS: All machine-tracked rules have coverage. No orphans.")
        sys.exit(0)
    else:
        print("Run with --report to see full coverage map.")
        sys.exit(1)


if __name__ == "__main__":
    main()
