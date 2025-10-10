import os
import time
from contextlib import asynccontextmanager
from typing import List

import jwt
from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from openai import OpenAI
from sqlmodel import Session, select, create_engine

from models import ReportTemplate, ReportType, ApiReportTemplate, GenerateReportResponse, GenerateReportRequest

load_dotenv()
ENV = os.getenv("ENV", "development")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
DATABASE_URL = os.getenv("DATABASE_URL")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

engine = create_engine(DATABASE_URL)


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
        return payload["sub"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_session():
    with Session(engine) as session:
        yield session


def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    if ENV == "development":
        print("run alembic upgrade head...")
        run_migrations()
    yield
    print("Shutting down...")


app = FastAPI(
    title="Radiology Report Template API with Auth & Supabase",
    lifespan=lifespan,
)

origins = [
    "https://rapid-radiology-frontend.onrender.com",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/templates", response_model=ApiReportTemplate)
def upsert_template(
        template: ApiReportTemplate,
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    try:

        existing = session.exec(
            select(ReportTemplate).where(
                ReportTemplate.user_id == user_id,
                ReportTemplate.report_type == template.report_type,
            )
        ).first()

        if existing:
            existing.template_text = template.template_text
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return ApiReportTemplate(
                report_type=existing.report_type,
                template_text=existing.template_text,
            )
        else:
            template = ReportTemplate(user_id=user_id, report_type=template.report_type,
                                      template_text=template.template_text)
            session.add(template)
            session.commit()
            session.refresh(template)
            return ApiReportTemplate(
                report_type=template.report_type,
                template_text=template.template_text,
            )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/templates", response_model=List[ApiReportTemplate])
def read_templates(
        user_id: str = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    existing_templates = session.exec(
        select(ReportTemplate).where(ReportTemplate.user_id == user_id)
    ).all()

    results = [
        ApiReportTemplate(
            report_type=template.report_type,
            template_text=template.template_text,
        )
        for template in existing_templates
    ]
    return results


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


INSTRUCTIONS = """
    You are acting as a radiology reporting assistant. 
    You help radiologists efficiently generate structured, professional MRI and CT reports by integrating the user’s described imaging findings into pre-defined normal report templates. 
    Reports should contain only the 'Findings' section and omit the 'Impression' section. 
    Findings should be presented as concise structured lines in shorthand phrasing, styled like bullet points but without any bullet symbols. 
    Laterality should always be written out as 'left' and 'right' (not abbreviated). 
    When a comparison study is provided with a date, the first sentence of the report must read: 'Comparison is made to previous imaging dated [date].' 
    If no comparison information is given or if no date is present, the first sentence MUST default to: 'No previous imaging available for comparison.'
    Either 'No previous imaging available for comparison or 'Comparison is made to previous imaging dated [date].' should be the first line of the report, with the date filled in if it's present in the radiologist's findings
    The assistant should use the normal report template as the baseline structure.
    The language the radiologist uses to describe their findings should not be altered in any way, it should only replace the correct part of the normal report template.
    You must preserve every line of the normal report template and only replace or modify the relevant lines where abnormalities are present, while leaving the rest unchanged.
    Do not change order of findings from the normal report template.
    Normal statements must remain exactly as worded in the normal report template unless replaced by an abnormality. For example, if the template reads 'No focal consolidation nor suspicious lung nodules' and the radiologist inputs 'Left lower lobe consolidation,' the report should read 'Left lower lobe consolidation. No suspicious lung nodules.' 
    The assistant must assimilate multiple abnormalities at once, placing each into the correct section of the template. 
    Output should always remain in plain text, with the full preserved template structure intact and no additional text before or after. 
    The assistant ensures correct medical terminology, structured format, and logical organization. It avoids guessing beyond the given information, but will fill in standard negative or normal statements where appropriate. If the findings are incomplete or ambiguous, it will make clear assumptions explicit. 
    You should always produce clear, concise, and clinically appropriate reports in line with radiology standards.
    
    Assume the following normal report template:
    
    The liver has a smooth contour.
    No focal liver lesions.
    Patent hepatic veins.
    Patent portal vein, superior mesenteric vein and splenic vein.
    The gallbladder is thin-walled.
    No radio-opaque gallstones.
    No biliary duct dilatation.
    Normal spleen, pancreas and adrenals.
    Normal kidneys and urinary bladder.
    Unremarkable small and large bowel.
    No enlarged abdominopelvic lymph nodes.
    No aggressive osseous lesions.
    
    If the radiologist inputs "inflammatory changes surrounding the appendix", the line "Unremarkable small and large bowel" should be changed to "Inflammatory changes surrounding the appendix. Unremarkable small bowel."
    If the radiologist inputs "periappendiceal fat stranding with small volume lymph nodes", the line "Unremarkable small and large bowel" should be changed to "Periappendiceal fat stranding with small volume lymph nodes. Unremarkable small bowel."
    If the radiologist inputs "inflammatory fat stranding and free fluid surrounding the appendix", the line "Unremarkable small and large bowel" should be changed to "Inflammatory fat stranding and free fluid surrounding the appendix. Unremarkable small bowel."
    """


@app.post("/generate-report", response_model=GenerateReportResponse)
def generate_report(
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

    content = f""""
    The normal report template we're using is:
    {template.template_text}

    and the described image findings input by the radiologist is:
    {req.radiologist_input}
    """

    try:
        start = time.perf_counter()
        response = client.responses.create(
            model="gpt-5",
            instructions=INSTRUCTIONS,
            input=content,
            # temperature=0,
            max_output_tokens=10000
        )
        request_time = time.perf_counter() - start
        print("OpenAI request completed in {0:.0f} seconds".format(request_time))

        report_text = response.output_text

        return GenerateReportResponse(report_text=report_text)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-report-gemini", response_model=GenerateReportResponse)
def generate_report_gemini(
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

    content = f""""
    The normal report template we're using is:
    {template.template_text}

    and the described image findings input by the radiologist is:
    {req.radiologist_input}
    """

    try:
        start = time.perf_counter()
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction=INSTRUCTIONS, ),
            contents=content
        )
        request_time = time.perf_counter() - start
        print("Gemini request completed in {0:.0f} seconds".format(request_time))
        report_text = response.text

        return GenerateReportResponse(report_text=report_text)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
