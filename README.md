# Procucev AI Tech Hiring Assignment — Speech to Text

A multilingual speech-to-text web application using:
- Java 17 + Spring Boot 3.3 (REST API and persistence)
- PostgreSQL
- Python + FastAPI + Faster-Whisper (open-source speech recognition)
- HTML, CSS and JavaScript (MediaRecorder browser API)
- Docker Compose

## Features
- Record audio from the browser microphone.
- Upload short audio chunks to Faster-Whisper and display incremental transcript text.
- Supports multilingual recognition, including Hindi and English (`language=auto`).
- Save completed transcripts to PostgreSQL.
- View, search, edit and delete transcription history.

> This is chunk-based incremental transcription, not word-level streaming. Each audio chunk is independently decoded, so a word at a chunk boundary may occasionally be missed or repeated. For a production-grade streaming system, add overlap/context reconciliation or use a streaming ASR engine.

## Requirements
- Docker Desktop with Docker Compose (recommended), OR:
  - Java 17+
  - Maven 3.9+
  - Python 3.10+
  - PostgreSQL 14+
- Microphone permission in a modern browser.
- Internet access on first AI service startup to download the Whisper model.

## Run with Docker Compose
From the project root:

```bash
docker compose up --build
```

Open: http://localhost:8080

The first startup downloads the Faster-Whisper `small` model and can take a few minutes. CPU inference may be slow; set `WHISPER_MODEL=base` for a faster/lighter setup or `small` for better accuracy.

Stop services:

```bash
docker compose down
```

Delete database data too:

```bash
docker compose down -v
```

## Run without Docker

### 1. Start PostgreSQL
Create a database named `speechdb`, then set these environment variables if your local credentials differ:

```text
DB_URL=jdbc:postgresql://localhost:5432/speechdb
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

### 2. Start the Python speech service
```bash
cd speech-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

### 3. Start Spring Boot
In another terminal, from the project root:

```bash
mvn spring-boot:run
```

Open http://localhost:8080

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/transcriptions/transcribe` | Transcribe an uploaded audio chunk |
| POST | `/api/transcriptions` | Save a transcript |
| GET | `/api/transcriptions` | List/search saved transcripts |
| GET | `/api/transcriptions/{id}` | Get one transcript |
| PUT | `/api/transcriptions/{id}` | Update title/text |
| DELETE | `/api/transcriptions/{id}` | Delete transcript |

Python speech service:
- `GET http://localhost:8001/health`
- `POST http://localhost:8001/transcribe` (multipart field: `file`)

## Configuration
Spring Boot reads:
- `DB_URL` (default `jdbc:postgresql://localhost:5432/speechdb`)
- `DB_USERNAME` (default `postgres`)
- `DB_PASSWORD` (default `postgres`)
- `SPEECH_SERVICE_URL` (default `http://localhost:8001`)

Python reads:
- `WHISPER_MODEL` (default `small`)
- `WHISPER_DEVICE` (default `cpu`)
- `WHISPER_COMPUTE_TYPE` (default `int8`)

## GitHub upload
Create an empty GitHub repository, then from this folder:

```bash
git init
git add .
git commit -m "Initial speech to text application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/procucev-speech-to-text.git
git push -u origin main
```

Do not commit passwords, API keys, `.env` files, database data, or model files.

## Deployment notes
The included Compose setup is suitable for a Docker-capable host. For cloud deployment, deploy all three services (web/backend, speech service, PostgreSQL) on a platform that supports persistent services and Docker networking. Configure `SPEECH_SERVICE_URL` to the internal URL of the speech service and use a managed PostgreSQL database. Do not expose PostgreSQL publicly.
