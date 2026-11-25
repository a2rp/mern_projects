# 052 - Cookies, tokens, refresh, and expiration: example

This worked example implements a first-party browser API with opaque access and refresh tokens. The browser receives them in HttpOnly cookies; MongoDB stores only SHA-256 digests of the random token values. The refresh endpoint consumes each refresh token once, rotates it, and revokes the token family if a used token is presented again.

The example code is for learning and is not run. It expects a user account created with chapter 050. Its MongoDB deployment must support transactions, such as MongoDB Atlas or a replica set. The code uses opaque server-stored tokens rather than JWTs, so the API can revoke access credentials immediately by checking MongoDB.

## What this example demonstrates

- Use cryptographically random opaque tokens instead of storing bearer values in MongoDB.
- Hash random tokens for database lookup; password hashes remain Argon2id as in chapter 050.
- Put browser credentials in Secure, HttpOnly, SameSite cookies.
- Enforce access expiry, refresh idle expiry, and an absolute grant lifetime on the server.
- Rotate refresh tokens atomically and detect replay of a previously consumed token.
- Revoke the grant family on logout or refresh-token reuse.
- Protect cookie-authenticated state-changing requests with a CSRF token.

The token cookie values never appear in JSON responses, URLs, or logs. The CSRF token is returned to the frontend so it can send it in a request header; it is not an authentication token.

## Install packages and configure the environment

~~~powershell
npm install express mongoose argon2 cookie-parser csrf-csrf express-rate-limit
~~~

Create a random secret for CSRF signing using Node's cryptographic random generator. In production, generate and store it in a secret manager. Set a MongoDB replica-set URI for transaction support.

~~~powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/mern_token_demo?replicaSet=rs0"
$env:CSRF_SECRET = node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
$env:NODE_ENV = "development"
~~~

Create **server.js**:

## Express token API

~~~js
const express = require("express");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const cookieParser = require("cookie-parser");
const { doubleCsrf } = require("csrf-csrf");
const { rateLimit } = require("express-rate-limit");
const { createHash, randomBytes } = require("node:crypto");

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
const csrfSecret = process.env.CSRF_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!mongoUri) {
  throw new Error("Set MONGODB_URI before starting the server.");
}

if (!csrfSecret || Buffer.byteLength(csrfSecret, "utf8") < 32) {
  throw new Error("Set CSRF_SECRET to a random value with at least 32 bytes.");
}

const cookieNames = isProduction
  ? {
      access: "__Host-access",
      refresh: "__Host-refresh",
      csrf: "__Host-csrf-token",
      csrfBinding: "__Host-csrf-binding",
    }
  : {
      access: "access",
      refresh: "refresh",
      csrf: "csrf-token",
      csrfBinding: "csrf-binding",
    };

const ACCESS_TTL_MS = 5 * 60 * 1000;
const REFRESH_IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GRANT_ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CSRF_COOKIE_TTL_MS = 12 * 60 * 60 * 1000;

const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

const csrfCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: CSRF_COOKIE_TTL_MS,
};

app.use(express.json({ limit: "8kb" }));
app.use(cookieParser());

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier: (req) =>
    req.cookies[cookieNames.csrfBinding] || "missing-csrf-binding",
  cookieName: cookieNames.csrf,
  cookieOptions: csrfCookieOptions,
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// This schema matches the user account created in chapter 050.
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const accessCredentialSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
});

accessCredentialSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AccessCredential = mongoose.model(
  "AccessCredential",
  accessCredentialSchema
);

const refreshCredentialSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  familyId: { type: String, required: true, index: true },
  tokenExpiresAt: { type: Date, required: true },
  familyExpiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
  replacedByHash: { type: String, default: null },
});

