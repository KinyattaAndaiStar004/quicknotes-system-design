
# QuickNotes Data Model

## 1. Database Choice

QuickNotes will use a relational SQL database such as PostgreSQL. Users, notes, and tags have clear relationships, and SQL supports foreign keys, transactions, joins, and constraints that help preserve data integrity.

## 2. Entities and Columns

### Users

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| name | VARCHAR(100) | Required |
| email | VARCHAR(255) | Required, unique |
| password_hash | VARCHAR(255) | Required |
| created_at | TIMESTAMPTZ | Required, defaults to current time |

### Notes

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| user_id | BIGINT | Foreign key referencing users.id |
| title | VARCHAR(100) | Required |
| body | TEXT | Optional |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |

### Tags

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| user_id | BIGINT | Foreign key referencing users.id |
| name | VARCHAR(50) | Required |
| created_at | TIMESTAMPTZ | Required |

A tag belongs to a user, so users can create their own tags.

### Note_Tags

| Column | Type | Key / rule |
|---|---|---|
| note_id | BIGINT | Foreign key referencing notes.id; part of composite primary key |
| tag_id | BIGINT | Foreign key referencing tags.id; part of composite primary key |
| created_at | TIMESTAMPTZ | Required |

The composite primary key `(note_id, tag_id)` prevents the same tag from being attached to the same note more than once.

## 3. Relationships

### One-to-many: Users and Notes

One user can have many notes, but each note belongs to one user. The `notes.user_id` foreign key identifies the owner.

### One-to-many: Users and Tags

One user can create many tags, but each tag belongs to one user. The `tags.user_id` foreign key identifies the tag owner.

### Many-to-many: Notes and Tags

A note can have many tags, and a tag can be attached to many notes. The `note_tags` join table represents this many-to-many relationship by storing pairs of note IDs and tag IDs.

The join table is necessary because storing multiple tag IDs in one column would make validation, searching, updates, and referential integrity more difficult.

## 4. CREATE TABLE Statements

The following PostgreSQL statements create all four tables.
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id)
);
The application must also verify that a tag belongs to the same user as the note before attaching it. That ownership rule spans multiple tables and should be enforced by appropriate application logic or a database-level mechanism.

## 5. Example SQL Queries

### Query 1: List a user's notes
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 7
ORDER BY updated_at DESC
LIMIT 20;

This query retrieves the latest notes for one user, with a limit to avoid returning too many records at once.

### Query 2: Find notes with a specific tag (JOIN)

SELECT n.id, n.title, n.body
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 7
  AND t.user_id = 7
  AND t.name = 'Work'
ORDER BY n.updated_at DESC;


This query joins notes, the join table, and tags to find notes labelled "Work" for the selected user.

### Query 3: Create a note


INSERT INTO notes (user_id, title, body)
VALUES (7, 'Project meeting', 'Prepare the agenda.')
RETURNING id, user_id, title, body, created_at, updated_at;


This inserts a note and returns its generated ID and saved values. In production, the authenticated user's ID must be obtained from the verified session or token, not trusted directly from client input.

### Query 4: Count notes per user


SELECT u.id, u.name, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.name
ORDER BY note_count DESC;


This query reports how many notes each user has, including users who have not created any notes.

## 6. Indexes


CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);


This index supports the common query that retrieves a user's notes ordered by most recent update. It can reduce the amount of data the database must scan and sort.

Primary keys and unique constraints create their own indexes where supported by PostgreSQL.

## 7. SQL vs. NoSQL Justification

I would choose SQL, specifically PostgreSQL, for QuickNotes because the system has structured entities and clear relationships. Foreign keys protect referential integrity, transactions help keep related changes consistent, and joins make it straightforward to retrieve notes with their tags. Indexes and read replicas can support growth as the service gains users. NoSQL could be useful for specific future workloads, but a relational database is the more appropriate default for this data model.
