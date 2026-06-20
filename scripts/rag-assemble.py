#!/usr/bin/env python3
"""
RAG Assembler — Standard 28 §3: 6-step pipeline automation.
Index → Search → Score → Assemble → Verify → Send.

Usage:
  scripts/rag-assemble.py --task audit --source docs/ --query "repository port"
  scripts/rag-assemble.py --task feature_impl --source src/ --source docs/ \\
    --query "forbidden imports" --query "DTO boundary"
  scripts/rag-assemble.py --dry-run --task code_review --source src/
"""

import sys
import os
import json
import time
import argparse
import glob
import hashlib
from dataclasses import dataclass, asdict
from typing import Optional

CHARS_PER_TOKEN = 4.0
CACHE_DIR = ".cache"
TIMESTAMP_FILE = os.path.join(CACHE_DIR, "rag-index-timestamps.json")

BUDGET_TABLE = {
    "default": {"system": 0.05, "task": 0.40, "retrieved": 0.30, "working": 0.20, "safety": 0.05},
    "code_review": {"system": 0.05, "task": 0.50, "retrieved": 0.20, "working": 0.20, "safety": 0.05},
    "audit": {"system": 0.05, "task": 0.35, "retrieved": 0.40, "working": 0.15, "safety": 0.05},
    "feature_impl": {"system": 0.05, "task": 0.40, "retrieved": 0.25, "working": 0.25, "safety": 0.05},
    "bug_fix": {"system": 0.05, "task": 0.45, "retrieved": 0.25, "working": 0.20, "safety": 0.05},
    "refactor": {"system": 0.05, "task": 0.35, "retrieved": 0.35, "working": 0.20, "safety": 0.05},
    "documentation": {"system": 0.05, "task": 0.30, "retrieved": 0.45, "working": 0.15, "safety": 0.05},
}


@dataclass
class AssembledSection:
    priority: str
    source: str
    content: str
    score: float = 0.0
    tokens: int = 0


@dataclass
class AssembledContext:
    tokens_used: int
    budget_used_pct: float
    budget_breakdown: dict
    sections: list
    warnings: list
    checksum: str


def estimate_tokens(text: str) -> int:
    return int(len(text) / CHARS_PER_TOKEN)


def load_budget(task_type: str, total_budget: int = 2000) -> dict:
    ratios = BUDGET_TABLE.get(task_type, BUDGET_TABLE["default"])
    return {k: int(v * total_budget) for k, v in ratios.items()}


def get_file_mtime(path: str) -> float:
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0.0


def should_reindex(source_path: str, cache_key: str) -> bool:
    if not os.path.exists(TIMESTAMP_FILE):
        return True
    try:
        with open(TIMESTAMP_FILE) as f:
            timestamps = json.load(f)
        last = timestamps.get(cache_key, 0)
        current = get_file_mtime(source_path)
        if os.path.isdir(source_path):
            for root, _, files in os.walk(source_path):
                for fname in files:
                    fp = os.path.join(root, fname)
                    if get_file_mtime(fp) > last:
                        return True
            return False
        return current > last
    except Exception:
        return True


def update_timestamp(cache_key: str):
    os.makedirs(CACHE_DIR, exist_ok=True)
    timestamps = {}
    if os.path.exists(TIMESTAMP_FILE):
        try:
            with open(TIMESTAMP_FILE) as f:
                timestamps = json.load(f)
        except Exception:
            pass
    timestamps[cache_key] = time.time()
    with open(TIMESTAMP_FILE, "w") as f:
        json.dump(timestamps, f, indent=2)


def index_source(source_path: str, source_name: str, extensions: tuple = ()):
    """Simulate ctx_index — reads all matching files and returns content."""
    if not extensions:
        extensions = (".md", ".py", ".ts", ".js", ".java", ".yml", ".yaml", ".json", ".toml", ".ini")

    if should_reindex(source_path, source_name):
        # Note: In production, this calls ctx_index(path=source_path, source=source_name)
        # For now, we collect file contents for scoring
        update_timestamp(source_name)
        return {"status": "indexed", "source": source_name, "path": source_path}
    return {"status": "fresh", "source": source_name, "path": source_path}


