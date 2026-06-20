#!/usr/bin/env python3
"""
Handoff Verification — Standard 29 Phase 4: 6-point gate.
Reads GitHub issue/PR text and validates against quality gates.

Usage:
  scripts/handoff-verify.py --issue 177
  scripts/handoff-verify.py --pr 42
  echo "text" | scripts/handoff-verify.py --stdin
  scripts/handoff-verify.py --file task.md
  scripts/handoff-verify.py --pr 42 --comment
"""

import sys
import os
import re
import json
import argparse
import subprocess
from dataclasses import dataclass, asdict
from typing import Optional

GATES = ["file_path", "standard_citation", "explanation", "vagueness", "multi_service", "tech_spec"]

BLACKLIST_VAGUE = ["improve", "better", "optimize", "enhance", "refactor", "clean up", "streamline"]
EXPLANATION_KEYWORDS = ["what", "why", "because", "verify", "reproduce", "how", "specifically"]


@dataclass
class GateResult:
    name: str
    passed: bool
    reason: Optional[str]
    suggestion: Optional[str] = None


@dataclass
class VerificationResult:
    passed: bool
    overall_score: float
    gates: list[GateResult]
    comment_body: str
    findings_count: int = 0


class HandoffVerifier:
    def __init__(self, repo: str = None):
        self.repo = repo or self._detect_repo()

    def _detect_repo(self) -> str:
        try:
            remote = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                capture_output=True, text=True, check=True
            ).stdout.strip()
            # Parse github.com/OWNER/REPO.git → OWNER/REPO
            match = re.search(r'github\.com[/:]([^/]+)/([^/\.]+)', remote)
            if match:
                return f"{match.group(1)}/{match.group(2)}"
        except Exception:
            pass
        return os.environ.get("GITHUB_REPOSITORY", "")

    def fetch_issue(self, number: int) -> str:
        try:
            result = subprocess.run(
                ["gh", "issue", "view", str(number), "--repo", self.repo, "--json", "title,body"],
                capture_output=True, text=True, check=True
            )
            data = json.loads(result.stdout)
            return f"{data['title']}\n\n{data['body']}"
        except subprocess.CalledProcessError as e:
            return f"Error fetching issue #{number}: {e.stderr}"
        except json.JSONDecodeError:
            return f"Error parsing issue #{number} response"

    def fetch_pr(self, number: int) -> str:
        try:
            result = subprocess.run(
                ["gh", "pr", "view", str(number), "--repo", self.repo, "--json", "title,body"],
                capture_output=True, text=True, check=True
            )
            data = json.loads(result.stdout)
            return f"{data['title']}\n\n{data['body']}"
        except subprocess.CalledProcessError as e:
            return f"Error fetching PR #{number}: {e.stderr}"

    def extract_findings(self, text: str) -> list[str]:
        """Split text into individual findings/sections."""
        # Split by headers (## or ###)
        sections = re.split(r'\n##+\s+', text)
        findings = []
        for sec in sections:
            sec = sec.strip()
            if len(sec) > 100:
                findings.append(sec)
        return findings

    def gate_file_path(self, text: str) -> GateResult:
        # Match file paths with optional line numbers
        pattern = r'(?:^|\s)(?:src/|tests?/|boilerplate/|scripts/|docs/)[\w/-]+\.\w+(?::\d+)?'
        paths = re.findall(pattern, text)
        if len(paths) >= 2:
            return GateResult("file_path", True, None, f"Found {len(paths)} file references")
        elif len(paths) == 1:
            return GateResult("file_path", False, "Only 1 file path found", "Add file paths to every finding (minimum 2)")
        else:
            return GateResult("file_path", False, "No file paths found", "Add file:line references to each finding")

    def gate_standard_citation(self, text: str) -> GateResult:
        # Match Standard N, §N.N, #N, docs/.../.md
        patterns = [
            r'Standard\s+\d+',
            r'§[\d.]+',
            r'docs/[\w/-]+\.md',
            r'#\d{3}',  # issue numbers
        ]
        found = 0
        for pat in patterns:
            found += len(re.findall(pat, text))
        if found >= 2:
            return GateResult("standard_citation", True, None, f"Found {found} standard references")
        elif found == 1:
            return GateResult("standard_citation", False, "Only 1 standard reference", "Cite specific standard sections for each finding")
        else:
            return GateResult("standard_citation", False, "No standard references", "Add 'Standard N §X.Y' or 'docs/.../NN-*.md' to findings")

    def gate_explanation(self, text: str) -> GateResult:
        text_lower = text.lower()
        found_keywords = [kw for kw in EXPLANATION_KEYWORDS if kw in text_lower]
        if len(found_keywords) >= 3:
            return GateResult("explanation", True, None, f"Keywords found: {', '.join(found_keywords)}")
        elif len(found_keywords) >= 2:
            return GateResult("explanation", False, f"Only {len(found_keywords)} explanation keywords", "Add 'how to verify' or 'reproduce with' to findings")
        else:
            return GateResult("explanation", False, "Missing explanation keywords", "Structure findings as: WHAT (problem), WHY (impact), HOW (verify fix)")

    def gate_vagueness(self, text: str) -> GateResult:
        text_lower = text.lower()
        found_vague = [w for w in BLACKLIST_VAGUE if w in text_lower]
        if not found_vague:
            return GateResult("vagueness", True, None)

        # Check if vague words have file paths or metrics attached
        lines = text.split('\n')
        bad_lines = []
        for line in lines:
            for vword in found_vague:
                if vword in line.lower():
                    # Does this line have a file path or metric?
                    has_path = re.search(r'(?:src/|tests?/|boilerplate/)[\w/-]+\.\w+', line)
                    has_metric = re.search(r'\d+\s*(?:ms|s|%|chars|tokens|lines)', line)
                    if not has_path and not has_metric:
                        bad_lines.append((line.strip(), vword))

        if bad_lines:
            examples = "; ".join(f"'{l[:40]}...' (word: '{w}')" for l, w in bad_lines[:3])
            return GateResult("vagueness", False,
                f"Vague words without specifics: {examples}",
                "Replace vague words with file:line references or metrics")
        return GateResult("vagueness", True, None)

    def gate_multi_service(self, text: str) -> GateResult:
        # Check for multi-service indicators without sub-task references
        multi_indicators = ["span", "multiple", "across services", "cross-service", "all services"]
        has_multi = any(ind in text.lower() for ind in multi_indicators)

        subtask_indicators = ["sub-task", "subtask", "break down", "per service", "#", "issue #"]
        has_subtasks = any(ind in text.lower() for ind in subtask_indicators)

        if has_multi and not has_subtasks:
            return GateResult("multi_service", False,
                "Multi-service finding lacks sub-tasks",
                "Split into per-service sub-tasks with issue references")
        return GateResult("multi_service", True, None)

    def gate_tech_spec(self, text: str) -> GateResult:
        # Check for tech-spec-complete label with supporting evidence
        has_label = "tech-spec-complete" in text.lower()
        if not has_label:
            return GateResult("tech_spec", True, None, "No tech-spec-complete label — gate N/A")

        # Must have: method signatures, DB schema, API contract, wire-in points
        has_methods = bool(re.search(r'def\s+\w+\(|->\s+\w+|:\s+\w+\s*=\s*\w+\(', text))
        has_db = bool(re.search(r'table[s]?\s+\w+|column[s]?|field[s]?|index|migration', text.lower()))
        has_api = bool(re.search(r'@(router|controller|api)|\b(GET|POST|PUT|DELETE)\s+/|response_model', text))
        has_wire = bool(re.search(r'wire.*in|import.*from|depends.*on|constructor.*inject', text.lower()))

        missing = []
        if not has_methods: missing.append("method signatures")
        if not has_db: missing.append("DB schema")
        if not has_api: missing.append("API contract")
        if not has_wire: missing.append("wire-in points")

        if missing:
            return GateResult("tech_spec", False,
                f"Label present but missing: {', '.join(missing)}",
                f"Add: {', '.join(missing)}")
        return GateResult("tech_spec", True, None, "All tech-spec elements present")

    def verify_text(self, text: str) -> VerificationResult:
        findings = self.extract_findings(text)
        gates = [
            self.gate_file_path(text),
            self.gate_standard_citation(text),
            self.gate_explanation(text),
            self.gate_vagueness(text),
            self.gate_multi_service(text),
            self.gate_tech_spec(text),
        ]
        passed_count = sum(1 for g in gates if g.passed)
        overall = passed_count / len(gates)
        passed = overall >= 0.85  # 5/6 or better

        comment_lines = ["# Handoff Verification (Standard 29 Phase 4)", ""]
        comment_lines.append(f"**Overall: {passed_count}/{len(gates)} gates passed ({overall:.0%})**")
        comment_lines.append("")

        for g in gates:
            icon = "✅" if g.passed else "❌"
            comment_lines.append(f"### {icon} {g.name}")
            if g.reason:
                comment_lines.append(f"**Issue:** {g.reason}")
            if g.suggestion:
                comment_lines.append(f"**Fix:** {g.suggestion}")
            comment_lines.append("")

        return VerificationResult(
            passed=passed,
            overall_score=overall,
            gates=gates,
            comment_body="\n".join(comment_lines),
            findings_count=len(findings),
        )

    def post_comment(self, number: int, body: str, is_pr: bool = False):
        cmd = ["gh", "pr" if is_pr else "issue", "comment", str(number), "--repo", self.repo, "--body", body]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"  Comment posted to {'PR' if is_pr else 'issue'} #{number}")
        except subprocess.CalledProcessError as e:
            print(f"  Failed to post comment: {e.stderr}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Handoff Verification Gate (Standard 29)")
    parser.add_argument("--issue", type=int, help="GitHub issue number")
    parser.add_argument("--pr", type=int, help="GitHub PR number")
    parser.add_argument("--stdin", action="store_true", help="Read text from stdin")
    parser.add_argument("--file", help="Read text from file")
    parser.add_argument("--repo", help="Repo slug (owner/name)")
    parser.add_argument("--ci", action="store_true", help="Exit non-zero on failure")
    parser.add_argument("--comment", action="store_true", help="Post result as GitHub comment")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    verifier = HandoffVerifier(repo=args.repo)

    if args.issue:
        text = verifier.fetch_issue(args.issue)
        source_num = args.issue
        is_pr = False
    elif args.pr:
        text = verifier.fetch_pr(args.pr)
        source_num = args.pr
        is_pr = True
    elif args.stdin:
        text = sys.stdin.read()
        source_num = None
        is_pr = False
    elif args.file:
        text = open(args.file, encoding="utf-8").read()
        source_num = None
        is_pr = False
    else:
        parser.print_help()
        sys.exit(1)

    result = verifier.verify_text(text)

    if args.json:
        print(json.dumps(asdict(result), indent=2))
    else:
        print(f"Findings: {result.findings_count}")
        print(f"Score: {result.overall_score:.0%}")
        for g in result.gates:
            icon = "✅" if g.passed else "❌"
            print(f"  {icon} {g.name}")
            if g.reason:
                print(f"     Issue: {g.reason}")
            if g.suggestion:
                print(f"     Fix: {g.suggestion}")
        print(f"\nStatus: {'PASSED' if result.passed else 'FAILED'}")

    if args.comment and source_num is not None:
        verifier.post_comment(source_num, result.comment_body, is_pr)

    if not result.passed and args.ci:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
