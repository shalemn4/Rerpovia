import pytest
import pytest_asyncio
import httpx
from app.main import app

@pytest.mark.asyncio
async def test_artifacts_api():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. List artifacts
        res = await client.get("/api/artifacts")
        assert res.status_code == 200
        artifacts = res.json()
        assert isinstance(artifacts, list)
        
        # If seed data ran, there should be artifacts for run-184
        if len(artifacts) > 0:
            first_art = artifacts[0]
            assert "id" in first_art
            assert "name" in first_art
            assert "checksum" in first_art
            
            # 2. Get artifact detail
            detail_res = await client.get(f"/api/artifacts/{first_art['id']}")
            assert detail_res.status_code == 200
            assert detail_res.json()["name"] == first_art["name"]

@pytest.mark.asyncio
async def test_datasets_api():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. List datasets
        res = await client.get("/api/datasets")
        assert res.status_code == 200
        datasets = res.json()
        assert isinstance(datasets, list)

        # 2. Create new dataset
        create_res = await client.post("/api/datasets", json={
            "project_id": "proj-particle-physics",
            "name": "Integration Test Dataset",
            "description": "Created during pytest execution",
            "version_tag": "v1.0",
            "file_format": "csv"
        })
        assert create_res.status_code == 200
        new_ds = create_res.json()
        assert new_ds["name"] == "Integration Test Dataset"
        assert "checksum" in new_ds

        # 3. Get dataset detail
        get_res = await client.get(f"/api/datasets/{new_ds['id']}")
        assert get_res.status_code == 200
        assert len(get_res.json()["versions"]) >= 1

@pytest.mark.asyncio
async def test_workflow_templates_api():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/workflows/templates")
        assert res.status_code == 200
        templates = res.json()
        assert len(templates) == 4
        assert any(t["title"] == "Particle Collision Analysis" for t in templates)
        assert any(t["title"] == "Monte Carlo Quantum Simulation" for t in templates)

@pytest.mark.asyncio
async def test_members_api():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. List members
        res = await client.get("/api/auth/members")
        assert res.status_code == 200
        members = res.json()
        assert isinstance(members, list)
        assert len(members) >= 1

        # 2. Invite member
        invite_res = await client.post("/api/auth/members", json={
            "name": "Test Colleague",
            "email": "test.colleague@cern.ch",
            "role": "RESEARCHER",
            "institution": "ATLAS Experiment"
        })
        # Should succeed or return 400 if already exists
        assert invite_res.status_code in [200, 400]
