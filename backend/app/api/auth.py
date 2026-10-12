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
            institution="REPROVIA LABS / Open Science"
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

class InviteMemberRequest(BaseModel):
    name: str
    email: str
    role: str = "RESEARCHER"
    institution: str = "CERN / Reprovia Open Science"

@router.get("/members")
async def list_members(db: AsyncSession = Depends(get_db)):
    """Lists organization and project members with their assigned RBAC roles."""
    users = (await db.execute(select(User).order_by(User.created_at.asc()))).scalars().all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "team": u.institution,
            "joined": u.created_at.strftime("%Y-%m-%d")
        }
        for u in users
    ]

@router.post("/members")
async def invite_member(req: InviteMemberRequest, db: AsyncSession = Depends(get_db)):
    """Invites and provisions a new researcher in the organization."""
    # Check if already exists
    existing = (await db.execute(select(User).where(User.email == req.email))).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    try:
        role_enum = RoleEnum(req.role.upper())
    except ValueError:
        role_enum = RoleEnum.RESEARCHER

    import uuid
    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        email=req.email,
        name=req.name,
        role=role_enum,
        institution=req.institution
    )
    db.add(new_user)
    await db.commit()

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role.value,
        "team": new_user.institution,
        "joined": new_user.created_at.strftime("%Y-%m-%d")
    }

