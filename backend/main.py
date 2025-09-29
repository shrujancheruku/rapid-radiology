import os
from contextlib import asynccontextmanager
from typing import List

import jwt
from openai import OpenAI
from alembic import command
from alembic.config import Config
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, create_engine

from models import ReportTemplate, ReportType, ApiReportTemplate, GenerateReportResponse, GenerateReportRequest

# --- Config ---
ENV = os.getenv("ENV", "development")
if ENV == "production":
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # from your Supabase project settings
    DATABASE_URL = os.getenv("DATABASE_URL")  # Postgres connection string from Supabase
else:
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    DATABASE_URL = "sqlite:///test.db"

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

engine = create_engine(DATABASE_URL)


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
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience='authenticated')
        return payload["sub"]  # Supabase puts the user ID in `sub`
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# --- DB session ---
def get_session():
    with Session(engine) as session:
        yield session


def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


# --- Lifespan context ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    print("run alembic upgrade head...")
    run_migrations()
    yield
    print("Shutting down...")


# --- FastAPI App ---
app = FastAPI(
    title="Radiology Report Template API with Auth & Supabase",
    lifespan=lifespan,
)

origins = [
    "https://rapid-radiology-backend.onrender.com",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- CRUD Endpoints ---


@app.get("/health")
async def health():
    return {"status": "ok"}

# Create or update template (upsert behavior)
@app.post("/templates/", response_model=ApiReportTemplate)
def upsert_template(
        template: ApiReportTemplate,
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    # Check if the user already has a template for this report_type
    existing = session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == template.report_type,
        )
    ).first()

    if existing:
        # Update
        existing.template_text = template.template_text
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        template = ReportTemplate(user_id=user_id, report_type=template.report_type,
                                  template_text=template.template_text)
        session.add(template)
        session.commit()
        session.refresh(template)
        return template


# Read all templates for the current user

@app.get("/templates/", response_model=List[ApiReportTemplate])
def read_templates(
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    # Fetch all templates the user has created
    existing_templates = session.exec(
        select(ReportTemplate).where(ReportTemplate.user_id == user_id)
    ).all()

    # Build a full list (one entry per report type)
    results = [
        ApiReportTemplate(
            report_type=template.report_type,
            template_text=template.template_text,
        )
        for template in existing_templates
    ]
    return results


# Read a single template by a report type
@app.get("/templates/{report_type}", response_model=ApiReportTemplate)
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

    return ApiReportTemplate(
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


# --- Generate report endpoint ---
@app.post("/generate-report", response_model=GenerateReportResponse)
async def generate_report(
    req: GenerateReportRequest,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    template = session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == req.report_type,
        )
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if not template.template_text:
        raise HTTPException(status_code=404, detail="Template not found")

    # --- GPT prompt template ---
    prompt = f"""
    This GPT is designed to act as a radiology reporting assistant. 
    It helps radiologists efficiently generate structured, professional MRI and CT reports by integrating the user’s described imaging findings into pre-defined reporting templates. 
    Reports should contain only the 'Findings' section and omit the 'Impression' section. 
    Findings should be presented as concise structured lines in shorthand phrasing, styled like bullet points but without any bullet symbols. 
    Laterality should always be written out as 'left' and 'right' (not abbreviated). 
    When a comparison study is provided, the first sentence of the report must read: 'Comparison is made to previous imaging dated [date].' If no comparison information is given, the first sentence must default to: 'No previous imaging available for comparison.' 
    When the user provides normal reporting templates, the assistant should use these as the baseline structure. 
    It must preserve every line of the normal template and only replace or modify the relevant lines where abnormalities are present, while leaving the rest unchanged. 
    Normal statements must remain exactly as worded in the template unless replaced by an abnormality. For example, if the template reads 'No focal consolidation nor suspicious lung nodules' and the user states 'left lower lobe consolidation,' the assistant should output 'Left lower lobe consolidation. No suspicious lung nodules.' 
    The assistant must assimilate multiple abnormalities at once, placing each into the correct section of the template. 
    Output should always remain in plain text, with the full preserved template structure intact and no additional text before or after. 
    The assistant ensures correct medical terminology, structured format, and logical organization. It avoids guessing beyond the given information, but will fill in standard negative or normal statements where appropriate. If the findings are incomplete or ambiguous, it will make clear assumptions explicit. 
    It should always produce clear, concise, and clinically appropriate reports in line with radiology standards.

    The template is:
    {template.template_text}

    and the description is:
    {req.radiologist_input}
    """

    try:
        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt,
            # temperature=0.2,
            max_output_tokens=10000
        )
        # The Responses API returns structured output
        # Here we assume text is in response.output_text

        report_text = response.output_text

        return GenerateReportResponse(report_text=report_text)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

