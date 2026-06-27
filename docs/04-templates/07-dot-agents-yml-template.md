---
title: ".agents.yml — forex-trading-app (example)"
number: "07"
type: "Template"
created: "2026-06-27"
status: "active"
---
# .agents.yml — forex-trading-app (example)
# Copy this template from app-architecture-template/.agents.yml
# Fill in all values before first commit.

version: "1.0"

# =======================================================================
# PROJECT LINKAGE (REQUIRED)
# =======================================================================
project:
  name: "forex-trading-app"
  repository_url: "https://github.com/leonardsoetedjo/forex-trading-app"

  # --- CRITICAL: Boilerplate Reference ---
  # Every project MUST declare which boilerplate it derives from.
  # Agents use this to discover patterns, verify compliance, and flag drift.
  #
  # When this section is missing or empty, the audit agent WILL flag:
  #   Finding: MAJ-03 "No .agents.yml — machine-readable configuration missing"
  #
  boilerplate_reference:
    # Stack variant from app-architecture-template
    stack: "python"        # java | python | nestjs | reactjs | quasar
    template_repo: "https://github.com/leonardsoetedjo/app-architecture-template"
    template_boilerplate_path: "boilerplate/python"
    # The specific commit/tag of the template this project was bootstrapped from
    template_version: "v2.1"
    # When the template boilerplate was last updated (auto-fetched by CI)
    template_boilerplate_date: "2026-06-19"

  # --- CRITICAL: Temporal Mismatch Check ---
  # If project_init_date > template_boilerplate_date, the boilerplate
  # did not exist when the project started. This flags the forex-trading-app
  # scenario: code built before reference existed.
  project_init_date: "2026-04-20"  # First commit date

  # Machine-readable rule IDs for this project's stack.
  # Must map to architecture_rules[] in the template.
  rule_mapping:
    # template_rule_id → local_enforcement_mechanism
    DDD-DOMAIN-PURITY-PYTHON:
      enforced_by: "pytest-archon / tests/archunit/test_architecture.py"
      test_file: "backend/tests/archunit/test_architecture.py::test_domain_no_sqlmodel_imports"
    DDD-CONSTRUCTOR-INJECTION:
      enforced_by: "pytest-archon / tests/archunit/test_architecture.py"
      test_file: "backend/tests/archunit/test_architecture.py::test_services_no_sqlmodel_imports"
    DDD-DTO-BOUNDARY:
      enforced_by: "manual review / lefthook"
      pattern: "grep -rl 'from app.models' src/app/api/v1/endpoints/"
    DDD-DATABASE-001:
      enforced_by: "pytest / Testcontainers"
      test_file: "backend/tests/integration/"

# =======================================================================
# CONTEXT SOURCES (REQUIRED)
# =======================================================================
# Agents index these paths with ctx_index() and query with ctx_search().
# Every path here MUST exist or the agent will flag drift.
context_sources:
  forex-architecture:
    path: "docs/architecture"
    extensions: [".md"]
    description: "Project architecture docs, ADRs, standards"

  forex-standards:
    path: "docs/standards"
    extensions: [".md"]
    description: "Project standards and validation harness"

  forex-prd:
    path: "docs/business-requirements"
    extensions: [".md"]
    description: "PRDs and feature specifications"

  forex-backend:
    path: "backend/src/app"
    extensions: [".py"]
    description: "Backend source code"

  forex-tests:
    path: "backend/tests"
    extensions: [".py"]
    description: "Test suite"

  # --- CRITICAL: Link to template boilerplate ---
  # Agents MUST also index the canonical boilerplate for pattern reference.
  # This ensures the project stays in sync with template evolution.
  template-python-boilerplate:
    path: "../app-architecture-template/boilerplate/python"
    extensions: [".py", ".md", ".toml"]
    description: "Canonical Python boilerplate from template"
    # NOTE: Use relative path if template is sibling repo;
    #       use git submodule or absolute path in CI.

# =======================================================================
# FORBIDDEN PATTERNS (REQUIRED)
# =======================================================================
# These mirror the template's architecture_rules but are project-specific.
# Each pattern MUST reference a template rule ID for traceability.
forbidden_patterns:
  - id: DDD-DOMAIN-PURITY-PYTHON
    name: "Domain has zero framework imports"
    pattern: "^(import|from)\\s+(fastapi|sqlalchemy|pydantic|sqlmodel)"
    path_regex: "backend/src/app/domain/.*\\.py$"
    message: "Domain layer must not import frameworks"
    severity: error
    stacks: [python]
    # Traceability link to canonical rule
    canonical_rule: "app-architecture-template#DDD-DOMAIN-PURITY-PYTHON"

  - id: DDD-SERVICE-PORTS
    name: "Services must use repository ports"
    pattern: "db\\.add\\(|db\\.commit\\(|db\\.execute\\("
    path_regex: "backend/src/app/services/.*\\.py$"
    message: "Services must delegate persistence to repository ports"
    severity: warning
    stacks: [python]
    canonical_rule: "app-architecture-template#DDD-CONSTRUCTOR-INJECTION"

  - id: DDD-ROUTER-MODELS
    name: "Routers must not import models directly"
    pattern: "from app\\.models"
    path_regex: "backend/src/app/api/v1/endpoints/.*\\.py$"
    message: "Routers must delegate to services, not import models directly"
    severity: warning
    stacks: [python]
    canonical_rule: "app-architecture-template#DDD-DTO-BOUNDARY"

# =======================================================================
# ARCHITECTURE RULES (PROJECT-SPECIFIC)
# =======================================================================
# These are project-specific rules that supplement (not replace) template rules.
# Each MUST reference the parent template rule for traceability.
architecture_rules:
  - id: LAYER-DOMAIN-CLEAN
    name: "Domain has zero framework imports"
    description: "Domain entities are pure Python dataclasses"
    test: "test_domain_no_sqlmodel_imports"
    severity: critical
    canonical_rule: "app-architecture-template#DDD-DOMAIN-PURITY-PYTHON"

  - id: LAYER-SERVICE-PORTS
    name: "Services use repository ports"
    description: "Services receive repositories via constructor, not AsyncSession"
    test: "test_services_no_sqlmodel_imports"
    severity: critical
    canonical_rule: "app-architecture-template#DDD-CONSTRUCTOR-INJECTION"

  - id: LAYER-ROUTERS-DELEGATE
    name: "Routers delegate to services"
    description: "Routers use Depends() with service factories, not direct ORM"
    test: "test_routers_no_orm_direct_usage"
    severity: major
    canonical_rule: "app-architecture-template#DDD-DTO-BOUNDARY"

# =======================================================================
# PRE-COMMIT (REQUIRED)
# =======================================================================
pre_commit: backend/scripts/pre-commit.sh

# =======================================================================
# TEMPORAL MISMATCH WARNING
# =======================================================================
# This project was created on 2026-04-20.
# The template boilerplate was finalized on 2026-05-03.
# This means 82 services were built before the reference pattern existed.
# Audit agents should expect retrofit work, not green-field compliance.
# =======================================================================
