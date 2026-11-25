# 056 - File uploads and validation

File uploads turn untrusted network input into files that the application stores, processes, and may later return to other people. A safe implementation controls who can upload, what the request can consume, which content is accepted, where it is stored, and who can retrieve it.

This chapter uses an avatar upload to explain the controls. The same principles apply to documents, attachments, imports, and media, but each file type needs its own validation and processing rules.

## Learning goals

After this chapter, you should be able to:

- Explain how a browser sends a file in a `multipart/form-data` request.
- Authenticate and authorize upload and download actions.
- Apply request, file, count, field, quota, and concurrency limits.
- Validate content with multiple checks instead of trusting a filename or MIME header.
- Store files under application-generated keys outside the public web root.
- Serve private files only after authorization and clean up files safely.
- Plan scanning, image processing, observability, and failure handling.

## How a browser upload works

A form that uploads a file uses `method="post"` and `enctype="multipart/form-data"`. Each form field is sent as a part in the request body. The browser sends a filename and a content-type hint for a file part, along with the bytes. JavaScript can also send `FormData` with `fetch`.

Those part headers are supplied by the client. They describe what the client claims to send; they do not prove what the bytes contain. A user can rename a script to `avatar.png`, set a misleading content type, or send a request without using your page at all.

In an Express application, middleware such as Multer parses multipart requests. It exposes text fields and file metadata on the request. Multer is a parser and storage adapter; it does not make a file safe. Add it only to routes that intentionally accept uploads, and ensure every accepted file is either processed or removed.

## Start with access control

An upload endpoint should normally require an authenticated account. Authorization should decide whether that account may add or replace this particular file. A signed-in user may update their own avatar, while an organization member may need a specific role to upload a shared document.

Treat upload and download as separate permissions. A user who may upload a file does not automatically gain permission to read every file, and knowing or guessing an identifier must not grant access. Scope database queries by the authenticated user, tenant, or other authorization boundary.

For browser requests authenticated with cookies, protect state-changing uploads against cross-site request forgery (CSRF), using the application's established CSRF mechanism. CORS is not a CSRF defense. For token-authenticated clients, apply the authentication and origin policies appropriate to that API.

## Bound resource use

Set limits before accepting bytes. A single maximum file size is only one part of the policy:

| Limit | What it controls |
| --- | --- |
| Request body size | Total bytes accepted by the proxy, platform, and application. |
| File size | Bytes allowed for each file. |
| File count | Number of file parts accepted in one request. |
| Field count and field size | Multipart text fields and their values. |
| Part count and field-name length | Multipart parser work and unusual input. |
| Per-user storage quota | Long-term storage consumed by one account or tenant. |
| Request rate and concurrency | Repeated uploads and simultaneous expensive processing. |
| Processing limits | CPU, memory, image dimensions, archive expansion, and time. |

Configure compatible limits at every layer: CDN or load balancer, reverse proxy, platform, Express parser, and upload middleware. The smallest effective upstream limit may reject a request before Express can return its own JSON error. Document the expected maximum and return a clear status such as `413 Payload Too Large` when your application handles the rejection.

Do not buffer arbitrarily large files in process memory. Memory storage can be reasonable for a small, tightly bounded avatar because the file size and count are deliberately low. For larger files, stream to a private temporary location or directly to controlled object storage, and validate while streaming. Use concurrency controls or a queue for expensive scans and transformations.

## Validate the content, not just its label

Validation should match the feature's business need. An avatar route might allow only raster PNG and JPEG images; a document route needs a separate small allowlist and parser. Avoid a generic “accept any file” endpoint.

Use several checks, each with a limited purpose:

1. **Extension allowlist:** useful as a policy check, but the original extension is client-controlled and can be misleading.
2. **Declared MIME type:** useful for early rejection and user feedback, but it comes from the request and can be spoofed.
3. **Signature or magic-byte detection:** helps identify common binary formats from their bytes. It is a hint, not a proof that the file is well-formed or harmless.
4. **Format-aware parsing or decoding:** use a maintained parser for the exact format, with file-size, dimension, recursion, memory, and time limits. Handle parser errors as invalid input.
5. **Business validation:** check rules such as image dimensions, document page count, or allowed archive entries when the feature needs them.

A signature check alone cannot prove that a file is safe. A valid image can still exploit a vulnerable decoder or contain unexpected metadata. Keep parsers updated, process untrusted files with resource limits, and consider isolation for high-risk formats.

For images, a common policy is to decode and re-encode into a supported raster format, strip unnecessary metadata, and reject excessive dimensions. Re-encoding reduces some risks but does not guarantee that all malicious content has been removed. Do not accept SVG as an ordinary image without a specific sanitization and serving policy; it can contain active content.

For archives and office documents, consider whether uploads are needed at all. If they are, validate the internal structure, entry count, expanded size, paths, and processing time. A small compressed archive can expand to a huge amount of data. Never extract entries by concatenating their supplied paths with a destination directory.

