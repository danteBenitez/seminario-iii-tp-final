from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from validation.question_validation import Question
from model import qa
from db.chat_model import ChatMessage
from db.connection import create_db_and_tables, SessionDep
from sqlmodel import select

from json import dumps

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

@app.get('/api/messages')
def get_messages(
    session: SessionDep
):
    msgs = session.exec(select(ChatMessage)).all()
    return list(msgs)

@app.post("/api/answer")
def answer(
    question: Question,
    session: SessionDep
):
    msg = ChatMessage(contents=question.text, is_ai=False)
    session.add(msg)
    stream = qa.stream({"input": question.text})
    return StreamingResponse(stream_response(stream, session), media_type="text/event-stream")
