# QuickNotes Architecture and Scaling Plan

## 1. Overview

QuickNotes is moving from a browser-only application to an online service designed to support one million registered users. The architecture must support secure access, note creation and retrieval, reliable storage, and growth in traffic.

The proposed system uses multiple application servers, caching, a primary SQL database with a read replica, and asynchronous background processing.

## 2. Functional Requirements

1. Users can register, log in, and log out securely.
2. Users can create, read, update, and delete their own notes.
3. Users can organize notes using tags.
4. Users can search, filter, sort, and paginate their notes.
5. Users cannot read or modify another user's private notes.
6. The system displays useful validation messages and handles request failures.
7. Users can access their notes from supported web browsers.

## 3. Non-Functional Requirements

- **Scalability:** The service should scale horizontally as traffic grows.
- **Availability:** A single application server failure should not take down the service.
- **Performance:** Common note reads should respond quickly, supported by caching and indexed queries.
- **Security:** Use HTTPS, secure password hashing, authentication, authorization, and input validation.
- **Reliability:** Use backups, database replication, monitoring, and retryable background jobs.
- **Consistency:** Note writes must be persisted reliably, and users should see their own recent changes.
- **Maintainability:** Keep components modular, documented, monitored, and testable.
- **Data integrity:** Use transactions, foreign keys, and database constraints where appropriate.

## 4. Load Estimates for One Million Users

### Assumptions

- There are 1,000,000 registered users.
- 10% are active daily, giving 100,000 daily active users.
- Each daily active user makes 20 read requests per day.
- Each daily active user makes 2 write requests per day.
- Each new or updated note adds an average of 10 KB of stored note data, including its allocated metadata overhead.
- A year has 365 days and 86,400 seconds per day.
- Average rates are calculated over a full day; peak traffic is estimated at five times the average.
- The storage estimate covers new note data and does not include backups, replicas, logs, or indexes.

### Reads per second

Daily reads:

100,000 × 20 = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 = approximately **23.15 reads per second**.

Estimated peak reads:

23.15 × 5 = approximately **115.74 reads per second**.

### Writes per second

Daily writes:

100,000 × 2 = 200,000 writes per day.

Average writes per second:

200,000 ÷ 86,400 = approximately **2.31 writes per second**.

Estimated peak writes:

2.31 × 5 = approximately **11.57 writes per second**.

### Storage per year

Annual note writes:

200,000 × 365 = 73,000,000 note writes per year.

Estimated annual storage growth:

73,000,000 × 10 KB = 730,000,000 KB.

Using decimal units, this is approximately **730 GB of new note data per year**.

This is a planning estimate rather than a prediction of exact database size. Updates may replace existing data, while indexes, backups, replicas, and database overhead require additional capacity.

### Read-heavy or write-heavy?

Under these assumptions, QuickNotes is read-heavy: it receives ten times as many read requests as write requests. The architecture should prioritize fast reads using caching, indexes, a CDN for static assets, and a database read replica, while ensuring writes go to the primary database.

## 5. Architecture Diagram

                       +----------------------+
                       |       Client         |
                       | Browser / JavaScript |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       |         DNS          |
                       | Resolve service name |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       |         CDN          |
                       | Static assets/cache  |
                       +----------------------+
                                  |
                                  v
                       +----------------------+
                       |    Load Balancer     |
                       +----------------------+
                                  |
                   +--------------+--------------+
                   |              |              |
                   v              v              v
             +-----------+  +-----------+  +-----------+
             | App Server|  | App Server|  | App Server|
             |     A     |  |     B     |  |     C     |
             +-----------+  +-----------+  +-----------+
                   |              |              |
                   +--------------+--------------+
                                  |
                         +--------+--------+
                         |                 |
                         v                 v
                  +-------------+   +--------------+
                  |    Cache    |   |   Database   |
                  | Redis-like  |   |   Primary    |
                  +-------------+   +--------------+
                                          |
                                          | Replication
                                          v
                                   +--------------+
                                   | Read Replica |
                                   +--------------+

 Background work:
                  +-------------+
                  | App Server  |
                  +-------------+
                         |
                         v
                  +-------------+
                  |    Queue    |
                  +-------------+
                         |
                         v
                  +-------------+
                  |   Worker    |
                  | Notifications|
                  | maintenance |
                  +-------------+

 Notes and metadata are stored in the primary database.
 The read replica handles suitable read queries.
 The cache stores frequently accessed data.
 The queue and worker handle work that need not block
 the user's immediate request.


## 6. What Each Component Solves

