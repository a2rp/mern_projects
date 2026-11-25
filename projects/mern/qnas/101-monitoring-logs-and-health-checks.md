# 101 - Monitoring, logs, and health checks: Q&A

### 1. What is observability?

**Answer:** Observability is the ability to understand a system's internal behavior from the signals it emits, including logs, metrics, traces, and health status.

### 2. What is the main purpose of application logs?

**Answer:** Logs record individual events with context so operators can investigate what happened during a request, process lifecycle, or failure.

### 3. What is a metric?

**Answer:** A metric is an aggregate measurement over time, such as request rate, error count, latency, memory use, or database pool pressure.

### 4. What is a distributed trace?

**Answer:** A trace follows one operation across services and components, such as from a browser request through Express to a MongoDB query.

### 5. What does a health check do?

**Answer:** A health check provides a simple signal that a platform can use to decide whether a process is responding or should receive traffic.

### 6. Why use structured JSON logs?

**Answer:** Stable fields make records easier to search, filter, aggregate, and correlate than inconsistent free-form messages.

### 7. Which fields can help describe an API request log?

**Answer:** A timestamp, severity, service, environment, event name, request ID, HTTP method, route template, status code, and duration can provide useful context.

### 8. Why use stable event names?

**Answer:** Stable names let operators query recurring event types without depending on changing prose in log messages.

### 9. What is a request ID used for?

**Answer:** It correlates a request's response, server logs, and error records so an operator can locate the events related to one operation.

### 10. Why should an API return its request ID in a response header?

**Answer:** A user or support operator can provide the identifier when reporting a failure, allowing the server to search relevant logs without requiring sensitive request data.

### 11. Why should an API not blindly trust a client-provided request ID?

**Answer:** An untrusted client could choose values that collide, mislead investigations, or inject invalid data. Validate a trusted upstream value or generate a new identifier.

### 12. Why use a route template such as <code>/api/courses/:courseId</code> in request logs?

**Answer:** It groups requests by route shape without recording arbitrary identifiers or creating an unbounded set of log and metric values.

### 13. Why avoid logging the raw URL query string by default?

**Answer:** Query parameters may contain personal data, search terms, tokens, or other sensitive values that do not belong in routine logs.

### 14. Which authentication values should never appear in routine logs?

**Answer:** Passwords, password hashes, reset tokens, session cookies, authorization headers, CSRF tokens, and bearer tokens should not be logged.

### 15. Why avoid logging a full MongoDB URI?

**Answer:** It can contain a username, password, hostname, and database details. Log a sanitized error category instead of the connection string.

### 16. What is the difference between an expected client error and an infrastructure failure?

**Answer:** A validation or authorization rejection may be an expected response to a client request. A database outage or unexpected programming failure indicates a service problem and should be measured differently.

### 17. Which dimensions are useful for bounded API metrics?

**Answer:** Method, route template, status class, and service are often bounded dimensions. Avoid dimensions whose values grow with users, requests, URLs, or arbitrary input.

### 18. Why are request IDs poor metric labels?

**Answer:** Every request ID is usually unique, so it creates high metric cardinality and makes aggregation expensive. Use request IDs in logs or traces instead.

### 19. Why are raw user IDs or email addresses poor metric labels?

**Answer:** They create unbounded cardinality and can expose personal information. Use aggregate dimensions or protected internal diagnostics instead.

### 20. Which four broad service behaviors are useful to monitor?

**Answer:** Traffic, errors, latency, and saturation. Together they show usage, failed operations, user-perceived speed, and resource pressure.

### 21. What could indicate MongoDB pool saturation?

**Answer:** Increased connection checkout wait, operation latency, request timeouts, or a high count of connections relative to available database capacity can indicate pressure.

### 22. Why monitor background job age as well as queue size?

**Answer:** A queue can remain nonempty during normal operation. The age of the oldest job helps reveal whether work is falling behind users' or business processes' expectations.

### 23. What is the difference between liveness and readiness?

**Answer:** Liveness indicates whether the process can respond. Readiness indicates whether it should receive normal traffic because its required local state and dependencies are ready.

### 24. Should liveness depend on every remote service?

**Answer:** Usually not. A remote database outage could make all healthy processes restart repeatedly. Use readiness to remove instances from traffic when a required dependency is unavailable.

### 25. What information should a public health endpoint return?

**Answer:** A minimal status such as ready or not-ready. It should not return secrets, internal hostnames, database names, URIs, stack traces, or raw errors.

### 26. Why should health checks be inexpensive?

**Answer:** Platforms may call them frequently. Expensive queries or long timeouts can add load, slow the service, or create an additional failure path.

### 27. What is an SLI?

**Answer:** A service-level indicator is a measured behavior relevant to users, such as successful request proportion or latency for an important operation.

### 28. What is an SLO?

**Answer:** A service-level objective is a target for an SLI over a defined time window, chosen according to product and operational needs.

### 29. What is an error budget?

**Answer:** It is the amount of failure allowed by an SLO during its measurement period. It helps teams reason about reliability trade-offs and release risk.

### 30. Why should a team avoid copying a universal SLO percentage?

**Answer:** An objective needs a defined eligible-request population, measurement window, user impact, and product requirement. A number without those choices can be misleading.

### 31. What makes an alert actionable?

**Answer:** It identifies a meaningful user or service impact, provides enough context to investigate, has a clear owner, and links to a runbook or next action.

### 32. Why avoid creating an alert for every metric change?

**Answer:** Too many noisy alerts cause fatigue, duplicate paging, and make responders more likely to ignore important failures.

### 33. What should a useful overview dashboard show?

**Answer:** Traffic, errors, latency, healthy instance count, database and pool health, process saturation, and deployment revision markers over a consistent time range.

### 34. What should an operator check first when an incident alert fires?

**Answer:** Confirm user impact, affected routes and environments, the start time, and whether a deployment or configuration change preceded the symptom.

### 35. How can a request ID help during an incident?

**Answer:** It lets the operator find the structured log record and related error details for one reported request without collecting its cookies or full body.

### 36. Why sample traces?

**Answer:** Tracing every request may have excessive storage or processing cost. Sampling can preserve representative success traffic while prioritizing errors and slow requests.

### 37. Why does telemetry need retention and access policies?

**Answer:** Logs and traces may contain operational or personal information. Access controls and retention limits reduce unnecessary exposure and storage.

### 38. An API error rate rises after a release. What signals should be compared?

**Answer:** Compare deployment revision, request volume, errors by route and status, latency, readiness, database connection and pool metrics, and representative sanitized logs or traces.

### 39. Why log an exception only at an appropriate layer?

**Answer:** Logging the same failure at every layer creates duplicate noise and can multiply sensitive details. Log once where the application has enough context to classify it.

### 40. What should an incident runbook include?

**Answer:** Service ownership, relevant dashboards and logs, first diagnostic steps, safe mitigation and rollback procedures, escalation or communication guidance, and actions that require extra review.
