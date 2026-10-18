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

// Reusable function for GET, POST and DELETE requests.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    return {
        data: await response.json(),
        status: response.status
    };
}

function renderNote(note) {
    const item = document.createElement("li");
    item.className = "note";
    item.dataset.id = note.id;

    const heading = document.createElement("h3");
    heading.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    item.append(heading, body);
    return item;
}

function showEmptyState() {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "No notes found. Create your first note.";

    notesList.replaceChildren(item);
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

// Create a note using POST.
noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validate the title before sending the request.
    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must not exceed 100 characters.", "error");
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        const newNote = result.data;

        // Display the newly created note at the top of the list.
        const newItem = renderNote(newNote);

        const emptyState = notesList.querySelector(".empty-state");
        if (emptyState) {
            notesList.replaceChildren(newItem);
        } else {
            notesList.prepend(newItem);
        }

        noteForm.reset();

        showStatus(
            `Note created (status ${result.status}, id ${newNote.id}).`,
            "success"
        );
    } catch (error) {
        showStatus("Unable to create the note. Please try again.", "error");
        console.error("Create note error:", error);
    } finally {
        submitButton.disabled = false;
    }
});
