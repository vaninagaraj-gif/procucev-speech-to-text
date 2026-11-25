import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

app = FastAPI(title="Faster-Whisper Speech Service", version="1.0.0")

MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# Load once when the service starts, not for every audio request.
model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)


@app.get("/health")
def health():
    return {"status": "UP", "model": MODEL_NAME, "device": DEVICE}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Audio filename is required")

    suffix = Path(file.filename).suffix or ".webm"
    temp_path = None
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio file exceeds 20 MB")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(contents)
            temp_path = temp.name

        segments, info = model.transcribe(
            temp_path,
            language=None,          # Automatically detect language per chunk
            task="transcribe",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return {"text": text, "language": info.language}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not transcribe audio: {exc}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
