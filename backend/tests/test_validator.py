import pytest
from app.workflows.validator import validate_and_normalize_workflow

VALID_YAML = """version: "1.0"
name: test-pipeline
steps:
  - name: step-a
    image: python:3.11-slim
    command: python a.py
  - name: step-b
    image: python:3.11-slim
    command: python b.py
    depends_on:
      - step-a
"""

CYCLE_YAML = """version: "1.0"
name: cyclic-pipeline
steps:
  - name: step-a
    image: python:3.11-slim
    command: python a.py
    depends_on:
      - step-b
  - name: step-b
    image: python:3.11-slim
    command: python b.py
    depends_on:
      - step-a
"""

MISSING_DEP_YAML = """version: "1.0"
name: missing-dep
steps:
  - name: step-b
    image: python:3.11-slim
    command: python b.py
    depends_on:
      - non-existent-step
"""

def test_valid_dag_normalization():
    res = validate_and_normalize_workflow(VALID_YAML)
    assert res.is_valid is True
    assert len(res.errors) == 0
    assert res.normalized_dag is not None
    assert res.normalized_dag["execution_order"] == ["step-a", "step-b"]
    assert len(res.normalized_dag["react_flow"]["nodes"]) >= 2

def test_cycle_detection():
    res = validate_and_normalize_workflow(CYCLE_YAML)
    assert res.is_valid is False
    assert any("Circular dependency" in e.msg for e in res.errors)

def test_missing_dependency_detection():
    res = validate_and_normalize_workflow(MISSING_DEP_YAML)
    assert res.is_valid is False
    assert any("depends on non-existent step" in e.msg for e in res.errors)
