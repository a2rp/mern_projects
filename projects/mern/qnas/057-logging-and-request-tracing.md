# 057 - Logging and request tracing: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. Which signal is best suited to show whether API error rates increased over the last hour?

- A. A single application log line.
- B. A metric aggregated over time.
- C. A request ID.
- D. A database document.

**Answer: B.** Metrics aggregate measurements over time and make trends such as error rates visible. Logs provide individual events, while traces show the path and timing of individual operations.

### 2. What does a distributed trace show?

- A. A connected timeline of spans for work across components.
- B. Every database document in a collection.
- C. The raw contents of every HTTP body.
- D. A count of requests only.

**Answer: A.** A trace links spans that describe operations and their timing and parent-child relationships across services or libraries.

### 3. What does a span ID identify?

- A. One timed operation within a trace.
- B. A user's password reset token.
- C. Every request to a service for all time.
- D. A MongoDB collection.

**Answer: A.** A span represents a unit of work, such as an HTTP handler or database call. The trace ID groups related spans into one distributed operation.

### 4. What is a common use for an application-generated request ID?

- A. To prove that a caller is authenticated.
- B. To find the logs associated with one service request.
- C. To replace a database primary key.
- D. To authorize a file download.

**Answer: B.** A request ID is a convenient correlation key for one request within a service. It is not a credential or authorization signal.

### 5. Are a request ID and a trace ID automatically the same thing?

- A. Yes, every logger makes them identical.
- B. No; they are different identifiers with different purposes.
- C. Yes, if the API uses MongoDB.
- D. No; neither identifier can be logged.

**Answer: B.** A request ID helps find one service's request logs. A trace ID links spans across a distributed operation and can include several service requests.

### 6. When should OpenTelemetry instrumentation be initialized in a Node.js application?

- A. After the server has loaded Express and database modules.
- B. Before loading the modules that need instrumentation.
- C. Only inside the final error handler.
- D. After the first request finishes.

**Answer: B.** Instrumentation often patches or observes modules when they load. Initialize it before importing the instrumented application and dependencies.

### 7. Which value is safer to log for an HTTP route?

- A. The full URL including all query values.
- B. A route template such as `/api/orders/:orderId`.
- C. The complete request body.
- D. The value of the user's cookie.

**Answer: B.** Route templates provide useful grouping without recording user-specific path values or sensitive query parameters.

### 8. Which should normally be excluded from application logs?

- A. HTTP status code.
- B. Route template.
- C. Passwords and session cookies.
- D. Request duration.

**Answer: C.** Passwords and session credentials should not be retained in logs. Exclude or redact secrets before data reaches the logging destination.

### 9. What does a structured JSON logger provide?

- A. Fields stored as machine-readable data that can be filtered and queried.
- B. Automatic authorization of requests.
- C. A guarantee that logs contain no personal information.
- D. A replacement for metrics and traces.

**Answer: A.** Structured fields are easier to search and aggregate than free-form sentences. They still need careful data selection and access controls.

### 10. Why should an application avoid logging an entire request object?

- A. Request objects contain no useful metadata.
- B. They can include secrets, personal data, large bodies, and unnecessary fields.
- C. JSON loggers cannot serialize objects.
- D. It prevents Express from routing requests.

**Answer: B.** Full objects can expose credentials and sensitive data, increase storage cost, and slow the application. Prefer an allowlist of relevant fields.

### 11. Which event is a good use of an `info`-level application log?

- A. A meaningful normal event such as an order being accepted.
- B. Every variable assignment in production.
- C. A secret value used for signing cookies.
- D. A repeated stack trace from the same failure at every middleware layer.

**Answer: A.** `info` should record useful normal events. High-volume debugging belongs at a controlled debug level, and secrets must not be logged at any level.

### 12. What is a suitable behavior for a final Express error handler?

- A. Return a stack trace and database connection string to the client.
- B. Record the failure safely once and return a generic error with a request ID.
- C. Ignore the error and leave the connection open.
- D. Log the full request body to simplify debugging.

**Answer: B.** Protected server-side telemetry can contain diagnostic details. The public response should not reveal implementation details or secrets.

### 13. What does OpenTelemetry use a trace context for?

