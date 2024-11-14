import os
from dotenv import load_dotenv

load_dotenv()

print("Loading config...")

DATABASE_NAME = os.getenv("DATABASE_NAME", "database.db")
print(f"DATABASE_NAME = {DATABASE_NAME}")
LLM_MODEL_NAME= os.getenv("LLM_MODEL_NAME", "llama3.2:1b")
print(f"LLM_MODEL_NAME = {LLM_MODEL_NAME}")

EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
print(f"LLM_MODEL_NAME = {EMBED_MODEL_NAME}")

CHROMA_DIR = os.getenv("CHROMA_DIR", "chroma_db")
print(f"CHROMA_DIR = {CHROMA_DIR}")
