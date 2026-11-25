# 101 - Monitoring, logs, and health checks

A deployed MERN application needs signals that help its operators answer three questions: is it available, is it behaving correctly, and where should an investigation begin? Useful monitoring combines structured logs, service and dependency metrics, request tracing, health checks, actionable alerts, and an incident response process.

This chapter applies those ideas to the React edge, Express API, MongoDB, session store, and background work. Chapter 098 introduced API readiness and deployment health; this chapter connects those probes to ongoing operations.

## Learning outcomes

After this chapter, you should be able to:

- Distinguish logs, metrics, traces, and health checks.
- Emit structured, privacy-conscious API logs.
- Correlate a browser request with API and database work.
- Choose metrics that describe availability, latency, errors, and saturation.
- Avoid high-cardinality metric labels and sensitive data.
- Design useful liveness and readiness checks.
- Define alerts and service objectives around user impact.
- Use a dashboard and runbook during an incident.

## 1. Build an observability model

Observability is the ability to understand a system's internal behavior from the signals it emits. Common signal types have different roles:

| Signal | Useful for |
| --- | --- |
| Logs | Understanding a specific event and its context |
| Metrics | Seeing aggregate values and trends over time |
| Traces | Following one request across application components |
| Health checks | Deciding whether an instance should receive traffic or be restarted |

A metric can reveal that API errors increased. Logs can show the sanitized errors around that time. A trace can show that the affected requests waited on MongoDB. No one signal answers every question.

Instrument the user request path from browser through the edge to Express and MongoDB. Add session store, file storage, email, and background workers where they affect user-visible behavior.

## 2. Log events as structured records

Structured logs use consistent fields instead of prose that must be parsed later. A useful API request record can contain:

- Timestamp.
- Severity.
- Service and environment.
- Request ID or trace ID.
- HTTP method and route template.
- Response status.
- Duration.
- A safe error category when a request fails.

A JSON record might look like:

~~~~json
{
  "timestamp": "2026-11-22T12:00:00.000Z",
  "level": "info",
  "service": "mern-api",
  "environment": "production",
  "event": "http.request.completed",
  "requestId": "e5227284-50d0-4846-a218-458a35b843de",
  "method": "GET",
  "route": "/api/courses/:courseId",
  "statusCode": 200,
  "durationMs": 18.7
}
~~~~

The values are illustrative. Use the platform's standard output and error collection or a supported logging transport. Keep fields consistent across instances so records can be filtered and correlated.

## 3. Add a request ID and completion log

Generate a request ID at the API edge or in the API, validate any trusted upstream ID, and return the chosen ID in a response header. Do not blindly accept arbitrary values from an untrusted client as an internal trace identifier.

A small Express example:

~~~~js
// server/src/middleware/request-observability.js
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

function routeTemplate(req) {
  if (typeof req.route?.path !== "string") {
    return "unmatched";
  }

  return req.baseUrl + req.route.path;
}

export function requestObservability(req, res, next) {
  const requestId = randomUUID();
  const startedAt = performance.now();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.once("finish", () => {
    const record = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : "info",
      service: "mern-api",
      event: "http.request.completed",
      requestId,
      method: req.method,
      route: routeTemplate(req),
      statusCode: res.statusCode,
      durationMs: Number((performance.now() - startedAt).toFixed(1))
    };

    process.stdout.write(JSON.stringify(record) + "\n");
  });

  next();
}
~~~~

Place request ID middleware early enough that later middleware and error handlers can use the identifier. Attach the request ID to sanitized error logs too.

This minimal sample is for teaching. A production logger should handle write failures, consistent severity, redaction, and output transport. Do not log raw URL query strings, request bodies, authorization headers, cookies, session identifiers, passwords, or database URIs. Use route templates rather than arbitrary path values.

## 4. Choose log levels and event names

Use levels consistently:

- **Debug:** detailed diagnostics, normally restricted or disabled in production.
- **Info:** routine lifecycle and request events.
- **Warn:** unexpected conditions that may need attention but are currently handled.
- **Error:** a failed operation that requires investigation or a user-visible failure.

