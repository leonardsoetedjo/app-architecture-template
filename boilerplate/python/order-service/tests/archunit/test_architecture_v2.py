"""
Architecture Tests for Python Boilerplate - CORRECTED VERSION

Based on pytest-archon 0.0.7, the archrule decorator should be used as:
@archrule
def rule_name():
    return all_modules()...

NOT with parameters. The name comes from the function name.
"""

from pytest_archon.rule import archrule, all_modules


# Layer Dependency Rules

@archrule
def domain_layer_must_not_import_infrastructure():
    """Domain layer must be pure - no infrastructure imports allowed."""
    return (
        all_modules()
        .matching("src.domain.*")
        .must_not_import(all_modules().matching("src.infrastructure.*"))
        .must_not_import(all_modules().matching("fastapi.*"))
        .must_not_import(all_modules().matching("sqlalchemy.*"))
        .must_not_import(all_modules().matching("pydantic.*"))
    )


@archrule
def domain_layer_must_not_import_application():
    """Domain layer should not depend on application layer."""
    return (
        all_modules()
        .matching("src.domain.*")
        .must_not_import(all_modules().matching("src.application.*"))
    )


@archrule
def application_layer_must_not_import_infrastructure():
    """Application layer must not import infrastructure."""
    return (
        all_modules()
        .matching("src.application.*")
        .must_not_import(all_modules().matching("src.infrastructure.*"))
        .must_not_import(all_modules().matching("fastapi.*"))
        .must_not_import(all_modules().matching("sqlalchemy.*"))
    )


@archrule
def domain_pure_python_only():
    """Domain models must be pure Python."""
    return (
        all_modules()
        .matching("src.domain.*")
        .may_only_import(
            all_modules().matching("src.domain.*"),
            all_modules().matching("typing.*"),
            all_modules().matching("dataclasses.*"),
            all_modules().matching("datetime.*"),
            all_modules().matching("decimal.*"),
            all_modules().matching("uuid.*"),
            all_modules().matching("enum.*"),
        )
    )


if __name__ == "__main__":
    print("Architecture rules defined successfully")
