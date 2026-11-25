# 092 - File uploads end to end: Q&A

Use these questions to review the complete upload flow: browser form, multipart parser, content validation, private storage, metadata, authorization, cleanup, and production operations.

### 1. What does a file upload send to the server?

**Answer:** It sends the file's bytes as part of an HTTP request, usually encoded as <code>multipart/form-data</code>. The filename and MIME type are additional client-supplied metadata; they are not the file itself and are not trustworthy proof of what the bytes contain.

### 2. What is the multipart boundary?

**Answer:** It is a token in the request's content type that separates the individual fields and file parts in the request body. The browser generates the boundary when it serializes a <code>FormData</code> object, and the server's parser needs the matching value to decode the parts.

### 3. Why should the client not manually set the multipart Content-Type header?

**Answer:** If the client sets only <code>multipart/form-data</code>, the browser may not add the boundary parameter. The request body then cannot be parsed correctly. When passing <code>FormData</code>, leave the content type unset so the browser creates the header and boundary together.

### 4. What should the browser append to FormData?

**Answer:** Append the selected <code>File</code> under the exact field name that the API expects, such as <code>file</code>. Add only fields the product needs. The server must validate those fields too, because a caller can bypass the React form and send an arbitrary request.

### 5. What does the file input accept attribute do?

**Answer:** It suggests file types to the browser's picker and can improve the user's experience. It does not prevent a caller from sending another format or constructing an HTTP request directly. Server-side validation is still mandatory.

### 6. Why is file.originalname untrusted?

**Answer:** The client controls it. It can contain a misleading extension, path-like text, control characters, or a very long value. Never use it as a filesystem path or storage key. If it is displayed or included in a download name, reduce it to a safe, bounded display value.

### 7. Can the server trust file.mimetype from Multer?

**Answer:** No. It is parsed from the multipart part's client-supplied content type. A malicious client can label arbitrary bytes as an allowed type. Treat it as a hint only and inspect the file contents using a suitable signature detector and a narrow allowlist.

### 8. What is a file signature or magic number?

**Answer:** Many formats begin with characteristic bytes. A detector can inspect those bytes and infer a likely format, such as PNG or JPEG. This is stronger than trusting a filename or MIME claim, but it does not prove the file is harmless or valid in every way.

### 9. Does signature detection replace malware scanning?

**Answer:** No. Signature detection classifies a likely format. It does not find every malicious payload, parser vulnerability, exploit, or harmful document feature. If users can download or process uploaded content, use quarantine, scanning, safe previews, and format-specific controls as the product requires.

### 10. Why use a narrow allowlist?

**Answer:** Each supported format adds parsing, rendering, and storage risks. An endpoint that needs profile images should accept only the required image types. Do not accept executable, archive, SVG, or office-document formats merely because the upload library can parse them.

### 11. What does Multer do?

**Answer:** Multer is Express middleware that parses <code>multipart/form-data</code> and makes parsed fields and file information available to a route. It also supports storage engines and limits. It does not decide whether the file is safe or whether the user may access it later.

### 12. What does single("file") enforce?

**Answer:** It configures the route to accept one file part with the field name <code>file</code>. A different field name or unexpected extra file should produce a controlled error. This matches a one-file UI and reduces the request surface.

### 13. Which multipart limits should be explicit?

**Answer:** Set finite values for maximum file bytes, file count, regular field count, part count, field name length, and field value size. Choose them for the feature. Defaults that are unlimited can let a caller consume memory, CPU, or storage.

### 14. Is the Multer fileSize limit per file or the entire request?

**Answer:** The <code>fileSize</code> option limits an individual uploaded file. Other limits such as number of files, fields, and parts constrain the rest of the request. Keep request-body limits and upstream proxy limits aligned with the application limit.

### 15. What is the risk of memory storage?

**Answer:** Memory storage keeps the uploaded file bytes in the Node.js process. Several concurrent uploads can multiply memory use and exhaust the process. If using memory storage for a deliberately small payload, set strict byte, concurrency, and rate limits. Otherwise stage to disk or stream to controlled storage.

### 16. Why use a private staging directory?

**Answer:** The server can write the incoming file before it has verified the contents, so the staged bytes should not be publicly retrievable. A private directory also lets the application validate, rename, move, or delete the file before it becomes available through an authorized download route.

### 17. Why generate the storage filename on the server?

**Answer:** A random server-generated key avoids path traversal, filename collisions, and executable-looking extensions chosen by a client. The final extension should come from the verified format mapping. Keep the submitted name only as carefully sanitized display metadata if it is needed.

### 18. Where should uploaded files be stored?

**Answer:** Store them outside the application's public static directory and expose them through a route that checks authentication and authorization. Production deployments should use a durable private volume or private object storage with access policies. A container's temporary filesystem may disappear during replacement or restart.

### 19. Why store file metadata in MongoDB separately from the bytes?

**Answer:** Metadata such as owner, generated storage key, verified MIME type, byte count, display name, and creation time is easy to query and authorize. Keeping bytes in storage designed for files avoids inflating ordinary documents and gives the application a deliberate storage lifecycle. Database-backed binary storage may still fit a specific use case.

### 20. Where should the file owner ID come from?

**Answer:** Derive it from the authenticated server-side session, for example <code>req.user.id</code>. Never accept an owner ID from the request body or form as proof of ownership. The user could change it and attach the file to someone else's account.

### 21. What is an insecure direct object reference in a download route?

**Answer:** It is an access-control flaw where changing a file ID lets a caller access another user's file. Random IDs are not authorization. Query the file by both its ID and the authenticated owner or an explicit sharing permission.

### 22. Why might a route return 404 for an unowned file?

