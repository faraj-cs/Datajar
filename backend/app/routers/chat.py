from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict

from backend.app.db.session import get_db
from backend.app.models.chat import ChatSession, ChatMessage
from backend.app.schemas.chat import SessionCreate, SessionRead, MessageCreate, MessageRead, SessionWithMessages
from backend.app.services.llm import chat_complete


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=SessionRead)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session = ChatSession(title=payload.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=SessionWithMessages)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.messages.sort(key=lambda m: m.created_at)
    return session


@router.post("/sessions/{session_id}/message", response_model=MessageRead)
async def post_message(session_id: str, payload: MessageCreate, db: Session = Depends(get_db)):
    chat_session = db.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = ChatMessage(session_id=session_id, role=payload.role, content=payload.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    ]
    assistant_text = await chat_complete(history)
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


@router.post("/log-analyze")
async def log_analyze(file: UploadFile = File(...)):
    raw = await file.read()
    text = raw.decode(errors="ignore")
    lines = text.splitlines()
    flagged: List[str] = []
    for i, line in enumerate(lines, start=1):
        lower = line.lower()
        if any(k in lower for k in ["error", "warn", "exception", "fail"]):
            flagged.append(f"L{i}: {line}")
        if len(flagged) >= 200:
            break

    summary_prompt = (
        "You are a log analysis assistant. Given the flagged log lines below, extract the likely root causes and propose concise, actionable next steps. Output bullet points under 'Findings' and 'Fixes'."
    )
    history = [
        {"role": "system", "content": summary_prompt},
        {"role": "user", "content": "\n".join(flagged) or "No flagged lines."},
    ]
    analysis = await chat_complete(history)
    return {"flagged": flagged, "analysis": analysis}

