# 054 - CSRF, XSS, and injection protection: example

This example extends the session API from chapter 051 and the authorization context from chapter 053. It creates private notes using a session-bound CSRF token, validates request values before building MongoDB queries, and renders note content as plain text in React.

The code is a learning example and is not run. Add the server snippets to the existing session application after its session middleware and use its existing account model. The account model must include the `organizationId` and `disabledAt` fields used in chapter 053. The browser must request a fresh CSRF token after login regenerates the session.

## What the example demonstrates

- Generate a synchronizer CSRF token for the active session and require it on mutations.
- Keep GET requests read-only.
- Load the account from the ID stored by the authenticated session.
- Validate exact request fields and scalar types.
- Build MongoDB filters from trusted server-controlled keys.
- Bind note reads and writes to the authenticated account and organization.
- Render user-supplied note text through React's ordinary text interpolation.
- Reject operator objects and attempts to change privileged fields.

## Prerequisites

Use the Express app, MongoDB connection, session middleware, account model, login route, and logout route from chapters 051 and 053. The login route sets `req.session.userId` after verifying the password and regenerating the session.

Install the packages if the project does not already have them:

~~~powershell
npm install express mongoose csrf-sync
~~~

Do not replace the session store with Express's default in-memory store for production. Keep the HTTPS and cookie configuration from chapter 051.

## Define a private note model

Create this model once in the application. If a note model already exists, merge the fields and indexes rather than defining a duplicate collection.

~~~js
const mongoose = require("mongoose");

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

noteSchema.index({ organizationId: 1, ownerId: 1, createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);
~~~

The server sets `organizationId`, `ownerId`, and `status`. The API never accepts them from the caller.

## Create the security router

Create **security-routes.js**. This router uses the existing account model, passed in as `User`, and the `Note` model above.

~~~js
const express = require("express");
const mongoose = require("mongoose");

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function validateNoteFields(body, { partial = false } = {}) {
  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    (Object.getPrototypeOf(body) !== Object.prototype &&
      Object.getPrototypeOf(body) !== null)
  ) {
    return { error: "A JSON object is required." };
  }

  const allowedKeys = new Set(["title", "body"]);
  const keys = Object.keys(body);

  if (keys.some((key) => !allowedKeys.has(key))) {
    return { error: "Only title and body may be supplied." };
  }

  if (partial && keys.length === 0) {
    return { error: "Provide at least one editable field." };
  }

  const values = {};

  for (const key of keys) {
    if (typeof body[key] !== "string") {
      return { error: `${key} must be a string.` };
    }

    const value = key === "title" ? body[key].trim() : body[key];

    if (key === "title" && (value.length < 1 || value.length > 120)) {
      return { error: "title must contain 1 to 120 characters." };
    }

    if (key === "body" && (value.length < 1 || value.length > 10000)) {
      return { error: "body must contain 1 to 10000 characters." };
    }

    values[key] = value;
  }

  if (!partial && (!Object.hasOwn(values, "title") || !Object.hasOwn(values, "body"))) {
    return { error: "Both title and body are required." };
  }

  return { values };
}

function parseListOptions(query) {
  const allowedStatuses = new Set(["draft", "published"]);
  const allowedSorts = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
  };

  let status;
  if (query.status !== undefined) {
    if (
      typeof query.status !== "string" ||
      !allowedStatuses.has(query.status)
    ) {
      return { error: "status must be draft or published." };
    }
    status = query.status;
  }

  let limit = 20;
  if (query.limit !== undefined) {
    if (typeof query.limit !== "string" || !/^\d{1,2}$/.test(query.limit)) {
      return { error: "limit must be an integer from 1 to 50." };
    }

    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return { error: "limit must be an integer from 1 to 50." };
    }
  }

  let sort = "newest";
  if (query.sort !== undefined) {
    if (
      typeof query.sort !== "string" ||
      !Object.prototype.hasOwnProperty.call(allowedSorts, query.sort)
    ) {
      return { error: "sort must be newest or oldest." };
    }
    sort = query.sort;
  }

  return { status, limit, sort: allowedSorts[sort] };
}

