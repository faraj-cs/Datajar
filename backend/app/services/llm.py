from __future__ import annotations

from typing import List, Dict
import httpx
from openai import OpenAI

from backend.app.core.config import settings


def _format_messages(history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    result: List[Dict[str, str]] = []
    for m in history:
        result.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    return result


async def chat_complete(history: List[Dict[str, str]]) -> str:
    if settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key)
        messages = _format_messages(history)
        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": "You are a helpful, concise assistant."})
        try:
            resp = client.chat.completions.create(model=settings.openai_model, messages=messages, temperature=0.2)
            return resp.choices[0].message.content or ""
        except Exception as exc:
            return f"[LLM error: {exc}]"

    # Simple fallback
    last_user = next((m["content"] for m in reversed(history) if m.get("role") == "user"), "")
    return f"You said: {last_user}"

