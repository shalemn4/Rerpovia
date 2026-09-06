from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.auth import User, Organization, Project, Membership, RoleEnum

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    institution: str

class SwitchOrgRequest(BaseModel):
    org_id: str

@router.get("/me")
async def get_current_user(db: AsyncSession = Depends(get_db)):
    """Returns currently authenticated researcher profile and organizations."""
    stmt = select(User).limit(1)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        # Create default demo researcher
        user = User(
            id="usr-cern-001",
            email="h.vance@cern.ch",
            name="Dr. Helena Vance",
            role=RoleEnum.OWNER,
            institution="CERN EP-SFT / Reprovia"
        )
        db.add(user)
        
        org = Organization(
            id="org-cern-atlas",
            name="CERN Large Hadron Collider",
            slug="cern-lhc"
        )
        db.add(org)

        proj = Project(
            id="proj-particle-physics",
            org_id=org.id,
            name="Particle Resonance Investigation",
            slug="particle-resonance",
            description="High precision invariant mass reconstruction on ATLAS collision open data."
        )
        db.add(proj)

        membership = Membership(
            id="mem-001",
            user_id=user.id,
            org_id=org.id,
            role=RoleEnum.OWNER
        )
        db.add(membership)
        await db.commit()

    # Fetch projects and orgs
    org_stmt = select(Organization)
    orgs = (await db.execute(org_stmt)).scalars().all()

    proj_stmt = select(Project)
    projects = (await db.execute(proj_stmt)).scalars().all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "institution": user.institution
        },
        "organizations": [{"id": o.id, "name": o.name, "slug": o.slug} for o in orgs],
        "projects": [{"id": p.id, "name": p.name, "slug": p.slug, "org_id": p.org_id, "description": p.description} for p in projects],
        "active_project_id": projects[0].id if projects else None
    }

@router.get("/roles")
async def get_roles():
    """Exposes RBAC roles and permissions."""
    return {
        "roles": [
            {
                "role": "OWNER",
                "description": "Full administrative control, cluster execution, secrets, and member management.",
                "permissions": ["all"]
            },
            {
                "role": "RESEARCHER",
                "description": "Can create, execute, reproduce workflows and publish datasets.",
                "permissions": ["workflow:create", "workflow:run", "run:reproduce", "dataset:upload"]
            },
            {
                "role": "DEVELOPER",
                "description": "Can build workflows and configure container environments.",
                "permissions": ["workflow:create", "workflow:edit", "env:configure"]
            },
            {
                "role": "VIEWER",
                "description": "Read-only access to published workflows, results, and provenance records.",
                "permissions": ["read"]
            }
        ]
    }
