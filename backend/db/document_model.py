from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select, Relationship

class DocumentBase(SQLModel, table=False):
    id: int | None = Field(default=None, primary_key=True)
    original_filename: str = Field()
    user_id: str = Field()

class Document(DocumentBase, table=True):
    file_path: str = Field(index=True)
    original_filename: str = Field()
    mime_type: str = Field()

    messages: list["ChatMessage"] = Relationship()

class DocumentPublic(DocumentBase):
    pass 
