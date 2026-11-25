# 050 - Password hashing and account registration: example

This worked example builds a small Express registration endpoint backed by MongoDB and Mongoose. It validates a username and password, hashes the password with Argon2id, creates the account, and returns only public account fields.

The example code is for learning and is not run. It demonstrates registration only; login, sessions, email verification, and password recovery belong to later chapters. Do not use the demonstration password values for a real account.

## What this example demonstrates

- Store a password hash instead of plaintext or reversible encryption.
- Use Argon2id through a maintained library that generates a unique salt.
- Validate input and bound request and password sizes before hashing.
- Normalize a deliberately simple username policy without changing passwords.
- Let a unique database index resolve concurrent duplicate registrations.
- Return an explicit public response object.
- Handle a chosen duplicate-username response and its enumeration tradeoff.

This example uses usernames rather than email addresses so it can focus on password registration without pretending that email canonicalization is simple. An email-based system also needs a documented comparison policy and ownership verification.

## Install the dependencies

Create a Node.js project, then install the packages used below:

~~~powershell
npm init -y
npm install express mongoose argon2 express-rate-limit
~~~

Set the MongoDB connection string in the current PowerShell session. Use a local development database or a managed secret in a real deployment; never commit production credentials.

~~~powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/mern_password_demo"
~~~

Create a file named **server.js** and add the following code.

## Registration server

~~~js
const express = require("express");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const { rateLimit } = require("express-rate-limit");

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Set MONGODB_URI before starting the server.");
}

// Keep JSON bodies small. The password-specific limits below are also
// checked before Argon2id runs.
app.use(express.json({ limit: "8kb" }));

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// This example accepts only lowercase ASCII usernames after canonicalization.
// The unique index therefore treats a username as case-insensitive.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 3,
      maxlength: 32,
    },
    displayName: {
      type: String,
      required: true,
      maxlength: 80,
    },
    // Exclude this field from ordinary Mongoose queries by default.
    // The API response below still uses an explicit allowlist.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

function sendPublicUser(res, user) {
  // Never serialize the complete Mongoose document.
  return res.status(201).json({
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
  });
}

function validateRegistration(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const allowedFields = new Set(["username", "displayName", "password"]);
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    return { error: "Request contains an unsupported field." };
  }

  if (typeof body.username !== "string") {
    return { error: "Username must be a string." };
  }

  // This example chooses case-insensitive ASCII usernames. Trim/lowercase
  // applies only to the identifier, never to the password.
  const username = body.username.toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return {
      error: "Username must contain 3 to 32 ASCII letters, digits, or underscores.",
    };
  }

  if (typeof body.displayName !== "string") {
    return { error: "Display name must be a string." };
  }

  const displayName = body.displayName.trim();
  if (displayName.length < 1 || [...displayName].length > 80) {
    return { error: "Display name must contain 1 to 80 characters." };
  }

  if (typeof body.password !== "string") {
    return { error: "Password must be a string." };
  }

  // This sample uses password-only authentication, so it requires at least
  // 15 Unicode code points. It accepts passphrases and spaces.
  // It accepts at most 128 code points and 1024 UTF-8 bytes to bound work.
  // Do not trim, lowercase, or Unicode-normalize the password.
  const passwordCharacters = [...body.password].length;
  const passwordBytes = Buffer.byteLength(body.password, "utf8");

  if (passwordCharacters < 15) {
    return { error: "Password must contain at least 15 characters." };
  }

  if (passwordCharacters > 128 || passwordBytes > 1024) {
    return { error: "Password is longer than this service allows." };
  }

  return { value: { username, displayName, password: body.password } };
}

app.post("/api/register", registrationLimiter, async (req, res, next) => {
  const result = validateRegistration(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    // A production service should also check a maintained compromised-password
    // blocklist before hashing. Keep this check before expensive KDF work.
    const passwordHash = await argon2.hash(result.value.password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB, expressed in KiB by this library
      timeCost: 2,
      parallelism: 1,
    });

    const user = await User.create({
      username: result.value.username,
      displayName: result.value.displayName,
      passwordHash,
    });

    return sendPublicUser(res, user);
  } catch (error) {
    if (error && error.code === 11000) {
      // This specific 409 response is convenient for a form, but reveals
      // that the username is taken. See the enumeration note below.
      return res.status(409).json({ error: "Username is unavailable." });
    }

    return next(error);
  }
});

// Keep internal database and hashing errors out of public responses.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }

  console.error("Request failed", {
    requestId: req.get("x-request-id") || "not-provided",
    method: req.method,
    path: req.path,
    // Deliberately omit req.body, passwords, hashes, and tokens.
  });

  return res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await mongoose.connect(mongoUri);

  // This waits for this model's indexes in this demonstration. In production,
  // create and verify indexes through a controlled deployment migration.
  await User.init();

  app.listen(port, () => {
    console.log("Registration demo listening on port " + port);
  });
}

