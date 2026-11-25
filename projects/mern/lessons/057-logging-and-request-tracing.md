# 057 - Logging and request tracing

When a request fails, a useful system should help you answer what happened, where it happened, and which other operations were involved. Structured logs record selected events. Distributed traces show how one operation moves across middleware, services, and databases. Together they help diagnose failures without collecting every request detail or exposing private data.

This chapter uses a MERN API request as its example: the browser calls Express, Express reads MongoDB, and the API returns a response. The same ideas apply to background jobs and calls to other services.

## Learning goals

After this chapter, you should be able to:

- Explain the difference between logs, metrics, and traces.
- Add structured request and application-event logs to Express.
- Connect log records to a request ID and distributed trace.
- Instrument a Node.js application before its dependencies load.
- Record useful errors without exposing secrets or private request data.
- Choose safe retention, access, sampling, and alerting practices.

## Logs, metrics, and traces answer different questions

| Signal | What it records | Example question |
| --- | --- | --- |
| Log | A timestamped event with selected context. | Which validation step rejected this order? |
| Metric | A numeric measurement aggregated over time. | Did the API's error rate increase this hour? |
| Trace | A connected timeline of spans for one operation. | Which service or database call made this request slow? |

A log line is useful for an individual event. A metric shows a trend without retaining every event. A trace links work across components and shows timing and parent-child relationships. These signals complement one another; using one as a replacement for all the others usually leaves gaps.

## Emit structured logs

A structured logger records fields as data, often JSON, instead of relying on sentences that must be parsed later. A request completion record might include:

- timestamp and severity level;
- service name and deployment environment;
- request ID, trace ID, and span ID when available;
- HTTP method, route template, response status, and duration;
- a safe event name and relevant internal record identifier;
- error name and stack in protected server-side logs when appropriate.

Choose fields that help answer operational questions. Prefer a route template such as `/api/orders/:orderId` over a full URL containing query values. Use stable event names such as `order.lookup.failed`, and do not turn every customer value into a new event type.

Use levels consistently. `debug` is for detailed development diagnostics; `info` is for meaningful normal events; `warn` is for unexpected but handled conditions; and `error` is for failures that need investigation. Do not log every line at `error`, or important failures become hard to distinguish.

An HTTP access log can record one completion event after the response status and duration are known. Application logs can record important steps, such as a payment authorization being declined or a background job being retried. Avoid duplicate stacks and repeated logs for the same error as it moves through middleware.

## Distinguish request IDs and trace IDs

A **request ID** identifies one request as seen by a particular service. It is useful for returning a reference to a caller and finding that request's logs. An application can generate an unpredictable ID for every incoming request and return it in a response header.

A **trace ID** identifies a distributed operation that may include several service requests. A **span ID** identifies one timed operation inside that trace, such as an HTTP server handler or a database call. A trace contains a parent-child structure of spans. Several requests can share a trace when they are part of one user action or asynchronous workflow.

These IDs have different jobs. A request ID is not automatically a trace ID. Use an observability standard such as OpenTelemetry to create and propagate trace context across supported HTTP and database instrumentation. Add the active trace ID and span ID to application log records so an operator can move between the log and its trace.

Incoming `traceparent` and request-ID values are correlation metadata, not proof of identity or permission. Do not use them for authorization, rate-limit identity, or business decisions. If a deployment accepts an upstream request ID, accept it only from a trusted boundary and validate its format and length. Otherwise generate a new service request ID.

## Instrument an Express application

OpenTelemetry instrumentation must load before the modules it instruments. In a Node.js app, initialize the SDK from a separate startup module and import that module before starting the application. Auto-instrumentation can create HTTP and Express spans, and supported database instrumentation can add spans for database calls.

A trace is only as useful as its boundaries and attributes. Use route templates and operation names rather than high-cardinality raw URLs. Add business attributes only when they help diagnose behavior and are safe to retain. Never attach passwords, access tokens, session cookies, full request bodies, or sensitive personal data to spans.

Trace propagation lets compatible services continue the same trace. Background jobs should carry appropriate trace context or a link to the initiating operation, together with a job identifier. Do not assume a request's in-memory context will automatically survive a queue boundary.

