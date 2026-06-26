#!/usr/bin/env python3
"""
Python Architecture Checker — AST-based

Enforces Clean Architecture layer boundaries through Python AST static analysis.
Called by: lefthook pre-commit, check-file-architecture.sh, CI gates
Returns: exit code 0 = pass, 1 = violations found
Output: Human-readable (default) or JSON (--json flag)

Usage:
  python3 scripts/check_python_architecture.py                    # human output
  python3 scripts/check_python_architecture.py --json             # machine output
  python3 scripts/check_python_architecture.py src/domain/        # check specific path
  python3 scripts/check_python_architecture.py --json src/        # check src/
"""

import ast
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# ── Configuration ────────────────────────────────────────────────────────────
# Layer → forbidden modules (exact package names)
FORBIDDEN_IMPORTS: Dict[str, List[str]] = {
    "domain": [
        "fastapi", "sqlalchemy", "pydantic", "alembic",
        "application", "infrastructure", "usecases",
    ],
    "application": [
        "fastapi", "sqlalchemy", "alembic", "infrastructure",
    ],
}

# Also detect dynamic imports: importlib.import_module("fastapi")
DYNAMIC_IMPORT_FUNCS = {"importlib.import_module", "__import__"}


# ── AST Analysis ─────────────────────────────────────────────────────────────

class ImportVisitor(ast.NodeVisitor):
    """Walks AST collecting import statements and dynamic import calls."""

    def __init__(self, forbidden: List[str], file_path: Path) -> None:
        self.forbidden = set(forbidden)
        self.file_path = file_path
        self.violations: List[Dict[str, Any]] = []

    def _record(self, node: ast.AST, module: str, line: str, kind: str) -> None:
        """Record a violation if the module is forbidden."""
        # Match top-level package (e.g., "sqlalchemy.orm" → "sqlalchemy")
        top_module = module.split(".")[0]
        if top_module in self.forbidden:
            self.violations.append({
                "file": str(self.file_path),
                "line": node.lineno,
                "column": getattr(node, "col_offset", 0),
                "kind": kind,
                "module": module,
                "top_module": top_module,
                "source_line": line.strip(),
            })

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            self._record(node, alias.name, ast.unparse(node), "import")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            self._record(node, node.module, ast.unparse(node), "from-import")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        """Detect dynamic imports: importlib.import_module('x'), __import__('x')."""
        func_name = self._resolve_call(node.func)
        if func_name in DYNAMIC_IMPORT_FUNCS:
            if node.args:
                first_arg = node.args[0]
                if isinstance(first_arg, ast.Constant) and isinstance(first_arg.value, str):
                    self._record(node, first_arg.value, ast.unparse(node), "dynamic-import")
        self.generic_visit(node)

    @staticmethod
    def _resolve_call(func: ast.AST) -> str:
        """Resolve a call expression to a dotted name, e.g. importlib.import_module."""
        parts: List[str] = []
        node: ast.AST = func
        while isinstance(node, ast.Attribute):
            parts.append(node.attr)
            node = node.value
        if isinstance(node, ast.Name):
            parts.append(node.id)
        return ".".join(reversed(parts))


def check_file(file_path: Path, layer: str, forbidden: List[str]) -> List[Dict[str, Any]]:
    """Parse a single file and return violations."""
    try:
        source = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return []

    try:
        tree = ast.parse(source, filename=str(file_path))
    except SyntaxError:
        # Skip files with syntax errors (not our concern)
        return []

    visitor = ImportVisitor(forbidden, file_path)
    visitor.visit(tree)
    return visitor.violations


def check_layer(layer_name: str, src_root: Path) -> List[Dict[str, Any]]:
    """Check all Python files in a layer directory."""
    layer_path = src_root / layer_name
    if not layer_path.exists():
        return []

    forbidden = FORBIDDEN_IMPORTS.get(layer_name, [])
    if not forbidden:
        return []

    violations: List[Dict[str, Any]] = []
    for py_file in layer_path.rglob("*.py"):
        violations.extend(check_file(py_file, layer_name, forbidden))
    return violations


# ── Reporting ─────────────────────────────────────────────────────────────────

def report_human(violations: List[Dict[str, Any]]) -> int:
    """Print human-readable report. Returns exit code."""
    if not violations:
        print("      ✅ Python architecture OK")
        return 0

    # Group by layer (extract from file path)
    by_layer: Dict[str, List[Dict[str, Any]]] = {}
    for v in violations:
        # Derive layer from path: .../domain/... or .../application/...
        parts = Path(v["file"]).parts
        layer = "unknown"
        for p in parts:
            if p in FORBIDDEN_IMPORTS:
                layer = p
                break
        by_layer.setdefault(layer, []).append(v)

    total = len(violations)
    for layer, vs in sorted(by_layer.items()):
        print(f"\n      ❌ {layer.capitalize()} layer violations:")
        for v in vs:
            print(f"         {v['file']}:{v['line']}  {v['kind']} → {v['module']}")
            print(f"            {v['source_line'][:80]}")

    print(f"\n      Found {total} architecture violation(s)")
    return 1


def report_json(violations: List[Dict[str, Any]]) -> int:
    """Print JSON report. Returns exit code."""
    result = {
        "tool": "check_python_architecture.py",
        "version": "2.0",
        "violations": violations,
        "summary": {
            "total": len(violations),
            "passed": len(violations) == 0,
        },
    }
    print(json.dumps(result, indent=2))
    return 0 if not violations else 1


# ── Entry Point ───────────────────────────────────────────────────────────────

def discover_src_root() -> Optional[Path]:
    """Discover the source root directory."""
    for candidate in ["src", "source", "app", "."]:
        p = Path(candidate)
        if p.exists() and p.is_dir():
            return p
    return None


def main(argv: List[str]) -> int:
    use_json = "--json" in argv
    args = [a for a in argv if a != "--json"]

    # Determine source root
    src_root: Optional[Path] = None
    for arg in args[1:]:
        p = Path(arg)
        if p.exists() and p.is_dir():
            src_root = p
            break

    if src_root is None:
        src_root = discover_src_root()

    if src_root is None:
        print("      Skipping (no src directory found)", file=sys.stderr)
        return 0

    all_violations: List[Dict[str, Any]] = []

    # Check all configured layers
    for layer in FORBIDDEN_IMPORTS:
        all_violations.extend(check_layer(layer, src_root))

    if use_json:
        return report_json(all_violations)
    return report_human(all_violations)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
