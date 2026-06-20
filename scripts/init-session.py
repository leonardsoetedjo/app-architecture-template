#!/usr/bin/env python3
"""
Session Initializer — Standard 29 Phase 1.
Reads GitHub issue or manual scope, generates feature-list.json + context budget.

Usage:
  scripts/init-session.py --issue 177 --repo leonardsoetedjo/app-architecture-template
  scripts/init-session.py --title "Add auth" --scope "backend/api" --task-type feature_impl
  scripts/init-session.py --issue 177 --dry-run
"""

import sys
import os
import re
import json
import argparse
import subprocess
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

BUDGET_TABLE = {
    "default": {"system": 0.05, "task": 0.40, "retrieved": 0.30, "working": 0.20, "safety": 0.05},
    "feature_impl": {"system": 0.05, "task": 0.40, "retrieved": 0.25, "working": 0.25, "safety": 0.05},
    "bug_fix": {"system": 0.05, "task": 0.45, "retrieved": 0.25, "working": 0.20, "safety": 0.05},
    "code_review": {"system": 0.05, "task": 0.50, "retrieved": 0.20, "working": 0.20, "safety": 0.05},
    "refactor": {"system": 0.05, "task": 0.35, "retrieved": 0.35, "working": 0.20, "safety": 0.05},
    "documentation": {"system": 0.05, "task": 0.30, "retrieved": 0.45, "working": 0.15, "safety": 0.05},
    "audit": {"system": 0.05, "task": 0.35, "retrieved": 0.40, "working": 0.15, "safety": 0.05},
}

DEFAULT_SOURCES = [
    "docs/01-agnostic/01-standards",
    "docs/04-sops",
    "prompts/",
]


@dataclass
class Milestone:
    name: str
    acceptance_criteria: list[str]
    estimated_tokens: int
    dependencies: list[str]


@dataclass
class FeatureList:
    title: str
    description: str
    milestones: list[Milestone]
    current_milestone: int
    version: str = "1.0.0"


@dataclass
class BudgetAllocation:
    system: int
    task: int
    retrieved: int
    working: int
    safety: int
    total: int


@dataclass
class SessionManifest:
    feature_list: FeatureList
    context_budget: BudgetAllocation
    indexed_sources: list[str]
    estimated_sessions: int
    schema_version: str = "1.0.0"
    created_at: str = ""