## Place middleware deliberately

Request logging middleware should run early enough to observe most requests. Authentication should run before logging user-specific identity, and identity fields should be attached only after authentication succeeds. The final error middleware should record unhandled failures once and return a generic response to clients.

When a request is rejected before it reaches Express, such as by a proxy size limit, the proxy or platform must provide its own access and error records. Application logs cannot describe work the application never received.

## Protect log data

Logs and traces can contain sensitive data and are often retained for a long time. Do not record passwords, authorization headers, cookies, session identifiers, API keys, database connection strings, encryption keys, or raw request bodies. Consider personal data, payment data, health information, and exact IP addresses carefully under the product's privacy and legal requirements.

Redact sensitive fields in the logger configuration before sending data to the output destination. Prefer allowlisted fields over logging whole request or response objects. Do not rely on a viewer to hide secrets later. Keep stack traces and internal failure details in access-controlled telemetry; return callers a generic error and a safe request ID.

Structured JSON encoding helps keep untrusted strings inside a field, but it does not make every downstream text viewer safe. Avoid concatenating untrusted values into log messages. If a human-readable log format is used, sanitize control characters and line breaks to prevent forged entries.

## Logging is not a database

A log store is not an appropriate place for every business record. Store durable application state in the database. Use logs for operational and security-relevant events that help explain what the application did. Avoid verbose “log everything” behavior: it increases cost, exposes more data, and can make important events harder to find.

Set retention and access rules based on the data's purpose. Restrict who can read and change telemetry, protect data in transit and at rest, and monitor ingestion failures. Use sampling for high-volume traces when necessary, while preserving enough error and latency data to investigate incidents. Logs, metrics, traces, and security audit events may need different retention policies.

## Practical example workflow

For one API call, a useful workflow is:

1. Generate a request ID and add it to the response header.
2. Let HTTP and Express instrumentation create spans and propagate trace context.
3. Write a structured completion log with method, route, status, duration, request ID, and active trace/span IDs.
4. Write focused application-event logs for important success, rejection, or retry decisions.
5. On an unhandled failure, log a protected error record once and return a generic response containing the request ID.
6. Use the trace to find slow spans and the log to find detailed application events.

## Common mistakes

- Logging whole request objects, headers, cookies, bodies, or authorization values.
- Treating a request ID as if it were a distributed trace ID.
- Accepting a client-supplied ID and using it as authenticated identity.
- Recording full URLs with tokens or private query parameters.
- Writing unstructured messages that cannot be filtered by fields.
- Logging every error at every middleware layer and producing duplicate noise.
- Returning stack traces, database errors, or secret values to API clients.
- Starting telemetry after Express or database modules have already loaded.
- Sending high-cardinality or sensitive user data as trace attributes.
- Assuming background jobs inherit an HTTP trace context automatically.
- Retaining all logs forever or granting broad access to telemetry.
- Expecting app logs to show requests rejected upstream by a proxy.

## Observability review checklist

Before deploying, confirm that:

- Request-completion logs are structured and include a stable service name and environment.
- Request IDs and distributed trace IDs are distinct and correlated correctly.
- HTTP method, route template, status, duration, and relevant event names are recorded.
- Sensitive headers and body fields are excluded or redacted before emission.
- Unhandled errors are logged once with a generic client response.
- OpenTelemetry starts before the app and uses a configured exporter or collector.
- Background jobs receive suitable correlation context.
- Retention, access, sampling, and telemetry failure behavior are deliberate.
- Proxy and platform logs cover requests that never reach Express.

## Summary

Structured logs describe selected events; metrics show trends; traces connect operations across a request's path. Generate request IDs for local log lookup, use trace and span IDs for distributed work, and correlate them without treating either as identity. Record only the fields needed to operate the service, redact secrets before emission, and configure instrumentation, exporters, retention, and access deliberately.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [056 - File uploads and validation](056-file-uploads-and-validation.md) | [Q&A](../qnas/057-logging-and-request-tracing.md) | [Example](../examples/057-logging-and-request-tracing.md) | [058 - API documentation and versioning](058-api-documentation-and-versioning.md) |