def search_local(source_path: str, query: str, extensions: tuple = ()) -> list[dict]:
    """Local file search when ctx_search unavailable. Matches keywords in files."""
    results = []
    if not extensions:
        extensions = (".md", ".py", ".ts", ".js", ".java", ".yml", ".yaml", ".json", ".toml")

    if os.path.isfile(source_path):
        files = [source_path]
    elif os.path.isdir(source_path):
        files = []
        for ext in extensions:
            files.extend(glob.glob(os.path.join(source_path, f"**/*{ext}"), recursive=True))
    else:
        return results

    query_terms = [q.lower() for q in query.replace("-", " ").split()]

    for filepath in files:
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        content_lower = content.lower()
        matches = sum(1 for term in query_terms if term in content_lower)
        if matches == 0:
            continue

        # Score = (matched terms / total terms) * density bonus
        score = (matches / len(query_terms)) * min(1.0, len(content) / 5000)
        results.append({
            "file": filepath,
            "score": score,
            "matches": matches,
            "content": content[:3000],  # truncate for memory
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def score_results(results: list[dict]) -> list[dict]:
    """Apply relevance threshold. Filter score > 0.5."""
    return [r for r in results if r["score"] >= 0.5]


def assemble_sections(results: list[dict], budget: dict, task_text: str = "") -> list[AssembledSection]:
    sections = []
    tokens_used = 0

    # Priority 1: System (standard intro)
    system_text = "Clean Architecture v2.1 — Layered code: domain/ (pure), application/ (use cases), infrastructure/ (controllers, persistence)."
    system_tokens = estimate_tokens(system_text)
    if system_tokens <= budget["system"]:
        sections.append(AssembledSection("system", "architecture-standards", system_text, 1.0, system_tokens))
        tokens_used += system_tokens

    # Priority 2: Task (the query itself + context)
    task_tokens = estimate_tokens(task_text)
    if task_tokens <= budget["task"]:
        sections.append(AssembledSection("task", "user_query", task_text, 1.0, task_tokens))
        tokens_used += task_tokens

    # Priority 3: Retrieved (search results)
    remaining_budget = budget["retrieved"]
    for rank, result in enumerate(results, 1):
        header = f"## Source: {result['file']}\n\n"
        content = result["content"][:1500]  # cap per section
        full_text = header + content
        section_tokens = estimate_tokens(full_text)

        if section_tokens > remaining_budget:
            # Truncate to fit budget
            chars_available = int(remaining_budget * CHARS_PER_TOKEN)
            full_text = header + content[:chars_available - len(header)] + "\n\n[TRUNCATED]"
            section_tokens = estimate_tokens(full_text)

        sections.append(AssembledSection(
            "retrieved",
            result["file"],
            full_text,
            result["score"],
            section_tokens
        ))
        tokens_used += section_tokens
        remaining_budget -= section_tokens
        if remaining_budget <= 0:
            break

    # Priority 4: Working (workspace context)
    working_budget = budget["working"]
    working_text = ""
    if working_budget > 0:
        working_text = "# Current working context\n\n(Edit as needed during task execution.)"
        wt = estimate_tokens(working_text)
        if wt <= working_budget:
            sections.append(AssembledSection("working", "workspace", working_text, 0.0, wt))
            tokens_used += wt

    # Priority 5: Safety buffer (unused)
    safety = budget["safety"]
    sections.append(AssembledSection("safety", "budget_buffer", f"Safety buffer: {safety} tokens reserved.", 0.0, 0))

    return sections, tokens_used


def verify_assembly(sections: list, budget: dict, total_tokens: int) -> list[str]:
    warnings = []
    total_budget = sum(budget.values())
    pct = (total_tokens / total_budget) * 100

    if pct > 95:
        warnings.append(f"Assembly at {pct:.0f}% of budget — approaching limit")
    if pct > 100:
        warnings.append(f"OVERRUN: Assembly exceeds {total_budget} token budget by {total_tokens - total_budget} tokens")

    # Check 5-point checklist (Standard 28 §5)
    priorities = [s.priority for s in sections]
    if "system" not in priorities:
        warnings.append("Missing SYSTEM section — add architecture context")
    if "task" not in priorities:
        warnings.append("Missing TASK section — add user query context")
    if "retrieved" not in priorities:
        warnings.append("Zero retrieved context — RAG produced no results")

    dupes = {}
    for s in sections:
        key = (s.priority, s.source)
        dupes[key] = dupes.get(key, 0) + 1
    for key, count in dupes.items():
        if count > 1:
            warnings.append(f"Duplicate section: {key[1]} ({count}x)")

    return warnings


def compute_checksum(sections: list) -> str:
    text = "".join(s.content for s in sections)
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def main():
    parser = argparse.ArgumentParser(description="RAG Assembler (Standard 28)")
    parser.add_argument("--task", required=True, choices=list(BUDGET_TABLE.keys()), help="Task type")
    parser.add_argument("--source", action="append", required=True, help="Source path(s)")
    parser.add_argument("--query", action="append", default=[], help="Search queries")
    parser.add_argument("--budget", type=int, default=2000, help="Total token budget")
    parser.add_argument("--output-format", choices=["json", "markdown", "raw"], default="json")
    parser.add_argument("--dry-run", action="store_true", help="Preview without fetching")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on budget overrun")
    args = parser.parse_args()

    print(f"RAG Assembler v1.0.0 — Task: {args.task}, Budget: {args.budget} tokens")
    print("=" * 62)

    # 1. INDEX
    print("\n[1/6] Indexing sources...")
    for src in args.source:
        print(f"  → {src}")
        if not args.dry_run:
            index_source(src, src.replace("/", "_"))
        else:
            print(f"    [dry-run] Would index: {src}")

    # 2. SEARCH
    print("\n[2/6] Searching...")
    all_results = []
    for query in args.query:
        print(f"  Query: '{query}'")
        for src in args.source:
            if args.dry_run:
                print(f"    [dry-run] Would search '{query}' in {src}")
                continue
            results = search_local(src, query)
            print(f"    Found {len(results)} results")
            all_results.extend(results)

    # 3. SCORE
    print("\n[3/6] Scoring relevance...")
    scored = score_results(all_results)
    print(f"  {len(scored)} results above threshold (≥0.5)")
    for r in scored[:5]:
        print(f"    • {r['file']:40s} score={r['score']:.2f} matches={r['matches']}")

    # 4. ASSEMBLE
    print("\n[4/6] Assembling context...")
    budget = load_budget(args.task, args.budget)
    task_text = f"Task: {args.task}\nQueries: {', '.join(args.query)}\nSources: {', '.join(args.source)}"
    sections, tokens_used = assemble_sections(scored, budget, task_text)
    print(f"  Sections: {len(sections)}, Tokens: {tokens_used}/{args.budget}")

    # 5. VERIFY
    print("\n[5/6] Verifying assembly...")
    warnings = verify_assembly(sections, budget, tokens_used)
    for w in warnings:
        print(f"  ⚠️  {w}")
    if not warnings:
        print("  ✅ All checks passed")

    # 6. SEND (output)
    print("\n[6/6] Output...")
    result = AssembledContext(
        tokens_used=tokens_used,
        budget_used_pct=(tokens_used / args.budget) * 100,
        budget_breakdown=budget,
        sections=[{"priority": s.priority, "source": s.source, "tokens": s.tokens, "score": s.score, "content_preview": s.content[:200] + "..."} for s in sections],
        warnings=warnings,
        checksum=compute_checksum(sections),
    )

    if args.output_format == "json":
        print(json.dumps(asdict(result), indent=2))
    elif args.output_format == "markdown":
        print(f"# Assembled Context ({result.tokens_used}/{args.budget} tokens)\n")
        print(f"**Checksum:** `{result.checksum}`\n")
        for s in sections:
            print(f"## [{s.priority}] {s.source}\n")
            print(f"Tokens: {s.tokens}, Score: {s.score:.2f}\n")
            print(f"{s.content[:500]}...\n")
    else:
        print(asdict(result))

    print("=" * 62)
    status = "✅ PASSED" if tokens_used <= args.budget and not warnings else "❌ FAILED"
    print(f"Status: {status} | {tokens_used}/{args.budget} tokens ({result.budget_used_pct:.1f}%)")

    if tokens_used > args.budget and args.strict:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