Include a stable event name such as <code>database.connection.failed</code> or <code>session.store.unavailable</code>. Keep the message and structured fields useful without repeating sensitive values.

Avoid logging the same error at every layer. Log once where the application has enough context to classify it, then return the sanitized response established by the error-handling chapter.

## 5. Protect personal and secret data

Logs can become a sensitive data store. Restrict access, choose retention deliberately, and avoid collecting values that the team does not need.

Do not log:

- Passwords, password hashes, or reset tokens.
- Session cookies, authorization headers, CSRF tokens, or bearer tokens.
- Full database connection strings or secret values.
- Full request or response bodies by default.
- Private file contents or storage credentials.
- Unnecessary personal information.

If a support workflow needs user correlation, prefer a stable internal identifier with access controls and avoid using email addresses as metric labels. Redact known sensitive fields before records leave the process. Masking only at a downstream dashboard is too late if the original log already contains the value.

## 6. Measure user-visible service behavior

Metrics aggregate behavior over time. Start with indicators for:

- **Traffic:** request count and background-job volume.
- **Errors:** failed requests and failed jobs.
- **Latency:** request duration percentiles and queue wait.
- **Saturation:** active requests, CPU, memory, event loop delay, and database pool pressure.

Break down API requests by method, route template, and status class. Do not use raw URL, user ID, email, request ID, or arbitrary query values as metric labels. Those values create unbounded cardinality and may expose private data.

For a MERN system, consider metrics for:

- API request count, latency, and error rate.
- Node process memory, CPU, restarts, and event loop delay.
- MongoDB connection count, pool checkout wait, and operation failures.
- Session store operation latency and failures.
- Queue depth, oldest job age, retries, and dead-letter count.
- Frontend asset errors and browser-reported API failures.
- Health probe status and deployment revision.

Choose metrics based on the system's actual architecture. Do not collect a metric simply because an agent or library can emit it.

## 7. Use traces to follow work across boundaries

A distributed trace follows one operation across services. For example:

~~~~text
browser navigation
  -> edge request
  -> Express route
  -> MongoDB query
  -> response
~~~~

Propagate a valid trace context across trusted components and create spans around meaningful work. Record service name, operation, duration, and sanitized outcome.

Do not include tokens, cookies, raw user input, full database queries containing personal data, or request bodies in span attributes. Use sampling when tracing every request would be too expensive, but keep enough coverage for errors and slow requests.

A trace complements logs and metrics. A request ID is useful for looking up records; a trace context can represent one request's related spans across several services.

## 8. Design liveness and readiness checks

Liveness answers whether the process can respond. Readiness answers whether it should receive ordinary traffic.

A readiness check can verify required local dependencies such as the Mongoose connection state. It should not expose connection details. A liveness check should generally avoid making remote dependencies part of the restart decision: a brief database outage should not cause every healthy API process to restart repeatedly.

Use dependency-specific checks carefully:

- Check only services required for the instance to serve the traffic it will receive.
- Set timeouts and avoid expensive queries on every probe.
- Keep health endpoints outside authentication and CSRF flows where the platform needs to call them.
- Return a simple status, not server internals.
- Make the edge or orchestrator's traffic behavior match the readiness semantics.

Chapter 098 shows API route examples. Reuse those routes rather than creating another inconsistent health response.

## 9. Define service objectives and alert on impact

A service-level indicator (SLI) measures a behavior users care about, such as successful requests or request latency. A service-level objective (SLO) sets a target over a stated window. An error budget is the amount of failure the target allows within that window.

Define objectives from the product's requirements and real baseline data. Do not copy a universal percentage without deciding what counts as an eligible request and how the measurement window works.

Alerts should identify user impact and prompt an action. Useful alert areas include:

- Sustained API error-rate increase.
- High latency for important routes.
- Readiness failures across instances.
- Database connection exhaustion or sustained pool wait.
- Queue backlog or oldest-job age beyond an operational limit.
- Repeated process restarts or memory pressure.
- Failure of a critical user journey.

Prefer a few actionable alerts over a large set of noisy thresholds. Group related symptoms so one database incident does not page the team independently from every API metric it affects.

