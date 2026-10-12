import pytest
import pytest_asyncio
import os
from app.database import engine, Base
from app.seed_data import seed_initial_database

@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_test_db():
    # Ensure all tables are created in the database before running tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial test data (projects, runs, artifacts, members)
    await seed_initial_database()
    yield
    
    # Teardown if needed
    await engine.dispose()
