# 092 - File uploads end to end

A file upload is an HTTP request that carries bytes, not just a filename. The browser, API, storage layer, database, and download route all have responsibilities. Treat every part supplied by the client as untrusted: the submitted name, extension, MIME type, and file contents.

This chapter builds a small authenticated image-upload flow. React sends a multipart request, Express applies strict limits and checks the file signature, the server stores bytes in a private directory under a generated key, and MongoDB stores ownership and display metadata. A protected download route checks ownership before returning a file.

## Learning outcomes

After this chapter, you should be able to:

- Explain multipart form data and the boundary in its content type.
- Build an accessible React file picker and submit it with <code>FormData</code>.
- Limit upload bytes, files, fields, and multipart parts.
- Explain why a browser-supplied MIME type and extension do not prove file contents.
- Inspect file signatures and apply a narrow allowlist.
- Generate storage names on the server and keep uploads outside the public web root.
- Store file metadata and ownership separately from file bytes.
- Authorize upload, listing, download, and deletion operations.
- Clean up staged files when validation or database work fails.
- Plan quotas, malware scanning, durable storage, and large-file uploads.

## 1. Decide what a file is allowed to do

Before implementing an upload, answer these product questions:

1. Who can upload?
2. Which exact formats are needed?
3. What is the maximum size and number of files?
4. Who can read or delete each file?
5. Should downloads be inline or attachments?
6. How long should files be retained?
7. What happens if a database write succeeds but storage fails, or vice versa?

This chapter allows one JPEG or PNG image per request, up to 5 MiB. It stores bytes on a private local volume and a MongoDB record with the owner ID. Other applications need a different allowlist and limits. A document upload should not inherit an image upload policy.

## 2. Understand the multipart request

A file input gives the browser a <code>File</code> object. The browser packages it and any extra form fields in a multipart request.

~~~~js
const form = new FormData();
form.append("file", selectedFile);

const response = await fetch("/api/uploads", {
  method: "POST",
  credentials: "include",
  headers: {
    "X-CSRF-Token": csrfToken
  },
  body: form
});
~~~~

Do not set the request's <code>Content-Type</code> header yourself when passing <code>FormData</code>. The browser must add a boundary parameter that separates the parts. If code supplies only <code>multipart/form-data</code>, the server cannot reliably parse that body.

Cookie-authenticated uploads are state-changing requests, so reuse the application's CSRF token flow. The client may check the selected file's size and type to give quick feedback, but the server repeats all validation.

## 3. Apply parser limits before reading the full request

Multer handles <code>multipart/form-data</code> in Express. Set finite limits for the file, file count, regular fields, and total parts. Never accept an unlimited upload simply because the UI has a size check.

~~~~js
import multer from "multer";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const uploadOneImage = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(_request, _file, callback) {
      callback(null, crypto.randomUUID());
    }
  }),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 1,
    fields: 2,
    parts: 3,
    fieldNameSize: 100,
    fieldSize: 1024
  }
}).single("file");
~~~~

The storage directory must be created during server startup and must be outside any directory mounted with <code>express.static</code>. Configure its absolute path from the deployment environment. Make sure the service account can write there and that unrelated users cannot.

Disk-backed staging avoids keeping the whole upload in process memory. If a bounded in-memory buffer is used for a small file, include a concurrency limit as well: total memory exposure depends on simultaneous requests, not only the per-file limit. A production upload service should also rate-limit and enforce per-user storage quotas.

## 4. Treat metadata as claims, then inspect bytes

These values come from the request and are not proof of file type:

- <code>file.originalname</code>
- <code>file.mimetype</code>
- The extension in the submitted filename

A client can label arbitrary bytes as <code>image/png</code>. Use a library that reads file signatures and compare the detected result with a small allowlist. Signature detection is useful validation, but it does not establish that an image is harmless or safe to render.

~~~~js
import { fileTypeFromFile } from "file-type";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"]
]);

async function inspectImage(filePath) {
  const detected = await fileTypeFromFile(filePath);
  const extension = detected && ALLOWED_TYPES.get(detected.mime);

  if (!detected || !extension) {
    const error = new Error("Upload a JPEG or PNG image.");
    error.status = 415;
    throw error;
  }

  return {
    mimeType: detected.mime,
    extension
  };
}
~~~~

