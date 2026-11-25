# 092 - File uploads end to end: Example

This example adds a private, authenticated JPEG/PNG upload feature to the MERN application from the previous chapters. The browser submits <code>FormData</code>; Express limits multipart input; the server detects the type from file bytes, moves it to private storage under a generated key, and records ownership in MongoDB. List, download, and delete queries are scoped to the authenticated user.

The code assumes the application already has the Chapter 091 session setup. Its <code>requireAuth</code> middleware sets <code>req.user.id</code>, and its global CSRF middleware checks <code>X-CSRF-Token</code> on state-changing requests. The API is exposed to the browser under <code>/api</code>.

This is a learning example, not a complete production upload service. Add the product's quotas, abuse controls, malware scanning, durable storage, monitoring, and recovery policy before accepting public uploads.

## 1. Install the server packages

~~~~text
# server dependencies
express
mongoose
multer
file-type
~~~~

Use a maintained Node.js release and dependency versions compatible with the project. The <code>file-type</code> package is ESM; this example uses ESM throughout.

## 2. Configure a private storage root

Add a private absolute path to the server's local environment. Keep this file out of version control.

~~~~text
# server/.env.local
PRIVATE_UPLOAD_DIR=/absolute/path/outside/the/web-root/mern-uploads
~~~~

For Windows development, set <code>PRIVATE_UPLOAD_DIR</code> to an absolute directory such as <code>D:\mern-private\uploads</code>. Do not place it under <code>client/public</code>, a web server document root, or a directory passed to <code>express.static</code>. Load the environment before importing application modules; for a Node.js release that supports environment files, start the server from its directory with:

~~~~text
node --env-file=.env.local src/server.js
~~~~

A deployment process manager can inject the same variable directly instead.

~~~~js
// server/src/features/uploads/upload.storage.js
import path from "node:path";
import { mkdir, rename, unlink } from "node:fs/promises";

const uploadRoot = process.env.PRIVATE_UPLOAD_DIR;

if (!uploadRoot || !path.isAbsolute(uploadRoot)) {
  throw new Error("PRIVATE_UPLOAD_DIR must be an absolute private path.");
}

export const stagingDirectory = path.join(uploadRoot, "staging");
export const filesDirectory = path.join(uploadRoot, "files");

export async function prepareUploadStorage() {
  await Promise.all([
    mkdir(stagingDirectory, { recursive: true }),
    mkdir(filesDirectory, { recursive: true })
  ]);
}

function pathForStorageKey(storageKey) {
  const matches = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/i.exec(
    storageKey
  );

  if (!matches) {
    const error = new Error("Stored file is unavailable.");
    error.status = 404;
    throw error;
  }

  return path.join(filesDirectory, storageKey);
}

export async function moveToPrivateStorage(stagedPath, storageKey) {
  await rename(stagedPath, pathForStorageKey(storageKey));
  return pathForStorageKey(storageKey);
}

export async function removeStagedFile(filePath) {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function removeStoredFile(storageKey) {
  return removeStagedFile(pathForStorageKey(storageKey));
}

export function storedFilePath(storageKey) {
  return pathForStorageKey(storageKey);
}
~~~~

The staging and final directories are under the same root so the move normally stays on one filesystem. The storage key format is checked again before joining it to the private directory.

Create these directories before listening for requests:

~~~~js
// server/src/server.js
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { prepareUploadStorage } from "./features/uploads/upload.storage.js";
import { config } from "./config/index.js";

await connectDatabase(config.mongoUri);
await prepareUploadStorage();

const app = createApp(config);
app.listen(config.port, () => {
  console.log("API server listening on port " + config.port);
});
~~~~

## 3. Add the metadata model

The database record stores the authenticated owner, generated key, detected content type, byte count, and safe display name. The actual bytes remain in private storage.

~~~~js
// server/src/features/uploads/upload.model.js
import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 120
    },
    mimeType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png"]
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024
    }
  },
  { timestamps: true }
);

uploadSchema.index({ ownerId: 1, createdAt: -1 });

export const Upload = mongoose.model("Upload", uploadSchema);
~~~~

The storage key is not selected by default and is never returned to the browser. The service selects it only when it needs to download or remove the file.

## 4. Create bounded multipart middleware

Multer stages exactly one expected file and applies finite request limits. It does not trust the provided MIME type for acceptance; byte inspection happens after parsing.