**Answer:** Returning the same 404 for a nonexistent file and a file the caller cannot see avoids disclosing whether another user's record exists. Some applications intentionally return 403 when the resource is known; whichever policy is chosen must not skip the actual authorization check.

### 23. Why does a cookie-authenticated upload need CSRF protection?

**Answer:** Browsers automatically attach matching cookies to requests. A malicious page may try to make a signed-in browser submit an upload. Require the application's CSRF token and check it on the state-changing upload endpoint, in addition to normal authentication.

### 24. Why use credentials: "include" in the browser request?

**Answer:** It tells Fetch to include cookies for a cross-origin API request when the app's origin configuration permits it. For a same-origin request, default credential behavior usually includes same-origin cookies. Use the setting that matches the deployment's exact origin arrangement and configure CORS carefully.

### 25. Should a CSRF token be sent as a multipart field or request header?

**Answer:** Either can be designed, but a request header is a common choice for a JSON and multipart API because middleware can check the same header consistently. The server must validate the token before accepting the state-changing operation. Never put the token in a URL.

### 26. What response should the API use for an upload over the configured byte limit?

**Answer:** Return 413 Payload Too Large with a stable, user-safe message. Catch the parser's size error in the centralized error handling path, remove any staged partial file where applicable, and avoid exposing filesystem paths or stack traces.

### 27. What response should an unsupported file type use?

**Answer:** Return 415 Unsupported Media Type when the actual file bytes do not match the endpoint's allowlist. The message can tell the user which formats are accepted without repeating untrusted file metadata.

### 28. How should an unexpected file field be handled?

**Answer:** Treat it as a malformed or unsupported request and return a controlled client error, often 400 or 413 depending on the exact parser error. Do not continue as if the expected file were uploaded, and do not reveal internal parser details.

### 29. When should temporary files be removed?

**Answer:** Remove them after validation rejection, storage move failure, metadata insert failure, or any other path where the application will not keep the upload. Make cleanup part of error handling, not an optional best effort that is silently ignored. A scheduled cleanup process can remove stale files after crashes.

### 30. Can MongoDB and the filesystem participate in one transaction?

**Answer:** Not in the usual local-filesystem design. The file move and database write are separate operations, so failure between them can leave an orphan file or a metadata record with no bytes. Choose an operation order, compensate on failure, and consider a pending state plus cleanup job for more robust workflows.

### 31. What is a safe delete sequence?

**Answer:** Authorize the file by ID and owner, remove the stored bytes, then remove or mark the metadata. If storage removal fails, keep metadata so the deletion can be retried and the UI does not imply success. Treat an already-missing file as a cleanup case and log it with a request ID.

### 32. How does a generated filename prevent path traversal?

**Answer:** Storage paths are created from a fixed server-controlled root plus a server-generated key and verified extension. Since the request name is never joined to the storage path, values such as <code>../../outside.txt</code> cannot choose a destination. Path authorization should still validate the record and key.

### 33. What is Content-Disposition used for?

**Answer:** It tells the browser whether a response should normally be displayed inline or downloaded as an attachment, and may provide a suggested filename. Use a framework helper that safely encodes the name, prefer attachment for arbitrary documents, and never insert raw client input into response headers.

### 34. Is inline serving always safe for an image?

**Answer:** No. Only consider it for a verified format that the application intends to render, serve with the detected MIME type, and protect with suitable browser security headers. User-controlled SVG or HTML content can execute active content in some contexts, so don't treat every image-like extension as passive.

### 35. Why are rate limits and quotas still needed with a 5 MiB limit?

**Answer:** A per-file limit does not restrict the total number of uploads or concurrent requests. An account can consume unbounded storage through many permitted files. Apply rate limits, per-user file counts and total-byte quotas, timeouts, and operational monitoring.

### 36. Is local disk a production-ready storage choice?

**Answer:** It can be, if it is durable, backed up, capacity-managed, private, and shared correctly across every API instance that serves downloads. Container-local ephemeral disks generally fail those requirements. A private object-storage service or durable shared volume is common for deployed systems.

### 37. When should the application stream or use resumable uploads?

**Answer:** Use streaming when buffering the file would use too much process memory or when size/concurrency makes temporary disk staging unsuitable. Resumable or direct-to-object-storage uploads help with large files and unreliable networks. They still need scoped authorization, size/type verification, lifecycle cleanup, and ownership checks.

### 38. Why is image pixel dimension validation separate from byte-size validation?

**Answer:** A small compressed image can expand to a very large pixel buffer when decoded. Limit dimensions and decoder resources, and consider re-encoding images on the server. A byte limit alone does not prevent decompression or image-decoding resource exhaustion.

### 39. What should upload logs include and exclude?

**Answer:** Include a request ID, outcome, detected type, byte count, and generated storage key where useful. Exclude file content, session cookies, CSRF tokens, secrets, and unnecessary personal data. Do not log an absolute private path if the generated key is sufficient to investigate.

### 40. What should be verified before shipping an upload feature?

**Answer:** Confirm the allowed type and size policy, parser limits, server-side byte inspection, generated private storage keys, authenticated ownership checks for list/download/delete, CSRF validation, cleanup after failures, durable storage, quota and rate controls, safe download headers, and useful client errors. Manually try spoofed types, oversized input, unexpected fields, cross-user IDs, and interrupted storage/database operations.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [091 - Authentication end to end](../lessons/091-authentication-end-to-end.md) | [Lesson](../lessons/092-file-uploads-end-to-end.md) | [Q&A](092-file-uploads-end-to-end.md) | [Example](../examples/092-file-uploads-end-to-end.md) | [093 - Production configuration, CORS, and secure cookies](../lessons/093-production-configuration-cors-and-secure-cookies.md) |
