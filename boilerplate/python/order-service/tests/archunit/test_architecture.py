"""
Architecture Tests for Python Boilerplate

These tests enforce Clean Architecture layer boundaries.
Currently using simple import checks - pytest-archon integration pending.

Run with: pytest tests/archunit/ -v
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))


def test_domain_has_no_framework_imports():
    """
    Verify domain layer has no framework imports.
    
    This is a simple static analysis check.
    For comprehensive checking, use pytest-archon or import-linter.
    """
    domain_path = src_path / "domain"
    
    forbidden_modules = ["fastapi", "sqlalchemy", "pydantic"]
    
    for py_file in domain_path.rglob("*.py"):
        content = py_file.read_text()
        for module in forbidden_modules:
            assert f"import {module}" not in content, \
                f"Domain file {py_file} imports forbidden module: {module}"
            assert f"from {module}" not in content, \
                f"Domain file {py_file} imports from forbidden module: {module}"
    
    print("✓ Domain layer has no framework imports")


def test_application_has_no_infrastructure_imports():
    """
    Verify application layer has no infrastructure imports.
    """
    app_path = src_path / "application"
    
    forbidden = ["fastapi", "sqlalchemy"]
    
    for py_file in app_path.rglob("*.py"):
        content = py_file.read_text()
        for module in forbidden:
            assert f"import {module}" not in content, \
                f"Application file {py_file} imports forbidden module: {module}"
            assert f"from {module}" not in content, \
                f"Application file {py_file} imports from forbidden module: {module}"
    
    print("✓ Application layer has no infrastructure imports")


if __name__ == "__main__":
    test_domain_has_no_framework_imports()
    test_application_has_no_infrastructure_imports()
    print("\n✅ All architecture tests passed!")
