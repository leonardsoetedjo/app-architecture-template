#!/usr/bin/env python3
"""
Measure context token usage per Standard 28.
Phase 1: wc-based estimate (chars / 4.0 ~ tokens).
Phase 2: tiktoken (set env MEASURE_USE_TIKTOKEN=1 for accuracy).

Usage:
  scripts/measure-context.py --check          # default: AGENTS.md + boilerplate AGENTS.md
  scripts/measure-context.py AGENTS.md --budget 2000
  scripts/measure-context.py boilerplate/python/AGENTS.md --budget 500
  scripts/measure-context.py --total-budget 18000
  scripts/measure-context.py --ci             # exit non-zero on over-budget
"""

import sys
import os
import argparse
import glob

CHARS_PER_TOKEN = 4.0


def estimate_tokens(text: str) -> int:
    return int(len(text) / CHARS_PER_TOKEN)


def try_tiktoken(text: str) -> int | None:
    if os.environ.get("MEASURE_USE_TIKTOKEN") != "1":
        return None
    try:
        import tiktoken
        # Default to cl100k_base (GPT-4 / Claude / most modern models)
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return None


def format_line(label: str, chars: int, tokens: int, budget: int, strict: bool = False) -> str:
    pct = (tokens / budget) * 100
    status = "✅" if tokens <= budget else ("❌" if strict else "⚠️")
    return f"  {label:46s} {tokens:5}/{budget} tokens ({pct:5.1f}%) {status}"


def main():
    parser = argparse.ArgumentParser(description="Measure context token usage")
    parser.add_argument("files", nargs="*", help="Files to measure (glob supported)")
    parser.add_argument("--budget", type=int, default=2000, help="Per-file token budget")
    parser.add_argument("--total-budget", type=int, help="Total token budget across all files")
    parser.add_argument("--warn-at", type=float, default=90.0, help="Warn threshold %")
    parser.add_argument("--fail-at", type=float, default=100.0, help="Fail threshold %")
    parser.add_argument("--ci", action="store_true", help="Exit non-zero on any failure")
    parser.add_argument("--check", action="store_true", help="Default: check AGENTS.md + boilerplate AGENTS.md")
    args = parser.parse_args()

    files = []
    if args.check or not args.files:
        for f in ['AGENTS.md'] + [f'boilerplate/{s}/AGENTS.md' for s in ['java', 'python', 'nestjs', 'reactjs', 'quasar']]:
            if os.path.isfile(f):
                files.append(f)
    else:
        for pat in args.files:
            if '*' in pat or '?' in pat:
                files.extend(sorted(glob.glob(pat)))
            else:
                files.append(pat)

    total_chars = 0
    total_tokens = 0
    total_tiktoken = 0
    failed = False

    print("=" * 62)
    print("Context Budget Measurement (Standard 28)")
    print("Method: chars / 4.0 ≈ tokens")
    tik_env = os.environ.get("MEASURE_USE_TIKTOKEN")
    if tik_env == "1":
        print("Tiktoken: ENABLED")
    else:
        print(f"Tiktoken: off (set MEASURE_USE_TIKTOKEN=1 for accuracy)")
    print("=" * 62)
    print()

    for filepath in files:
        if not os.path.isfile(filepath):
            print(f"  ❌ File not found: {filepath}")
            failed = True
            continue

        text = open(filepath, encoding='utf-8').read()
        chars = len(text)
        tokens = estimate_tokens(text)
        tiktoken_count = try_tiktoken(text)

        total_chars += chars
        total_tokens += tokens
        if tiktoken_count is not None:
            total_tiktoken += tiktoken_count

        # Per-file budget heuristic
        file_budget = args.budget
        if filepath.startswith("boilerplate/"):
            file_budget = min(file_budget, 500)
        if filepath == "AGENTS.md" or filepath.endswith("/AGENTS.md") and "boilerplate" not in filepath:
            file_budget = 2000

        label = filepath
        line = format_line(label, chars, tokens, file_budget, strict=args.ci)
        if tiktoken_count is not None:
            line += f"  [tiktoken: {tiktoken_count}]"
        print(line)

        pct = (tokens / file_budget) * 100
        if pct >= args.fail_at:
            failed = True
        elif pct >= args.warn_at:
            print(f"    ⚠️  Warning: {filepath} is {pct:.0f}% of budget")

    print()
    if args.total_budget:
        line = format_line("TOTAL", total_chars, total_tokens, args.total_budget, strict=args.ci)
        if total_tiktoken:
            line += f"  [tiktoken: {total_tiktoken}]"
        print(line)
        if total_tokens > args.total_budget:
            failed = True
    else:
        tt_str = f"  [tiktoken: {total_tiktoken}]" if total_tiktoken else ""
        print(f"  {'TOTAL':46s} {total_tokens:5} tokens  |  {total_chars:,} chars{tt_str}")

    print()
    print("=" * 62)
    print("Upgrade to tiktoken:")
    print("  pip install tiktoken   # or: uv pip install tiktoken")
    print("  MEASURE_USE_TIKTOKEN=1 scripts/measure-context.py")
    print("=" * 62)

    if failed and args.ci:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
