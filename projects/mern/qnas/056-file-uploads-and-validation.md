# 056 - File uploads and validation: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does `multipart/form-data` allow a browser to send?

- A. Only JSON objects.
- B. Separate fields and file parts in one request body.
- C. Files without sending any bytes.
- D. A database connection.

**Answer: B.** A multipart request contains distinct parts for form fields and uploaded files. The server's multipart middleware parses those parts.

### 2. Why should an application not trust a file's submitted `Content-Type` header?

- A. Browsers never send it.
- B. It is supplied by the client and can be spoofed.
- C. It always names the server's storage format.
- D. It encrypts the file contents.

**Answer: B.** The header is a client-provided claim. Use it only as a preliminary hint; inspect and parse the bytes according to the feature's allowlist.

### 3. What does checking a file's magic bytes help determine?

- A. Who owns the file.
- B. Whether a common binary signature resembles a known format.
- C. Whether the file is malware-free.
- D. Whether the user is authorized to download it.

**Answer: B.** Signature detection can identify a likely binary format. It does not prove that the content is valid, safe, or authorized for use.

### 4. Which filename should determine the server-side storage path?

- A. `req.file.originalname`.
- B. A path supplied in a multipart field.
- C. A generated server-side storage key.
- D. The URL path sent by the browser.

**Answer: C.** Generate an unpredictable key on the server. Client filenames and paths are untrusted and should never control a filesystem path.

### 5. Where should private user uploads usually be stored?

- A. In a directory served by Express static middleware.
- B. In a private object store or directory outside the web root.
- C. In the repository's source directory.
- D. In a temporary public URL with no access checks.

**Answer: B.** Private storage prevents direct unauthenticated access. A separate object store can further isolate uploaded content from the application host.

### 6. What is an important risk of Multer's memory storage?

- A. It writes files to MongoDB automatically.
- B. Concurrent or large uploads can exhaust process memory.
- C. It validates image dimensions automatically.
- D. It blocks multipart requests.

**Answer: B.** Memory storage keeps each accepted file buffer in the Node.js process. Use it only when file size, count, and concurrency are tightly bounded.

### 7. Which set of controls best limits multipart parser work?

- A. File size only.
- B. File count, field count, field size, part count, and field-name limits.
- C. Filename extension only.
- D. A client-side file picker.

**Answer: B.** A request can consume resources through many fields or parts even when no single file is large. Bound the parts the parser must handle.

### 8. What does a `413 Payload Too Large` response indicate?

- A. The user is not authenticated.
- B. The request exceeded an allowed size limit.
- C. The server found a valid file.
- D. The upload was scanned successfully.

**Answer: B.** A 413 response communicates that the request or payload exceeded the configured size policy. An upstream proxy may return it before Express sees the request.

### 9. How should a browser upload using a cookie-based session be protected?

- A. With CORS alone.
- B. With the application's CSRF protection, in addition to authentication and authorization.
- C. By exposing the upload directory publicly.
- D. By trusting the file extension.

**Answer: B.** Cookie credentials may be attached automatically by a browser. A state-changing upload should use the existing CSRF controls; CORS is not a CSRF defense.

### 10. What is the difference between authentication and authorization for an upload?

- A. Authentication identifies the account; authorization decides whether it may upload or modify this resource.
- B. They are identical and interchangeable.
- C. Authentication validates the image; authorization compresses it.
- D. Authorization only applies to downloads.

**Answer: A.** A valid signed-in account still needs permission for the specific action and resource, such as replacing an avatar or adding an organization document.

### 11. Why can an image decoder or document parser require resource limits?

- A. Valid files always use little memory.
- B. Malformed or specially constructed content can consume excessive CPU, memory, or time.
- C. Parsing automatically authorizes the user.
- D. Parsers cannot return errors.

**Answer: B.** Parsing untrusted bytes can be expensive or trigger vulnerabilities. Keep libraries current and bound dimensions, recursion, memory, and processing time.

### 12. What is a useful image-processing policy for an avatar feature?

- A. Accept all extensions and serve bytes inline.
- B. Decode an allowed raster format, enforce dimensions, and re-encode to a supported format.
- C. Rename every upload to `.png` without inspecting it.
- D. Trust the browser's `accept` attribute.

**Answer: B.** Format-aware decoding and re-encoding can normalize images and remove unnecessary metadata. It reduces some risks but is not a guarantee that content is harmless.

### 13. Why is SVG often treated differently from PNG or JPEG in upload features?

