# --- ENUM for Radiology Report Types ---
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, UniqueConstraint


class ReportType(str, Enum):
    chest_ct = "Chest CT"
    abdomen_ct = "Abdomen CT"
    foot_mri = "Foot MRI"
    shoulder_mri = "Shoulder MRI"


# --- Database Model ---
class ReportTemplate(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "report_type"),)  # enforce one per type per user

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Supabase Auth UUID
    report_type: ReportType
    template_text: str


# Response schema (doesn't expose user_id)
class ReportTemplateResponse(SQLModel):
    report_type: ReportType
    template_text: Optional[str]