function requireSignedInUser(User) {
  return asyncHandler(async (req, res, next) => {
    const userId = req.session?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const user = await User.findById(userId)
      .select("_id organizationId disabledAt")
      .lean();

    if (!user || user.disabledAt || !user.organizationId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.user = {
      id: user._id,
      organizationId: user.organizationId,
    };

    next();
  });
}

function createSecurityRouter({ User, Note, csrfProtection }) {
  const router = express.Router();

  router.use(requireSignedInUser(User));

  router.get(
    "/notes",
    asyncHandler(async (req, res) => {
      const options = parseListOptions(req.query);

      if (options.error) {
        return res.status(400).json({ error: options.error });
      }

      const filter = {
        organizationId: req.user.organizationId,
        ownerId: req.user.id,
      };

      if (options.status) {
        filter.status = options.status;
      }

      const notes = await Note.find(filter)
        .select("_id title body status createdAt updatedAt")
        .sort(options.sort)
        .limit(options.limit)
        .lean();

      res.json({ notes });
    })
  );

  router.post(
    "/notes",
    csrfProtection,
    asyncHandler(async (req, res) => {
      const result = validateNoteFields(req.body);

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      const note = await Note.create({
        organizationId: req.user.organizationId,
        ownerId: req.user.id,
        title: result.values.title,
        body: result.values.body,
        status: "draft",
      });

      res.status(201).json({
        note: {
          id: note.id,
          title: note.title,
          body: note.body,
          status: note.status,
          createdAt: note.createdAt,
        },
      });
    })
  );

  router.patch(
    "/notes/:noteId",
    csrfProtection,
    asyncHandler(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(404).json({ error: "Note not found." });
      }

      const result = validateNoteFields(req.body, { partial: true });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      const note = await Note.findOneAndUpdate(
        {
          _id: req.params.noteId,
          organizationId: req.user.organizationId,
          ownerId: req.user.id,
          status: "draft",
        },
        { $set: result.values },
        { new: true, runValidators: true }
      )
        .select("_id title body status createdAt updatedAt")
        .lean();

      if (!note) {
        return res.status(404).json({ error: "Note not found." });
      }

      res.json({ note });
    })
  );

  router.delete(
    "/notes/:noteId",
    csrfProtection,
    asyncHandler(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(404).json({ error: "Note not found." });
      }

      const deleted = await Note.findOneAndDelete({
        _id: req.params.noteId,
        organizationId: req.user.organizationId,
        ownerId: req.user.id,
        status: "draft",
      })
        .select("_id")
        .lean();

      if (!deleted) {
        return res.status(404).json({ error: "Note not found." });
      }

      res.status(204).end();
    })
  );

  return router;
}

module.exports = { createSecurityRouter };
~~~

The router does not accept MongoDB filters, update operators, sort objects, or privileged fields from the request. It selects query structure itself and checks IDs, scalar types, allowed values, and field lengths.

## Connect CSRF protection to the existing session app

In **server.js**, keep the existing session setup from chapter 051. The JSON parser and session middleware must be registered before the CSRF token route and API router.

~~~js
const express = require("express");
const { csrfSync } = require("csrf-sync");
const { User } = require("./models/user");
const { Note } = require("./models/note");
const { createSecurityRouter } = require("./security-routes");

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(existingSessionMiddleware);

const {
  generateToken,
  csrfSynchronisedProtection: csrfProtection,
} = csrfSync();

// This endpoint creates or returns a token associated with the current session.
app.get("/api/csrf-token", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ csrfToken: generateToken(req) });
});

app.use(
  "/api",
  createSecurityRouter({
    User,
    Note,
    csrfProtection,
  })
);

// Handle rejected CSRF tokens without exposing internals.
app.use((error, req, res, next) => {
  if (error?.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token." });
  }

  console.error("API request failed", {
    name: error?.name || "Error",
    method: req.method,
    path: req.path,
  });

  res.status(500).json({ error: "An unexpected server error occurred." });
});
~~~

`existingSessionMiddleware` represents the configured MongoDB-backed session middleware from chapter 051; keep its actual configuration and do not copy this placeholder literally. The account and note model exports should match your project. Connect to MongoDB and start listening using the existing server startup code.

The CSRF package reads the token from the `x-csrf-token` header by default. The middleware ignores safe methods by default, but every state-changing route above explicitly includes the protection middleware to make the requirement visible. Keep login and logout protected as shown in chapter 051.

## React client: fetch a token and render text

After login, get a fresh token for the authenticated session. Send it only in the header of state-changing requests:

~~~jsx
import { useEffect, useState } from "react";