~~~~js
// server/src/features/uploads/upload.middleware.js
import multer from "multer";
import { randomUUID } from "node:crypto";
import { stagingDirectory } from "./upload.storage.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const receiveOneFile = multer({
  storage: multer.diskStorage({
    destination: stagingDirectory,
    filename(_request, _file, callback) {
      callback(null, randomUUID());
    }
  }),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 100
  }
}).single("file");

export function parseOneUpload(req, res, next) {
  receiveOneFile(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        const tooLarge = new Error("The image must be 5 MiB or smaller.");
        tooLarge.status = 413;
        return next(tooLarge);
      }

      const invalidForm = new Error("The upload form is invalid.");
      invalidForm.status = 400;
      return next(invalidForm);
    }

    next(error);
  });
}
~~~~

The upload route uses <code>requireAuth</code> before the parser so unauthenticated callers do not consume file storage. The application's CSRF middleware is registered before API routes, as in the authentication chapter.

## 5. Inspect bytes and create an upload

This service maps only verified JPEG and PNG signatures to server-controlled extensions. The browser's filename and MIME claim are used only as untrusted input.

~~~~js
// server/src/features/uploads/upload.service.js
import { randomUUID } from "node:crypto";
import { fileTypeFromFile } from "file-type";
import { Upload } from "./upload.model.js";
import {
  moveToPrivateStorage,
  removeStagedFile,
  removeStoredFile,
  storedFilePath
} from "./upload.storage.js";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"]
]);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function safeDisplayName(input) {
  const name = String(input ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 120);

  return name || "image";
}

function toPublicUpload(upload) {
  return {
    id: String(upload._id),
    name: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
    createdAt: upload.createdAt
  };
}

export async function createUpload({ ownerId, file }) {
  if (!file) {
    throw httpError(400, "Choose an image to upload.");
  }

  let stagedPath = file.path;
  let finalStorageKey = null;

  try {
    const detected = await fileTypeFromFile(stagedPath);
    const extension = detected && allowedTypes.get(detected.mime);

    if (!detected || !extension) {
      throw httpError(415, "Upload a JPEG or PNG image.");
    }

    const storageKey = randomUUID() + "." + extension;
    await moveToPrivateStorage(stagedPath, storageKey);
    stagedPath = null;
    finalStorageKey = storageKey;

    const upload = await Upload.create({
      ownerId,
      storageKey,
      originalName: safeDisplayName(file.originalname),
      mimeType: detected.mime,
      size: file.size
    });

    return toPublicUpload(upload);
  } catch (error) {
    if (stagedPath) {
      await removeStagedFile(stagedPath).catch(() => {});
    }

    if (finalStorageKey) {
      await removeStoredFile(finalStorageKey).catch(() => {});
    }

    throw error;
  }
}

function parseUploadId(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw httpError(404, "Upload not found.");
  }

  return id;
}

async function findOwnedUpload(ownerId, id) {
  const upload = await Upload.findOne({
    _id: parseUploadId(id),
    ownerId
  }).select("+storageKey");

  if (!upload) throw httpError(404, "Upload not found.");
  return upload;
}

export async function listUploads(ownerId) {
  const uploads = await Upload.find({ ownerId })
    .select("_id originalName mimeType size createdAt")
    .sort({ createdAt: -1 });

  return uploads.map(toPublicUpload);
}

export async function getOwnedUpload(ownerId, id) {
  return findOwnedUpload(ownerId, id);
}

export function getDownloadPath(upload) {
  return storedFilePath(upload.storageKey);
}

export async function deleteOwnedUpload(ownerId, id) {
  const upload = await findOwnedUpload(ownerId, id);

  // ENOENT is treated as completed cleanup so a retry can remove stale metadata.
  await removeStoredFile(upload.storageKey);
  await upload.deleteOne();
}
~~~~

Cleanup errors during the compensation path should be reported to an operational logger in a deployed service. This small example keeps the original request error visible; production code should also alert on failed cleanup and run a stale-file reconciliation job.

## 6. Add authenticated routes and controllers

The owner comes from <code>req.user.id</code>, which Chapter 091's server middleware derives from the session. The route never accepts an owner identifier from the multipart body.

~~~~js
// server/src/features/uploads/upload.controller.js
import {
  createUpload,
  deleteOwnedUpload,
  getDownloadPath,
  getOwnedUpload,
  listUploads
} from "./upload.service.js";

export async function create(req, res, next) {
  try {
    const upload = await createUpload({
      ownerId: req.user.id,
      file: req.file
    });

    res.status(201).json({ data: upload });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const uploads = await listUploads(req.user.id);
    res.json({ data: uploads });
  } catch (error) {
    next(error);
  }
}

