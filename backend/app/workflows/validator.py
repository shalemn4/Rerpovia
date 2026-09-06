import yaml
from collections import defaultdict, deque
from typing import Any
from pydantic import ValidationError
from app.schemas.workflow_yaml import WorkflowSpec, ValidationResult, ValidationErrorDetail

def validate_and_normalize_workflow(yaml_content: str) -> ValidationResult:
    """
    Parses and thoroughly validates a workflow YAML string.
    Ensures:
    - Syntactically valid YAML
    - Pydantic schema conformance
    - Step uniqueness
    - Dependency existence
    - Acyclicity (Topological Sort / Cycle Detection)
    - Generates normalized DAG representation for execution and React Flow rendering
    """
    errors: list[ValidationErrorDetail] = []

    # 1. Parse YAML
    try:
        data = yaml.safe_load(yaml_content)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        line = mark.line + 1 if mark else 1
        col = mark.column + 1 if mark else 1
        return ValidationResult(
            is_valid=False,
            errors=[ValidationErrorDetail(
                loc=["yaml", line, col],
                msg=f"YAML syntax error: {str(exc)}",
                type="syntax_error"
            )]
        )

    if not isinstance(data, dict):
        return ValidationResult(
            is_valid=False,
            errors=[ValidationErrorDetail(
                loc=["root"],
                msg="Workflow specification must be a dictionary/mapping.",
                type="type_error"
            )]
        )

    # 2. Pydantic schema validation
    try:
        spec = WorkflowSpec(**data)
    except ValidationError as pydantic_err:
        for err in pydantic_err.errors():
            errors.append(ValidationErrorDetail(
                loc=[str(x) for x in err["loc"]],
                msg=err["msg"],
                type=err["type"]
            ))
        return ValidationResult(is_valid=False, errors=errors)

    # 3. Duplicate step names
    step_names = set()
    step_map = {}
    for idx, step in enumerate(spec.steps):
        if step.name in step_names:
            errors.append(ValidationErrorDetail(
                loc=["steps", idx, "name"],
                msg=f"Duplicate step name '{step.name}'. Step names must be unique across the workflow.",
                type="duplicate_step"
            ))
        step_names.add(step.name)
        step_map[step.name] = step

    # 4. Dependency existence check
    for idx, step in enumerate(spec.steps):
        for dep in step.depends_on:
            if dep not in step_map:
                errors.append(ValidationErrorDetail(
                    loc=["steps", idx, "depends_on"],
                    msg=f"Step '{step.name}' depends on non-existent step '{dep}'.",
                    type="missing_dependency"
                ))

    if errors:
        return ValidationResult(is_valid=False, errors=errors)

    # 5. Cycle Detection / Topological Sort (Kahn's Algorithm)
    in_degree = {name: 0 for name in step_names}
    graph = defaultdict(list)
    for step in spec.steps:
        for dep in step.depends_on:
            graph[dep].append(step.name)
            in_degree[step.name] += 1

    queue = deque([name for name, deg in in_degree.items() if deg == 0])
    ordered_steps = []
    step_depths = {name: 0 for name in step_names}

    while queue:
        current = queue.popleft()
        ordered_steps.append(current)
        current_depth = step_depths[current]

        for neighbor in graph[current]:
            step_depths[neighbor] = max(step_depths[neighbor], current_depth + 1)
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(ordered_steps) != len(step_names):
        # Find cycle participants
        cycle_candidates = [name for name, deg in in_degree.items() if deg > 0]
        return ValidationResult(
            is_valid=False,
            errors=[ValidationErrorDetail(
                loc=["steps"],
                msg=f"Circular dependency detected involving steps: {', '.join(cycle_candidates)}.",
                type="circular_dependency"
            )]
        )

    # 6. Generate Normalized DAG & React Flow coordinates
    # Organize into visual columns based on topological depth
    depth_groups = defaultdict(list)
    for name in ordered_steps:
        depth = step_depths[name]
        depth_groups[depth].append(name)

    rf_nodes = []
    rf_edges = []

    # Input Node (if inputs specified)
    x_spacing = 260
    y_spacing = 130
    x_offset = 60
    y_offset = 120

    if spec.inputs:
        rf_nodes.append({
            "id": "input-dataset",
            "type": "datasetNode",
            "position": {"x": x_offset, "y": y_offset},
            "data": {
                "label": "Inputs & Datasets",
                "inputs": spec.inputs,
                "nodeType": "input"
            }
        })
        x_offset += x_spacing

    for depth, names in depth_groups.items():
        col_x = x_offset + depth * x_spacing
        total_in_col = len(names)
        start_y = y_offset - ((total_in_col - 1) * y_spacing) / 2

        for row_idx, step_name in enumerate(names):
            step = step_map[step_name]
            node_y = start_y + row_idx * y_spacing

            rf_nodes.append({
                "id": step.name,
                "type": "computeStepNode",
                "position": {"x": col_x, "y": node_y},
                "data": {
                    "label": step.name,
                    "image": step.image,
                    "command": step.command,
                    "resources": step.resources.model_dump(),
                    "env": step.env,
                    "outputs": step.outputs,
                    "nodeType": "compute"
                }
            })

            # Create edges from dependencies
            if step.depends_on:
                for dep in step.depends_on:
                    rf_edges.append({
                        "id": f"edge-{dep}-{step.name}",
                        "source": dep,
                        "target": step.name,
                        "animated": True,
                        "type": "smoothstep",
                        "style": {"stroke": "#1d63ed", "strokeWidth": 2}
                    })
            elif spec.inputs:
                # First tier steps connect to inputs
                rf_edges.append({
                    "id": f"edge-input-{step.name}",
                    "source": "input-dataset",
                    "target": step.name,
                    "animated": True,
                    "type": "smoothstep",
                    "style": {"stroke": "#0c192c", "strokeWidth": 1.5, "strokeDasharray": "4 4"}
                })

    # Results Output Node
    max_depth = max(step_depths.values()) if step_depths else 0
    results_x = x_offset + (max_depth + 1) * x_spacing
    rf_nodes.append({
        "id": "output-results",
        "type": "resultsNode",
        "position": {"x": results_x, "y": y_offset},
        "data": {
            "label": "Artifacts & Results",
            "outputs": spec.outputs,
            "nodeType": "output"
        }
    })

    # Connect leaf nodes (nodes with out_degree 0) to Results node
    leaf_nodes = [name for name in step_names if len(graph[name]) == 0]
    for leaf in leaf_nodes:
        rf_edges.append({
            "id": f"edge-{leaf}-results",
            "source": leaf,
            "target": "output-results",
            "animated": True,
            "type": "smoothstep",
            "style": {"stroke": "#166534", "strokeWidth": 2}
        })

    normalized_dag = {
        "name": spec.name,
        "version": spec.version,
        "description": spec.description,
        "inputs": spec.inputs,
        "outputs": spec.outputs,
        "execution_order": ordered_steps,
        "step_depths": step_depths,
        "steps": {step.name: step.model_dump() for step in spec.steps},
        "react_flow": {
            "nodes": rf_nodes,
            "edges": rf_edges
        }
    }

    return ValidationResult(
        is_valid=True,
        errors=[],
        normalized_dag=normalized_dag
    )
