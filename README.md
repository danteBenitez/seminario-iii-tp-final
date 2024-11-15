# Seminario de Actualización III: Modelos y aplicaciones de la IA

## TRABAJO PRÁCTICO FINAL - Implementación de sistema RAG usando LangChain y Ollama

### Como implementar el backend

> [!NOTE]
> Instalar previamente [ollama](https://ollama.com/) y ejecutarlo al finalizar

- Posterior a la instalación de ollama, instalar alguno de los modelos que contiene la página.

```bash
#por ejemplo, para instalar el modelo 3b de ollama, ejecutamos el siguiente comando
ollama pull llama3.2:3b

#así también podes instalar el modelo 1b
ollama pull llama3.2:1b
```

### Dentro de la carpeta nombre backend

- copiar el archivo .env.example a un nuevo archivo con el nombre .env y configurar las variables de entorno, a continuación dejamos de ejemplo su implementación.

```bash
# base de datos que guardará usuarios, documentos y mensajes
DATABASE_NAME=database.db 
# modelo a utilizar
LLM_MODEL_NAME=llama3.2:3b #o el que instales en el paso previo
# embed model
EMBED_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
# nombre de base de datos para chroma
CHROMA_DIR=chroma_db
```

- Luego realizar las siguientes acciones en línea de comandos para ejecutar el backend como tal.

```bash
# crear un entorno python
py -m venv env

# activar el entorno en windows
.\env\Scripts\activate 

# o en linux
source ./env/bin/activate

# instalar dependencias
pip install -r requirements.txt

# ejecutar el proyecto
fastapi dev

```

### Como implementar el frontend

- Copiar el archivo .env.example a un nuevo archivo con el nombre .env y configurar las variables de entorno, a continuación dejamos de ejemplo su implementación.

```bash
VITE_API_URL=http://localhost:8000
```

- Dentro de la carpeta frontend ejecutar:

```bash
npm install
npm run dev
```

- Luego ingresar al [link](http://localhost:5173)
