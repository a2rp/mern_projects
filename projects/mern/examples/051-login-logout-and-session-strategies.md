# 051 - Login, logout, and session strategies: example

This worked example adds password login and logout to a small Express API. It uses the Argon2id hash stored by chapter 050, an opaque server-side session stored in MongoDB, and a synchronizer CSRF token for state-changing requests.

The example code is for learning and is not run. It expects a user account to exist in the MongoDB database; create one with the registration example in chapter 050 first. Do not use the demonstration password as a real credential.

## What the example demonstrates

- Verify a submitted password with the encoded Argon2 hash.
- Use one generic public failure for unknown usernames and wrong passwords.
- Apply a login rate limit and perform dummy hash work for unknown usernames.
- Regenerate the session identifier after successful login.
- Keep session data in a MongoDB-backed server-side store.
- Protect login and logout requests with a session-bound CSRF token.
- Destroy the server session and clear its cookie during logout.
- Require a valid session on a protected API route.

The session store keeps the session data on the server. The browser receives only an opaque session identifier cookie. Cookie attributes, broader token lifecycle policy, and expiration strategies receive more detail in chapter 052.

## Install packages

Create a Node.js project or use an existing Express project. Install the packages used below:

~~~powershell
npm install express mongoose argon2 express-session connect-mongo express-rate-limit csrf-sync
~~~

Set the required configuration in PowerShell. Create **SESSION_SECRET** from a cryptographically secure random generator; do not reuse a password or commit the value.

~~~powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/mern_password_demo"
$env:SESSION_SECRET = node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
$env:NODE_ENV = "development"
~~~

If the production app is behind a reverse proxy, configure **TRUST_PROXY_HOPS** to match the exact trusted proxy topology. Do not trust arbitrary forwarded headers.

Create **server.js**:

## Express login and session server

~~~js
const express = require("express");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { rateLimit } = require("express-rate-limit");
const { csrfSync } = require("csrf-sync");
const { randomBytes } = require("node:crypto");

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = isProduction ? "__Host-mern.sid" : "mern.sid";

if (!mongoUri) {
  throw new Error("Set MONGODB_URI before starting the server.");
}

if (!sessionSecret || Buffer.byteLength(sessionSecret, "utf8") < 32) {
  throw new Error("Set SESSION_SECRET to a random value with at least 32 bytes.");
}

const trustProxyHops = process.env.TRUST_PROXY_HOPS;
if (trustProxyHops) {
  const parsedHops = Number(trustProxyHops);
  if (!Number.isInteger(parsedHops) || parsedHops < 1) {
    throw new Error("TRUST_PROXY_HOPS must be a positive integer.");
  }
  app.set("trust proxy", parsedHops);
}

app.use(express.json({ limit: "8kb" }));

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 60 * 1000,
};

app.use(
  session({
    name: sessionCookieName,
    secret: sessionSecret,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      ttl: 30 * 60,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: cookieOptions,
  })
);

