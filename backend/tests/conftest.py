import os

os.environ.update(
    DATABASE_URL="sqlite://",
    SUPABASE_JWT_SECRET="test-secret",
    OPENAI_API_KEY="test-openai-key",
    GEMINI_API_KEY="test-gemini-key",
    ENV="test",
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine  # noqa: E402

import llm  # noqa: E402
from auth import get_current_user  # noqa: E402
from db import get_session  # noqa: E402
from main import app  # noqa: E402

USER_ID = "00000000-0000-0000-0000-000000000001"


class StubAdapter:
    def __init__(self, name: str, report: str = "", error: Exception | None = None):
        self.name = name
        self.report = report
        self.error = error
        self.calls: list[tuple[str, str]] = []

    def write_report(self, instructions: str, content: str) -> str:
        self.calls.append((instructions, content))
        if self.error:
            raise self.error
        return self.report


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(session):
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: USER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def openai_stub(monkeypatch):
    stub = StubAdapter("OpenAI", report="OpenAI Report")
    monkeypatch.setattr(llm, "openai_adapter", stub)
    return stub


@pytest.fixture
def gemini_stub(monkeypatch):
    stub = StubAdapter("Gemini", report="Gemini Report")
    monkeypatch.setattr(llm, "gemini_adapter", stub)
    return stub
