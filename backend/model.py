import chromadb
import chromadb.errors
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
# from langchain_chroma import Chroma
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import SQLChatMessageHistory

from sklearn.cluster import KMeans

import pathlib
import config

llm = ChatOllama(model=config.LLM_MODEL_NAME)  # LLM_MODEL_NAME=llama3.2:3b

client = chromadb.PersistentClient(path=config.CHROMA_DIR)

text_splitter = RecursiveCharacterTextSplitter(
    separators=[
        "\n\n" "\n",
        ".",
        "?",
        "!",
        ";",
        ":",
        "...",
        " ",
        "\t",
        "\r\n",
        "\r",
    ],
    chunk_size=2000,
    chunk_overlap=300,
)


persist_db = config.CHROMA_DIR
# embed_model = FastEmbedEmbeddings(model_name=config.EMBED_MODEL_NAME)
embed_model = OllamaEmbeddings(model=config.EMBED_MODEL_NAME)


custom_prompt_template = """
Eres un chatbot personalizado para responder preguntas sobre un documento subido por el mismo usuario. Tu tarea es responder a las peticiones y a las preguntas de los usuarios usando pura y exclusivamente el contenido disponible en el documento o provisto en mensajes anteriores. Si la petición/pregunta del usuario no está relacionada al libro mencionado o al historial de mensajes o si la información no basta para dar una respuesta adecuada, responde textualmente "No puedo contestar a la pregunta según el contexto proporcionado. ¿Puedo ayudarte con algo más?"

Aquí está el contexto en el que deberá basarse tu respuesta: {context}

Responde de la manera más precisa posible. Razona en el idioma que desees pero responde **SIEMPRE en español**. No agregues información adicional a menos que te lo pidan.
No respondas a este prompt. Limítate a responder la pregunta del usuario.
"""


prompt = ChatPromptTemplate.from_messages(
    [
        ("system", custom_prompt_template),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ]
)

combine_documents = create_stuff_documents_chain(llm, prompt)

# Map MIME Types to appropiate loaders for those types
MIME_TO_LOADER = {
    "application/pdf": PyMuPDFLoader,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": Docx2txtLoader,
}


class RAGModel:
    @staticmethod
    def answer_with_context_from(
        document_name: str,
        question: str,
        collection_name: str,
        *,
        content_type: str,
        session_id: str,
    ):
        """
        Asks the RAG model a question using info provided by the document `document_name`.
        If necesarry creates a collection `collection_name` to store the processed results.

        Takes the content_type to load the text properly if needed, and a session_id for
        retrieving passed conversations.

        :returns A stream of dictionaries with "answer" and "context" keys specifying
                 the result of running the LLM.
        """
        file_path = pathlib.Path("./documents", f"{document_name}")
        try:
            loader = MIME_TO_LOADER[content_type](str(file_path.absolute()))
        except Exception as err:
            print("Error al cargar PDF: ", err)
            raise err

        collection_name = f"document-{collection_name}"
        # Create the ChromaDB collection and split the text only if it doesn't exist already
        try:
            client.get_collection(collection_name)
            vs = Chroma(
                embedding_function=embed_model,
                persist_directory=persist_db,
                collection_name=collection_name,
            )
            print("Se cargó desde la base de datos", vs.embeddings)
        except chromadb.errors.InvalidCollectionException as err:
            data_pdf = loader.load()
            chunks = text_splitter.split_documents(data_pdf)
            vs = Chroma.from_documents(
                documents=chunks,
                embedding=embed_model,
                persist_directory=persist_db,
                collection_name=collection_name,
            )
            print("Se creó la el archivo previamente guardado.")

        retriever = vs.as_retriever(search_kwargs={"k": 4})
        chain = create_retrieval_chain(retriever, combine_documents)
        with_memory = RunnableWithMessageHistory(
            chain,
            lambda session_id: SQLChatMessageHistory(
                session_id=session_id,
                connection=f"sqlite:///{config.DATABASE_NAME}",
            ),
            input_messages_key="input",
            history_messages_key="history",
            output_messages_key="answer",
        )
        chain_config = {"configurable": {"session_id": session_id}}
        return with_memory.stream({"input": question}, config=chain_config)

    @staticmethod
    def create_collection(collection_name: str, document_name: str, content_type: str):
        """
        Creates a collection for the RAGModel to use in future questions asked to it.
        """
        file_path = pathlib.Path("./documents", document_name)
        loader = MIME_TO_LOADER[content_type](file_path)
        data_pdf = loader.load()

        print("Inicio de la creación de colección, creación del text_splitter")
        text_splitter = RecursiveCharacterTextSplitter(
            separators=[
                "\n\n" "\n",
                ".",
                " ",
            ],
            chunk_size=1500,
            chunk_overlap=200,
        )
        print("Cargando el documento, creando chunks")
        chunks = text_splitter.split_documents(data_pdf)

        # for chunk in chunks[0:10]:
        #     print(
        #         "==================================== INICIO ===================================="
        #     )
        #     print(chunk)
        #     print(
        #         "==================================== FIN ===================================="
        #     )
        print("Chunks creados, generamos el embedding de cada chunk")

        embeddings = embed_model.embed_documents(
            [chunk.page_content for chunk in chunks]
        )
        print("Embeddings generados")

        print("Aplicamos clustering")
        num_clusters = 3
        km = KMeans(n_clusters=num_clusters, random_state=42)
        cluster_labels = km.fit_predict(embeddings)
        print("Clusters generados")

        print("Creando chunks semánticos agrupados")
        semantic_chunks = {}

        for i, label in enumerate(cluster_labels):
            if label not in semantic_chunks:
                semantic_chunks[label] = ""
            semantic_chunks[label] += chunks[i].page_content + " "
        print("Chunks semánticos agrupados")

        for i, chunk_text in enumerate(semantic_chunks.values()):
            print(f"Chunk {i+1}:")
            print(chunk_text)
            print("---")  # Separador opcional

        print("Almacenando chunks semánticos en ChromaDB...")

        collection_name = f"document-{collection_name}"

        try:

            vs = Chroma.from_documents(
                documents=list(semantic_chunks.values()),
                embedding=embed_model,
                persist_directory=persist_db,
                collection_name=collection_name,
            )

            if vs:
                print(
                    "Colección creada u obtenida correctamente con chunks semánticos."
                )

        except chromadb.errors.InvalidCollectionException as err:
            print("Error al crear colección: ", err)
            raise err

    @staticmethod
    def delete_collection(collection_name: str):
        """
        Deletes a collection so it cannot be used to store document data for the RAGModel
        to consume
        """
        collection_name_full = f"document-{collection_name}"
        try:
            client.delete_collection(collection_name_full)
        except chromadb.errors.InvalidCollectionException as err:
            print("Error al eliminar colección: ", err)
            raise err