## 10. Build dashboards for investigation

A useful overview dashboard can show:

1. Request volume, error rate, and latency over the same time range.
2. Healthy and unready API instance counts.
3. Database connections, operation latency, and pool wait.
4. Process restarts, memory, CPU, and event loop delay.
5. Session store or queue health if those components are in use.
6. Deployment revision markers overlaid on the time series.

Use a separate service or route dashboard for deeper inspection. Keep axes, units, time windows, and aggregation clear. An alert should link to a dashboard and a runbook that explains the first diagnostic steps.

## 11. Preserve useful telemetry through errors

The centralized error handler should:

- Return the safe public error shape from the API design.
- Attach the request ID to the response.
- Log a sanitized category and safe diagnostic fields once.
- Avoid serializing the entire error object when it may include request or connection data.
- Track expected client errors separately from unexpected server failures.

Do not count every validation error as an infrastructure incident. Distinguish expected user mistakes, authentication failures, rate limits, dependency outages, and programming errors in metrics while keeping labels bounded.

## 12. Respond to an incident with a consistent sequence

When an alert fires:

1. Confirm whether users are affected and which routes or environments are involved.
2. Check when the symptom began and whether a deployment or configuration change preceded it.
3. Compare traffic, errors, latency, readiness, database health, and queue depth.
4. Use a request ID or trace to inspect a representative failed or slow request.
5. Identify the smallest safe mitigation, such as rollback or removing an unhealthy instance.
6. Preserve evidence while avoiding the collection of secrets or unnecessary personal data.
7. Communicate status through the team's established process.
8. After recovery, record the cause, impact, actions, and prevention work.

A runbook should state who owns the service, how to find dashboards and logs, how to roll back, and which actions require additional review.

## 13. Review telemetry cost and retention

Log volume, trace sampling, metric cardinality, and retention affect cost and privacy. Review them as the application grows.

- Drop fields that do not help operate the service.
- Use bounded route names and controlled dimensions.
- Sample routine successful traces if full capture is unnecessary.
- Preserve higher diagnostic value for errors and slow requests where supported.
- Set access and retention to match operational and data-handling needs.
- Review access to production telemetry as carefully as access to production data.

Do not reduce telemetry so far that an incident cannot be diagnosed. Use representative tests or a staging review to confirm important failure signals remain visible.

## Common mistakes

- Treating application logs as unstructured free-form text.
- Logging request bodies, cookies, tokens, or full database URIs.
- Using user IDs or raw URLs as high-cardinality metric labels.
- Adding a remote database check to liveness and restarting every API instance during an outage.
- Returning internal service details from a public health route.
- Alerting on every metric fluctuation instead of user-impacting symptoms.
- Creating so many alerts that responders ignore them.
- Logging the same exception at every middleware layer.
- Sampling away all traces for errors or slow requests.
- Keeping telemetry forever without access or retention controls.
- Having dashboards without runbooks or clear ownership.
- Deploying without recording a revision marker that operators can correlate with symptoms.

## Manually inspect production monitoring

1. Generate a request and confirm it has a request ID in the response and structured log.
2. Confirm logs use stable field names and a documented severity policy.
3. Confirm raw URL queries, request bodies, cookies, tokens, and database URIs are absent.
4. Confirm metrics use bounded route templates and do not label users or request IDs.
5. Confirm important API, database, session, and queue signals are visible where applicable.
6. Confirm liveness and readiness have different intended meanings.
7. Confirm alerts identify user impact and link to a runbook.
8. Confirm dashboards show traffic, errors, latency, saturation, and deployment revision.
9. Confirm telemetry access and retention are reviewed.
10. Walk through the incident response sequence with a realistic failure scenario.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [100 - Continuous integration: lint, test, and build](100-continuous-integration-lint-test-and-build.md) | [Lesson](101-monitoring-logs-and-health-checks.md) | [Q&A](../qnas/101-monitoring-logs-and-health-checks.md) | [Example](../examples/101-monitoring-logs-and-health-checks.md) | [102 - Backups, migrations, recovery, and releases](102-backups-migrations-recovery-and-releases.md) |
