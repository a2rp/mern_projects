# 056 - File uploads and validation: example

This example adds a protected avatar upload and private download route to the Express and MongoDB application from earlier chapters. It accepts a small PNG or JPEG, checks its binary signature, decodes and re-encodes it as a bounded JPEG, stores it under a generated key outside the web root, and authorizes downloads by owner.

The code is educational material and is not run. Integrate the router into the existing application and keep its established authentication, session, CSRF, MongoDB, error-handler, and deployment configuration.

## What the example demonstrates

- Limit the request to one small file and reject unsupported request MIME hints early.
- Check the uploaded bytes with signature detection and a format-aware image decoder.
- Bound image dimensions and normalize output to JPEG with metadata removed.
- Store files outside the web root under server-generated names.
- Save only metadata in MongoDB and delete a written file if database persistence fails.
- Authorize download by querying the current user's avatar record.
- Convert parser and size errors into useful HTTP responses.

## Install packages

Use a supported Node.js 22 release and the maintained versions of these packages. The current `file-type` package is ESM, so the CommonJS example loads it with dynamic `import()`.

~~~powershell
npm install express multer file-type sharp mongoose
~~~

The project already uses Express and Mongoose; install only what it does not already have. Create the upload directory using an absolute `UPLOAD_DIR` path outside the public web root. Configure OS or object-store permissions so only the application service can read and write these files.

## Add an avatar metadata model

This model stores a generated storage key and metadata, not the image bytes or a client-supplied filesystem path. Add the schema to the existing model setup and use the project's established model export pattern.

~~~js
const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    mimeType: {
      type: String,
      enum: ["image/jpeg"],
      required: true,
    },
    size: {
      type: Number,
      min: 1,
      required: true,
    },
  },
  { timestamps: true }
);

const Avatar = mongoose.model("Avatar", avatarSchema);
~~~

This simple example replaces an account's old avatar record after a new one is accepted. A production implementation should also coordinate deletion of the old object and account for concurrent updates.

## Create the upload router

The router factory receives the application's existing middleware and model. `requireAuth` must set `req.user.id` to the authenticated MongoDB user ID. `csrfProtection` must validate the application's CSRF token, for example from a request header. Keep that middleware before Multer so unauthenticated or cross-site requests are rejected before file parsing.

~~~js
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { mkdir, writeFile, unlink } = require("node:fs/promises");

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const ALLOWED_INPUT_TYPES = new Set(["image/png", "image/jpeg"]);
const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.jpg$/i;

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function makeUploadError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function handleSingleAvatarUpload(upload) {
  return (req, res, next) => {
    upload.single("avatar")(req, res, (error) => {
      if (!error) return next();

      if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ error: "The upload exceeds the allowed limits." });
      }

      if (error.code === "UNSUPPORTED_UPLOAD_TYPE") {
        return res.status(415).json({ error: error.message });
      }

      return next(error);
    });
  };
}

async function createAvatarRouter({ Avatar, requireAuth, csrfProtection, uploadDir }) {
  if (!uploadDir || !path.isAbsolute(uploadDir)) {
    throw new Error("UPLOAD_DIR must be configured as an absolute private path.");
  }

  const privateUploadDir = path.resolve(uploadDir);
  await mkdir(privateUploadDir, { recursive: true, mode: 0o700 });

  // file-type checks binary signatures. It is a best-effort detector, not
  // proof that the bytes form a valid or harmless image.
  const { fileTypeFromBuffer } = await import("file-type");

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
      fields: 0,
      parts: 1,
      fieldNameSize: 50,
    },
    fileFilter(req, file, callback) {
      // This request MIME value is untrusted. Use it only as an early filter;
      // the content signature and image decoder are checked in the route.
      if (!ALLOWED_INPUT_TYPES.has(file.mimetype)) {
        return callback(
          makeUploadError("UNSUPPORTED_UPLOAD_TYPE", "Upload a PNG or JPEG image."),
        );
      }
      callback(null, true);
    },
  });

  const parseAvatar = handleSingleAvatarUpload(upload);
  const router = express.Router();

  router.post(
    "/me/avatar",
    requireAuth,
    csrfProtection,
    parseAvatar,
    asyncHandler(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "Choose one avatar image to upload." });
      }

      const detectedType = await fileTypeFromBuffer(req.file.buffer);
      if (!detectedType || !ALLOWED_INPUT_TYPES.has(detectedType.mime)) {
        return res.status(415).json({ error: "The file bytes are not a supported image." });
      }

      // Require the header hint to agree with the detected signature too.
      if (detectedType.mime !== req.file.mimetype) {
        return res.status(415).json({ error: "The declared type does not match the image." });
      }

      let normalizedImage;
      try {
        // Decode the untrusted image with a pixel limit, auto-orient it,
        // constrain its dimensions, and write a fresh JPEG without metadata.
        normalizedImage = await sharp(req.file.buffer, {
          failOn: "warning",
          limitInputPixels: 16_000_000,
          limitInputChannels: 4,
          animated: false,
        })
          .rotate()
          .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer({ resolveWithObject: true });
      } catch {
        return res.status(415).json({ error: "The image could not be decoded safely." });
      }

      if (normalizedImage.info.width > 512 || normalizedImage.info.height > 512) {
        return res.status(415).json({ error: "The image dimensions exceed the allowed limit." });
      }

      if (normalizedImage.data.length > MAX_OUTPUT_BYTES) {
        return res.status(413).json({ error: "The processed image exceeds the allowed size." });
      }

      const storageKey = `${randomUUID()}.jpg`;
      const filePath = path.join(privateUploadDir, storageKey);

      // wx avoids overwriting an existing key. The directory is private and
      // the key is generated here; never derive it from originalname.
      await writeFile(filePath, normalizedImage.data, {
        flag: "wx",
        mode: 0o600,
      });

      let avatar;
      try {
        avatar = await Avatar.create({
          ownerId: req.user.id,
          storageKey,
          mimeType: "image/jpeg",
          size: normalizedImage.data.length,
        });
      } catch (error) {
        try {
          await unlink(filePath);
        } catch (cleanupError) {
          if (cleanupError.code !== "ENOENT") {
            // Log only the generated key and failure category, never file bytes.
            console.error("Avatar cleanup failed after database error", { storageKey });
          }
        }
        throw error;
      }

      return res.status(201).json({
        id: avatar.id,
        mimeType: avatar.mimeType,
        size: avatar.size,
        message: "Avatar uploaded and normalized.",
      });
    }),
  );

  router.get(
    "/me/avatar/:avatarId",
    requireAuth,
    asyncHandler(async (req, res, next) => {
      // Scope the lookup to the authenticated owner. An ID alone is not access.
      if (!mongoose.isValidObjectId(req.params.avatarId)) {
        return res.status(404).json({ error: "Avatar not found." });
      }

      const avatar = await Avatar.findOne({
        _id: req.params.avatarId,
        ownerId: req.user.id,
      }).lean();

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found." });
      }

      // The key is generated by this application, but validate it before using
      // database data as a filename. Never accept a path from the request.
      if (!STORAGE_KEY_PATTERN.test(avatar.storageKey)) {
        return next(new Error("Stored avatar key has an invalid format."));
      }

      const filePath = path.join(privateUploadDir, avatar.storageKey);
      res.type("image/jpeg");
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Cache-Control", "private, no-store");

      // Use a fixed download name, not a client-supplied original filename.
      return res.download(filePath, "avatar.jpg", (error) => {
        if (error) next(error);
      });
    }),
  );

  return router;
}

