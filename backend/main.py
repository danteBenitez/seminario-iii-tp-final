from typing import Union, Annotated

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from validation.question_validation import Question
from model import LLModel
from db.chat_model import ChatMessage
from db.document_model import Document, DocumentPublic
from db.connection import create_db_and_tables, SessionDep
from sqlmodel import select
from random import randbytes

import pathlib

from json import dumps

USER_ID_LEN = 32

def on_startup():
    create_db_and_tables()


app = FastAPI(on_startup=[on_startup])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pathlib.Path('./documents').mkdir(exist_ok=True, parents=True)

def stream_response(stream, session):
    answer = ""
    for chunk in stream:
        dict = {}
        print(chunk)

        if "context" in chunk:
            dict["context"] = list(map(lambda c: { "page_content": c.page_content, "metadata": c.metadata }, chunk["context"]))
        if "answer" in chunk:
            dict["answer"] = str(chunk["answer"])
            answer += chunk["answer"]

        yield f"{dumps(dict)}\n"

    msg = ChatMessage(contents=answer, is_ai=True)
    session.add(msg)
    session.commit()

@app.get('/api/users/{user_id}/{document_id}/messages')
def get_messages(
    session: SessionDep,
    user_id: str,
    document_id: str
):
    msgs = session.exec(select(ChatMessage).join(Document).where(Document.user_id == user_id).where(Document.id == document_id)).all()
    return list(msgs)

@app.post('/api/upload', response_model=Union[DocumentPublic, dict])
async def upload_document(
    session: SessionDep,
    file: UploadFile,
    user_id: Annotated[str | None, Form()]
): 
    if not user_id or len(user_id) <= USER_ID_LEN:
        user_id = randbytes(USER_ID_LEN).hex()

    if file.content_type != "application/pdf":
        return {"message": "Tipo de archivo inválido"}

    doc = Document(file_path="", user_id=user_id, original_filename=file.filename)

    session.add(doc)
    session.commit()
    session.refresh(doc)

    full_path = pathlib.Path("./documents", str(doc.id))
    doc.file_path = str(full_path)


    with open(full_path, "wb") as f:
        f.write(await file.read())

    LLModel.create_collection(str(doc.id), str(doc.id))

    return doc

@app.get('/api/users/{user_id}/documents', response_model=list[DocumentPublic])
async def get_my_documents(
    session: SessionDep,
    user_id: str
):
    docs = session.exec(select(Document).where(Document.user_id==user_id))
    return docs

@app.post("/api/answer")
def answer(
    question: Question,
    session: SessionDep
):
    doc = session.exec(select(Document).where(Document.id == question.document_id)).one_or_none()

    if not doc:
        return {"message": "No existe el documento"}

    # FIXME: message creation
    msg = ChatMessage(contents=question.text, is_ai=False, document_id=question.document_id)
    session.add(msg)
    session.commit()
    session.refresh(msg)

    stream = LLModel.answer_with_context_from(str(doc.id), question.text, str(doc.id))
    return StreamingResponse(stream_response(stream, session), media_type="text/event-stream")
