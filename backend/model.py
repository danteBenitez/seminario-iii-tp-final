from langchain_ollama import ChatOllama
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.output_parsers import JsonOutputParser

import os

llm = ChatOllama(model="llama3.2:1b") # Modelo de lenguaje

file_path = "clean-code.pdf" # Ruta del archivo PDF


persist_db = "chroma_db_dir" # Directorio donde se guardará la información
collection_db = "chroma_collection" # Nombre de la colección
try:
    open(persist_db)
except Exception:
    loader = PyMuPDFLoader(file_path)

    data_pdf = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=500) # Tamaño de los chunks y el overlap (superposición de los chunks)

    chunks = text_splitter.split_documents(data_pdf)

    embed_model = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vs = Chroma.from_documents(
        documents=chunks,
        embedding=embed_model,
        persist_directory=persist_db,
        collection_name=collection_db
    )

vectorstore = Chroma(
    embedding_function=embed_model,
    persist_directory=persist_db,
    collection_name=collection_db
)

retriever = vectorstore.as_retriever(
    search_kwargs={'k': 5} # Cantidad de chunks a retornar
)

custom_prompt_template = """
Eres un chatbot personalizado para responder preguntas sobre el libro 'Clean Code' de Robert C. Martin.
Tu tarea es responder a las peticiones y a las preguntas de los usuarios usando **pura y exclusivamente** 
el contenido disponible en el libro. Si la petición/pregunta del usuario no está relacionada al libro mencionado,
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

qa = create_retrieval_chain(retriever, combine_documents)

