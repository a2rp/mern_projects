# 015 - Environment Variables, Configuration, and Secrets

## Learning goals

By the end of this lesson, you should be able to:

- Explain why application configuration should live outside source code.
- Read environment variables with process.env.
- Load a local .env file with Node.js.
- Set an environment variable in PowerShell and in a POSIX shell.
- Parse and validate environment values before using them.
- Keep real credentials out of Git and out of browser code.
- Handle a secret safely if it is accidentally exposed.

## What is configuration?

Configuration is information that changes how an application runs without changing its source code. Examples include:

- The port on which a server listens.
- Whether the app is running in development, test, or production.
- A database connection address.
- An API credential used by a server.
- A feature switch or a public service endpoint.

The same application code can use different settings on a developer's computer, in automated tests, and in production. Keeping those settings outside the source code avoids editing the program for each environment and helps prevent private values from being committed.

Separate configuration values into two groups:

- **Ordinary settings** can be safe defaults, such as a local development port or a display message.
- **Secrets** grant access to a system, such as passwords, database credentials, signing keys, or private API tokens. They need controlled access and should not have a committed fallback value.

Do not confuse configuration with code. A value that must remain private should not be written into a JavaScript file, a public repository, a log, a screenshot, or a browser bundle.

## Environment variables

An environment variable is a key-value setting provided to a process by its operating environment. Node.js exposes them through process.env:

~~~js
console.log(process.env.NODE_ENV);
console.log(process.env.PORT);
~~~

If a key is not set, its value is undefined. Environment variable values are text, even when they look like numbers, booleans, or JSON:

~~~js
console.log(typeof process.env.PORT); // "string" when set
console.log(typeof process.env.DEBUG); // "string" when set
~~~

Convert values to the type your code needs and validate them. Do not treat the string "false" as a boolean false: in JavaScript it is a non-empty string and therefore truthy.

~~~js
const port = Number(process.env.PORT ?? "3000");
const debugEnabled = process.env.DEBUG === "true";
~~~

For a boolean setting, define accepted values clearly. For example, accept only "true" or "false" rather than guessing what other strings mean.

Environment variables belong to the process environment. A value set in a terminal is generally available to commands started from that terminal, but its lifetime and syntax depend on the shell and operating system.

### Set a variable for one command

In PowerShell, set a variable in the current shell, then run the program:

~~~powershell
$env:PORT = "4100"
node src/app.js
~~~

The assignment affects the current PowerShell session and processes started from it. Close the terminal to end that session value.

In a POSIX shell, set a variable for one command like this:

~~~sh
PORT=4100 node src/app.js
~~~

These command forms differ. Use the syntax for the shell you are actually running. For a long-lived deployment, configure variables through the hosting environment rather than editing application source.

### Read a required variable

Use a clear startup error for a required setting:

~~~js
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before the application starts.");
}
~~~

This checks that a value exists. It does not prove that the database is reachable or that the credentials work. The database connection code should handle those failures separately.

Avoid a fake or empty fallback for a required secret:

~~~js
// Unsafe pattern: the app may start with a wrong or shared credential.
const databaseUrl =
  process.env.DATABASE_URL ?? "mongodb://user:password@example.invalid/app";
~~~

A safe default is appropriate for an optional, non-secret setting. A missing production secret should normally stop startup with an actionable error.

## Local .env files

A .env file is a plain text file containing key-value pairs. It is a convenient way to provide local development values without putting them in JavaScript source files:

~~~dotenv
NODE_ENV=development
PORT=4100
WELCOME_MESSAGE=Local configuration loaded
~~~

Node.js does not automatically read every .env file just because it exists. On supported Node.js releases, pass the file to Node with the --env-file option:

~~~sh
node --env-file=.env src/app.js
~~~

The path is resolved from the command's current working directory. Run this command from the project root, where .env lives.

The --env-file option was added in Node.js 20.6.0. Confirm the project's Node.js version before depending on it. The option loads the values into process.env before the application runs. Variables already supplied by the process environment take precedence over values in the file. If multiple env files are supplied, later files can override values from earlier files, while the existing process environment still takes precedence.

An npm script can include the option:

~~~json
{
  "scripts": {
    "start": "node --env-file=.env src/app.js"
  }
}
~~~

Then start the application from its project root:

~~~sh
npm start
~~~

For a project that targets a Node.js version without built-in env-file support, use a compatible configuration loader as a dependency or use the deployment platform's environment settings directly. Keep the runtime version consistent across development and deployment.

## Keep .env files out of Git

A real .env file may contain credentials. Ignore it in Git:

~~~gitignore
.env
.env.*
!.env.example
~~~