- A. Propagating trace correlation across compatible operations and services.
- B. Proving a user owns a database record.
- C. Encrypting request and response bodies.
- D. Replacing an application's CSRF token.

**Answer: A.** Trace context carries identifiers that connect spans across services. It is correlation metadata, not an identity or permission check.

### 14. What is a risk of accepting any client-supplied `X-Request-ID` without validation?

- A. A client can choose a huge or misleading value that complicates logs or correlation.
- B. The database becomes read-only.
- C. The logger cannot output JSON.
- D. Tracing stops working for all users.

**Answer: A.** Untrusted correlation values can be malformed, oversized, or deliberately misleading. Generate an ID or accept one only from a trusted and validated boundary.

### 15. How should a background worker correlate a job with the request that created it?

- A. Assume the request's in-memory context will automatically cross the queue.
- B. Propagate appropriate trace context or a trace link and use a job ID.
- C. Put the access token into the job name.
- D. Log the complete job payload in every worker message.

**Answer: B.** Queue boundaries require deliberate context propagation. A job ID helps locate job events, and trace context or links can connect the work to its initiating operation.

### 16. What does trace sampling control?

- A. Which traces are retained or exported from high-volume traffic.
- B. Which users are allowed to sign in.
- C. Whether the API validates JSON.
- D. How a request ID is generated.

**Answer: A.** Sampling can reduce telemetry volume and cost. The policy should retain enough errors and latency data for useful investigations.

### 17. A request fails at the reverse proxy before Express receives it. Where must its access or rejection details be recorded?

- A. Only in Express application logs.
- B. At the proxy or platform layer that rejected the request.
- C. In MongoDB's user collection.
- D. In a React component.

**Answer: B.** The application cannot log work it never received. The earlier infrastructure layer needs its own observability and retention policy.

### 18. Which fields make a request completion log more useful without recording a body?

- A. Method, route template, response status, duration, and request ID.
- B. Password, cookie, and authorization header.
- C. Full URL with private query parameters and the entire response body.
- D. Only the server process ID.

**Answer: A.** These fields answer many operational questions while avoiding the unnecessary collection of request and response contents.

### 19. Why should an application avoid turning user-specific values into metric labels or event names?

- A. Such values can create high cardinality and expose sensitive data.
- B. Metrics cannot contain numbers.
- C. It makes every trace identical.
- D. It automatically disables the logger.

**Answer: A.** Unique values create too many distinct time series or event categories, increasing cost and reducing useful aggregation. Sensitive identifiers can also leak.

### 20. What is a sound log-retention policy?

- A. Keep all logs forever and allow all employees to read them.
- B. Set retention and access based on purpose, sensitivity, and operational needs.
- C. Delete all logs immediately after each request.
- D. Store secrets in logs because they will eventually expire.

**Answer: B.** Logs can include sensitive operational data. Limit access and retention to what is justified, and protect the telemetry in storage and transit.

## Short-answer questions

### 21. In one sentence each, describe what logs, metrics, and traces are for.

**Answer:** Logs record selected individual events; metrics aggregate numeric measurements over time; traces connect and time spans across the path of an operation. They are complementary observability signals.

### 22. What is the difference between a request ID, a trace ID, and a span ID?

**Answer:** A request ID finds one service's request logs. A trace ID groups distributed work, and a span ID identifies one operation within that trace. One trace can contain multiple spans and service requests.

### 23. Name five useful fields for an Express request completion log.

**Answer:** Examples include timestamp, level, service/environment, request ID, trace ID, span ID, HTTP method, route template, status code, and duration. Include only fields that are useful and safe to retain.

### 24. Why is a full URL potentially unsafe to log?

**Answer:** Query strings and path values can contain access tokens, personal information, or other private values. Logging a route template or sanitized pathname reduces unnecessary exposure and high-cardinality data.

### 25. Why should telemetry initialization happen before loading Express and other instrumented libraries?

**Answer:** Instrumentation may need to patch or observe modules as they load. Starting it later can leave HTTP, framework, or database operations without the intended spans.

### 26. What does it mean to redact a log field before emission?

**Answer:** The logger removes or masks a sensitive value before writing or exporting the record. This is safer than relying on a downstream viewer to hide a secret after it has already been stored.

