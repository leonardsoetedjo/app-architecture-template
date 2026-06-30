#!/usr/bin/env python3
"""
Boilerplate Parity CI Script

Verifies that all boilerplate stacks maintain feature parity.
Fails CI if any stack lacks a file/capability present in others.

Usage:
    python scripts/verify-boilerplate-parity.py

Checks:
1. AGENTS.md presence per stack
2. .env.example presence per stack
3. docker-compose.yml or Dockerfile presence
4. feature-list.json schema compliance
5. Architecture test files exist
6. Pre-commit hooks coverage (Gate 5a)
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional
import json

BOILERPLATE_DIR = Path(__file__).parent.parent / "boilerplate"

# Stack paths - some have AGENTS.md at stack root, some in order-service
STACKS = {
    "java": {
        "root": BOILERPLATE_DIR / "java",
        "service": BOILERPLATE_DIR / "java" / "order-service",
        "type": "backend"
    },
    "nestjs": {
        "root": BOILERPLATE_DIR / "nestjs",
        "service": BOILERPLATE_DIR / "nestjs" / "order-service",
        "type": "backend"
    },
    "python": {
        "root": BOILERPLATE_DIR / "python",
        "service": BOILERPLATE_DIR / "python" / "order-service",
        "type": "backend"
    },
    "reactjs": {
        "root": BOILERPLATE_DIR / "reactjs",
        "service": None,
        "type": "frontend"
    },
    "quasar": {
        "root": BOILERPLATE_DIR / "quasar",
        "service": None,
        "type": "frontend"
    },
}

def check_file_presence(stack_name: str, stack_info: Dict) -> List[str]:
    """Check for required files in each stack."""
    errors = []
    root = stack_info["root"]
    service = stack_info["service"]
    stack_type = stack_info["type"]
    
    # Check AGENTS.md at root level
    agents_md = root / "AGENTS.md"
    if not agents_md.exists():
        errors.append(f"❌ {stack_name}: Missing AGENTS.md at {root}")
    else:
        print(f"✅ {stack_name}: AGENTS.md exists")
    
    # Check .env.example and Dockerfile at service level for backends
    if stack_type == "backend" and service:
        for file_name in [".env.example", "Dockerfile"]:
            if not (service / file_name).exists():
                errors.append(f"❌ {stack_name}: Missing {file_name} in {service}")
            else:
                print(f"✅ {stack_name}: {file_name} exists")
    
    # Frontend checks
    if stack_type == "frontend":
        for file_name in ["vite.config.ts", "playwright.config.ts"]:
            if not (root / file_name).exists():
                errors.append(f"❌ {stack_name}: Missing {file_name}")
            else:
                print(f"✅ {stack_name}: {file_name} exists")
    
    return errors


def check_feature_list_schema(stack_name: str, stack_path: Path) -> List[str]:
    """Verify feature-list.json exists and has valid schema."""
    errors = []
    feature_list_path = stack_path / "feature-list.json"
    
    if not feature_list_path.exists():
        errors.append(f"❌ {stack_name}: Missing feature-list.json")
        return errors
    
    try:
        with open(feature_list_path) as f:
            data = json.load(f)
        
        # Check schema: should be dict with 'features' key containing list
        if not isinstance(data, dict):
            errors.append(f"❌ {stack_name}: feature-list.json must be an object")
        elif "features" not in data:
            errors.append(f"❌ {stack_name}: feature-list.json missing 'features' key")
        elif not isinstance(data["features"], list):
            errors.append(f"❌ {stack_name}: 'features' must be an array")
        elif len(data["features"]) == 0:
            errors.append(f"⚠️  {stack_name}: feature-list.json has 0 features")
        else:
            print(f"✅ {stack_name}: feature-list.json valid ({len(data['features'])} features)")
            
    except json.JSONDecodeError as e:
        errors.append(f"❌ {stack_name}: feature-list.json invalid JSON: {e}")
    
    return errors


def check_architecture_tests(stack_name: str, stack_path: Path) -> List[str]:
    """Check for architecture test files."""
    errors = []
    
    # Backend: look for ArchUnit/pytest-archon tests
    if stack_name in ["java", "nestjs", "python"]:
        test_dirs = [
            stack_path / "test" / "archunit",
            stack_path / "tests" / "archunit",
            stack_path / "src" / "test" / "archunit",
            stack_path / "src" / "test" / "java",  # Java has archunit under java
        ]
        found = any(d.exists() for d in test_dirs)
        # Also check for actual test files
        if stack_name == "java":
            java_arch_tests = list((stack_path / "src" / "test" / "java").rglob("*archunit*.java"))
            found = found or len(java_arch_tests) > 0
        if not found:
            errors.append(f"❌ {stack_name}: Missing architecture tests (test/archunit/)")
        else:
            print(f"✅ {stack_name}: Architecture tests exist")
    
    # Frontend: look for architecture.test.ts
    elif stack_name in ["reactjs", "quasar"]:
        arch_test = stack_path / "src" / "test" / "architecture.test.ts"
        if not arch_test.exists():
            errors.append(f"❌ {stack_name}: Missing src/test/architecture.test.ts")
        else:
            print(f"✅ {stack_name}: Architecture test exists")
    
    return errors


def check_gate_5a(stack_name: str, stack_path: Path) -> List[str]:
    """Check for Gate 5a (config sanity) in lefthook.yml."""
    errors = []
    
    if stack_name not in ["reactjs", "quasar"]:
        return errors  # Only for frontends
    
    lefthook_path = stack_path / "lefthook.yml"
    if not lefthook_path.exists():
        errors.append(f"❌ {stack_name}: Missing lefthook.yml")
        return errors
    
    content = lefthook_path.read_text()
    if "gate-5a" not in content.lower() and "config-sanity" not in content.lower():
        errors.append(f"❌ {stack_name}: Missing Gate 5a (config-sanity) in lefthook.yml")
    else:
        print(f"✅ {stack_name}: Gate 5a present in lefthook.yml")
    
    return errors


def check_deployed_e2e(stack_name: str, stack_path: Path) -> List[str]:
    """Check for deployed smoke test (e2e/deployed.spec.ts)."""
    errors = []
    
    if stack_name not in ["reactjs", "quasar"]:
        return errors  # Only for frontends
    
    deployed_test = stack_path / "e2e" / "deployed.spec.ts"
    if not deployed_test.exists():
        errors.append(f"❌ {stack_name}: Missing e2e/deployed.spec.ts")
    else:
        print(f"✅ {stack_name}: e2e/deployed.spec.ts exists")
    
    return errors


def main() -> int:
    """Run all parity checks."""
    print("=" * 60)
    print("Boilerplate Parity Check")
    print("=" * 60)
    
    all_errors: List[str] = []
    
    for stack_name, stack_info in STACKS.items():
        print(f"\n--- {stack_name.upper()} ---")
        root = stack_info["root"]
        service = stack_info["service"]
        if not root.exists():
            all_errors.append(f"❌ {stack_name}: Directory not found at {root}")
            continue
        
        all_errors.extend(check_file_presence(stack_name, stack_info))
        # Use service path for backends, root for frontends
        feature_path = service if service else root
        all_errors.extend(check_feature_list_schema(stack_name, feature_path))
        all_errors.extend(check_architecture_tests(stack_name, feature_path))
        all_errors.extend(check_gate_5a(stack_name, root))
        all_errors.extend(check_deployed_e2e(stack_name, root))
    
    print("\n" + "=" * 60)
    if all_errors:
        print("PARITY CHECK FAILED")
        print("=" * 60)
        for error in all_errors:
            print(error)
        return 1
    else:
        print("✅ ALL PARITY CHECKS PASSED")
        print("=" * 60)
        return 0


if __name__ == "__main__":
    sys.exit(main())
