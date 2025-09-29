# --- ENUM for Radiology Report Types ---
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, UniqueConstraint

class ReportType(str, Enum):
    CHEST_CT = "Chest CT"
    ABDOMEN_CT = "Abdomen CT"
    FOOT_MRI = "Foot MRI"
    SHOULDER_MRI = "Shoulder MRI"


# --- Database Model ---
class ReportTemplate(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "report_type"),)  # enforce one per type per user

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Supabase Auth UUID
    report_type: ReportType
    template_text: str


# Response schema (doesn't expose user_id)
class ApiReportTemplate(SQLModel):
    report_type: ReportType
    template_text: Optional[str]

class GenerateReportRequest(SQLModel):
    report_type: ReportType
    radiologist_input: str

class GenerateReportResponse(SQLModel):
    report_text: str