- A. SVG is always larger than PNG.
- B. SVG can contain active content and needs a deliberate sanitization and serving policy.
- C. SVG cannot be uploaded with HTTP.
- D. SVG does not have text content.

**Answer: B.** SVG is an active document format in browsers. Do not treat it as an inert raster image without a specific policy and safe delivery context.

### 14. What should an application do while a high-risk file is being scanned?

- A. Make it downloadable and mark the scan later.
- B. Keep it quarantined and inaccessible until required checks succeed.
- C. Put its path in a public database field.
- D. Retry every scan forever without limits.

**Answer: B.** A processing state such as `quarantined` prevents users from retrieving a file before review. Failed checks should not transition it to `ready`.

### 15. What does `X-Content-Type-Options: nosniff` help with on a download response?

- A. It makes the file safe to execute.
- B. It tells browsers not to guess a different content type from the response.
- C. It replaces authorization.
- D. It encrypts the response.

**Answer: B.** `nosniff` reduces browser MIME-type guessing. It is a response-hardening measure, not a substitute for validation or access checks.

### 16. Why should an application scope a download lookup by owner or tenant?

- A. To make the storage key shorter.
- B. To prevent one user from retrieving another user's private file by guessing an ID.
- C. To let the client choose a disk path.
- D. To avoid storing metadata.

**Answer: B.** Access must be checked for the specific record. Possession of an identifier or a valid session alone should not grant access to unrelated files.

### 17. What should happen if a file is written but saving its database metadata fails?

- A. Leave it publicly accessible.
- B. Delete the orphan or place it in a monitored cleanup workflow.
- C. Return its absolute disk path to the browser.
- D. Ignore the failure permanently.

**Answer: B.** The filesystem/object store and MongoDB do not form one automatic transaction. Clean up partial success or track it for reliable reconciliation.

### 18. What is an archive expansion risk?

- A. A small compressed archive can expand to a very large amount of data.
- B. An archive cannot contain directories.
- C. Archive contents never have paths.
- D. Compressed size always equals expanded size.

**Answer: A.** Limit expanded size, entry count, paths, and processing time. Never extract entries by blindly joining attacker-controlled paths to a destination.

### 19. What does a storage quota control?

- A. Maximum bytes retained by a user or tenant over time.
- B. The file's declared MIME type.
- C. A browser's form encoding.
- D. Which HTTP method parses multipart data.

**Answer: A.** Per-user or tenant quotas help control durable storage consumption; request limits and rate controls address additional resource costs.

### 20. What is a key rule for Multer middleware placement?

- A. Install `.any()` globally so every route can accept files.
- B. Add narrowly configured upload middleware only to routes that intentionally accept files.
- C. Run it after every route handler.
- D. Use it instead of authentication middleware.

**Answer: B.** A route-specific upload parser limits exposure and makes it clear which endpoint accepts multipart data. Keep authentication and authorization in the request path.

## Short-answer questions

### 21. Why are a filename extension and a MIME type both insufficient as the only file-type checks?

**Answer:** Both are supplied or influenced by the client and can be changed without changing the bytes. They may support an allowlist policy or early rejection, but the application should also inspect the content and use a format-aware parser where appropriate.

### 22. Name four independent limits that can be applied to an upload endpoint.

**Answer:** Examples include maximum request body size, maximum file size, files per request, multipart field count, field size, part count, per-user storage quota, request rate, concurrent processing, and parser time or memory. The precise controls depend on the feature.

### 23. What information can be useful in a file metadata record?

**Answer:** Store an owner or tenant ID, generated storage key, validated content type, byte size, processing status, and timestamps. Keep a display filename separately if needed, and never use it as the storage path.

### 24. Why should an upload directory be outside Express's static web root?

**Answer:** A direct static URL could bypass the application's authorization and processing checks. Private storage allows the application to serve a file through a handler that first checks the requesting user's permission.

### 25. What is the difference between checking magic bytes and decoding a file?

**Answer:** Magic-byte detection looks for a signature associated with a binary format and is only a best-effort hint. A format-aware decoder checks whether the content can be parsed as that format and can expose structural details, but it also processes untrusted input and needs limits.

### 26. What should a private download route check before opening a stored file?

**Answer:** Authenticate the requester, find the file record within the correct owner or tenant scope, confirm its status allows retrieval, validate the generated storage key stays within the configured storage area, and then set safe response headers before streaming.

### 27. Why is re-encoding an image helpful, and what does it not guarantee?