export async function download(req, res, next) {
  try {
    const upload = await getOwnedUpload(req.user.id, req.params.uploadId);
    const filePath = getDownloadPath(upload);

    res.download(filePath, upload.originalName, (error) => {
      if (!error) return;

      if (!res.headersSent && error.code === "ENOENT") {
        const missing = new Error("Upload file not found.");
        missing.status = 404;
        return next(missing);
      }

      next(error);
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await deleteOwnedUpload(req.user.id, req.params.uploadId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
~~~~

~~~~js
// server/src/features/uploads/upload.routes.js
import { Router } from "express";
import { requireAuth } from "../auth/require-auth.js";
import * as controller from "./upload.controller.js";
import { parseOneUpload } from "./upload.middleware.js";

export const uploadRouter = Router();

uploadRouter.get("/", requireAuth, controller.list);
uploadRouter.post("/", requireAuth, parseOneUpload, controller.create);
uploadRouter.get("/:uploadId/download", requireAuth, controller.download);
uploadRouter.delete("/:uploadId", requireAuth, controller.remove);
~~~~

The server's global CSRF middleware must run before this router, as in the previous chapter. It protects the POST and DELETE routes; authentication alone does not protect cookie-authenticated requests against CSRF.

## 7. Mount the router and format errors

Register the API router after session and CSRF middleware and before the final error handler. Do not mount the private upload root using <code>express.static</code>.

~~~~js
// server/src/app.js
import { uploadRouter } from "./features/uploads/upload.routes.js";

// Inside createApp(config), after the existing session and CSRF middleware:
app.use("/api/uploads", uploadRouter);

// Keep the existing centralized error handler after this route.
~~~~

The router applies <code>requireAuth</code> before parsing an upload. The global CSRF middleware from Chapter 091 must run before state-changing API routes. Preserve the complete middleware order and error handler already established by the application.

## 8. Add a browser API client

This API helper uses the CSRF token provided by the existing authentication state. It deliberately does not set a multipart content type.

~~~~js
// client/src/features/uploads/uploadApi.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function readResponse(response) {
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ?? "The upload request failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload?.data;
}

export async function getUploads() {
  const response = await fetch(apiBaseUrl + "/api/uploads", {
    credentials: "include",
    headers: { Accept: "application/json" }
  });

  return readResponse(response);
}

export async function uploadImage(file, csrfToken) {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(apiBaseUrl + "/api/uploads", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken
    },
    body
  });

  return readResponse(response);
}

export async function deleteUpload(uploadId, csrfToken) {
  const response = await fetch(
    apiBaseUrl + "/api/uploads/" + encodeURIComponent(uploadId),
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": csrfToken
      }
    }
  );

  return readResponse(response);
}

export function downloadUrl(uploadId) {
  return (
    apiBaseUrl +
    "/api/uploads/" +
    encodeURIComponent(uploadId) +
    "/download"
  );
}
~~~~

If the frontend and API are on different origins, configure the exact frontend origin, credentials, cookie attributes, and allowed headers in CORS and session settings. CORS is not authorization: every route still authenticates and scopes its database query to the owner.

## 9. Build an accessible upload form

The browser performs quick checks to give immediate feedback. The server remains authoritative. The form exposes progress state and errors to assistive technology and disables duplicate submission.

~~~~jsx
// client/src/features/uploads/ImageUploadForm.jsx
import { useState } from "react";
import { uploadImage } from "./uploadApi.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export function ImageUploadForm({ csrfToken, onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || busy) return;

    const form = event.currentTarget;
    setBusy(true);
    setMessage("Uploading image.");

    try {
      const uploaded = await uploadImage(file, csrfToken);
      onUploaded(uploaded);
      setFile(null);
      form.reset();
      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0] ?? null;
    setMessage("");

    if (selected && selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setMessage("Choose an image that is 5 MiB or smaller.");
      return;
    }

    if (selected && !ALLOWED_TYPES.has(selected.type)) {
      setFile(null);
      setMessage("Choose a JPEG or PNG image.");
      return;
    }

    setFile(selected);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="image-upload">Choose a JPEG or PNG image</label>
      <input
        id="image-upload"
        name="file"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        aria-describedby="image-upload-help image-upload-status"
      />
      <p id="image-upload-help">Maximum size: 5 MiB.</p>
      <button type="submit" disabled={!file || busy}>
        {busy ? "Uploading…" : "Upload image"}
      </button>
      <p id="image-upload-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
