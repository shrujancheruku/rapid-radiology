from google import genai
from google.genai import types
from openai import OpenAI

from config import settings

OPENAI_MODEL = "gpt-5"
GEMINI_MODEL = "gemini-2.5-flash"


class OpenAIAdapter:
    name = "OpenAI"

    def __init__(self, api_key: str):
        self._client = OpenAI(api_key=api_key)

    def write_report(self, instructions: str, content: str) -> str:
        response = self._client.responses.create(
            model=OPENAI_MODEL,
            instructions=instructions,
            input=content,
            max_output_tokens=10000,
        )
        return response.output_text


class GeminiAdapter:
    name = "Gemini"

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    def write_report(self, instructions: str, content: str) -> str:
        response = self._client.models.generate_content(
            model=GEMINI_MODEL,
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction=instructions,
            ),
            contents=content,
        )
        return response.text


openai_adapter = OpenAIAdapter(settings.openai_api_key)
gemini_adapter = GeminiAdapter(settings.gemini_api_key)