**Answer:** Re-encoding can normalize pixels into an allowed raster format and remove unnecessary metadata. It does not guarantee that the source or decoder was safe, so use maintained libraries with resource limits and consider isolation for higher-risk workloads.

### 28. Give two situations where a file should remain unavailable after upload.

**Answer:** While format validation or malware scanning is pending, and after a required validation/scanning step fails. The file should transition to an accessible state only after all required checks succeed.

### 29. How can the application handle storage and database failures that occur at different times?

**Answer:** Plan cleanup or reconciliation for partial success. For example, remove a file if its database record cannot be saved, and queue a retry if metadata deletion succeeds but storage deletion fails. Make processing and cleanup idempotent and observable.

### 30. Why is a client-side file input's `accept` attribute not a server security control?

**Answer:** It only guides the browser's file picker. A client can modify the page or send an HTTP request directly, so the server must enforce authentication, limits, allowlists, and content validation itself.

## Application questions

### 31. An avatar route accepts files whose request MIME type is `image/png`, but a user uploads a JavaScript file renamed to `.png`. What should the server do?

**Answer:** Treat the request MIME value and extension as untrusted. Check the bytes using a signature detector and parse/decode the allowed image format with bounded resources. Reject it when the content is not an allowed image, and do not store it as a ready avatar.

### 32. A route uses Multer memory storage and allows files up to 20 MB, with no concurrency limit. Why can this be unsafe, and what could be changed?

**Answer:** Many concurrent requests can retain large buffers in process memory and exhaust the Node.js process. For a small avatar, lower the cap and bound request rate/concurrency. For larger files, stream to private temporary or object storage and process them with resource controls.

### 33. A team stores uploads under `public/uploads/${req.file.originalname}`. Identify the problem and propose a safer approach.

**Answer:** The filename is client-controlled, can collide or contain problematic path characters, and the public directory can bypass authorization. Generate a random storage key, keep the file in private storage outside the web root, save metadata, and serve it only through an authorized handler.

### 34. A user can open another person's private attachment by changing `/files/123` to `/files/124`. What authorization check is missing?

**Answer:** The download query must be scoped to the current user, tenant, or another authorization boundary, and verify that the record is in a retrievable state. A valid session and a guessed ID are not sufficient permission.

### 35. A browser form uses a signed-in cookie session to upload a profile image. Which request protections should the application retain?

**Answer:** Require authentication and authorization, apply the existing CSRF middleware for the state-changing cookie-authenticated request, and enforce server-side size and content validation. CORS alone does not prevent CSRF.

### 36. The proxy rejects a 12 MB upload, while Express is configured to accept 20 MB. Why might the client never see Express's JSON error body?

**Answer:** The proxy is an earlier layer and can reject the request before forwarding it to Express. Align and document limits across the CDN, proxy, platform, and application; configure the edge response or make the application limit lower when it should produce the error.

### 37. A small ZIP upload passes a compressed-size check but expands to several gigabytes during processing. What limits are needed?

**Answer:** Set limits for total expanded bytes, number of entries, path depth and traversal, allowed entry types, and processing time. Extract safely into isolated temporary storage and reject archives that exceed policy; do not trust compressed size alone.

### 38. A file passes signature detection, but the image decoder reports malformed data. Should it be made available?

**Answer:** No. Signature detection is only a hint. A parse/decode failure should be treated as invalid input, the file should remain inaccessible, and temporary bytes should be removed or handled under the quarantine policy.

### 39. An upload is saved to object storage, but MongoDB is unavailable before its metadata is created. How can the system avoid an untracked permanent file?

**Answer:** Remove the object when metadata creation fails, or record it in a durable pending workflow that a reconciliation job can complete or delete. Add an age threshold and monitoring so cleanup cannot race with active uploads.

### 40. A private PDF is served inline with its original client filename and no content-type protections. What would you change?

**Answer:** Authorize the exact file record, use the validated server-recorded content type, add `X-Content-Type-Options: nosniff`, and use a server-chosen safe attachment filename for sensitive content. Avoid reflecting the original name into response headers and keep the file on private storage.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [055 - Rate limits, security headers, and API hardening](../lessons/055-rate-limits-security-headers-and-api-hardening.md) | [Lesson](../lessons/056-file-uploads-and-validation.md) | [Example](../examples/056-file-uploads-and-validation.md) | [057 - Logging and request tracing](../lessons/057-logging-and-request-tracing.md) |
