const API = "/api/transcriptions";
const recordButton = document.getElementById("recordButton");
const transcriptText = document.getElementById("transcriptText");
const message = document.getElementById("message");
const statusPill = document.getElementById("statusPill");
const recordTitle = document.getElementById("recordTitle");
const recordDescription = document.getElementById("recordDescription");
const wordCount = document.getElementById("wordCount");

let mediaRecorder = null;
let mediaStream = null;
let recording = false;
let chunkQueue = Promise.resolve();
let chunkNumber = 0;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "message error" : "message";
}
function updateWordCount() {
  const count = transcriptText.value.trim() ? transcriptText.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${count} ${count === 1 ? "word" : "words"}`;
}
transcriptText.addEventListener("input", updateWordCount);

function chooseMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return types.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showMessage("Your browser does not support microphone recording. Try the latest Chrome or Edge.", true);
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = chooseMimeType();
    mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    chunkQueue = Promise.resolve();
    chunkNumber = 0;
    recording = true;
    recordButton.classList.add("recording");
    recordButton.innerHTML = "■";
    recordButton.setAttribute("aria-label", "Stop recording");
    statusPill.textContent = "Recording";
    statusPill.classList.add("live");
    recordTitle.textContent = "Listening to you...";
    recordDescription.textContent = "Speak naturally. Your words will appear below.";
    showMessage("Recording started.");
    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        const currentChunk = ++chunkNumber;
        chunkQueue = chunkQueue.then(() => sendAudioChunk(event.data, currentChunk))
          .catch(error => showMessage(error.message, true));
      }
    };
    mediaRecorder.onerror = () => showMessage("A recording error occurred.", true);
    mediaRecorder.start(4000);
  } catch (error) {
    showMessage("Microphone permission was denied or the device is unavailable.", true);
    stopTracks();
  }
}

async function sendAudioChunk(blob, number) {
  const formData = new FormData();
  const extension = blob.type.includes("ogg") ? "ogg" : "webm";
  formData.append("file", blob, `speech-${number}.${extension}`);
  const response = await fetch(`${API}/transcribe`, { method: "POST", body: formData });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new Error(problem.error || problem.detail || `Transcription failed (${response.status})`);
  }
  const result = await response.json();
  if (result.text?.trim()) {
    const existing = transcriptText.value.trim();
    transcriptText.value = existing ? `${existing} ${result.text.trim()}` : result.text.trim();
    updateWordCount();
  }
}

async function stopRecording() {
  if (!mediaRecorder || !recording) return;
  recording = false;
  recordTitle.textContent = "Processing final audio...";
  recordDescription.textContent = "Please wait while the last audio chunk is transcribed.";
  statusPill.textContent = "Processing";
  mediaRecorder.stop();
  await new Promise(resolve => {
    mediaRecorder.addEventListener("stop", resolve, { once: true });
  });
  stopTracks();
  try {
    await chunkQueue;
    recordTitle.textContent = "Recording completed";
    recordDescription.textContent = "Review your transcript and save it to your history.";
    statusPill.textContent = "Completed";
    statusPill.classList.remove("live");
    showMessage("Recording completed. Review and save your transcript.");
  } catch (error) {
    showMessage(error.message, true);
  }
  recordButton.classList.remove("recording");
  recordButton.innerHTML = "●";
  recordButton.setAttribute("aria-label", "Start recording");
}

function stopTracks() {
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  mediaStream = null;
}

recordButton.addEventListener("click", () => recording ? stopRecording() : startRecording());

document.getElementById("clearButton").addEventListener("click", () => {
  transcriptText.value = "";
  updateWordCount();
  showMessage("Transcript cleared.");
});

document.getElementById("saveButton").addEventListener("click", async () => {
  const content = transcriptText.value.trim();
  if (!content) return showMessage("There is no transcript to save.", true);
  const title = `Transcription — ${new Date().toLocaleString()}`;
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) throw new Error("Could not save transcript.");
    const saved = await response.json();
    showMessage(`Transcript #${saved.id} saved successfully.`);
    await loadHistory();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById("searchInput").addEventListener("input", loadHistory);

async function loadHistory() {
  const search = document.getElementById("searchInput").value.trim();
  const url = search ? `${API}?search=${encodeURIComponent(search)}` : API;
  const container = document.getElementById("historyList");
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not load transcription history.");
    const records = await response.json();
    if (!records.length) {
      container.innerHTML = '<div class="empty-state">No saved transcripts yet. Record your first one above.</div>';
      return;
    }
    container.replaceChildren();
    records.forEach(record => container.appendChild(createHistoryItem(record)));
  } catch (error) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function createHistoryItem(record) {
  const article = document.createElement("article");
  article.className = "history-item";
  const top = document.createElement("div");
  top.className = "item-top";
  const title = document.createElement("h3");
  title.textContent = record.title;
  const date = document.createElement("span");
  date.className = "date";
  date.textContent = new Date(record.updatedAt).toLocaleString();
  top.append(title, date);

  const preview = document.createElement("p");
  preview.className = "preview";
  preview.textContent = record.content.length > 260 ? record.content.slice(0, 260) + "…" : record.content;

  const actions = document.createElement("div");
  actions.className = "item-actions";
  const edit = document.createElement("button");
  edit.className = "small-button";
  edit.textContent = "Edit";
  edit.addEventListener("click", () => editRecord(record));
  const remove = document.createElement("button");
  remove.className = "small-button delete";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => deleteRecord(record.id));
  actions.append(edit, remove);
  article.append(top, preview, actions);
  return article;
}

async function editRecord(record) {
  const newTitle = prompt("Edit transcription title:", record.title);
  if (newTitle === null) return;
  const newContent = prompt("Edit transcription text:", record.content);
  if (newContent === null) return;
  if (!newTitle.trim() || !newContent.trim()) return showMessage("Title and text cannot be empty.", true);
  try {
    const response = await fetch(`${API}/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() })
    });
    if (!response.ok) throw new Error("Could not update transcript.");
    showMessage("Transcript updated.");
    await loadHistory();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteRecord(id) {
  if (!confirm("Are you sure you want to delete this transcript?")) return;
  try {
    const response = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Could not delete transcript.");
    showMessage("Transcript deleted.");
    await loadHistory();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

loadHistory();
