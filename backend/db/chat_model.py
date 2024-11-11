from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

class ChatMessage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    contents: str = Field(index=True)
    is_ai: bool = Field(default=False)
    document_id: str | None = Field(index=True)
