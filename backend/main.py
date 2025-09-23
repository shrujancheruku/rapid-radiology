import os
from contextlib import asynccontextmanager
from typing import List

import jwt
from fastapi import FastAPI, HTTPException, Depends, Header
from sqlmodel import SQLModel, Session, select, create_engine

from models import ReportTemplate, ReportType, ReportTemplateResponse

# --- Config ---
ENV = os.getenv("ENV", "development")
if ENV == "production":
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # from your Supabase project settings
    DATABASE_URL = os.getenv("DATABASE_URL")  # Postgres connection string from Supabase
else:
    SUPABASE_JWT_SECRET = ""
    DATABASE_URL = "sqlite:///test.db"

engine = create_engine(DATABASE_URL, echo=True)


# --- Auth Dependency ---
def get_current_user(authorization: str = Header(...)) -> str:
    """
    Extract and validate JWT issued by Supabase Auth.
    Returns user_id (UUID).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]  # Supabase puts the user ID in `sub`
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# --- DB session ---
def get_session():
    with Session(engine) as session:
        yield session


# --- Lifespan context ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    SQLModel.metadata.create_all(engine)
    yield
    # Shutdown (nothing special to clean up here)


# --- FastAPI App ---
app = FastAPI(
    title="Radiology Report Template API with Auth & Supabase",
    lifespan=lifespan,
)


# --- CRUD Endpoints ---

# Create or update template (upsert behavior)
@app.post("/templates/", response_model=ReportTemplate)
def create_template(
        report_type: ReportType,
        template_text: str,
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    # Check if the user already has a template for this report_type
    existing = session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == report_type,
        )
    ).first()

    if existing:
        # Update
        existing.template_text = template_text
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        template = ReportTemplate(user_id=user_id, report_type=report_type, template_text=template_text)
        session.add(template)
        session.commit()
        session.refresh(template)
        return template


# Read all templates for the current user

@app.get("/templates/", response_model=List[ReportTemplateResponse])
def read_templates(
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    # Fetch all templates the user has created
    existing_templates = session.exec(
        select(ReportTemplate).where(ReportTemplate.user_id == user_id)
    ).all()
    existing_map = {t.report_type: t.template_text for t in existing_templates}

    # Build a full list (one entry per report type)
    results = [
        ReportTemplateResponse(
            report_type=rt,
            template_text=existing_map.get(rt)  # None if not set
        )
        for rt in ReportType
    ]
    return results


# Read a single template by a report type
@app.get("/templates/{report_type}", response_model=ReportTemplateResponse)
def read_template(
        report_type: ReportType,
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    template = session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == report_type,
        )
    ).first()

    return ReportTemplateResponse(
        report_type=report_type,
        template_text=template.template_text if template else None
    )


# Delete template
@app.delete("/templates/{report_type}")
def delete_template(
        report_type: ReportType,
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    template = session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == report_type,
        )
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    session.delete(template)
    session.commit()
    return {"ok": True, "message": f"{report_type} template deleted"}