class SessionInitializer:
    def __init__(self, repo: str = None):
        self.repo = repo or self._detect_repo()

    def _detect_repo(self) -> str:
        try:
            remote = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                capture_output=True, text=True, check=True
            ).stdout.strip()
            match = re.search(r'github\.com[/:]([^/]+)/([^/\.]+)', remote)
            if match:
                return f"{match.group(1)}/{match.group(2)}"
        except Exception:
            pass
        return os.environ.get("GITHUB_REPOSITORY", "")

    def parse_issue(self, number: int) -> tuple[str, str, list[str]]:
        """Returns: (title, body, acceptance_criteria)"""
        try:
            result = subprocess.run(
                ["gh", "issue", "view", str(number), "--repo", self.repo, "--json", "title,body"],
                capture_output=True, text=True, check=True
            )
            data = json.loads(result.stdout)
            title = data.get("title", "Untitled")
            body = data.get("body", "")

            # Extract acceptance criteria from checkboxes
            criteria = re.findall(r'- \[x?\]\s*(.+)', body)
            if not criteria:
                # Try numbered lists
                criteria = re.findall(r'\d+\.\s+(.+)', body)

            return title, body, criteria
        except subprocess.CalledProcessError as e:
            print(f"Error fetching issue #{number}: {e.stderr}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError:
            print(f"Error parsing issue #{number}", file=sys.stderr)
            sys.exit(1)

    def infer_task_type(self, title: str, body: str) -> str:
        text = (title + " " + body).lower()
        if any(w in text for w in ["bug", "fix", "crash", "error", "exception"]):
            return "bug_fix"
        if any(w in text for w in ["refactor", "rewrite", "restructure", "extract"]):
            return "refactor"
        if any(w in text for w in ["audit", "review", "assessment", "gap"]):
            return "audit"
        if any(w in text for w in ["doc", "readme", "guide", "sop", "adr"]):
            return "documentation"
        if any(w in text for w in ["review", "pr ", "code review"]):
            return "code_review"
        return "feature_impl"

    def build_milestones(self, title: str, criteria: list[str], task_type: str) -> list[Milestone]:
        if criteria:
            # One milestone per acceptance criterion
            return [
                Milestone(
                    name=f"{title[:30]} — {c[:40]}",
                    acceptance_criteria=[c],
                    estimated_tokens=500,
                    dependencies=[] if i == 0 else [f"Milestone {i}"]
                )
                for i, c in enumerate(criteria[:5])  # cap at 5 milestones
            ]

        # Generic milestones based on task type
        templates = {
            "feature_impl": [
                ("Domain model", ["Entity/aggregate defined", "Unit tests pass"], 600),
                ("Application layer", ["Use case implements logic", "DTOs at boundaries"], 800),
                ("Infrastructure", ["Controller/router wired", "Repository implemented"], 800),
                ("Integration", ["E2E/API test passes", "Lefthook gates pass"], 600),
            ],
            "bug_fix": [
                ("Reproduce", ["Failing test reproduces bug"], 400),
                ("Fix", ["Bug fixed, all tests pass"], 800),
                ("Regression test", ["New test prevents regression"], 400),
            ],
            "refactor": [
                ("Identify violations", ["Architecture test confirms violation"], 500),
                ("Extract", ["Code moved to correct layer"], 800),
                ("Verify", ["All tests pass, no regressions"], 500),
            ],
            "audit": [
                ("Reconnaissance", ["Codebase mapped"], 500),
                ("Analysis", ["Violations identified and categorized"], 800),
                ("Report", ["Issues created with acceptance criteria"], 600),
            ],
        }

        template = templates.get(task_type, templates["feature_impl"])
        return [
            Milestone(name=n, acceptance_criteria=c, estimated_tokens=t, dependencies=[])
            for n, c, t in template
        ]

    def allocate_budget(self, task_type: str, total: int = 2000) -> BudgetAllocation:
        ratios = BUDGET_TABLE.get(task_type, BUDGET_TABLE["default"])
        return BudgetAllocation(
            system=int(ratios["system"] * total),
            task=int(ratios["task"] * total),
            retrieved=int(ratios["retrieved"] * total),
            working=int(ratios["working"] * total),
            safety=int(ratios["safety"] * total),
            total=total,
        )

    def index_sources(self, extra_sources: list[str] = None) -> list[str]:
        sources = list(DEFAULT_SOURCES)
        if extra_sources:
            sources.extend(extra_sources)

        indexed = []
        for src in sources:
            if os.path.exists(src):
                # In production, calls ctx_index(path=src, source=...)
                # For now, just validate existence
                indexed.append(src)
            else:
                print(f"  ⚠️  Source not found: {src}")
        return indexed

    def create_manifest(self, title: str, description: str, task_type: str,
                        criteria: list[str], extra_sources: list[str] = None) -> SessionManifest:
        milestones = self.build_milestones(title, criteria, task_type)
        budget = self.allocate_budget(task_type)
        indexed = self.index_sources(extra_sources)

        total_estimated = sum(m.estimated_tokens for m in milestones)
        sessions = max(1, total_estimated // budget.total)

        return SessionManifest(
            feature_list=FeatureList(
                title=title,
                description=description,
                milestones=milestones,
                current_milestone=0,
            ),
            context_budget=budget,
            indexed_sources=indexed,
            estimated_sessions=sessions,
            created_at=datetime.now(timezone.utc).isoformat() + "Z",
        )

    def write_manifest(self, manifest: SessionManifest, dry_run: bool = False):
        output = {
            "schema_version": manifest.schema_version,
            "created_at": manifest.created_at,
            "feature_list": asdict(manifest.feature_list),
            "context_budget": asdict(manifest.context_budget),
            "indexed_sources": manifest.indexed_sources,
            "estimated_sessions": manifest.estimated_sessions,
        }

        if dry_run:
            print(json.dumps(output, indent=2))
            return

        with open("feature-list.json", "w") as f:
            json.dump(output, f, indent=2)
        print(f"Written: feature-list.json ({manifest.estimated_sessions} sessions estimated)")

    def init_from_issue(self, number: int, dry_run: bool = False, extra_sources: list[str] = None):
        print(f"Initializing from issue #{number} ({self.repo})")
        title, body, criteria = self.parse_issue(number)
        task_type = self.infer_task_type(title, body)
        print(f"  Title: {title}")
        print(f"  Task type: {task_type}")
        print(f"  Criteria found: {len(criteria)}")

        manifest = self.create_manifest(title, body[:500], task_type, criteria, extra_sources)
        self.write_manifest(manifest, dry_run)
        return manifest

    def init_manual(self, title: str, scope: str, task_type: str,
                    dry_run: bool = False, extra_sources: list[str] = None):
        print(f"Initializing manually: {title}")
        print(f"  Scope: {scope}")
        print(f"  Task type: {task_type}")

        criteria = [f"Implement {scope}", "Tests pass", "Lefthook gates pass"]
        manifest = self.create_manifest(title, f"Scope: {scope}", task_type, criteria, extra_sources)
        self.write_manifest(manifest, dry_run)
        return manifest


def main():
    parser = argparse.ArgumentParser(description="Session Initializer (Standard 29 Phase 1)")
    parser.add_argument("--issue", type=int, help="GitHub issue number")
    parser.add_argument("--title", help="Manual title")
    parser.add_argument("--scope", help="Manual scope")
    parser.add_argument("--task-type", choices=list(BUDGET_TABLE.keys()), help="Override task type")
    parser.add_argument("--source", action="append", help="Extra context sources to index")
    parser.add_argument("--repo", help="Repo slug (owner/name)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--budget", type=int, default=2000, help="Total token budget")
    args = parser.parse_args()

    initializer = SessionInitializer(repo=args.repo)

    if args.issue:
        initializer.init_from_issue(
            args.issue,
            dry_run=args.dry_run,
            extra_sources=args.source,
        )
    elif args.title and args.scope:
        task_type = args.task_type or initializer.infer_task_type(args.title, args.scope)
        initializer.init_manual(
            args.title, args.scope, task_type,
            dry_run=args.dry_run,
            extra_sources=args.source,
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
