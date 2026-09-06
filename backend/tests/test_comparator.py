import pytest
from app.provenance.comparator import VerdictStatus, ComparisonItem

def test_verdict_logic():
    # Test comparison item structures
    item = ComparisonItem(
        category="INPUTS",
        status=VerdictStatus.MATCHED,
        original_value="Dataset v1.2",
        reproduced_value="Dataset v1.2",
        details="Bitwise identical"
    )
    assert item.status == VerdictStatus.MATCHED
    assert item.category == "INPUTS"
