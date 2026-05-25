"""
Simple test to understand pytest-archon usage
"""
from pytest_archon.rule import archrule

# Try the simplest form - just use archrule as a decorator
@archrule
def test_simple_rule():
    """A simple architecture rule"""
    return archrule.all_modules().matching("src.*")

if __name__ == "__main__":
    print("Test file created successfully")