1. **Client:** Provides the browser interface through which users manage their notes.
2. **DNS:** Resolves the service's domain name to the correct network endpoint.
3. **CDN:** Delivers static assets such as JavaScript, CSS, and images from nearby edge locations, reducing latency and origin traffic.
4. **Load balancer:** Distributes incoming requests across healthy application servers to avoid overloading one server.
5. **Application servers:** Validate requests, authenticate users, enforce permissions, execute business logic, and communicate with the cache, database, and queue.
6. **Cache:** Stores frequently accessed notes or query results in fast memory to reduce database reads and response time.
7. **Primary database:** Reliably stores users, notes, tags, and relationships and processes database writes.
8. **Read replica:** Handles suitable read queries to reduce the primary database's read workload and improve read capacity.
9. **Queue:** Buffers asynchronous jobs so background work does not delay user-facing requests.
10. **Worker:** Processes queued jobs such as notifications, cleanup, or other maintenance tasks outside the request-response cycle.

## 7. Flow of GET /notes

1. The user opens QuickNotes in a browser and requests their notes.
2. DNS resolves the service domain, and the client sends an HTTPS request to the API.
3. The load balancer forwards the request to a healthy application server.
4. The application server validates the user's access token and determines the user's identity.
5. The server checks the cache for the requested user's notes and query parameters.
6. If valid cached data is available, the server returns it, subject to the application's freshness rules.
7. On a cache miss, the server queries the read replica using an indexed, paginated SQL query, provided replica consistency is sufficient.
8. If the replica is unavailable or a read-after-write guarantee is needed, the application can fall back to the primary database.
9. The application caches suitable results with an expiration policy and returns a JSON response with pagination metadata.
10. The browser displays the notes and handles empty or error responses appropriately.

## 8. Flow of POST /notes

1. The user enters a title and optional body and submits the form.
2. The browser sends an HTTPS `POST /notes` request with JSON data and the user's access token.
3. The load balancer forwards the request to a healthy application server.
4. The server validates the token, checks authorization, and validates the note's title and body.
5. The server writes the note to the primary database using a parameterized query or transaction.
6. The database commits the transaction and returns the new note ID and saved values.
7. The application invalidates or updates relevant cached note lists so stale data is not served.
8. If necessary, the application places independent background work, such as a notification, onto the queue.
9. The application returns `201 Created` with the new note representation.
10. The browser adds the note to the interface and shows a success message.

The queue is not required for the basic database write; it is used for follow-up work that can safely happen asynchronously.

## 9. Trade-Offs

### Trade-Off 1: Cache Speed vs. Data Freshness

Caching reduces database load and improves response time, but cached note lists can become outdated after a create, update, or delete operation. QuickNotes can use short expiration times and invalidate affected cache keys after successful writes. The application should avoid caching sensitive data across users.

### Trade-Off 2: Read Replicas vs. Immediate Consistency

Read replicas increase read capacity, but replication lag can cause recently changed notes to appear outdated. The application can route read-after-write requests to the primary database or use a consistency-aware routing policy.

### Trade-Off 3: Synchronous vs. Asynchronous Work

A queue allows nonessential tasks to run in the background and keeps API responses fast. However, jobs may be delayed or fail, so workers need retries, monitoring, and idempotent processing to avoid duplicate effects.

### Trade-Off 4: More Servers vs. Operational Cost

Running multiple application servers improves capacity and resilience but increases infrastructure cost and monitoring complexity. Autoscaling, health checks, and measured capacity planning help balance cost against availability.

## 10. Avoiding Single Points of Failure

- **Application tier:** Run at least two application servers across separate failure domains behind a health-checking load balancer.
- **Load balancing and DNS:** Use a managed or redundant load-balancing service and reliable DNS hosting with health monitoring.
- **Database:** Configure automated backups and a monitored read replica; use a tested failover strategy to promote a replica if the primary fails. A read replica alone does not guarantee automatic failover.
- **Cache:** Use a redundant or managed cache where appropriate, and ensure the application can degrade gracefully or fall back to the database when the cache is unavailable.
- **Queue and workers:** Use a durable, replicated queue where supported and multiple workers so a single worker failure does not stop all processing.
- **Deployment and monitoring:** Deploy across multiple instances, monitor latency and error rates, and alert on failures, capacity limits, and replication lag.
- **Recovery:** Test database restoration and failover procedures regularly rather than assuming that backups alone guarantee recovery.

These measures reduce single points of failure, although actual availability depends on the selected provider, deployment topology, and tested recovery procedures.

## 11. Conclusion

QuickNotes can scale to one million registered users by separating the client, application, caching, database, and background-processing responsibilities. Horizontal application scaling, indexed SQL queries, a read replica, and asynchronous jobs support growth while maintaining manageable response times.

The load figures are based on explicit assumptions and should be validated through load testing and production monitoring before setting final capacity and availability targets.
