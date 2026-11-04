from fastapi.testclient import TestClient

from auth import get_current_user
from main import app
from models import ReportTemplate, ReportType
from tests.conftest import USER_ID

NORMAL_TEMPLATE = "No focal consolidation nor suspicious lung nodules."
FINDINGS = "Left lower lobe consolidation"
REQUEST = {"report_type": ReportType.CT_CHEST.value, "radiologist_input": FINDINGS}


def add_normal_template(session):
    session.add(
        ReportTemplate(
            user_id=USER_ID,
            report_type=ReportType.CT_CHEST,
            template_text=NORMAL_TEMPLATE,
        )
    )
    session.commit()


def test_generate_report_openai(client, session, openai_stub):
    add_normal_template(session)

    res = client.post("/generate-report", json=REQUEST)

    assert res.status_code == 200
    assert res.json() == {"report_text": "OpenAI Report"}
    [(_, content)] = openai_stub.calls
    assert NORMAL_TEMPLATE in content
    assert FINDINGS in content


def test_generate_report_gemini(client, session, gemini_stub):
    add_normal_template(session)

    res = client.post("/generate-report-gemini", json=REQUEST)

    assert res.status_code == 200
    assert res.json() == {"report_text": "Gemini Report"}
    [(_, content)] = gemini_stub.calls
    assert NORMAL_TEMPLATE in content
    assert FINDINGS in content


def test_generate_report_without_normal_template(client, openai_stub):
    res = client.post("/generate-report", json=REQUEST)

    assert res.status_code == 404
    assert res.json() == {"detail": "Normal Template not found"}
    assert openai_stub.calls == []


def test_generate_report_model_failure(client, session, openai_stub):
    add_normal_template(session)
    openai_stub.error = RuntimeError("provider down")

    res = client.post("/generate-report", json=REQUEST)

    assert res.status_code == 502
    assert res.json() == {"detail": "Report generation failed"}


def test_requires_token(session):
    app.dependency_overrides.pop(get_current_user, None)
    client = TestClient(app)

    res = client.get("/templates")

    assert res.status_code == 401
    assert res.json() == {"detail": "Not authenticated"}


def test_save_template_creates_then_updates(client):
    first = {"report_type": ReportType.CT_CHEST.value, "template_text": "v1"}
    second = {"report_type": ReportType.CT_CHEST.value, "template_text": "v2"}

    assert client.post("/templates", json=first).json() == first
    assert client.post("/templates", json=second).json() == second
    assert client.get("/templates").json() == [second]
