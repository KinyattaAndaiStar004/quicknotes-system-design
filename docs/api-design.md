
# QuickNotes API Design

## 1. Overview

QuickNotes is a note-taking service that allows registered users to create, read, update, and delete notes and organize them using tags.

The production API will use REST principles, JSON request and response bodies, HTTPS, and token-based authentication. The examples below describe the proposed QuickNotes backend, not the JSONPlaceholder practice API.

Base URL: `https://api.quicknotes.example/v1`

Authentication: `Authorization: Bearer <access_token>`

## 2. REST Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | 201 Created |
| POST | `/auth/login` | Authenticate a user and issue a token | 200 OK |
| GET | `/notes` | List the authenticated user's notes, with pagination | 200 OK |
| GET | `/notes/{noteId}` | Retrieve one note owned by the user | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| PATCH | `/notes/{noteId}` | Update selected fields of a note | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | List the user's tags | 200 OK |
| POST | `/notes/{noteId}/tags/{tagId}` | Attach a tag to a note | 204 No Content |

All note endpoints must enforce ownership so users cannot access or change other users' private notes.

## 3. Create a Note

### Request

`POST /v1/notes`

Headers:

http
Authorization: Bearer <access_token>
Content-Type: application/json


Request JSON:

json
{
  "title": "Project meeting",
  "body": "Prepare the agenda for Monday.",
  "tagIds": [2, 4]
}


The title is required and must contain between 1 and 100 characters after trimming. The body is optional.

### Success response

Status: `201 Created`

{
  "id": 101,
  "userId": 7,
  "title": "Project meeting",
  "body": "Prepare the agenda for Monday.",
  "tags": [
    {"id": 2, "name": "Work"},
    {"id": 4, "name": "Planning"}
  ],
  "createdAt": "2026-10-18T10:30:00Z",
  "updatedAt": "2026-10-18T10:30:00Z"
}
```

The server generates the note ID, timestamps, and authenticated user ID. The client must not be trusted to choose another user's ID.

## 4. List Notes

### Request

`GET /v1/notes?page=1&limit=20`

Headers:

http
Authorization: Bearer <access_token>

### Success response

Status: `200 OK`

{
  "data": [
    {
      "id": 101,
      "userId": 7,
      "title": "Project meeting",
      "body": "Prepare the agenda for Monday.",
      "createdAt": "2026-10-18T10:30:00Z",
      "updatedAt": "2026-10-18T10:30:00Z"
    },
    {
      "id": 102,
      "userId": 7,
      "title": "Shopping list",
      "body": "Milk and bread",
      "createdAt": "2026-10-18T11:00:00Z",
      "updatedAt": "2026-10-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
The API returns only notes belonging to the authenticated user. Results should be ordered by most recently updated, and pagination limits the amount of data returned in one request.

## 5. Update and Delete Examples

### Update a note

`PATCH /v1/notes/101`

Request:

{
  "title": "Updated project meeting"
}


Success: `200 OK`, returning the updated note as JSON.

### Delete a note

`DELETE /v1/notes/101`

Success: `204 No Content`, with no response body.

A note that does not exist or is not accessible to the current user should not be deleted.

## 6. Error Status Codes

| Status | Name | Meaning |
|---|---|---|
| 400 | Bad Request | Invalid JSON, missing title, or invalid field values |
| 401 | Unauthorized | Missing, invalid, or expired authentication token |
| 403 | Forbidden | The user is authenticated but lacks permission for the action |
| 404 | Not Found | The requested resource does not exist or is unavailable |
| 409 | Conflict | A resource conflicts with an existing record, such as a duplicate email |
| 422 | Unprocessable Content | The request is valid JSON but fails business validation |
| 429 | Too Many Requests | The client exceeded a rate limit |
| 500 | Internal Server Error | An unexpected server-side failure occurred |
| 503 | Service Unavailable | The service is temporarily unable to handle the request |

### Example error response

Status: `400 Bad Request`
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must not exceed 100 characters."
      }
    ],
    "requestId": "req-a81c20"
  }
}
Error responses should use a consistent JSON structure. They must not expose passwords, access tokens, database credentials, stack traces, or other internal secrets.

## 7. Security and Reliability

- Require HTTPS for all production traffic.
- Hash passwords using a suitable password-hashing algorithm; never store plain-text passwords.
- Use short-lived access tokens and a secure refresh-token strategy.
- Validate and authorize every request on the server.
- Apply pagination, request-size limits, rate limiting, and input validation.
- Use parameterized SQL queries to prevent SQL injection.
- Log request IDs and server errors without logging secrets.
- Use database transactions for operations that must succeed or fail together.
- Return suitable HTTP status codes and predictable JSON error bodies.

## 8. Conclusion

This API provides a clear REST interface for authentication, note management, and tagging. Authentication, ownership checks, validation, pagination, and consistent error handling make it suitable as a starting contract for a production QuickNotes backend.
