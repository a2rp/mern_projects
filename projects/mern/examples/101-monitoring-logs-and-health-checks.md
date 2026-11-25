# 101 - Monitoring, logs, and health checks: Example

This example instruments a production Express API with request IDs, structured logs, bounded metrics, safe health checks, and an incident runbook. Keep the application's existing centralized error response, CSRF middleware, session handling, and monitoring client.

## 1. Add request correlation and safe request logs

~~~~js
// server/src/middleware/request-observability.js
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

function routeTemplate(req) {
  if (typeof req.route?.path !== "string") return "unmatched";
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
      environment: process.env.NODE_ENV,
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

Register it early so later routes and error handling can access <code>req.requestId</code>:

~~~~js
app.use(requestObservability);
~~~~

The record intentionally omits the raw URL, query string, request body, user-provided identifiers, cookies, and authorization headers. Use the route template and request ID to find related diagnostics without copying private input into logs.

## 2. Log sanitized errors

Use the existing central error handler. Log a request ID and safe category, then return the application's established public error shape:

~~~~js
app.use((error, req, res, next) => {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? "error" : "warn",
    service: "mern-api",
    event: "http.request.failed",
    requestId: req.requestId,
    method: req.method,
    route: req.route?.path ?? "unmatched",
    statusCode,
    errorName: error.name
  }));

  // Keep the response shape used by the application.
  res.status(statusCode).json({
    error: {
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
      message: statusCode >= 500
        ? "The request could not be completed."
        : "The request was rejected."
    },
    requestId: req.requestId
  });
});
~~~~

In the actual application, map known validation and authorization errors to approved public messages. Do not serialize the complete error object or return arbitrary exception messages.

## 3. Define bounded metrics

Configure the selected metrics client to expose or export a focused set:

| Metric | Bounded dimensions | Operational question |
| --- | --- | --- |
| HTTP request count | Method, route template, status class | How much traffic and how many failures? |
| HTTP request duration | Method, route template | Which important routes are slow? |
| Active requests | Service instance | Is the API saturated or draining? |
| Process memory and restarts | Instance or service | Is memory growing or the process crashing? |
| MongoDB operation failures | Operation class, safe error category | Is the database path failing? |
| MongoDB pool wait and connections | Client role or service instance | Is the database pool saturated? |
| Session store failures and latency | Operation class | Are authentication sessions unavailable? |

Use route templates such as <code>/api/courses/:courseId</code>, not raw URLs. Never use request IDs, emails, session IDs, user IDs, or arbitrary query values as metric labels. They create unbounded cardinality and may expose private data.

Set alert thresholds from service objectives and measured behavior. These signal names do not prescribe universal threshold values.

## 4. Separate liveness and readiness

Register simple probes where the platform can reach them:

~~~~js
app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health/ready", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: "not-ready" });
  }

  res.status(200).json({ status: "ready" });
});
~~~~

Use <code>/health/live</code> to ask whether the process responds and <code>/health/ready</code> to decide whether it should receive normal traffic. Do not include a MongoDB host, name, URI, or raw error in either response.

A temporary database outage should normally make the API unready, rather than cause all otherwise healthy processes to restart repeatedly.

## 5. Correlate one reported request

A user reports a slow course page and shares the response's request ID. Follow this path:

~~~~text
request ID from browser
  -> structured API completion log
  -> trace for the request
  -> Express route span
  -> MongoDB operation span
  -> route latency and pool-wait metric trend
~~~~

Logs show what happened to the request. Metrics show whether the issue is widespread. Traces show where time was spent. Propagate valid trace context across trusted services and keep private data out of span attributes.

## 6. Build an investigation dashboard

Show these panels over a consistent time range:

1. Request count by route template and status class.
2. Error rate and latency for important routes.
3. Ready and unready API instance counts.
4. Process restarts, memory, CPU, and event-loop delay.
5. MongoDB connections, operation failures, and pool wait.
6. Session-store errors and latency.
7. Deployment revision markers.

If the system has background jobs, add queue depth and oldest-job age. Display units and aggregation clearly.

## 7. Write an actionable alert

Use the product's actual service objective. The alert should identify:

- The affected user journey or service.
- The SLI and measurement window that crossed the objective.
- Whether the symptom affects one instance or the whole service.
- The relevant dashboard and runbook.
- The service owner or escalation route.

Group symptoms from a shared dependency failure so a database outage does not generate separate pages for every downstream error.

## 8. Example incident: errors after a release

### Signal

The API error-rate alert fires shortly after revision <code>release-2026-11-22.3</code>. Readiness remains healthy for some instances but fails for others.

### First checks

1. Confirm the affected environment and routes on the dashboard.
2. Compare the start time with deployment revision markers.
3. Check readiness counts and sanitized startup logs by instance.
4. Compare MongoDB connection use and pool wait with the prior time range.
5. Find one failed request by its request ID and inspect its trace.
6. Check whether the release changed a secret name, network route, database role, or startup configuration.

### Safe mitigation

If the release is the likely cause and the prior revision is schema-compatible, route traffic back to the prior artifact and configuration. Preserve the failed revision and sanitized diagnostics.

### After recovery

Record user impact, cause, mitigation, affected revisions, and follow-up work. Add a focused check or deployment guard that would detect the same failure earlier.

## 9. Review telemetry privacy

Before adding a field, label, or trace attribute, ask whether it answers an operational question, can contain personal data or credentials, has a safer bounded alternative, and is covered by access and retention rules.

Remove raw request and response bodies from routine instrumentation. Redact sensitive fields before telemetry leaves the process. Restrict access to production logs and traces and choose a deliberate retention period.

## 10. Production review

- [ ] A browser request receives an <code>X-Request-ID</code> header.
- [ ] The request ID appears in completion and sanitized error logs.
- [ ] Logs omit queries, bodies, cookies, and tokens.
- [ ] Metrics use bounded labels and clear units.
- [ ] Traces can follow important API and database work.
- [ ] Readiness and liveness have distinct responsibilities.
- [ ] Health responses reveal no private infrastructure details.
- [ ] Alerts identify user impact and link to a runbook.
- [ ] Dashboards show traffic, errors, latency, saturation, and releases.
- [ ] Telemetry access and retention are reviewed.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [100 - Continuous integration: lint, test, and build](100-continuous-integration-lint-test-and-build.md) | [Lesson](../lessons/101-monitoring-logs-and-health-checks.md) | [Q&A](../qnas/101-monitoring-logs-and-health-checks.md) | [Example](101-monitoring-logs-and-health-checks.md) | [102 - Backups, migrations, recovery, and releases](102-backups-migrations-recovery-and-releases.md) |