refreshCredentialSchema.index(
  { familyExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const RefreshCredential = mongoose.model(
  "RefreshCredential",
  refreshCredentialSchema
);

function hashOpaqueToken(token) {
  // SHA-256 is appropriate here because these tokens have high random entropy.
  // It is not a password-hashing replacement.
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createOpaqueToken(byteLength) {
  return randomBytes(byteLength).toString("base64url");
}

function clearAuthCookies(res) {
  res.clearCookie(cookieNames.access, authCookieOptions);
  res.clearCookie(cookieNames.refresh, authCookieOptions);
}

function setAuthCookies(res, credentials) {
  const now = Date.now();

  res.cookie(cookieNames.access, credentials.accessToken, {
    ...authCookieOptions,
    maxAge: Math.max(0, credentials.accessExpiresAt.getTime() - now),
  });

  res.cookie(cookieNames.refresh, credentials.refreshToken, {
    ...authCookieOptions,
    maxAge: Math.max(0, credentials.refreshExpiresAt.getTime() - now),
  });
}

function setNoStore(res) {
  res.set("Cache-Control", "no-store");
}

async function createCredentialFamily(userId) {
  const now = Date.now();
  const familyId = createOpaqueToken(24);
  const accessToken = createOpaqueToken(32);
  const refreshToken = createOpaqueToken(48);
  const accessExpiresAt = new Date(now + ACCESS_TTL_MS);
  const familyExpiresAt = new Date(now + GRANT_ABSOLUTE_TTL_MS);
  const refreshExpiresAt = new Date(
    Math.min(now + REFRESH_IDLE_TTL_MS, familyExpiresAt.getTime())
  );

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      await AccessCredential.create(
        [
          {
            tokenHash: hashOpaqueToken(accessToken),
            userId,
            familyId,
            expiresAt: accessExpiresAt,
          },
        ],
        { session: dbSession }
      );

      await RefreshCredential.create(
        [
          {
            tokenHash: hashOpaqueToken(refreshToken),
            userId,
            familyId,
            tokenExpiresAt: refreshExpiresAt,
            familyExpiresAt,
          },
        ],
        { session: dbSession }
      );
    });
  } finally {
    await dbSession.endSession();
  }

  return {
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  };
}

async function revokeFamily(familyId, at, dbSession) {
  await RefreshCredential.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: at } },
    { session: dbSession }
  );

  await AccessCredential.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: at } },
    { session: dbSession }
  );
}

async function rotateRefreshToken(presentedToken) {
  const tokenHash = hashOpaqueToken(presentedToken);
  const now = new Date();
  const dbSession = await mongoose.startSession();
  let outcome = { kind: "invalid" };

  try {
    await dbSession.withTransaction(async () => {
      const current = await RefreshCredential.findOne({ tokenHash }).session(
        dbSession
      );

      if (!current) {
        outcome = { kind: "invalid" };
        return;
      }

      if (current.usedAt) {
        await revokeFamily(current.familyId, now, dbSession);
        outcome = { kind: "replay" };
        return;
      }

      if (
        current.revokedAt ||
        current.tokenExpiresAt <= now ||
        current.familyExpiresAt <= now
      ) {
        outcome = { kind: "invalid" };
        return;
      }

      const replacementRefreshToken = createOpaqueToken(48);
      const replacementAccessToken = createOpaqueToken(32);
      const replacementRefreshHash = hashOpaqueToken(
        replacementRefreshToken
      );
      const accessExpiresAt = new Date(
        Math.min(now.getTime() + ACCESS_TTL_MS, current.familyExpiresAt.getTime())
      );
      const refreshExpiresAt = new Date(
        Math.min(
          now.getTime() + REFRESH_IDLE_TTL_MS,
          current.familyExpiresAt.getTime()
        )
      );

      const consumed = await RefreshCredential.updateOne(
        {
          _id: current._id,
          usedAt: null,
          revokedAt: null,
          tokenExpiresAt: { $gt: now },
          familyExpiresAt: { $gt: now },
        },
        {
          $set: {
            usedAt: now,
            replacedByHash: replacementRefreshHash,
          },
        },
        { session: dbSession }
      );

      if (consumed.modifiedCount !== 1) {
        await revokeFamily(current.familyId, now, dbSession);
        outcome = { kind: "replay" };
        return;
      }

      await RefreshCredential.create(
        [
          {
            tokenHash: replacementRefreshHash,
            userId: current.userId,
            familyId: current.familyId,
            tokenExpiresAt: refreshExpiresAt,
            familyExpiresAt: current.familyExpiresAt,
          },
        ],
        { session: dbSession }
      );

      await AccessCredential.create(
        [
          {
            tokenHash: hashOpaqueToken(replacementAccessToken),
            userId: current.userId,
            familyId: current.familyId,
            expiresAt: accessExpiresAt,
          },
        ],
        { session: dbSession }
      );

      outcome = {
        kind: "rotated",
        accessToken: replacementAccessToken,
        refreshToken: replacementRefreshToken,
        accessExpiresAt,
        refreshExpiresAt,
      };
    });
  } finally {
    await dbSession.endSession();
  }

  return outcome;
}

