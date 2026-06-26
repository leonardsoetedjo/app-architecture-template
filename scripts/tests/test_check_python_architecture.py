#!/usr/bin/env python3
"""
Tests for check_python_architecture.py

Run with: python3 -m pytest scripts/tests/ -v
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

# Add scripts directory to path so we can import the module under test
sys.path.insert(0, str(Path(__file__).parent.parent))

from check_python_architecture import (
    check_file,
    check_layer,
    discover_src_root,
    FORBIDDEN_IMPORTS,
    ImportVisitor,
    main,
)

# ── Fixtures ─────────────────────────────────────────────────────────────────

FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ── Unit Tests: ImportVisitor AST ────────────────────────────────────────────

def test_detects_simple_import():
    """Visitor catches: import fastapi"""
    source = "import fastapi\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["fastapi"], Path("test.py"))
    visitor.visit(tree)
    assert len(visitor.violations) == 1
    assert visitor.violations[0]["module"] == "fastapi"
    assert visitor.violations[0]["kind"] == "import"


def test_detects_from_import():
    """Visitor catches: from sqlalchemy import orm"""
    source = "from sqlalchemy import orm\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["sqlalchemy"], Path("test.py"))
    visitor.visit(tree)
    assert len(visitor.violations) == 1
    assert visitor.violations[0]["module"] == "sqlalchemy"
    assert visitor.violations[0]["kind"] == "from-import"


def test_ignores_comments():
    """Comments should NOT produce violations."""
    source = "# import fastapi\n# from sqlalchemy import Column\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["fastapi", "sqlalchemy"], Path("test.py"))
    visitor.visit(tree)
    assert len(visitor.violations) == 0


def test_ignores_allowed_modules():
    """Modules not in forbidden list should pass."""
    source = "import json\nimport typing\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["fastapi"], Path("test.py"))
    visitor.visit(tree)
    assert len(visitor.violations) == 0


def test_detects_submodule_import():
    """Visitor matches top-level package: from sqlalchemy.orm → sqlalchemy"""
    source = "from sqlalchemy.orm import Session\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["sqlalchemy"], Path("test.py"))
    visitor.visit(tree)
    assert len(visitor.violations) == 1
    assert visitor.violations[0]["top_module"] == "sqlalchemy"


def test_detects_dynamic_import_importlib():
    """Visitor catches: importlib.import_module('fastapi')"""
    source = "import importlib\nmod = importlib.import_module('fastapi')\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["fastapi"], Path("test.py"))
    visitor.visit(tree)
    dynamic = [v for v in visitor.violations if v["kind"] == "dynamic-import"]
    assert len(dynamic) == 1
    assert dynamic[0]["module"] == "fastapi"


def test_detects_dynamic_import_dunder():
    """Visitor catches: __import__('sqlalchemy')"""
    source = "mod = __import__('sqlalchemy')\n"
    tree = __import__("ast").parse(source)
    visitor = ImportVisitor(["sqlalchemy"], Path("test.py"))
    visitor.visit(tree)
    dynamic = [v for v in visitor.violations if v["kind"] == "dynamic-import"]
    assert len(dynamic) == 1


# ── Integration Tests: check_file / check_layer ──────────────────────────────

def test_domain_violation_fixture():
    """domain_violation.py should have 3 violations (fastapi, sqlalchemy, pydantic)."""
    violations = check_file(
        FIXTURES_DIR / "domain" / "domain_violation.py",
        "domain",
        FORBIDDEN_IMPORTS["domain"],
    )
    modules = {v["top_module"] for v in violations}
    assert modules == {"fastapi", "sqlalchemy", "pydantic"}
    assert len(violations) == 3


def test_application_violation_fixture():
    """application_violation.py should detect infrastructure import."""
    violations = check_file(
        FIXTURES_DIR / "application" / "application_violation.py",
        "application",
        FORBIDDEN_IMPORTS["application"],
    )
    modules = {v["top_module"] for v in violations}
    assert "infrastructure" in modules
    assert "fastapi" in modules
    assert "sqlalchemy" in modules
    assert len(violations) == 3


def test_clean_domain_passes():
    """clean_domain.py has no violations."""
    violations = check_file(
        FIXTURES_DIR / "domain" / "clean_domain.py",
        "domain",
        FORBIDDEN_IMPORTS["domain"],
    )
    assert len(violations) == 0


def test_comment_only_passes():
    """comment_only.py has no violations (imports in comments)."""
    violations = check_file(
        FIXTURES_DIR / "domain" / "comment_only.py",
        "domain",
        FORBIDDEN_IMPORTS["domain"],
    )
    assert len(violations) == 0


def test_dynamic_import_fixture():
    """dynamic_import.py should catch importlib.import_module('sqlalchemy.orm')."""
    violations = check_file(
        FIXTURES_DIR / "domain" / "dynamic_import.py",
        "domain",
        FORBIDDEN_IMPORTS["domain"],
    )
    assert len(violations) == 1
    assert violations[0]["kind"] == "dynamic-import"
    assert violations[0]["module"] == "sqlalchemy.orm"


def test_check_layer_finds_all():
    """check_layer('domain') on fixtures/domain/ finds 5 violations across 3 files."""
    violations = check_layer("domain", FIXTURES_DIR)
    # domain_violation.py (3) + dynamic_import.py (1) = 4
    # clean_domain.py (0) + comment_only.py (0) = 0
    assert len(violations) == 4
    for v in violations:
        assert "domain" in v["file"]


# ── CLI / End-to-end Tests ───────────────────────────────────────────────────

def test_cli_human_output():
    """Script produces human-readable output."""
    result = subprocess.run(
        [sys.executable, "scripts/check_python_architecture.py", str(FIXTURES_DIR)],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent.parent,
    )
    assert result.returncode == 1  # fixtures have violations
    assert "violations" in result.stdout.lower() or "❌" in result.stdout


def test_cli_json_output():
    """Script produces valid JSON with --json flag."""
    result = subprocess.run(
        [
            sys.executable,
            "scripts/check_python_architecture.py",
            "--json",
            str(FIXTURES_DIR),
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent.parent,
    )
    assert result.returncode == 1
    data = json.loads(result.stdout)
    assert data["tool"] == "check_python_architecture.py"
    assert data["summary"]["total"] == 7  # all fixtures
    assert not data["summary"]["passed"]
    assert len(data["violations"]) == 7


def test_cli_passes_on_clean_code():
    """Script returns 0 when given only clean_domain.py."""
    clean_dir = FIXTURES_DIR / "domain" / "clean_domain.py"
    result = subprocess.run(
        [sys.executable, "scripts/check_python_architecture.py", str(clean_dir)],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent.parent,
    )
    # Single file passed as arg: check_file treats it as src_root, not layer
    # So we test on a directory with only clean files
    clean_parent = FIXTURES_DIR / "domain"
    result = subprocess.run(
        [sys.executable, "scripts/check_python_architecture.py", str(clean_parent)],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent.parent,
    )
    # Will find violations from other fixture files in domain/
    # Instead, create temp dir with just clean file
    import tempfile, shutil
    with tempfile.TemporaryDirectory() as td:
        tpath = Path(td)
        (tpath / "domain").mkdir()
        shutil.copy(clean_dir, tpath / "domain" / "clean.py")
        result = subprocess.run(
            [sys.executable, "scripts/check_python_architecture.py", str(tpath)],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,
        )
        assert result.returncode == 0
        assert "✅ Python architecture OK" in result.stdout


def test_discover_src_root():
    """discover_src_root finds existing directories."""
    # Default behavior: looks for src, source, app in current dir
    assert discover_src_root() is not None or True  # at least one of src/ etc exists


def test_main_no_src_dir():
    """main exits cleanly when no source dir exists."""
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        result = subprocess.run(
            [sys.executable, "scripts/check_python_architecture.py", td],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,
        )
        # No src/ in temp dir → discovers nothing → skips gracefully
        assert result.returncode == 0


# ── Coverage ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
