import logging
import time
from typing import Protocol

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

import llm
from auth import get_current_user
from db import get_normal_template, get_session
from models import GenerateReportRequest, GenerateReportResponse
from prompt import INSTRUCTIONS, build_content

logger = logging.getLogger(__name__)

router = APIRouter()


class ModelAdapter(Protocol):
    name: str

    def write_report(self, instructions: str, content: str) -> str: ...


def generate_report(normal_template: str, findings: str, model: ModelAdapter) -> str:
    content = build_content(normal_template, findings)
    start = time.perf_counter()
    try:
        report = model.write_report(INSTRUCTIONS, content)
    except Exception:
        logger.exception("%s report generation failed", model.name)
        raise HTTPException(status_code=502, detail="Report generation failed")
    logger.info(
        "%s report generated in %.0f seconds", model.name, time.perf_counter() - start
    )
    return report


def _generate(
    req: GenerateReportRequest, user_id: str, session: Session, model: ModelAdapter
) -> GenerateReportResponse:
    normal_template = get_normal_template(session, user_id, req.report_type)
    if normal_template is None or not normal_template.template_text:
        raise HTTPException(status_code=404, detail="Normal Template not found")

    report = generate_report(
        normal_template.template_text, req.radiologist_input, model
    )
    return GenerateReportResponse(report_text=report)


@router.post("/generate-report", response_model=GenerateReportResponse)
def generate_report_openai(
    req: GenerateReportRequest,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return _generate(req, user_id, session, llm.openai_adapter)


@router.post("/generate-report-gemini", response_model=GenerateReportResponse)
def generate_report_gemini(
    req: GenerateReportRequest,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return _generate(req, user_id, session, llm.gemini_adapter)
