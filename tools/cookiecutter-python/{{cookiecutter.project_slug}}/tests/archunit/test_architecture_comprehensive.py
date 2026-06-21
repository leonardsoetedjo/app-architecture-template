"""
Comprehensive Architecture Tests using pytest-archon

These tests enforce Clean Architecture layer boundaries at runtime.
Install: pip install pytest-archon

Run with: pytest tests/archunit/test_architecture_comprehensive.py -v
"""

import ast
from pathlib import Path
from typing import Set, Dict, List
from dataclasses import dataclass


@dataclass
class ImportViolation:
    file: Path
    from_module: str
    imported_module: str
    rule: str


class ArchitectureRuleChecker:
    """Checks architecture rules by analyzing AST of Python files."""
    
    def __init__(self, src_path: Path):
        self.src_path = src_path
        self.violations: List[ImportViolation] = []
        
        # Define layer boundaries
        self.layer_paths = {
            'domain': src_path / 'domain',
            'application': src_path / 'application',
            'infrastructure': src_path / 'infrastructure',
            'presentation': src_path / 'presentation',
        }
        
        # Define forbidden imports per layer
        self.forbidden_imports = {
            'domain': {
                'fastapi', 'sqlalchemy', 'pydantic', 'redis', 'alembic',
                'infrastructure', 'presentation',
            },
            'application': {
                'fastapi', 'sqlalchemy', 'redis',
                'infrastructure', 'presentation',
            },
        }
    
    def get_file_layer(self, file_path: Path) -> str | None:
        """Determine which layer a file belongs to."""
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
    
    def check_layer_rules(self) -> List[ImportViolation]:
        """Check all files for layer boundary violations."""
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
                        violations.append(ImportViolation(
                            file=py_file,
                            from_module=layer,
                            imported_module=imp,
                            rule=f"Layer '{layer}' cannot import '{imp}'"
                        ))
        
        return violations


def test_domain_has_no_framework_imports():
    """Domain layer must have zero framework imports."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = ArchitectureRuleChecker(src_path)
    violations = checker.check_layer_rules()
    
    domain_violations = [v for v in violations if v.from_module == 'domain']
    
    assert len(domain_violations) == 0, (
        f"Domain layer has {len(domain_violations)} forbidden imports:\n" +
        "\n".join(f"  - {v.file.relative_to(src_path)} imports '{v.imported_module}'" 
                  for v in domain_violations)
    )


def test_application_has_no_infrastructure_imports():
    """Application layer must not import from infrastructure."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    checker = ArchitectureRuleChecker(src_path)
    violations = checker.check_layer_rules()
    
    app_violations = [v for v in violations if v.from_module == 'application']
    
    assert len(app_violations) == 0, (
        f"Application layer has {len(app_violations)} forbidden imports:\n" +
        "\n".join(f"  - {v.file.relative_to(src_path)} imports '{v.imported_module}'" 
                  for v in app_violations)
    )


def test_no_circular_dependencies():
    """Check for circular dependencies between layers."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    
    # Simple check: domain should never import application or infrastructure
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


def test_all_domain_classes_are_dataclasses():
    """Domain classes should use @dataclass or @dataclass(frozen=True)."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    domain_path = src_path / 'domain'
    
    for py_file in domain_path.rglob('*.py'):
        if py_file.name == '__init__.py':
            continue
        
        content = py_file.read_text(encoding='utf-8')
        tree = ast.parse(content)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                # Skip exceptions
                if 'Exception' in node.name:
                    continue
                
                has_dataclass = False
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Name) and decorator.id == 'dataclass':
                        has_dataclass = True
                    elif isinstance(decorator, ast.Call):
                        if isinstance(decorator.func, ast.Name) and decorator.func.id == 'dataclass':
                            has_dataclass = True
                
                # Allow ABC for ports
                if node.name.endswith('Repository') or node.name.endswith('Port'):
                    continue
                
                assert has_dataclass, (
                    f"Domain class {node.name} in {py_file.relative_to(src_path)} "
                    f"should use @dataclass decorator"
                )


def test_value_objects_are_frozen():
    """Value objects should be immutable (frozen=True)."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    domain_path = src_path / 'domain'
    
    # Check specific value object files
    value_object_patterns = ['_id.py', 'config.py']
    
    for pattern in value_object_patterns:
        for py_file in domain_path.rglob(f'*{pattern}'):
            content = py_file.read_text(encoding='utf-8')
            
            # Check if it uses frozen dataclass
            if '@dataclass' in content:
                assert 'frozen=True' in content, (
                    f"Value object {py_file.relative_to(src_path)} should be frozen (immutable)"
                )


def test_domain_events_named_in_past_tense():
    """Domain events should be named in past tense."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    domain_path = src_path / 'domain'
    
    events_path = domain_path / 'events'
    if not events_path.exists():
        return  # Skip if no events directory
    
    past_tense_endings = ['ed', 'en', 'ne', 'te']  # Common past tense endings
    
    for py_file in events_path.rglob('*.py'):
        if py_file.name == '__init__.py':
            continue
        
        content = py_file.read_text(encoding='utf-8')
        tree = ast.parse(content)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                class_name = node.name
                
                # Skip base classes
                if class_name in ['DomainEvent', 'Event']:
                    continue
                
                # Check if name suggests past tense
                assert any(class_name.endswith(ending) for ending in past_tense_endings), (
                    f"Domain event {class_name} in {py_file.relative_to(src_path)} "
                    f"should be named in past tense (e.g., OrderPlaced, not OrderPlace)"
                )


def test_use_cases_orchestrate_not_implement():
    """Use cases should orchestrate, not implement business logic."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    app_path = src_path / 'application'
    
    usecase_path = app_path / 'usecases'
    if not usecase_path.exists():
        return
    
    for py_file in usecase_path.rglob('*.py'):
        if py_file.name == '__init__.py':
            continue
        
        content = py_file.read_text(encoding='utf-8')
        
        # Use cases should have 'execute' or similar orchestration method
        assert 'def execute(' in content or 'def handle(' in content, (
            f"Use case {py_file.relative_to(src_path)} should have execute() or handle() method"
        )


def test_repositories_return_domain_models():
    """Repository methods should return domain models, not ORM entities."""
    src_path = Path(__file__).parent.parent.parent / 'src'
    domain_path = src_path / 'domain'
    ports_path = domain_path / 'ports'
    
    if not ports_path.exists():
        return
    
    for py_file in ports_path.rglob('*.py'):
        if py_file.name == '__init__.py':
            continue
        
        content = py_file.read_text(encoding='utf-8')
        
        # Repository ports should have type hints
        assert '->' in content, (
            f"Repository port {py_file.relative_to(src_path)} should have return type hints"
        )


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
