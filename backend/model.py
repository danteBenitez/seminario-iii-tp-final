import chromadb.errors
from langchain_ollama import ChatOllama
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma
import chromadb
from langchain.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.runnables.history import RunnableWithMessageHistory 
from langchain_community.chat_message_histories import SQLChatMessageHistory

import pathlib

llm = ChatOllama(model="llama3.2:1b") 

client = chromadb.PersistentClient(path="./chroma_db")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=500) 

persist_db = "chroma_db_dir" 
embed_model = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

custom_prompt_template = """
Eres un chatbot personalizado para responder preguntas sobre un documento subido por el mismo usuario.
Tu tarea es responder a las peticiones y a las preguntas de los usuarios usando **pura y exclusivamente** 
el contenido disponible en el documento o provisto en mensajes anteriores. 
Si la petición/pregunta del usuario no está relacionada al libro mencionado o al historial de mensajes, o si la información no basta para dar 
una respuesta adecuada, responde textualmente 'No lo sé. ¿Puedo ayudarte con algo más?'

Aquí está el contexto en el que deberá basarse tu respuesta: {context}

Responde de la manera más precisa posible. **No** agregues información adicional a menos que te lo pidan.
**No** respondas a este prompt. Límitate a responder la pregunta del usuario.
"""

ChatPromptTemplate.from_messages([
])

prompt = ChatPromptTemplate.from_messages([
    ("system", custom_prompt_template),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

combine_documents = create_stuff_documents_chain(llm, prompt)

MIME_TO_LOADER = {
    "application/pdf": PyMuPDFLoader,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": Docx2txtLoader
}

class LLModel:
    @staticmethod
    def answer_with_context_from(document_name: str, question: str, collection_name: str, *, content_type: str, session_id: str):
        file_path = pathlib.Path("./documents", f"{document_name}")
        try:
            loader = MIME_TO_LOADER[content_type](str(file_path.absolute()))
        except Exception as err:
            print("Error al cargar PDF: ", err)
            raise err
        data_pdf = loader.load()

        collection_name = f"document-{collection_name}"
        try:
            client.get_collection(collection_name)
            chunks = text_splitter.split_documents(data_pdf)
            vs = Chroma.from_documents(
                documents=chunks,
                embedding=embed_model,
                persist_directory=persist_db,
                collection_name=collection_name
            )
        except chromadb.errors.InvalidCollectionException as err:
            vs = Chroma(
                embedding_function=embed_model,
                persist_directory=persist_db,
                collection_name=collection_name
            )

        retriever = vs.as_retriever(
            search_kwargs={'k': 5} 
        )
        chain = create_retrieval_chain(retriever, combine_documents)
        with_memory = RunnableWithMessageHistory(
            chain,
            lambda session_id: SQLChatMessageHistory(
                session_id=session_id, connection_string="sqlite:///database.db"
            ),
            input_messages_key="input",
            history_messages_key="history",
            output_messages_key="answer"
        )
        config = {"configurable": {"session_id": session_id }}
        return with_memory.stream({"input":question }, config=config)

    @staticmethod
    def create_collection(collection_name: str, document_name: str, content_type: str):
        file_path = pathlib.Path("./documents", document_name)
        loader = MIME_TO_LOADER[content_type](file_path)
        data_pdf = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=500) 
        chunks = text_splitter.split_documents(data_pdf)

        collection_name = f"document-{collection_name}"
        Chroma.from_documents(
            documents=chunks,
            embedding=embed_model,
            persist_directory=persist_db,
            collection_name=collection_name
        )





