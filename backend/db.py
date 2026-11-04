from alembic import command
from alembic.config import Config
from sqlmodel import Session, create_engine, select

from config import settings
from models import ReportTemplate, ReportType

engine = create_engine(settings.database_url)


def get_session():
    with Session(engine) as session:
        yield session


def run_migrations():
    command.upgrade(Config("alembic.ini"), "head")


def get_normal_template(
    session: Session, user_id: str, report_type: ReportType
) -> ReportTemplate | None:
    return session.exec(
        select(ReportTemplate).where(
            ReportTemplate.user_id == user_id,
            ReportTemplate.report_type == report_type,
        )
    ).first()