## Use generated storage keys

Never use a client filename as a filesystem path or storage key. It may contain path separators, confusing Unicode, reserved names, duplicate names, or other unexpected values. Do not enable path preservation unless a narrowly defined feature requires and safely handles it.

Generate a random server-side identifier, such as a UUID, and derive the stored extension from the validated content type. Store the mapping from that key to the owner and metadata in the database. If a human-readable download name is needed, keep it as separate metadata, validate it for display, and never let it control the storage path.

Prefer a separate object-storage service or a directory outside the web root. Give the application only the filesystem or bucket permissions it needs. Uploaded files should not be executable. Do not expose the upload directory through static middleware or a public bucket by default.

A typical database record contains an owner or tenant ID, generated storage key, detected content type, byte size, processing status, and timestamps. Store binary data in MongoDB only when the design has deliberately chosen a database-backed file store, such as GridFS, and has considered backup, performance, and access-control implications. Do not place arbitrary file bytes in an ordinary document just because MongoDB accepts binary values.

## Quarantine, scan, and publish

Some applications can make a file available immediately after validation. Higher-risk workflows should use explicit processing states, for example:

`received -> validating -> quarantined -> scanning -> ready`

A file must not become downloadable while it is pending inspection or has failed a check. Queue malware scanning, content disarm and reconstruction, or manual review when the file type and business risk call for it. A scanner is an additional control, not a substitute for authentication, validation, limits, and safe storage.

If scanning or transformation fails, keep the file inaccessible and delete or retain it according to a documented policy. Make retries idempotent so a retried worker does not publish duplicate records or leave inconsistent files.

## Serve files through an authorized handler

For private content, resolve a public application ID to a database record using an authorization-scoped query. Then read the generated storage key from trusted application data, verify it stays within the configured storage area, and stream the bytes. Do not accept a disk path from a request parameter.

Set a content type based on the validated or server-recorded type, and add `X-Content-Type-Options: nosniff`. For sensitive files, use an attachment response with a safe server-chosen download name and suitable cache controls. Avoid serving untrusted active formats inline from the application's origin. If content must be public, consider a separate origin or a controlled delivery service and explicitly set the intended access policy.

Downloads also consume resources. Apply authorization, rate or bandwidth controls where appropriate, and avoid loading large files entirely into memory. Ensure deleted or revoked files cannot still be fetched from a public object URL or a cache longer than the product's policy allows.

## Handle failures and cleanup

File storage and MongoDB are separate systems, so an upload can fail after one side has succeeded. Plan the sequence and cleanup:

- If validation fails, do not persist a downloadable file.
- If writing the file fails, do not create a ready database record.
- If database persistence fails after the file is written, remove the orphan or mark it for cleanup.
- If a later scan fails, keep the record inaccessible and update its status.
- If deletion removes metadata but file deletion fails, queue a retry and monitor the orphan.

A scheduled cleanup task can remove old temporary files and reconcile storage against database metadata. Use a grace period so a cleanup task does not remove a file currently being processed. Record safe operational events, but do not log file bytes, credentials, session cookies, or unnecessary personal data.

## Common mistakes

- Trusting `originalname`, a `.png` suffix, or the request's `Content-Type` as proof of file type.
- Accepting every file type and relying on the browser's file picker.
- Using a global `.any()` upload middleware across unrelated routes.
- Omitting file, field, part, request, quota, or concurrency limits.
- Keeping unbounded uploads in memory.
- Writing files into a public web directory or using a client path.
- Making a file public as soon as bytes arrive, before validation or scanning.
- Returning files by guessing a path or checking only that the user is signed in.
- Treating magic-byte detection or antivirus scanning as a guarantee of safety.
- Forgetting cleanup when the database write, file write, or processing step fails.

## Upload review checklist

Before shipping an upload feature, confirm that:

- The route has authentication, authorization, and CSRF protection when cookie-based browser sessions are used.
- Every accepted format is needed and has a defined validation/processing path.
- Request, file, multipart, quota, rate, concurrency, and processing limits are configured.
- Client filenames and MIME headers are treated as untrusted hints.
- Storage keys are generated by the application and files are stored privately outside the web root.
- Downloads authorize access to the specific record and use safe response headers.
- Temporary files, failures, scanning states, deletion, and orphan cleanup are handled.
- Parsers and upload middleware are maintained and kept current.

## Summary

A secure upload feature is a complete path from permission checks through bounded parsing, content validation, private storage, controlled retrieval, and cleanup. Combine allowlists with format-aware checks; never trust a client filename, extension, or MIME value by itself. Keep uploads outside the public web root, generate storage keys on the server, and publish files only after the required validation and review steps succeed.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [055 - Rate limits, security headers, and API hardening](055-rate-limits-security-headers-and-api-hardening.md) | [Q&A](../qnas/056-file-uploads-and-validation.md) | [Example](../examples/056-file-uploads-and-validation.md) | [057 - Logging and request tracing](057-logging-and-request-tracing.md) |