export function NotesPage() {
  const [csrfToken, setCsrfToken] = useState("");
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/csrf-token", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not get a CSRF token.");
        return response.json();
      })
      .then((data) => {
        if (active) setCsrfToken(data.csrfToken);
      })
      .catch(() => {
        if (active) setError("Could not prepare a secure request.");
      });

    fetch("/api/notes", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load notes.");
        return response.json();
      })
      .then((data) => {
        if (active) setNotes(data.notes);
      })
      .catch(() => {
        if (active) setError("Could not load notes.");
      });

    return () => {
      active = false;
    };
  }, []);

  async function createNote(event) {
    event.preventDefault();
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: String(form.get("title") || ""),
      body: String(form.get("body") || ""),
    };

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the note.");
      }

      setNotes((current) => [data.note, ...current]);
      formElement.reset();
    } catch (requestError) {
      setError(requestError.message || "Could not save the note.");
    }
  }

  return (
    <main>
      <h1>My notes</h1>

      <form onSubmit={createNote}>
        <label>
          Title
          <input name="title" maxLength={120} required />
        </label>

        <label>
          Note
          <textarea name="body" maxLength={10000} required />
        </label>

        <button type="submit" disabled={!csrfToken}>
          Save draft
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <ul>
        {notes.map((note) => (
          <li key={note._id}>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
            <small>{note.status}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
~~~

React renders `note.title` and `note.body` as text in this component. If a note contains `<img src=x onerror=alert(1)>`, the text appears literally; the browser does not create that image element. Do not replace the paragraph with `dangerouslySetInnerHTML` for plain text.

If the product later supports rich HTML, use a maintained sanitizer with an explicit allowlist, validate link schemes, and review every raw HTML insertion point. Keep a Content Security Policy as an additional layer rather than relying on it to fix unsafe rendering.

## What the API accepts

A valid create request contains only the editable fields:

~~~json
{
  "title": "My draft",
  "body": "This is plain note text."
}
~~~

The server supplies the owner, organization, and draft status from trusted state.

These inputs are rejected:

~~~json
{
  "title": { "$ne": null },
  "body": "Try an operator object."
}
~~~

~~~json
{
  "title": "Attempt to change ownership",
  "body": "Still not allowed.",
  "ownerId": "another-account-id",
  "status": "published"
}
~~~

The first request fails because `title` is not a string. The second fails because it includes fields outside the allowlist. Neither request reaches a MongoDB update.

## Expected behavior

| Request | Expected result |
| --- | --- |
| Authenticated user requests `GET /api/notes` | 200 with only that user's notes in the trusted organization |
| Anonymous user requests `GET /api/notes` | 401; no notes are returned |
| Valid create with a session-bound `x-csrf-token` | 201; server assigns owner, organization, and draft status |
| Create without a CSRF token | 403; no note is created |
| Create with `title` as an object or array | 400; no MongoDB filter or update is built from it |
| Create with extra `ownerId`, `organizationId`, or `status` | 400; privileged fields are rejected |
| Update another user's note or a published note | 404 under this example's concealment policy |
| Note body contains HTML-looking text and is rendered by React | It appears as text, not executable markup |

For manual API requests, use the session cookie and CSRF token obtained from the existing login flow. A state-changing request must send both:

~~~http
POST /api/notes
Content-Type: application/json
Cookie: __Host-mern.sid=<session-cookie>
x-csrf-token: <session-bound-token>

{
  "title": "Manual request",
  "body": "A legitimate draft."
}
~~~

Do not put either token in a URL or paste a real session value into source control or logs.

## Review the protections

1. Send a POST without the CSRF header. Confirm a 403 response and no inserted note.
2. Fetch `/api/csrf-token` for the current session and retry with the returned token. Confirm a 201 response.
3. Sign out and attempt the same request with the old session. Confirm a 401 response.
4. Submit an object or array where a string is required. Confirm a 400 response.
5. Submit unexpected fields such as `ownerId`, `organizationId`, `status`, or `$where`. Confirm rejection and inspect the database for no unauthorized change.
6. Change a note ID to another user's ID. Confirm the scoped query returns 404.
7. Store HTML-looking text and inspect the React page. Confirm it is displayed literally.
8. Verify that all GET routes are read-only and all state-changing routes use CSRF protection.

## Production considerations

- Use HTTPS, a secure session cookie, an appropriate SameSite policy, and a durable shared session store.
- Treat SameSite and CORS as supporting controls; keep the synchronizer token for cookie-authenticated mutations unless the deployment has a reviewed alternative.
- Refresh the CSRF token after login or other session regeneration.
- Apply authentication and authorization checks as well as CSRF checks; a valid token does not grant access.
- Validate nested input shapes and size limits, not only top-level field names.
- Keep user content as text unless rich HTML is required. If it is, define and maintain a sanitizer allowlist.
- Validate any user-controlled URLs against allowed schemes and destinations.
- Keep CSP and security headers as defense in depth; chapter 055 covers API hardening.
- Avoid logging session cookies, CSRF tokens, passwords, bearer tokens, and sensitive request bodies.
- Test all state-changing methods, including less common routes and administrative endpoints.

## Expected learning outcome

A cookie-authenticated browser mutation is rejected unless it carries the CSRF token for its current session. The API accepts only validated scalar note fields and builds MongoDB filters from the server's authenticated user and organization. React renders saved note content as text, so markup-looking input is not executed.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [053 - Authorization and role-based access](../lessons/053-authorization-and-role-based-access.md) | [Q&A](../qnas/054-csrf-xss-and-injection-protection.md) | [055 - Rate limits, security headers, and API hardening](../lessons/055-rate-limits-security-headers-and-api-hardening.md) |