app.get("/api/csrf-token", (req, res) => {
  setNoStore(res);

  // This random cookie binds the CSRF token to this browser context. It is
  // not an authentication credential and cannot authorize API requests.
  let binding = req.cookies[cookieNames.csrfBinding];
  if (!binding) {
    binding = createOpaqueToken(32);
    req.cookies[cookieNames.csrfBinding] = binding;
    res.cookie(cookieNames.csrfBinding, binding, csrfCookieOptions);
  }

  const csrfToken = generateCsrfToken(req, res);
  return res.json({ csrfToken });
});

app.post(
  "/api/auth/login",
  loginLimiter,
  doubleCsrfProtection,
  async (req, res, next) => {
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string" ||
      Object.keys(body).some((key) => !["username", "password"].includes(key))
    ) {
      return res.status(400).json({ error: "Invalid login request." });
    }

    const username = body.username.toLowerCase();
    const password = body.password;

    if (
      !/^[a-z0-9_]{3,32}$/.test(username) ||
      Buffer.byteLength(password, "utf8") > 1024
    ) {
      return res.status(400).json({ error: "Invalid login request." });
    }

    try {
      const user = await User.findOne({ username }).select("+passwordHash");
      const hashToVerify = user
        ? user.passwordHash
        : req.app.locals.dummyPasswordHash;
      const passwordMatches = await argon2.verify(hashToVerify, password);

      if (!user || !passwordMatches) {
        setNoStore(res);
        return res.status(401).json({
          error: "Invalid username or password.",
        });
      }

      const credentials = await createCredentialFamily(user._id);
      setNoStore(res);
      setAuthCookies(res, credentials);

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.post(
  "/api/auth/refresh",
  refreshLimiter,
  doubleCsrfProtection,
  async (req, res, next) => {
    const presentedToken = req.cookies[cookieNames.refresh];

    if (!presentedToken) {
      setNoStore(res);
      clearAuthCookies(res);
      return res.status(401).json({
        error: "Authentication required. Sign in again.",
      });
    }

    try {
      const result = await rotateRefreshToken(presentedToken);
      setNoStore(res);

      if (result.kind !== "rotated") {
        clearAuthCookies(res);
        return res.status(401).json({
          error: "Authentication required. Sign in again.",
        });
      }

      setAuthCookies(res, result);
      return res.json({ message: "Credentials refreshed." });
    } catch (error) {
      return next(error);
    }
  }
);

async function requireAccessCredential(req, res, next) {
  const presentedToken = req.cookies[cookieNames.access];

  if (!presentedToken) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const credential = await AccessCredential.findOne({
      tokenHash: hashOpaqueToken(presentedToken),
      expiresAt: { $gt: new Date() },
      revokedAt: null,
    });

    if (!credential) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const user = await User.findById(credential.userId).select(
      "_id username displayName"
    );

    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.user = user;
    req.credentialFamilyId = credential.familyId;
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get("/api/me", requireAccessCredential, (req, res) => {
  setNoStore(res);
  return res.json({
    user: {
      id: req.user._id.toString(),
      username: req.user.username,
      displayName: req.user.displayName,
    },
  });
});

app.post(
  "/api/auth/logout",
  doubleCsrfProtection,
  async (req, res, next) => {
    const refreshToken = req.cookies[cookieNames.refresh];
    const accessToken = req.cookies[cookieNames.access];

    try {
      const refreshCredential = refreshToken
        ? await RefreshCredential.findOne({
            tokenHash: hashOpaqueToken(refreshToken),
          })
        : null;
      const accessCredential = accessToken
        ? await AccessCredential.findOne({
            tokenHash: hashOpaqueToken(accessToken),
          })
        : null;
      const familyId =
        (refreshCredential && refreshCredential.familyId) ||
        (accessCredential && accessCredential.familyId);

      if (familyId) {
        const dbSession = await mongoose.startSession();
        try {
          await dbSession.withTransaction(async () => {
            await revokeFamily(familyId, new Date(), dbSession);
          });
        } finally {
          await dbSession.endSession();
        }
      }

      setNoStore(res);
      clearAuthCookies(res);
      res.clearCookie(cookieNames.csrf, csrfCookieOptions);
      res.clearCookie(cookieNames.csrfBinding, csrfCookieOptions);
      return res.json({ message: "Logged out." });
    } catch (error) {
      return next(error);
    }
  }
);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid or missing CSRF token." });
  }

  if (error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }

  // Never log raw passwords, opaque tokens, cookies, or request bodies.
  console.error("Authentication request failed:", error.message);
  return res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await mongoose.connect(mongoUri);

  app.locals.dummyPasswordHash = await argon2.hash(
    randomBytes(32).toString("hex"),
    argonOptions
  );

  await Promise.all([
    User.init(),
    AccessCredential.init(),
    RefreshCredential.init(),
  ]);

  app.listen(port, () => {
    console.log("Cookie and token demo listening on port " + port);
  });
}

start().catch((error) => {
  console.error("Could not start the token demo:", error.message);
  process.exitCode = 1;
});
~~~

### Why token digests use SHA-256

The access and refresh values are generated with a cryptographically secure random generator and have high entropy. A fast digest is suitable for indexing such random bearer values: a database leak does not directly reveal the original token. Passwords are human-chosen and low entropy, so they still require a password-hashing algorithm such as Argon2id.

### Server-enforced lifetime policy

This demonstration uses these sample lifetimes:

| Credential | Sample lifetime | Enforced by |
| --- | --- | --- |
| Access token | 5 minutes | Database lookup rejects an expired or revoked credential. |
| Refresh token | 7 days of inactivity | Its current database record's **tokenExpiresAt** value. |
| Grant family | 30 days absolute | Every refresh record keeps **familyExpiresAt**; rotation cannot extend it. |
| CSRF cookies | 12 hours | Browser retention; the CSRF library validates the submitted token. |

MongoDB's TTL index is cleanup, not the authorization check. TTL deletion is asynchronous, so the API explicitly compares expiry fields with the current server time on every relevant request.

## Call the API with PowerShell

First create a user through chapter 050 and run this API against the same database. Keep a PowerShell web-session object so it retains the HttpOnly cookies between requests. The password below is an example-only value.

~~~powershell
$web = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$csrf = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/csrf-token" -WebSession $web

$loginBody = @{
  username = "sam_learner"
  password = "example-only-passphrase-not-a-real-secret"
} | ConvertTo-Json

$headers = @{ "x-csrf-token" = $csrf.csrfToken }

$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Headers $headers -Body $loginBody -WebSession $web
$login
~~~

Expected login response:

~~~json
{
  "user": {
    "id": "674a00000000000000000001",
    "username": "sam_learner",
    "displayName": "Sam Learner"
  }
}
~~~

The response does not include access or refresh token values. The server sets them as HttpOnly cookies.

### Read protected account data

~~~powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/me" -WebSession $web
~~~

Expected response:

~~~json
{
  "user": {
    "id": "674a00000000000000000001",
    "username": "sam_learner",
    "displayName": "Sam Learner"
  }
}
~~~

### Refresh the credentials

~~~powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/refresh" -Headers $headers -WebSession $web
~~~

Expected response:

~~~json
{
  "message": "Credentials refreshed."
}
~~~

The browser's cookie jar replaces the old access and refresh values with the new ones. The old refresh token is marked as consumed and cannot be reused.

### Log out

~~~powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/logout" -Headers $headers -WebSession $web
~~~

Expected response:

~~~json
{
  "message": "Logged out."
}
~~~

Logout revokes the token family in MongoDB and expires the browser's credential cookies. A subsequent **GET /api/me** with this web-session object should return **401 Authentication required**.

## Failure and replay behavior

| Situation | Expected status | Result |
| --- | --- | --- |
| Unknown username or incorrect password | 401 Unauthorized | Generic login error; no account-existence detail. |
| Missing or invalid CSRF token | 403 Forbidden | State-changing request is rejected. |
| Expired or unknown access token | 401 Unauthorized | Protected route rejects the credential. |
| Expired or unknown refresh token | 401 Unauthorized | Client must sign in again. |
| Previously consumed refresh token is presented | 401 Unauthorized | Server revokes the active refresh and access credentials in that family. |
| Login or refresh rate limit is exceeded | 429 Too Many Requests | Client must wait before retrying. |

To understand reuse detection, imagine the browser successfully refreshes and stores the replacement cookie. If an attacker later presents the old refresh token, the server finds its consumed record, revokes the family, and rejects the request. The legitimate client must authenticate again. Do not log or print the old token to demonstrate this behavior.

## Browser client outline

A React client keeps the CSRF token in memory and lets the browser manage HttpOnly authentication cookies. It does not copy access or refresh values into React state or web storage.

~~~js
const csrfResponse = await fetch("/api/csrf-token", {
  credentials: "same-origin",
});
const { csrfToken } = await csrfResponse.json();

const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  credentials: "same-origin",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify({
    username: "sam_learner",
    password: "example-only-passphrase-not-a-real-secret",
  }),
});

