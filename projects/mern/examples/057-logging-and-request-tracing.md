# 057 - Logging and request tracing: example

This example adds structured request logging and OpenTelemetry tracing to the Express API used in earlier chapters. Pino writes JSON logs, `pino-http` records request completion, each service request gets a generated request ID, and application logs include active trace and span IDs when OpenTelemetry is available.

The code is educational material and is not run. Integrate it into the existing application and keep its established authentication, MongoDB connection, routes, and final error handling. The console span exporter is for local learning; production should export telemetry to a protected collector or backend.

## What the example demonstrates

- Generate a request ID on the server and return it in `X-Request-ID`.
- Log method, safe route path, status, and duration as structured JSON.
- Avoid request bodies, query strings, cookies, authorization headers, and arbitrary headers in access logs.
- Correlate application log records with an active OpenTelemetry trace and span.
- Initialize HTTP and Express instrumentation before loading the app.
- Log an unexpected failure once and return a generic error with the request ID.

## Install packages

Use a supported Node.js 22 release. Keep the OpenTelemetry SDK and instrumentation packages compatible with one another. Express and the Mongoose model are already used in this course.

~~~powershell
npm install pino pino-http @opentelemetry/api
npm install @opentelemetry/sdk-node @opentelemetry/sdk-trace @opentelemetry/auto-instrumentations-node
~~~

## Initialize tracing before loading the app

Create **instrumentation.mjs** at the project root. OpenTelemetry must start before `app.js` imports Express and other instrumented dependencies. This local configuration prints spans for learning; use a configured OTLP exporter and collector for production.

~~~js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
~~~

## Add request logging and correlated application events

The example assumes the application already has `requireAuth` middleware that sets `req.user.id` and an `Order` Mongoose model. Adapt those imports to the project. The database query scopes the order to the authenticated user; the request ID and trace context do not grant access.

~~~js
const express = require("express");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { randomUUID } = require("node:crypto");
const { trace } = require("@opentelemetry/api");
const { Order } = require("./models/order");
const { requireAuth } = require("./middleware/require-auth");

const app = express();
app.disable("x-powered-by");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "mern-api",
    environment: process.env.NODE_ENV || "development",
  },
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "user.password",
      "user.accessToken",
    ],
    censor: "[REDACTED]",
  },
});

app.use(
  pinoHttp({
    logger,
    genReqId(_req, res) {
      // Generate a fresh ID here; do not trust an arbitrary client header.
      const requestId = randomUUID();
      res.setHeader("X-Request-ID", requestId);
      return requestId;
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    wrapSerializers: false,
    serializers: {
      // Use an allowlist. In particular, omit headers and query strings.
      req(req) {
        return {
          id: req.id,
          method: req.method,
          path: req.url ? req.url.split("?")[0] : undefined,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
      err: pino.stdSerializers.err,
    },
  }),
);

// Bind request and active trace context to application-event logs.
app.use((req, _res, next) => {
  const spanContext = trace.getActiveSpan()?.spanContext();
  const fields = {
    requestId: req.id,
    ...(spanContext
      ? {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
        }
      : {}),
  };

  req.log = req.log.child(fields);
  next();
});

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.get(
  "/api/orders/:orderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      _id: req.params.orderId,
      ownerId: req.user.id,
    }).lean();

    if (!order) {
      req.log.warn({ event: "order.lookup.not_found" }, "Order was not available to this user");
      return res.status(404).json({ error: "Order not found." });
    }

    req.log.info({ event: "order.lookup.completed" }, "Order lookup completed");
    return res.json({ id: order._id, status: order.status });
  }),
);

// Keep this after routes. Record an unhandled error once, then send a generic
// response; never expose the internal message or stack to the API caller.
app.use((error, req, res, next) => {
  req.log?.error(
    { event: "http.request.failed", err: error },
    "Unhandled request error",
  );

  if (res.headersSent) return next(error);
  return res.status(500).json({
    error: "Internal server error.",
    requestId: req.id,
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  logger.info({ event: "server.started", port }, "MERN API is listening");
});
~~~

The request serializer deliberately records only a pathname, not query values or headers. The server-generated request ID is useful for finding one request's logs. When instrumentation has created an active span, application logs also include its trace and span IDs. If tracing is not configured, those optional fields are omitted.

## Start the instrumented app

Run Node with the instrumentation module preloaded. The environment variable sets the OpenTelemetry service name for exported spans.

~~~powershell
$env:OTEL_SERVICE_NAME = "mern-api"
node --import ./instrumentation.mjs app.js
~~~

Visit an authenticated order route. The output will include structured JSON request-completion and application-event logs. During local learning, spans will also be printed by the console exporter.

A Pino application-event record will look similar to:

~~~json
{
  "level": 30,
  "time": 1795300000000,
  "service": "mern-api",
  "environment": "development",
  "requestId": "a-server-generated-request-id",
  "traceId": "a-distributed-trace-id-when-tracing-is-active",
  "spanId": "the-active-span-id-when-tracing-is-active",
  "event": "order.lookup.completed",
  "msg": "Order lookup completed"
}
~~~

The request-completion record also includes the method, pathname, response status, and response duration. Exact field names and timing values depend on the logger configuration and the request.

## Expected behavior

- A successful authenticated lookup returns the order response and produces a completion log.
- A missing or unauthorized order returns `404` and records a safe `order.lookup.not_found` event.
- An unexpected application error is logged server-side with the request and active trace context, while the client receives only a generic `500` response and a request ID.
- The response header includes `X-Request-ID` for support and log lookup.
- OpenTelemetry exports spans for supported instrumented operations when the instrumentation module starts first.
- Passwords, cookies, authorization headers, query strings, and full request bodies are not included in these access or application logs.

## Production considerations

- Replace `ConsoleSpanExporter` with a protected exporter and collector. Console output is for local learning and can create noisy or sensitive container logs.
- Configure a stable service name, deployment environment, resource attributes, and an exporter endpoint through deployment configuration; never commit telemetry credentials.
- Shut down and flush telemetry during graceful server shutdown so buffered spans are not lost.
- Confirm the OpenTelemetry SDK and instrumentations load before the application modules and match the versions of Express and database drivers.
- Do not blindly accept a client `X-Request-ID`. If a trusted gateway supplies an upstream ID, validate it and trust it only on traffic that cannot bypass that gateway.
- Trace context and request IDs are not authentication, authorization, or rate-limit identity.
- Add only fields needed for operations. Avoid PII, full URLs, raw request/response bodies, secrets, and unbounded user-provided values.
- Define retention, access controls, redaction, sampling, and alerting for logs and traces.
- Configure proxy and platform logs for requests rejected before they reach Express.
- Use application audit records for required business/security events; do not assume operational debug logs are a durable audit ledger.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [056 - File uploads and validation](../lessons/056-file-uploads-and-validation.md) | [Q&A](../qnas/057-logging-and-request-tracing.md) | [058 - API documentation and versioning](../lessons/058-api-documentation-and-versioning.md) |
