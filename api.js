const API_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const submitButton = document.getElementById("submit-btn");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Reusable function for sending HTTP requests.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    const data = await response.json();

    return {
        data,
        status: response.status
    };
}

function renderNote(note) {
    const item = document.createElement("li");
    item.className = "note";

    const heading = document.createElement("h3");
    heading.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    item.append(heading, body);
    return item;
}

function showEmptyState() {
    notesList.replaceChildren();

    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "No notes found. Load notes or create your first note.";

    notesList.appendChild(item);
}

async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");
    notesList.replaceChildren();

    try {
        const result = await request(`${API_URL}?_limit=10`);
        const notes = result.data;

        if (notes.length === 0) {
            showEmptyState();
            showStatus("No notes were found.", "success");
            return;
        }

        const fragment = document.createDocumentFragment();

        notes.forEach((note) => {
            fragment.appendChild(renderNote(note));
        });

        notesList.replaceChildren(fragment);
        showStatus(`Loaded ${notes.length} notes from the server.`, "success");
    } catch (error) {
        showStatus("Unable to load notes. Please try again.", "error");
        console.error("Load notes error:", error);
    } finally {
        loadButton.disabled = false;
    }
}

loadButton.addEventListener("click", loadNotes);

// POST and DELETE handlers will be added in the next tasks.
noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showStatus("Note creation will be enabled in the next task.");
});
