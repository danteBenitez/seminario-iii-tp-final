from pydantic import BaseModel

class Question(BaseModel):
    text: str
    document_id: str