The exception allows a safe .env.example file to be committed. That example should show required variable names and harmless placeholders, never working passwords, private tokens, or production connection strings:

~~~dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=replace-with-a-local-database-url
API_TOKEN=replace-with-a-local-token
~~~

A developer can copy .env.example to .env and fill in private local values. Do not commit the filled-in .env file.

A .gitignore rule only stops untracked files from being added. If a secret was already committed, deleting it in a later commit does not remove it from earlier Git history or make it safe again. Revoke or rotate the exposed credential immediately, then clean up the repository history if needed. Treat a posted token or password as compromised even if the repository was private at the time.

Do not put real secrets in a README, issue, pull request, chat message, log, test fixture, or sample command. Avoid printing all of process.env: it can expose credentials in terminal output and logs.

## Keep secrets on the server

MERN applications include both server-side and browser-side code. A secret used by an Express server must stay in the server environment. Never send a private database URL, API token, password, or signing key to React.

Values compiled into a browser application are visible to users. Frontend build tools may expose variables with a special prefix, but that prefix does not encrypt the value or make it private. Only put intentionally public configuration in browser code, such as a public API base URL.

For deployment, use the hosting provider's protected environment or secret settings. Restrict access to the people and services that need a secret, use different credentials for development and production, and grant each credential only the permissions it needs.

## Validate configuration at startup

Read configuration once and validate it near application startup. This gives a clear failure before the app begins serving requests.

~~~js
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const nodeEnvironment = process.env.NODE_ENV ?? "development";
const allowedEnvironments = new Set([
  "development",
  "test",
  "production"
]);

if (!allowedEnvironments.has(nodeEnvironment)) {
  throw new Error(
    "NODE_ENV must be development, test, or production."
  );
}

export const config = {
  port,
  nodeEnvironment
};
~~~

This code provides a safe default for the local port and environment. It rejects malformed values rather than silently continuing with NaN or an unexpected mode.

Configuration validation should match the setting:

- Convert a port to a number, then verify that it is an allowed integer.
- Parse booleans from explicitly accepted strings.
- Check that required secrets are present without logging their contents.
- Validate URLs with a URL parser when the application expects a URL.
- Keep database connectivity checks in the database connection workflow.

Environment variable names are usually written in uppercase with underscores, such as DATABASE_URL. Choose clear names and use them consistently.

## Common mistakes

### Assuming .env loads automatically

A .env file does nothing by itself unless Node.js or a package is told to load it. Use the supported --env-file option or the loader selected by the project.

### Committing a real .env file

A private repository is still a place where secrets can be copied, exposed, or leaked later. Ignore local env files and use protected environment settings for deployment.

### Treating every value as the right type

process.env.PORT is text. Convert and validate it. A value such as "abc" becomes NaN when converted to a number, and a string such as "false" is truthy in a conditional.

### Using an unsafe fallback for a secret

A hard-coded fallback can hide a missing configuration and can accidentally be used in production. Fail clearly when a required credential is absent.

### Logging secret values while debugging

Logs are copied to terminals, files, and hosted services. Log whether a required value is present if necessary, but never log the value itself.

### Putting a backend secret in React

Browser code is delivered to the user's device and can be inspected. Keep private credentials in server-side code and server configuration.

### Believing deletion removes a leaked secret

Deleting a secret from the newest version does not revoke it or remove older copies. Rotate or revoke it first and treat the old value as compromised.

## Key takeaways

- Configuration lets the same code run in different environments.
- Read environment variables through process.env; their values are strings.
- Convert and validate settings before using them.
- Node.js can load a local .env file with --env-file on supported versions.
- An existing process environment value overrides the same key from the env file.
- Ignore real .env files and commit only a safe .env.example.
- Keep server secrets out of React, public Git, logs, and sample content.
- If a secret is exposed, rotate or revoke it; deleting the line is not enough.

## Review checklist

You are ready to move on when you can:

- Explain the difference between configuration and secrets.
- Read a value from process.env and describe why it is initially text.
- Set an environment variable using your shell's syntax.
- Load a local env file with a Node.js version that supports --env-file.
- Create .gitignore rules for local env files and a safe example file.
- Validate a port and a required configuration value.
- Explain why React code cannot keep a secret private.
- Describe what to do after a credential is exposed.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [014 - Create a Node.js project with ES modules](014-create-a-node-js-project-with-es-modules.md) | Lesson | [Q&A](../qnas/015-environment-variables-configuration-and-secrets.md) | [Example](../examples/015-environment-variables-configuration-and-secrets.md) | [016 - MongoDB concepts: databases, collections, and documents](016-mongodb-concepts-databases-collections-and-documents.md) |
