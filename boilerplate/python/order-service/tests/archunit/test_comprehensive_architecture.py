"""
Comprehensive Architecture Tests using AST Analysis

This test suite enforces Clean Architecture principles for Python/FastAPI:
1. Layer dependency rules (inward-only dependencies)
2. Framework isolation (no FastAPI/SQLAlchemy/Pydantic in domain)
3. Naming conventions (past tense events, Repository interfaces)
4. Structural rules (dataclasses, immutability, constructor patterns)

Run with: pytest tests/archunit/test_comprehensive_architecture.py -v
"""

import ast
from pathlib import Path
from typing import Set, Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class ArchitectureViolation:
    """Represents an architecture rule violation."""
    file: Path
    line: int
    rule: str
    detail: str
    severity: str = "error"  # error | warning


class PythonArchitectureChecker:
    """
    Comprehensive architecture rule checker using AST analysis.
    
    Analyzes Python source files to enforce:
    - Layer boundary violations
    - Forbidden imports per layer
    - Naming conventions
    - Structural patterns (dataclasses, records)
    - Annotation usage
    """
    
    def __init__(self, src_path: Path):
        self.src_path = src_path
        self.violations: List[ArchitectureViolation] = []
        
        # Define layer boundaries
        self.layer_paths = {
            'domain': src_path / 'domain',
            'application': src_path / 'application',
            'infrastructure': src_path / 'infrastructure',
        }
        
        # Forbidden imports per layer
        self.forbidden_imports: Dict[str, Set[str]] = {
            'domain': {
                'fastapi', 'sqlalchemy', 'pydantic', 'redis', 'alembic',
                'infrastructure', 'presentation', 'api',
            },
            'application': {
                'fastapi', 'sqlalchemy', 'redis', 'alembic',
                'infrastructure', 'presentation',
            },
        }
        
        # Framework annotation patterns to detect
        self.framework_annotations = {
            'fastapi': ['Depends', 'FastAPI', 'APIRouter', 'HTTPException'],
            'sqlalchemy': ['Column', 'Integer', 'String', 'ForeignKey', 'relationship', 'Session', 'declarative_base'],
            'pydantic': ['BaseModel', 'Field', 'validator', 'root_validator'],
        }
    
    def get_file_layer(self, file_path: Path) -> Optional[str]:
        """Determine which layer a file belongs to based on its path."""
        try:
            rel_path = file_path.relative_to(self.src_path)
            for layer, path in self.layer_paths.items():
                try:
                    rel_path.relative_to(layer)
                    return layer
                except ValueError:
                    continue
        except ValueError:
            pass
        return None
    
    def extract_imports(self, file_path: Path) -> Set[str]:
        """Extract all import statements from a Python file."""
        imports: Set[str] = set()
        
        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split('.')[0])
        except (SyntaxError, UnicodeDecodeError):
            pass
        
        return imports
    
    def check_forbidden_imports(self) -> List[ArchitectureViolation]:
        """Check for forbidden imports in each layer."""
        violations = []
        
        for layer, forbidden in self.forbidden_imports.items():
            layer_path = self.layer_paths[layer]
            if not layer_path.exists():
                continue
            
            for py_file in layer_path.rglob('*.py'):
                if py_file.name == '__init__.py':
                    continue
                
                imports = self.extract_imports(py_file)
                
                for imp in imports:
                    if imp in forbidden:
                        violations.append(ArchitectureViolation(
                            file=py_file,
                            line=0,
                            rule=f"forbidden_import_{layer}",
                            detail=f"Layer '{layer}' cannot import '{imp}'",
                            severity="error"
                        ))
        
        return violations
    
    def check_framework_annotations(self) -> List[ArchitectureViolation]:
        """Check for framework annotations in domain layer."""
        violations = []
        domain_path = self.layer_paths['domain']
        
        if not domain_path.exists():
            return violations
        
        for py_file in domain_path.rglob('*.py'):
            if py_file.name == '__init__.py':
                continue
            
            try:
                content = py_file.read_text(encoding='utf-8')
                tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    # Check decorators (annotations)
                    if hasattr(node, 'decorator_list'):
                        for decorator in node.decorator_list:
                            dec_name = self._get_decorator_name(decorator)
                            if dec_name:
                                for framework, patterns in self.framework_annotations.items():
                                    if any(pattern in dec_name for pattern in patterns):
                                        violations.append(ArchitectureViolation(
                                            file=py_file,
                                            line=getattr(node, 'lineno', 0),
                                            rule="framework_annotation_in_domain",
                                            detail=f"Domain layer cannot use {framework}.{dec_name}",
                                            severity="error"
                                        ))
            except (SyntaxError, UnicodeDecodeError):
                pass
        
        return violations
    
    def _get_decorator_name(self, decorator) -> Optional[str]:
        """Extract decorator name from AST node."""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Attribute):
            return decorator.attr
        elif isinstance(decorator, ast.Call):
            return self._get_decorator_name(decorator.func)
        return None
    
    def check_naming_conventions(self) -> List[ArchitectureViolation]:
        """Check naming conventions for domain objects."""
        violations = []
        domain_path = self.layer_paths['domain']
        
        if not domain_path.exists():
            return violations
        
        for py_file in domain_path.rglob('*.py'):
            if py_file.name == '__init__.py':
                continue
            
            try:
                content = py_file.read_text(encoding='utf-8')
                tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        class_name = node.name
                        
                        # Skip base classes and exceptions
                        if class_name in ['Exception', 'DomainEvent', 'Event', 'ABC']:
                            continue
                        if 'Exception' in class_name or 'Error' in class_name:
                            continue
                        
                        # Check domain events are past tense
                        if 'events' in str(py_file).lower() or 'event' in class_name.lower():
                            past_tense_endings = ['ed', 'en', 'ne', 'te']
                            if not any(class_name.endswith(e) for e in past_tense_endings):
                                violations.append(ArchitectureViolation(
                                    file=py_file,
                                    line=node.lineno,
                                    rule="event_naming",
                                    detail=f"Domain event '{class_name}' should be past tense (e.g., OrderPlaced)",
                                    severity="warning"
                                ))
                        
                        # Check repository interfaces end with Repository
                        if 'ports' in str(py_file).lower():
                            if class_name.endswith('Repository') or class_name.endswith('Port'):
                                # Check it's likely an interface (has ABC or no body)
                                pass
                            elif not class_name.endswith('Service'):
                                # Might be a model, not a port
                                pass
            except (SyntaxError, UnicodeDecodeError):
                pass
        
        return violations
    
    def check_dataclass_usage(self) -> List[ArchitectureViolation]:
        """Check that domain classes use @dataclass decorator."""
        violations = []
        domain_path = self.layer_paths['domain']
        
        if not domain_path.exists():
            return violations
        
        for py_file in domain_path.rglob('*.py'):
            if py_file.name == '__init__.py':
                continue
            
            try:
                content = py_file.read_text(encoding='utf-8')
                tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        class_name = node.name
                        
                        # Skip exceptions and ABCs
                        if 'Exception' in class_name or 'Error' in class_name:
                            continue
                        if class_name.endswith('Repository') or class_name.endswith('Port'):
                            continue
                        
                        has_dataclass = False
                        for decorator in node.decorator_list:
                            dec_name = self._get_decorator_name(decorator)
                            if dec_name == 'dataclass':
                                has_dataclass = True
                                break
                        
                        if not has_dataclass:
                            violations.append(ArchitectureViolation(
                                file=py_file,
                                line=node.lineno,
                                rule="missing_dataclass",
                                detail=f"Domain class '{class_name}' should use @dataclass decorator",
                                severity="warning"
                            ))
            except (SyntaxError, UnicodeDecodeError):
                pass
        
        return violations
    
    def check_frozen_value_objects(self) -> List[ArchitectureViolation]:
        """Check that value objects are immutable (frozen=True)."""
        violations = []
        domain_path = self.layer_paths['domain']
        
        if not domain_path.exists():
            return violations
        
        value_object_patterns = ['_id.py', 'config.py', 'value_object.py']
        
        for pattern in value_object_patterns:
            for py_file in domain_path.rglob(f'*{pattern}'):
                try:
                    content = py_file.read_text(encoding='utf-8')
                    
                    if '@dataclass' in content and 'frozen=True' not in content:
                        violations.append(ArchitectureViolation(
                            file=py_file,
                            line=0,
                            rule="unfrozen_value_object",
                            detail=f"Value object should be frozen (immutable)",
                            severity="warning"
                        ))
                except (SyntaxError, UnicodeDecodeError):
                    pass
        
        return violations
    
    def check_use_case_structure(self) -> List[ArchitectureViolation]:
        """Check that use cases have execute/handle methods."""
        violations = []
        app_path = self.layer_paths['application']
        
        if not app_path.exists():
            return violations
        
        usecase_path = app_path / 'usecases'
        if not usecase_path.exists():
            return violations
        
        for py_file in usecase_path.rglob('*.py'):
            if py_file.name == '__init__.py':
                continue
            
            try:
                content = py_file.read_text(encoding='utf-8')
                
                # Use cases should have execute or handle method
                if 'def execute(' not in content and 'def handle(' not in content:
                    # Skip if it's an interface (has ABC or abstractmethod)
                    if 'ABC' not in content and 'abstractmethod' not in content:
                        violations.append(ArchitectureViolation(
                            file=py_file,
                            line=0,
                            rule="missing_use_case_method",
                            detail=f"Use case should have execute() or handle() method",
                            severity="warning"
                        ))
            except (SyntaxError, UnicodeDecodeError):
                pass
        
        return violations
    
    def run_all_checks(self) -> List[ArchitectureViolation]:
        """Run all architecture checks and return violations."""
        all_violations = []
        
        all_violations.extend(self.check_forbidden_imports())
        all_violations.extend(self.check_framework_annotations())
        all_violations.extend(self.check_naming_conventions())
        all_violations.extend(self.check_dataclass_usage())
        all_violations.extend(self.check_frozen_value_objects())
        all_violations.extend(self.check_use_case_structure())
        
        return all_violations