~~~~

The input's <code>accept</code> setting and <code>File.type</code> check can be bypassed, so the Express service performs its own byte and size checks.

## 10. List, download, and delete only the current user's files

The API already scopes each operation to the session user. The component uses those endpoints and updates its local state only after the server confirms an operation.

~~~~jsx
// client/src/features/uploads/UploadsPage.jsx
import { useEffect, useState } from "react";
import {
  deleteUpload,
  downloadUrl,
  getUploads
} from "./uploadApi.js";
import { ImageUploadForm } from "./ImageUploadForm.jsx";

export function UploadsPage({ csrfToken }) {
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function refresh() {
    setStatus("loading");

    try {
      setUploads(await getUploads());
      setStatus("ready");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUploaded(upload) {
    setUploads((current) => [upload, ...current]);
    setMessage("Image uploaded.");
  }

  async function handleDelete(uploadId) {
    setMessage("");

    try {
      await deleteUpload(uploadId, csrfToken);
      setUploads((current) =>
        current.filter((upload) => upload.id !== uploadId)
      );
      setMessage("Image deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (status === "loading") {
    return <p role="status">Loading your uploads…</p>;
  }

  if (status === "error") {
    return (
      <div>
        <p role="alert">{message}</p>
        <button type="button" onClick={refresh}>Try again</button>
      </div>
    );
  }

  return (
    <main>
      <h1>Your images</h1>
      <ImageUploadForm csrfToken={csrfToken} onUploaded={handleUploaded} />
      <p role="status" aria-live="polite">{message}</p>

      {uploads.length === 0 ? (
        <p>You have not uploaded an image yet.</p>
      ) : (
        <ul>
          {uploads.map((upload) => (
            <li key={upload.id}>
              <span>{upload.name}</span>
              <span> {Math.ceil(upload.size / 1024)} KiB</span>
              <a href={downloadUrl(upload.id)}>Download</a>
              <button
                type="button"
                onClick={() => handleDelete(upload.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
~~~~

A download link still goes through the protected API endpoint. It is not a public file URL. If the interface needs inline image previews, add a separately authorized response path that serves only the verified image MIME types and uses appropriate browser security headers.

## 11. Review failure and deployment behavior

Before treating the feature as ready, make sure the deployment includes:

- A durable, private storage directory mounted at the same configured path on every API instance that serves files.
- Backups and restore procedures for both upload metadata and bytes.
- Per-user quotas, rate limits, timeouts, and bounded concurrent processing.
- Alerts for storage failures, cleanup failures, quota exhaustion, and repeated rejected formats.
- A cleanup job for stale staging files and orphaned metadata.
- Malware scanning or quarantine where user files are shared or processed.
- Image dimension limits and safe re-encoding for user-visible image content.
- A retention and deletion policy that covers backups and object-storage versions.
- A plan for serving downloads safely, including content disposition and correct detected MIME type.
- CSRF checks for cookie-authenticated POST and DELETE requests.

If you replace local disk with object storage, keep the same trust boundaries: generate object keys on the server, verify the uploaded content, store owner metadata, authorize downloads, and expire abandoned uploads. A short-lived upload URL must be scoped to one object and the intended operation.

## Manual walkthrough

1. Start the database, API, and React client; sign in and obtain the current CSRF token.
2. Upload a valid small JPEG; confirm the API returns 201 with safe metadata.
3. Upload a PNG and confirm it is stored with the server-selected extension.
4. Rename a text file to <code>image.png</code>; confirm byte detection rejects it with 415.
5. Upload more than 5 MiB; confirm a 413 response and no leftover staged file.
6. Submit an unexpected multipart field or a second file; confirm a controlled error.
7. Remove the CSRF header from a POST and DELETE request; confirm the global middleware rejects them.
8. Sign in as another user and try to list, download, and delete the first user's upload; none should be accessible.
9. Force MongoDB to reject metadata insertion and confirm the moved file is cleaned up.
10. Restart the deployed service and verify that expected uploads remain available from the configured durable storage.
11. Review the API response and logs; neither should expose a private disk path, session cookie, or CSRF token.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [091 - Authentication end to end](../lessons/091-authentication-end-to-end.md) | [Lesson](../lessons/092-file-uploads-end-to-end.md) | [Q&A](../qnas/092-file-uploads-end-to-end.md) | [Example](092-file-uploads-end-to-end.md) | [093 - Production configuration, CORS, and secure cookies](../lessons/093-production-configuration-cors-and-secure-cookies.md) |