start().catch((error) => {
  // Avoid printing connection strings or request credentials.
  console.error("Could not start the registration demo:", error.message);
  process.exitCode = 1;
});
~~~

### Why the implementation is structured this way

The route validates request shape and password bounds before hashing. Argon2id work uses memory and CPU, so malformed or oversized input should not reach the expensive operation. The rate limiter is applied to the route as a basic abuse control; production systems should tune it for real traffic, identity signals, proxy configuration, and distributed deployment.

The Argon2 library generates a fresh salt and returns an encoded hash string containing the algorithm parameters and salt. Store that complete string. The password itself is never written to MongoDB.

The username policy is intentionally narrow and explicit. Uppercase ASCII letters are converted to lowercase for the username only. The password is passed unchanged to Argon2id; this example does not trim or normalize it.

The schema's unique index is the authority when two matching username registrations race. A preliminary “is it available?” query could improve form feedback, but cannot replace the index. In production, manage index creation and verification as a deployment migration. Mongoose's **unique** option requests an index; it is not a normal validation rule.

The endpoint returns a specific **409 Username is unavailable** response. That helps a registration form but reveals that a username exists. A privacy-sensitive service may instead use a generic response and verification flow so the public result does not confirm account existence. Choose and document the behavior for the product's threat model.

The example uses **select: false** as an additional safeguard, but the response is protected by the explicit allowlist in **sendPublicUser**. Never return the full account document.

## Verify a submitted password later

The next chapter covers login and session handling. This small snippet only demonstrates how the same library verifies a submitted candidate against the stored encoded hash. The parameter order is stored hash first, candidate password second.

~~~js
async function verifyPassword(username, submittedPassword) {
  const user = await User.findOne({ username }).select("+passwordHash");

  if (!user) {
    return false;
  }

  return argon2.verify(user.passwordHash, submittedPassword);
}
~~~

A real login handler must also consider timing behavior, rate limits, account status, generic failure responses, and session creation. Do not add a shortcut that discloses whether an account exists.

## Send a registration request

The following PowerShell examples use demonstration-only values. Do not use these values as real credentials.

### Successful registration

~~~powershell
$body = @{
  username = "sam_learner"
  displayName = "Sam Learner"
  password = "example-only-passphrase-not-a-real-secret"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/register" -ContentType "application/json" -Body $body
~~~

Expected response body:

~~~json
{
  "id": "674a00000000000000000001",
  "username": "sam_learner",
  "displayName": "Sam Learner"
}
~~~

The ID is illustrative. The response intentionally contains neither the submitted password nor the encoded password hash.

### Password below the minimum

~~~powershell
$body = @{
  username = "sam_learner"
  displayName = "Sam Learner"
  password = "short"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/register" -ContentType "application/json" -Body $body
~~~

Expected HTTP status: **400 Bad Request**

~~~json
{
  "error": "Password must contain at least 15 characters."
}
~~~

Validation fails before the application calls Argon2id.

### Duplicate username

Submitting the successful registration request again produces this illustrative response:

Expected HTTP status: **409 Conflict**

~~~json
{
  "error": "Username is unavailable."
}
~~~

This response reveals that the username already exists. That is the explicit user-experience tradeoff chosen for this demonstration.

## Production considerations

Before adapting this teaching example for a real service:

- Use HTTPS and configure trusted proxy settings correctly before relying on client IP rate limits.
- Tune Argon2id parameters on deployment hardware and cap concurrent hashing work.
- Use a maintained compromised-password blocklist and a documented password policy.
- Create and verify the unique index through a migration before accepting traffic.
- Decide how registration, recovery, and login responses handle account enumeration.
- Add email ownership verification if email addresses are used.
- Store MongoDB credentials in a secret manager and restrict database network access.
- Keep passwords, password hashes, verification tokens, reset links, and request bodies out of logs.
- Add monitoring and safe audit events without recording credentials.
- Use a hardened production error handler and a tested deployment configuration.
- Add MFA and secure login, session, logout, and recovery flows in their respective chapters.

## Expected learning outcome

The registration flow stores a salted Argon2id encoded hash, not a plaintext password. It validates and bounds the password before expensive work, relies on MongoDB's unique index for race-safe username uniqueness, handles duplicate writes, and returns only deliberately public fields.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [049 - Authentication concepts and threat modeling](../lessons/049-authentication-concepts-and-threat-modeling.md) | [Q&A](../qnas/050-password-hashing-and-account-registration.md) | [051 - Login, logout, and session strategies](../lessons/051-login-logout-and-session-strategies.md) |
