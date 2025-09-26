import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client: OpenAI | None = None

def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        _client = OpenAI(api_key=api_key)
    return _client