For a narrow image endpoint, accept only the formats the product needs. Do not trust a multipart <code>Content-Type</code> value as the final decision. If you later support PDFs, archives, SVG, or office documents, review that format's active-content, parser, decompression, and serving risks separately.

## 5. Generate storage keys and keep files private

Use a cryptographically random server-generated key. Do not build a path from the request filename, user name, or another request field. Store a generated key such as <code>7b...e2.png</code> and keep the original display name only as sanitized metadata.

A safe flow is:

1. Multer writes a randomly named temporary file in a private staging directory.
2. The server detects the file format from its bytes.
3. The server moves the file to a generated final key with the verified extension.
4. The server inserts metadata with the authenticated owner ID.
5. If metadata insertion fails, remove the final file.
6. If inspection or moving fails, remove the temporary file.

Use a storage root that is not reachable through a public static route. A file should be returned only by a route that authenticates the caller and checks the stored owner or an explicit sharing permission.

The local disk example later in this chapter is for a single-server learning setup. In production, local files disappear when a container is replaced unless storage is durable and shared correctly. Use a durable volume or private object storage with access controls and lifecycle policies. For larger files, stream bytes instead of buffering them, or upload directly to object storage with a short-lived, narrowly scoped signed request.

## 6. Store metadata and ownership in MongoDB

Keep file bytes and business metadata separate unless the application's requirements call for database-backed binary storage. A minimal record might include:

~~~~js
{
  ownerId: ObjectId,
  storageKey: "server-generated-key.png",
  originalName: "profile-photo.png",
  mimeType: "image/png",
  size: 248192,
  createdAt: Date
}
~~~~

The owner ID comes from the verified server session, never from a request-body field. Add indexes for the access pattern, such as owner plus creation time. Do not return internal filesystem paths to the browser.

Only expose the fields the current user needs:

~~~~json
{
  "id": "record-id",
  "name": "profile-photo.png",
  "mimeType": "image/png",
  "size": 248192,
  "createdAt": "2026-11-22T00:00:00.000Z"
}
~~~~

## 7. Authorize every file operation

Protect these operations independently:

- **Upload:** require a signed-in user, CSRF validation for cookie sessions, rate limits, parser limits, and the format allowlist.
- **List:** query by the authenticated user's ID; never fetch all records and filter in the browser.
- **Download:** find by both the file ID and owner ID, then serve the generated storage key.
- **Delete:** find by both the file ID and owner ID, remove its stored bytes, and remove or mark its metadata.
- **Administrative access:** use a separate explicit permission check if the product needs it.

An identifier being difficult to guess is not authorization. Validate identifier syntax before querying. Returning 404 for a record that does not exist or is not visible to the caller avoids exposing whether another user's file exists.

For downloads, choose a deliberate disposition. An attachment download is a safer default for arbitrary documents. If an image is shown inline, serve only a validated type with a correct response MIME type and an appropriate content security policy. Do not let user-provided names become response headers without safe encoding.

## 8. Make storage and database changes recoverable

A filesystem move and a MongoDB insert do not share a transaction. Plan the order and cleanup:

- If validation fails, remove the staged file.
- If moving to the final storage key fails, do not create metadata.
- If metadata creation fails after the move, delete the final file.
- If deletion of the bytes fails, keep metadata so the operation can be retried.
- If the bytes are already gone during deletion, allow cleanup to finish and record the condition.

A more durable design uses an upload state such as <code>pending</code>, then marks the record ready after verification and storage. A background cleanup job can remove stale pending files and metadata. Object storage lifecycle rules can handle abandoned temporary uploads.

Do not hide cleanup errors. Log a request ID and the generated storage key, but avoid logging file bytes, session cookies, CSRF tokens, or sensitive personal content.

## 9. Handle errors as part of the API contract

Return errors that tell the client what it can fix without revealing internal paths or stack traces.

| Situation | Useful status |
| --- | --- |
| Missing file or malformed form | 400 Bad Request |
| File too large | 413 Payload Too Large |
| Unsupported detected format | 415 Unsupported Media Type |
| Caller has no session | 401 Unauthorized |
| Caller lacks permission | 403 Forbidden, or 404 when hiding resource existence |
| Upload created | 201 Created |
| File removed with no response body | 204 No Content |
| Unexpected storage or database failure | 500 Internal Server Error |

