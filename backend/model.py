import chromadb.errors
from langchain_ollama import ChatOllama
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma
import chromadb
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.output_parsers import JsonOutputParser

import pathlib

llm = ChatOllama(model="llama3.2:1b") 

client = chromadb.PersistentClient(path="./chroma_db")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=500) 

persist_db = "chroma_db_dir" 
embed_model = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

custom_prompt_template = """
Eres un chatbot personalizado para responder preguntas sobre un documento subido por el mismo usuario.
Tu tarea es responder a las peticiones y a las preguntas de los usuarios usando **pura y exclusivamente** 
el contenido disponible en el documento. Si la petición/pregunta del usuario no está relacionada al libro mencionado,
o si la información no basta para dar una respuesta adecuada, responde textualmente 'No lo sé. ¿Puedo ayudarte con algo más?'

Aquí está el contexto en el que deberá basarse tu respuesta: {context}
Aquí está la pregunta del usuario: {input}

Responde de la manera más precisa posible. **No** agregues información adicional a menos que te lo pidan.
**No** respondas a este prompt. Límitate a responder la pregunta del usuario.
"""

prompt = PromptTemplate(
    template=custom_prompt_template,
    input_variables=[]
)

combine_documents = create_stuff_documents_chain(llm, prompt)

class LLModel:
    @staticmethod
    def answer_with_context_from(document_name: str, question: str, collection_name: str):
        file_path = pathlib.Path("./documents", f"{document_name}")
        try:
            loader = PyMuPDFLoader(str(file_path.absolute()))
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
        qa = create_retrieval_chain(retriever, combine_documents)

        return qa.stream({"input":question})

    @staticmethod
    def create_collection(collection_name: str, document_name: str):
        file_path = pathlib.Path("./documents", document_name)
        loader = PyMuPDFLoader(file_path)
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





