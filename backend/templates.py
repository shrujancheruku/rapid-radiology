from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import get_current_user
from db import get_normal_template, get_session
from models import ApiReportTemplate, ReportTemplate, ReportType

router = APIRouter(prefix="/templates")


@router.post("", response_model=ApiReportTemplate)
def upsert_template(
    template: ApiReportTemplate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    normal_template = get_normal_template(session, user_id, template.report_type)
    if normal_template is None:
        normal_template = ReportTemplate(
            user_id=user_id, report_type=template.report_type
        )
    normal_template.template_text = template.template_text

    session.add(normal_template)
    session.commit()
    session.refresh(normal_template)
    return ApiReportTemplate(
        report_type=normal_template.report_type,
        template_text=normal_template.template_text,
    )


@router.get("", response_model=list[ApiReportTemplate])
def read_templates(
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    normal_templates = session.exec(
        select(ReportTemplate).where(ReportTemplate.user_id == user_id)
    ).all()
    return [
        ApiReportTemplate(report_type=t.report_type, template_text=t.template_text)
        for t in normal_templates
    ]


@router.get("/{report_type}", response_model=ApiReportTemplate)
def read_template(
    report_type: ReportType,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    normal_template = get_normal_template(session, user_id, report_type)
    return ApiReportTemplate(
        report_type=report_type,
        template_text=normal_template.template_text if normal_template else None,
    )


@router.delete("/{report_type}")
def delete_template(
    report_type: ReportType,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    normal_template = get_normal_template(session, user_id, report_type)
    if normal_template is None:
        raise HTTPException(status_code=404, detail="Normal Template not found")
    session.delete(normal_template)
    session.commit()
    return {"ok": True, "message": f"{report_type.value} template deleted"}