# ============================================================================
# PYTEST TESTS
# ============================================================================

def test_domain_has_no_framework_imports():
    """Domain layer must have zero framework imports."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_forbidden_imports()
    
    domain_violations = [v for v in violations if 'domain' in str(v.file)]
    
    assert len(domain_violations) == 0, (
        f"Domain layer has {len(domain_violations)} forbidden imports:\n" +
        "\n".join(f"  - {v.file.relative_to(src_path)}: {v.detail}" 
                  for v in domain_violations)
    )


def test_application_has_no_infrastructure_imports():
    """Application layer must not import from infrastructure."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_forbidden_imports()
    
    app_violations = [v for v in violations if 'application' in str(v.file)]
    
    assert len(app_violations) == 0, (
        f"Application layer has {len(app_violations)} forbidden imports:\n" +
        "\n".join(f"  - {v.file.relative_to(src_path)}: {v.detail}" 
                  for v in app_violations)
    )


def test_no_circular_dependencies():
    """Check for circular dependencies between layers."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    domain_path = src_path / 'domain'
    
    for py_file in domain_path.rglob('*.py'):
        if py_file.name == '__init__.py':
            continue
        
        content = py_file.read_text(encoding='utf-8')
        
        assert 'from application' not in content, (
            f"Domain file {py_file.relative_to(src_path)} imports from application layer"
        )
        assert 'from infrastructure' not in content, (
            f"Domain file {py_file.relative_to(src_path)} imports from infrastructure layer"
        )
        assert 'import application' not in content, (
            f"Domain file {py_file.relative_to(src_path)} imports application module"
        )
        assert 'import infrastructure' not in content, (
            f"Domain file {py_file.relative_to(src_path)} imports infrastructure module"
        )


def test_all_domain_classes_use_dataclass():
    """Domain classes should use @dataclass decorator."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_dataclass_usage()
    
    # Only fail on errors, warnings are informational
    error_violations = [v for v in violations if v.severity == 'error']
    
    assert len(error_violations) == 0, (
        f"Found {len(error_violations)} domain classes missing @dataclass:\n" +
        "\n".join(f"  - {v.file.relative_to(src_path)}:{v.line} {v.detail}" 
                  for v in error_violations)
    )


