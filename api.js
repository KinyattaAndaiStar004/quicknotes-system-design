const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Get HTML elements
const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const submitButton = document.getElementById("submit-btn");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// Display status messages
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Reusable function for GET, POST, and DELETE requests
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    // DELETE requests may return 204 with no response body
    if (response.status === 204) {
        return {
            data: null,
            status: response.status
        };
    }

    return {
        data: await response.json(),
        status: response.status
    };
}

// Create a note element safely using textContent
function renderNote(note) {
    const item = document.createElement("li");
    item.className = "note";
    item.dataset.id = note.id;

    const heading = document.createElement("h3");
    heading.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", () => {
        deleteNote(note.id, item, deleteButton);
    });

    item.append(heading, body, deleteButton);

    return item;
}

// Display an empty state when there are no notes
function showEmptyState() {
    const item = document.createElement("li");

    item.className = "empty-state";
    item.textContent = "No notes found. Create your first note.";

    notesList.replaceChildren(item);
}

// GET: Load notes from the API
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");
    notesList.replaceChildren();

    try {
        const result = await request(`${API_URL}?_limit=10`);
        const notes = result.data;

        if (!Array.isArray(notes) || notes.length === 0) {
            showEmptyState();
            showStatus("No notes were found.", "success");
            return;
        }

        const fragment = document.createDocumentFragment();

        notes.forEach((note) => {
            fragment.appendChild(renderNote(note));
        });

        notesList.replaceChildren(fragment);

        showStatus(
            `Loaded ${notes.length} notes from the server.`,
            "success"
        );
    } catch (error) {
        showStatus(
            "Unable to load notes. Please check your connection and try again.",
            "error"
        );

        console.error("Load notes error:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// Attach the GET event listener
loadButton.addEventListener("click", loadNotes);

// POST: Create a new note
noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validate the title
    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus(
            "The title must not exceed 100 characters.",
            "error"
        );

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
                title: title,
                body: body,
                userId: 1
            })
        });

        const newNote = result.data;

        // Add the created note to the top of the list
        const newItem = renderNote(newNote);

        const emptyState = notesList.querySelector(".empty-state");

        if (emptyState) {
            notesList.replaceChildren(newItem);
        } else {
            notesList.prepend(newItem);
        }

        // Clear the form after successful creation
        noteForm.reset();

        showStatus(
            `Note created successfully (status ${result.status}, ID ${newNote.id}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            "Unable to create the note. Please try again.",
            "error"
        );

        console.error("Create note error:", error);
    } finally {
        submitButton.disabled = false;
    }
});

// DELETE: Delete a note
async function deleteNote(id, noteElement, deleteButton) {
    deleteButton.disabled = true;
    showStatus("Deleting note...");

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // Remove the note from the current page after success
        noteElement.remove();

        if (notesList.children.length === 0) {
            showEmptyState();
        }

        showStatus(
            `Note deleted successfully (status ${result.status}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            "Unable to delete the note. Please try again.",
            "error"
        );

        console.error("Delete note error:", error);
    } finally {
        deleteButton.disabled = false;
    }
}
