# --- ENUM for Radiology Report Types ---
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, UniqueConstraint

class ReportType(str, Enum):
    CT_CHEST = "CT Chest"
    CT_ABDOMEN_PELVIS = "CT Abdomen and Pelvis"
    CT_CHEST_ABDOMEN_PELVIS = "CT Chest, Abdomen, and Pelvis"
    CT_URINARY_TRACT = "CT Urinary Tract"
    MRI_BRACHIAL_PLEXUS = "MRI Brachial Plexus"
    MRI_HEAD = "MRI Head"
    MRI_HAND ="MRI Hand"
    MRI_WRIST = "MRI Wrist"
    MRI_ELBOW = "MRI Elbow"
    MRI_ANKLE = "MRI Ankle"
    MRI_FOOT = "MRI Foot"
    MRI_SACROILIAC_JOINTS = "MRI Sacroiliac Joints"
    MRI_LEFT_HIP = "MRI Left Hip"
    MRI_RIGHT_HIP = "MRI Right Hip"
    MRI_KNEE = "MRI Knee"
    MRI_SHOULDER = "MRI Shoulder"
    MRI_CERVICAL_SPINE = "MRI Cervical Spine"
    MRI_THORACIC_SPINE = "MRI Thoracic Spine"
    MRI_LUMBAR_SPINE = "MRI Lumbar Spine"
    MRI_COCCYX = "MRI Coccyx"


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