const loginResult = await loginResponse.json();
~~~

A production client should handle non-success responses, coordinate refresh so parallel requests do not race, and send the CSRF header on every state-changing cookie-authenticated request.

## Production considerations

Before adapting this example for production:

- Use HTTPS and production cookie names with the **__Host-** prefix, Secure, Path=/, and no Domain attribute.
- Configure cookie SameSite and CORS for the actual origin topology; cross-site cookies require Secure and explicit CSRF protection.
- Use separate, randomly generated secrets for CSRF signing and any other cryptographic purpose.
- Keep MongoDB transactions enabled and monitor transaction failures and token-store availability.
- Share rate-limit state across app instances and monitor login and refresh abuse.
- Choose sample expiry values based on the sensitivity and usage of the application.
- Protect refresh rotation against simultaneous requests; coordinate refreshes in the client and retain family history until its absolute expiry.
- Revoke token families after logout, password reset, compromise, and other high-risk events.
- Validate every access credential on the server and perform authorization checks for each requested resource.
- Keep tokens, cookies, authorization headers, passwords, and request bodies out of logs.
- Use a mature identity provider or reviewed token library if the system needs OAuth, OpenID Connect, signed JWTs, or third-party clients.

## Expected learning outcome

The browser receives opaque access and refresh credentials in HttpOnly cookies. MongoDB stores only digests and expiration/revocation metadata. Access is rejected after expiry or revocation. Each refresh consumes the old token and creates a replacement in a transaction; reuse revokes the token family. Logout revokes the server records and clears the browser cookies.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [051 - Login, logout, and session strategies](../lessons/051-login-logout-and-session-strategies.md) | [Q&A](../qnas/052-cookies-tokens-refresh-and-expiration.md) | [053 - Authorization and role-based access](../lessons/053-authorization-and-role-based-access.md) |