const { generateToken, csrfSynchronisedProtection: csrfProtection } = csrfSync();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// This schema matches the account fields created in chapter 050.
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function saveSession(sessionToSave) {
  return new Promise((resolve, reject) => {
    sessionToSave.save((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.destroy((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function clearSessionCookie(res) {
  return res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function sendGenericLoginFailure(res) {
  return res.status(401).json({
    error: "Invalid username or password.",
  });
}

// The browser requests this first and sends the returned token in the
// x-csrf-token header on login and logout requests.
app.get("/api/csrf-token", (req, res) => {
  return res.json({ csrfToken: generateToken(req) });
});

app.post(
  "/api/login",
  loginLimiter,
  csrfProtection,
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

      // Verify a dummy hash for a missing account to reduce an obvious
      // timing difference. This does not guarantee perfectly equal timing.
      const hashToVerify = user ? user.passwordHash : req.app.locals.dummyPasswordHash;
      const passwordMatches = await argon2.verify(hashToVerify, password);

      if (!user || !passwordMatches) {
        return sendGenericLoginFailure(res);
      }

      // Replace any anonymous session ID before storing authenticated state.
      await regenerateSession(req);
      req.session.userId = user._id.toString();
      req.session.authenticatedAt = Date.now();
      await saveSession(req.session);

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

async function requireAuthenticatedUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const user = await User.findById(req.session.userId).select(
      "_id username displayName"
    );

    if (!user) {
      await destroySession(req);
      clearSessionCookie(res);
      return res.status(401).json({ error: "Authentication required." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get("/api/me", requireAuthenticatedUser, (req, res) => {
  return res.json({
    user: {
      id: req.user._id.toString(),
      username: req.user.username,
      displayName: req.user.displayName,
    },
  });
});

app.post("/api/logout", csrfProtection, async (req, res, next) => {
  try {
    await destroySession(req);
    clearSessionCookie(res);
    return res.json({ message: "Logged out." });
  } catch (error) {
    return next(error);
  }
});

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

  // Keep credentials, cookies, session IDs, and request bodies out of logs.
  console.error("Authentication request failed:", error.message);
  return res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await mongoose.connect(mongoUri);

  // Generate one per-process dummy encoded hash for unknown usernames.
  app.locals.dummyPasswordHash = await argon2.hash(
    randomBytes(32).toString("hex"),
    argonOptions
  );

  await User.init();

  app.listen(port, () => {
    console.log("Login and session demo listening on port " + port);
  });
}

start().catch((error) => {
  console.error("Could not start the login demo:", error.message);
  process.exitCode = 1;
});
~~~

## Request flow

The example intentionally orders its controls this way:

1. The browser gets a CSRF token for its anonymous session from **GET /api/csrf-token**.
2. Login validates input, applies a rate limit, checks the CSRF token, and verifies the password hash.
3. A successful login regenerates the anonymous session ID, stores the account ID, and saves the new session.
4. The browser requests a fresh CSRF token because login created a new session.
5. **GET /api/me** demonstrates that a protected route uses the server-side session and reloads the public user fields.
6. Logout checks the CSRF token, destroys the server-side session, and clears the browser cookie.

CSRF tokens are session-bound and are not authentication credentials. Do not put the session ID, password, or CSRF token in a URL or log.

## Try the API with PowerShell

Create a web-session object so PowerShell keeps the session cookie between requests. The login values below are illustrative only. The user must already exist from chapter 050.

~~~powershell
$web = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$csrf = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/csrf-token" -WebSession $web

$loginBody = @{
  username = "sam_learner"
  password = "example-only-passphrase-not-a-real-secret"
} | ConvertTo-Json

$loginHeaders = @{ "x-csrf-token" = $csrf.csrfToken }

$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/login" -ContentType "application/json" -Headers $loginHeaders -Body $loginBody -WebSession $web

$login
~~~

Expected login response body:

~~~json
{
  "user": {
    "id": "674a00000000000000000001",
    "username": "sam_learner",
    "displayName": "Sam Learner"
  }
}
~~~

The ID is illustrative. The response does not contain the password hash or session ID. The browser stores the session cookie according to the server's cookie policy.

### Read the current account

~~~powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/me" -WebSession $web
~~~

Expected response body:

~~~json
{
  "user": {
    "id": "674a00000000000000000001",
    "username": "sam_learner",
    "displayName": "Sam Learner"
  }
}
~~~

### Log out

Login regenerated the session, so request a CSRF token for the new session before logout.

~~~powershell
$csrf = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/csrf-token" -WebSession $web

$logoutHeaders = @{ "x-csrf-token" = $csrf.csrfToken }

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/logout" -Headers $logoutHeaders -WebSession $web
~~~

Expected response body:

~~~json
{
  "message": "Logged out."
}
~~~

The server session is destroyed and the cookie is expired. A subsequent **GET /api/me** with the old web-session object should return **401 Authentication required**.

## Expected failure responses

| Situation | Expected HTTP status | Example response |
| --- | --- | --- |
| Unknown username or incorrect password | 401 Unauthorized | **Invalid username or password.** |
| Missing or invalid CSRF token | 403 Forbidden | **Invalid or missing CSRF token.** |
| Too many login attempts | 429 Too Many Requests | Rate-limit response |
| No valid session on **GET /api/me** | 401 Unauthorized | **Authentication required.** |

The same login error is returned for an unknown username and a wrong password. The dummy-hash verification narrows an obvious timing gap, but does not promise identical processing time. Rate limits and monitoring remain necessary.

## Production considerations

Before adapting this teaching example for production:

- Use HTTPS and set secure cookies. Configure Express to trust only the known reverse-proxy hops.
- Generate and rotate the session secret with a secret manager; never place it in source control.
- Use a maintained shared session store. The default Express **MemoryStore** is not suitable for production.
- Configure the rate limiter with a shared store in a multi-instance deployment and add suitable account-based controls.
- Review CSRF protection for every cookie-authenticated state-changing route.
- Tune session idle and absolute lifetimes, cookie attributes, and token lifecycle for the application.
- Revoke relevant sessions after password reset, account recovery, compromise, or privilege changes.
- Check authorization and resource ownership on every protected route.
- Do not log passwords, hashes, cookies, session IDs, tokens, or request bodies.
- Monitor login successes and failures using safe metadata.

## Expected learning outcome

A correct login verifies the existing password hash, then rotates and saves a fresh server-side session. Protected routes derive identity from that session and perform their own authorization checks. Logout destroys the session record and expires the cookie, so a copied old session ID no longer authenticates requests.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [050 - Password hashing and account registration](../lessons/050-password-hashing-and-account-registration.md) | [Q&A](../qnas/051-login-logout-and-session-strategies.md) | [052 - Cookies, tokens, refresh, and expiration](../lessons/052-cookies-tokens-refresh-and-expiration.md) |