Multer errors must be translated by the API's centralized error handler. Check <code>LIMIT_FILE_SIZE</code> and unexpected-file errors without returning the uploaded filename as trusted data. Ensure temporary files are removed for every failure path.

## 10. Build an accessible React upload form

Give the file input a visible label, announce the selected file and error, and disable repeat submission while the upload is active.

~~~~jsx
function ImageUploadForm({ csrfToken, onUploaded }) {
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");

  async function submit(event) {
    event.preventDefault();

    if (!file || status === "uploading") return;

    const body = new FormData();
    body.append("file", file);
    setStatus("uploading");
    setMessage("Uploading image.");

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrfToken },
        body
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed.");
      }

      onUploaded(result);
      setFile(null);
      event.currentTarget.reset();
      setStatus("idle");
      setMessage("Image uploaded.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="image-file">Choose a JPEG or PNG image</label>
      <input
        id="image-file"
        name="file"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        aria-describedby="image-help upload-status"
      />
      <p id="image-help">Maximum file size: 5 MiB.</p>
      <button type="submit" disabled={!file || status === "uploading"}>
        {status === "uploading" ? "Uploading…" : "Upload image"}
      </button>
      <p id="upload-status" role="status" aria-live="polite">{message}</p>
    </form>
  );
}
~~~~

The <code>accept</code> attribute is a picker hint, not server validation. Fetch supports the upload, but it does not expose a portable upload-progress event. If the interface needs byte-level progress, use <code>XMLHttpRequest</code> or a resumable upload protocol and preserve the same server-side checks.

## 11. Think about cost and abuse

A 5 MiB per-file limit does not stop a user from sending thousands of uploads. Add controls suited to the product:

- Per-user and per-IP rate limits.
- Per-user file count and total-byte quotas.
- Request timeouts and maximum concurrent uploads.
- Storage lifecycle and deletion policies.
- Malware scanning or quarantine where uploaded content is distributed.
- Image decoding and re-encoding for profile images.
- Monitoring for rejected files, quota use, and storage failures.
- Backups and restore procedures for both metadata and bytes.

If you transform an image, constrain pixel dimensions and decoder resource use. Compressed file size alone does not bound decoded memory. For archives and documents, consider decompression bombs, embedded content, and the risks of downstream preview or indexing tools.

## Common mistakes

- Trusting <code>accept</code>, filename extension, or the browser-supplied MIME type.
- Writing an original filename into a path.
- Putting user files under the web server's public static directory.
- Using unbounded memory storage or unlimited parser limits.
- Saving the owner ID supplied by the client.
- Serving a private file based only on a guessed or opaque ID.
- Setting <code>Content-Type: multipart/form-data</code> manually for <code>FormData</code>.
- Forgetting CSRF protection on a cookie-authenticated upload route.
- Leaving staged files behind when validation or database insertion fails.
- Assuming a local container filesystem is durable.
- Returning internal paths, raw errors, or another user's file metadata.
- Treating signature validation as malware scanning or proof of safety.

## Manually inspect the upload flow

1. Sign in and load the CSRF token using the existing authentication flow.
2. Upload a valid small JPEG and confirm a 201 response and safe metadata.
3. Upload a valid PNG and confirm the generated storage key uses the detected extension.
4. Rename a text file to <code>.png</code> and submit it; the server must reject its bytes.
5. Submit a file larger than 5 MiB; the server must return 413 and clean up temporary bytes.
6. Submit the wrong multipart field name and confirm a controlled client error.
7. Sign in as a second user and try to list, download, or delete the first user's upload.
8. Stop MongoDB or force a metadata failure and confirm stored files are cleaned up.
9. Restart the application and verify the storage plan matches the intended deployment.
10. Inspect logs and confirm they contain no session cookie, CSRF token, file content, or absolute private path.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [091 - Authentication end to end](091-authentication-end-to-end.md) | [Lesson](092-file-uploads-end-to-end.md) | [Q&A](../qnas/092-file-uploads-end-to-end.md) | [Example](../examples/092-file-uploads-end-to-end.md) | [093 - Production configuration, CORS, and secure cookies](093-production-configuration-cors-and-secure-cookies.md) |