module.exports = { createAvatarRouter };
~~~

Mount the router after the application's normal session and CSRF setup. The exact middleware and model paths depend on the existing project:

~~~js
const { createAvatarRouter } = require("./routes/avatar-routes");
const { Avatar } = require("./models/avatar");
const { requireAuth } = require("./middleware/require-auth");
const { csrfProtection } = require("./middleware/csrf");

const avatarRouter = await createAvatarRouter({
  Avatar,
  requireAuth,
  csrfProtection,
  uploadDir: process.env.UPLOAD_DIR,
});

app.use("/api", avatarRouter);
~~~

The existing application should configure its final 404 and error-handling middleware after this router. Do not install Multer globally.

## Send the upload from a browser

This request uses `FormData` and sends the application's CSRF token in a header. The browser sets the multipart boundary, so do not manually set the `Content-Type` header.

~~~js
const formData = new FormData();
formData.append("avatar", fileInput.files[0]);

const response = await fetch("/api/me/avatar", {
  method: "POST",
  credentials: "same-origin",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
  body: formData,
});

const result = await response.json();
console.log(response.status, result);
~~~

## Expected output

A valid image smaller than the configured limits is decoded and stored as a normalized JPEG. The API returns a response similar to:

~~~json
{
  "id": "an-application-generated-mongodb-id",
  "mimeType": "image/jpeg",
  "size": 18432,
  "message": "Avatar uploaded and normalized."
}
~~~

The actual ID and byte size depend on the stored record and image. A successful upload returns `201 Created`. Missing files return `400`; an oversized file returns `413`; unsupported, mismatched, or undecodable content returns `415`. Unauthenticated requests are rejected by `requireAuth`, and a user's request for another owner's avatar returns `404`.

The download endpoint responds with an attachment named `avatar.jpg`, a JPEG content type, `nosniff`, and private no-store caching. The file is read from the private storage directory only after the database lookup confirms that the authenticated user owns the record.

## Production considerations

- Memory storage is used only because this example caps the upload at 3 MB and accepts one file. Stream larger uploads to private temporary storage or object storage instead.
- Configure compatible body limits at the CDN, reverse proxy, hosting platform, and Express upload middleware. An earlier layer may reject a request before Express can respond.
- The signature detector and successful decode do not prove that an image is harmless. Keep image-processing libraries current, use resource limits, and isolate high-risk processing where appropriate.
- This example normalizes images but does not run antivirus scanning. For workflows that require scanning or review, keep the record inaccessible until it transitions to a ready state.
- Add per-user or tenant quotas, rate limits, concurrency limits, and monitoring for storage and processing failures.
- Set filesystem ACLs or object-store policies explicitly. The example's `mode` values are not a substitute for deployment-specific permissions.
- When replacing an avatar, coordinate old-file deletion with the database update and make cleanup retryable. Add a scheduled reconciliation task for orphaned objects.
- Use the application's actual CSRF mechanism and make sure its token source matches the middleware configuration.
- Keep private object storage private; do not return permanent public URLs for protected content.
- Do not log file bytes, secrets, session tokens, or unnecessary personal information.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [055 - Rate limits, security headers, and API hardening](../lessons/055-rate-limits-security-headers-and-api-hardening.md) | [Q&A](../qnas/056-file-uploads-and-validation.md) | [057 - Logging and request tracing](../lessons/057-logging-and-request-tracing.md) |
