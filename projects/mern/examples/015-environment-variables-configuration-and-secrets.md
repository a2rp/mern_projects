# Example 015 - Environment Variables, Configuration, and Secrets

## Question

How can a Node.js application load local settings from an env file, validate them before startup, and keep the local file out of Git?

## Goal

Create a small Node.js app that demonstrates:

- Loading environment variables with Node's --env-file option.
- Reading text values through process.env.
- Converting and validating a port and environment mode.
- Keeping a committed .env.example separate from the ignored local .env.
- Printing configuration without exposing any credentials.

This example uses only non-secret settings. It does not connect to a database or require a third-party package.

## 1. Create the project structure

Create a folder named `environment-config-demo` and add these files:

~~~text
environment-config-demo/
|-- package.json
|-- .gitignore
|-- .env.example
+-- src/
    +-- app.js
~~~

Run the commands in the next steps from `environment-config-demo`, the directory containing package.json. The example requires Node.js 20.6.0 or later for the built-in --env-file option.

## 2. Add package.json

Create `package.json`:

~~~json
{
  "name": "environment-config-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --env-file=.env src/app.js",
    "check": "node --check src/app.js"
  }
}
~~~

The start script loads .env before Node.js runs the application. The check script checks the JavaScript file's syntax without starting the app.

## 3. Add the Git ignore rules

Create `.gitignore`:

~~~gitignore
node_modules/
.env
.env.*
!.env.example
~~~

The rules ignore local env files while allowing the safe example file to be committed. These rules do not remove a file that was already tracked.

## 4. Add a safe configuration template

Create `.env.example`:

~~~dotenv
NODE_ENV=development
PORT=4100
WELCOME_MESSAGE="MERN environment loaded"
~~~

This file contains no password, token, database URI, or other credential. It documents the settings the app expects.

Make a private local copy named .env. In PowerShell, run:

~~~powershell
Copy-Item .env.example .env
~~~

In a POSIX shell, run:

~~~sh
cp .env.example .env
~~~

The resulting .env file is ignored by Git. If the application later needs a secret, put its real value only in the ignored local file or in a protected deployment setting. Keep only a harmless placeholder or required variable name in .env.example.

## 5. Read and validate the settings

Create `src/app.js`:

~~~js
const nodeEnvironment = process.env.NODE_ENV ?? "development";
const rawPort = process.env.PORT ?? "4100";
const port = Number(rawPort);
const welcomeMessage =
  process.env.WELCOME_MESSAGE ?? "MERN app is ready";

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

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

if (!welcomeMessage.trim()) {
  throw new Error("WELCOME_MESSAGE cannot be empty.");
}

console.log("Environment: " + nodeEnvironment);
console.log("Port: " + port);
console.log("Message: " + welcomeMessage);
~~~

Every environment value starts as text. The app converts PORT to a number and checks that it is a valid integer before using it. It also restricts NODE_ENV to the three modes used in this example.

The message is ordinary display configuration, not a secret. The app never prints process.env or a credential.

## 6. Check and start the app

From the project root, check the JavaScript syntax:

~~~sh
npm run check
~~~

Then start the app:

~~~sh
npm start
~~~

If a variable is already set in the terminal environment, Node.js uses that value instead of the same key in .env. For the exact output below, ensure NODE_ENV and PORT are not already set to other values in the current shell.

## Expected application output

~~~text
Environment: development
Port: 4100
Message: MERN environment loaded
~~~

The values come from .env.example after you copied it to .env.

## Try invalid configuration

To see why validation matters, temporarily change PORT in your local .env:

~~~dotenv
PORT=not-a-number
~~~

Run npm start again. The application stops with a clear error instead of using NaN as a port. Restore the local value to 4100 afterward.

You can also set a value in the shell. In PowerShell:

~~~powershell
$env:PORT = "4200"
npm start
~~~

The output should show port 4200 because the process environment takes precedence over the file. Close the PowerShell session to discard that temporary assignment.

In a POSIX shell, set a value for one command like this:

~~~sh
PORT=4200 npm start
~~~

Each shell has its own syntax for setting environment variables.

## How the configuration flow works

1. The npm start script launches Node.js with --env-file=.env.
2. Node.js reads the env file and makes its values available through process.env.
3. The app applies safe defaults only for optional settings.
4. The app converts and validates values before using them.
5. The app prints only non-sensitive settings.
6. Git ignores .env but allows .env.example.

No database connection or credential is included. When a later server project needs a database URL or API key, keep its real value in protected server configuration. Do not place it in React code or print it in logs.

## Common mistakes to avoid

- Assuming Node.js loads .env automatically without --env-file or a project loader.
- Running the command from a directory where the .env path does not exist.
- Forgetting that values from process.env can override the env file.
- Treating PORT as a number before converting and validating it.
- Using a hard-coded password or production URI as a fallback.
- Committing .env or placing a real value in .env.example.
- Assuming .gitignore removes a file that is already tracked.
- Printing all environment variables while debugging.
- Putting backend credentials into React code.

## Try these changes

1. Change PORT in .env to another valid number and observe the output.
2. Set PORT in the shell and confirm that it overrides the file.
3. Set PORT to zero, a decimal, or text and observe the validation error.
4. Set NODE_ENV to staging and observe the accepted-value error.
5. Change the welcome message and run npm start again.
6. Add a non-secret setting called APP_NAME to .env.example and read it in app.js.
7. Add a required secret check to a separate server project, but never print the secret itself.
8. Check Git status to confirm .env is ignored while .env.example remains visible.

## Key takeaways

- Load local values with a supported Node.js --env-file option.
- Read settings through process.env and remember that values are strings.
- Convert and validate configuration before using it.
- Keep real env files out of Git and commit a safe .env.example.
- Process environment values take precedence over env-file values.
- Never put a server secret in browser code, logs, or committed examples.

## Related chapter files

- [Lesson 015 - Environment variables, configuration, and secrets](../lessons/015-environment-variables-configuration-and-secrets.md)
- [Q&A 015 - Environment variables, configuration, and secrets](../qnas/015-environment-variables-configuration-and-secrets.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md) | [Lesson](../lessons/015-environment-variables-configuration-and-secrets.md) | [Q&A](../qnas/015-environment-variables-configuration-and-secrets.md) | [016 - MongoDB concepts: databases, collections, and documents](../lessons/016-mongodb-concepts-databases-collections-and-documents.md) |
