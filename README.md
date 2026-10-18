
# QuickNotes System Design

QuickNotes is a note-taking application demonstrating how a browser-based client communicates with an HTTP API and how the system could evolve into a scalable online service.

The front end uses HTML, CSS, and JavaScript. It uses the JSONPlaceholder practice API to demonstrate loading notes with GET, creating notes with POST, and deleting notes with DELETE. The `docs/` directory contains the proposed production API contract, relational data model, and scaling architecture.

**Note:** JSONPlaceholder is a demonstration API. Created and deleted posts are simulated and are not permanently stored.

## Features

- Load and display ten notes from the API.
- Create notes with a required title and optional body.
- Delete notes from the displayed list.
- Display loading, success, error, and empty states.
- Disable relevant buttons while requests are in progress.
- Validate titles and safely display user-provided text.
- Document a proposed production backend and its scaling requirements.

## Project Structure

quicknotes-system-design/
├── index.html
├── style.css
├── api.js
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md


## How to Run the API Client

1. Clone the repository:

   
   git clone https://github.com/YOUR-USERNAME/quicknotes-system-design.git
   

2. Open the project folder in VS Code:

   
   cd quicknotes-system-design
   code .
  

3. Open `index.html` using the VS Code Live Server extension, or serve the folder using another local HTTP server.

4. Ensure you have an internet connection because the client calls JSONPlaceholder.

5. Click **Load notes** to retrieve ten example posts. Use the form to create a note and the Delete buttons to remove notes from the current display.

No backend installation or API key is required for this demonstration.

## Design Documents

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, authentication, and error handling.
- [Data Model](docs/data-model.md) — SQL tables, keys, relationships, example queries, indexes, and database selection.
- [Architecture and Scaling](docs/architecture.md) — Requirements, capacity estimates, architecture diagram, request flows, trade-offs, and resilience.

## Technology Stack

- HTML5
- CSS3
- JavaScript (Fetch API and async/await)
- JSONPlaceholder practice API
- PostgreSQL as the proposed production database
- Git and GitHub

## What I Learned

1. **API integration:** How to make HTTP requests with Fetch, handle asynchronous operations, and process JSON responses.
2. **Error handling and validation:** How to validate user input, handle unsuccessful HTTP responses, and provide clear feedback through loading, success, error, and empty states.
3. **REST API design:** How HTTP methods and status codes support create, read, update, and delete operations.
4. **Relational database design:** How primary keys, foreign keys, one-to-many relationships, many-to-many relationships, and join tables organize application data.
5. **Scalable architecture:** How caching, read replicas, load balancing, and background queues can improve performance and resilience.
6. **Capacity planning:** How to estimate requests per second and annual storage using explicit workload assumptions.
7. **Version control:** How meaningful Git commits document development progress and how GitHub supports project sharing.

## Limitations

The client uses a public demonstration API rather than a persistent QuickNotes backend. Authentication, user ownership, and database persistence are design proposals documented for future implementation, not features provided by this demo.

## Future Improvements

- Build the real backend and connect it to PostgreSQL.
- Implement registration, login, and server-side authorization.
- Add search, pagination, and tag management.
- Introduce automated tests and continuous integration.
- Add monitoring, backups, and production deployment.

## Author

Developed as a web foundations system-design project.