### 27. Give two reasons not to log full request and response bodies by default.

**Answer:** Bodies can contain credentials or personal data, and retaining them increases processing and storage costs. An allowlist of operationally useful fields is safer.

### 28. What should an API return when an unexpected internal error occurs?

**Answer:** Return a generic error response with a safe request ID if useful. Keep stack traces and internal details in access-controlled server-side telemetry, and do not expose secrets or database errors to the caller.

### 29. What should a team decide about high-volume trace sampling?

**Answer:** Decide which traces to retain so cost is controlled while failures and latency problems remain diagnosable. Consider preserving errors, slow requests, and representative normal traffic.

### 30. Why is tracing context not suitable for authorization decisions?

**Answer:** Trace IDs are correlation metadata and may come from external requests; they do not prove identity, ownership, or permission. Authorization must use the application's authenticated identity and access-control rules.

## Application questions

### 31. A developer logs `req.headers` to diagnose a login issue. What can leak, and what should replace this log?

**Answer:** Headers may contain cookies, bearer tokens, API keys, and personal metadata. Remove the whole-object log and record only allowlisted fields needed for diagnosis, such as method, route template, status, request ID, and a safe event code. Configure redaction as defense in depth.

### 32. A request log contains a different random value from the trace shown in the tracing dashboard. Is this automatically a bug?

**Answer:** Not necessarily. A service request ID and a distributed trace ID have different purposes and are often different values. Ensure both identifiers are present where useful and that application logs include the active trace and span IDs for navigation.

### 33. A service returns `X-Request-ID` copied directly from any incoming client header. What risks should be reviewed?

**Answer:** An attacker could inject oversized or confusing values, create misleading log correlations, or exploit untrusted characters in downstream tools. Generate a new server ID or accept an upstream ID only from a trusted proxy after validating its length and format. Do not treat it as identity.

### 34. An Express request is visible in access logs but has no Express or database spans. What setup issue should be checked first?

**Answer:** Verify that OpenTelemetry SDK and instrumentation initialization ran before the application loaded Express and the database driver. Also check that the relevant instrumentation is installed, registered, and compatible with the dependency version.

### 35. An order lookup logs a full URL like `/orders?id=...&email=...`. How should it be changed?

**Answer:** Log a route template such as `/orders/:orderId` or a sanitized path, and avoid the email or other sensitive query data. If a safe internal order ID is needed, log it as a deliberately selected field under the applicable retention and access policy.

### 36. The same exception appears in logs at the database call, service layer, route handler, and final error middleware. What should change?

**Answer:** Choose one layer to record the unhandled exception with diagnostic detail, usually the final error handler, and use lower-level logs only for distinct handled decisions. Preserve error propagation without repeatedly logging the same stack.

### 37. A background email job is created by a traced HTTP request but appears as an unrelated trace. What should the application do?

**Answer:** Propagate suitable OpenTelemetry context into the job message or create a trace link to the initiating request, and log a stable job ID. Do not assume the request's in-memory async context survives a queue boundary.

### 38. A load balancer rejects an oversized request before it reaches Node.js. Why are there no corresponding Express logs, and what is needed?

**Answer:** Express never received the request, so its middleware could not log it. Configure and monitor the load balancer or proxy's access and rejection logs, with appropriate retention and sensitive-data controls.

### 39. A log aggregation query is slow because every customer ID is used as a metric label. What is the likely problem?

**Answer:** The metric has high cardinality because each customer creates a distinct series. Remove user-specific values from metric labels; use bounded dimensions for aggregation and use appropriately protected logs or traces when individual investigation is necessary.

### 40. An error response returns a stack trace to help a user report the problem. What safer response and logging pattern should replace it?

**Answer:** Return a generic error and a request ID. Record the detailed stack once in access-controlled server telemetry, correlated with that request ID and trace context, while excluding secrets and sensitive payloads.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [056 - File uploads and validation](../lessons/056-file-uploads-and-validation.md) | [Lesson](../lessons/057-logging-and-request-tracing.md) | [Example](../examples/057-logging-and-request-tracing.md) | [058 - API documentation and versioning](../lessons/058-api-documentation-and-versioning.md) |