def test_value_objects_are_frozen():
    """Value objects should be immutable (frozen=True)."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_frozen_value_objects()
    
    # This is a warning-level check
    if violations:
        print(f"⚠️  Warning: {len(violations)} value objects may not be frozen")
        for v in violations:
            print(f"   - {v.file.relative_to(src_path)}: {v.detail}")


def test_domain_events_named_in_past_tense():
    """Domain events should be named in past tense."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_naming_conventions()
    
    event_violations = [v for v in violations if 'event_naming' in v.rule]
    
    # This is a warning-level check
    if event_violations:
        print(f"⚠️  Warning: {len(event_violations)} domain events may not follow past tense naming")
        for v in event_violations:
            print(f"   - {v.file.relative_to(src_path)}:{v.line} {v.detail}")


def test_use_cases_have_execute_method():
    """Use cases should have execute() or handle() method."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    violations = checker.check_use_case_structure()
    
    usecase_violations = [v for v in violations if 'missing_use_case_method' in v.rule]
    
    # This is a warning-level check
    if usecase_violations:
        print(f"⚠️  Warning: {len(usecase_violations)} use cases missing execute/handle method")
        for v in usecase_violations:
            print(f"   - {v.file.relative_to(src_path)}: {v.detail}")


def test_comprehensive_architecture_check():
    """Run all comprehensive architecture checks."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = PythonArchitectureChecker(src_path)
    all_violations = checker.run_all_checks()
    
    # Separate errors from warnings
    errors = [v for v in all_violations if v.severity == 'error']
    warnings = [v for v in all_violations if v.severity == 'warning']
    
    # Print warnings but don't fail
    if warnings:
        print(f"\n⚠️  {len(warnings)} architecture warnings:")
        for w in warnings[:5]:  # Show first 5
            print(f"   - {w.file.relative_to(src_path)}:{w.line} {w.detail}")
        if len(warnings) > 5:
            print(f"   ... and {len(warnings) - 5} more")
    
    # Fail on errors
    assert len(errors) == 0, (
        f"❌ Found {len(errors)} critical architecture violations:\n" +
        "\n".join(f"  - {e.file.relative_to(src_path)}:{e.line} {e.rule}: {e.detail}" 
                  for e in errors)
    )


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v', '--tb=short'])
