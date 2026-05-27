#!/usr/bin/env python3
"""
Python Architecture Checker

Enforces Clean Architecture layer boundaries through static analysis.
Run with: python scripts/check_python_architecture.py

This is a pre-commit hook script - it should fail fast on violations.
"""

import sys
from pathlib import Path
from typing import List, Set, Tuple

# Forbidden imports by layer
FORBIDDEN_IMPORTS = {
    "domain": ["fastapi", "sqlalchemy", "pydantic", "application", "infrastructure"],
    "application": ["fastapi", "sqlalchemy", "infrastructure"],
}

def check_file(file_path: Path, layer: str, forbidden: List[str]) -> List[Tuple[str, str]]:
    """Check a single file for forbidden imports."""
    violations = []
    content = file_path.read_text()
    
    for line_num, line in enumerate(content.split('\n'), 1):
        # Skip comments and empty lines
        if line.strip().startswith('#') or not line.strip():
            continue
        
        for module in forbidden:
            if f"import {module}" in line or f"from {module}" in line:
                violations.append((str(file_path), f"Line {line_num}: {line.strip()}"))
    
    return violations

def check_layer(layer_name: str, src_root: Path) -> List[Tuple[str, str]]:
    """Check all files in a layer for forbidden imports."""
    layer_path = src_root / layer_name
    if not layer_path.exists():
        return []
    
    violations = []
    forbidden = FORBIDDEN_IMPORTS.get(layer_name, [])
    
    for py_file in layer_path.rglob("*.py"):
        file_violations = check_file(py_file, layer_name, forbidden)
        violations.extend(file_violations)
    
    return violations

def main():
    """Main entry point."""
    print("  Running Python architecture checks...")
    
    # Find src directory
    src_root = Path("src")
    if not src_root.exists():
        # Try alternative paths
        for alt_path in ["source", "app"]:
            if Path(alt_path).exists():
                src_root = Path(alt_path)
                break
        else:
            print("      Skipping (no src directory found)")
            return 0
    
    all_violations = []
    
    # Check domain layer
    domain_violations = check_layer("domain", src_root)
    if domain_violations:
        print(f"\n      ❌ Domain layer violations:")
        for file_path, line in domain_violations:
            print(f"         {file_path}: {line}")
        all_violations.extend(domain_violations)
    
    # Check application layer
    app_violations = check_layer("application", src_root)
    if app_violations:
        print(f"\n      ❌ Application layer violations:")
        for file_path, line in app_violations:
            print(f"         {file_path}: {line}")
        all_violations.extend(app_violations)
    
    if all_violations:
        print(f"\n      Found {len(all_violations)} architecture violation(s)")
        return 1
    
    print("      ✅ Python architecture OK")
    return 0

if __name__ == "__main__":
    sys.exit(main())
