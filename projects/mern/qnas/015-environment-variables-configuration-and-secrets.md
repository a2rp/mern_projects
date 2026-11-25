# 015 - Environment Variables, Configuration, and Secrets: Questions and Answers

Use these questions to review application configuration, process environment variables, local env files, validation, and secret handling. Each answer includes a short explanation.

Related lesson: [015 - Environment variables, configuration, and secrets](../lessons/015-environment-variables-configuration-and-secrets.md)

## Multiple-choice questions

### 1. What is application configuration?

- A. Values that affect how an app runs without changing its source code
- B. Only the application's JavaScript functions
- C. A replacement for the Node.js runtime
- D. A list of browser bookmarks

**Answer: A.** Settings such as a port or environment mode can differ across development, testing, and production.

### 2. Where does Node.js expose environment variables?

- A. process.env
- B. package.json
- C. import.meta.exports
- D. document.env

**Answer: A.** Node.js provides environment values on process.env.

### 3. What is the value of process.env.MISSING_SETTING when that variable is not set?

- A. undefined
- B. false
- C. An empty object
- D. The string "undefined"

**Answer: A.** A missing property evaluates to undefined. The application should decide whether to use a safe default or stop with an error.

### 4. What type does a set environment value have when read through process.env?

- A. A string
- B. A number automatically inferred from its characters
- C. A boolean automatically inferred from its spelling
- D. A JavaScript object automatically parsed from JSON

**Answer: A.** Environment values are text. Convert and validate them before using them as numbers, booleans, or structured data.

### 5. What does Boolean("false") evaluate to in JavaScript?

- A. true
- B. false
- C. undefined
- D. An error

**Answer: A.** "false" is a non-empty string, so it is truthy. Compare it to an accepted text value or parse it explicitly.

### 6. What does a .env file usually contain?

- A. Key-value pairs for an application's environment
- B. JavaScript functions that Node.js executes automatically
- C. A list of Git commits
- D. A browser's HTML source

**Answer: A.** A dotenv file stores environment variable names and text values.

### 7. Does Node.js automatically load every .env file in a project?

- A. No. The runtime or a package must be told to load it
- B. Yes. Every .env file is loaded at startup
- C. Only when the file is named production.env
- D. Only after npm publishes the package

**Answer: A.** Use a supported Node.js option such as --env-file or a project-selected loader.

### 8. Which command loads a local .env file before starting src/app.js?

- A. node --env-file=.env src/app.js
- B. node src/app.js --load package.json
- C. npm --env=.env src/app.js
- D. git env .env node src/app.js

**Answer: A.** The --env-file option loads variables into process.env before the application starts.

### 9. In which Node.js version was the --env-file option introduced?

- A. Node.js 20.6.0
- B. Node.js 10.0.0
- C. Node.js 12.0.0
- D. It is not a Node.js option

**Answer: A.** The option was introduced in Node.js 20.6.0. Confirm the version used by the project before relying on it.

### 10. How is the path in --env-file=.env resolved?

- A. From the command's current working directory
- B. From the operating system root every time
- C. From the importing JavaScript file
- D. From the Git repository's first commit

**Answer: A.** Run the command from the directory that contains the env file, or provide an appropriate path.

### 11. If the same variable is set in the process environment and in the env file, which value takes precedence?

- A. The value already in the process environment
- B. The value in the env file always replaces it
- C. The shorter value
- D. Neither value; Node.js deletes both

**Answer: A.** Node.js gives the existing process environment value precedence over the env-file value.

### 12. Which file is normally safe to commit?

- A. .env.example with safe placeholders
- B. .env containing real production credentials
- C. A file with a real API token in its sample output
- D. A screenshot showing a password

**Answer: A.** A committed example can show variable names and harmless placeholders without exposing working credentials.

### 13. What does the gitignore rule for .env do?

- A. Helps prevent an untracked env file from being added to Git
- B. Encrypts the file automatically
- C. Removes the file from all past commits
- D. Rotates credentials stored in the file

**Answer: A.** Ignore rules do not encrypt files and do not erase content already committed.

### 14. A credential was committed by mistake. What should happen first?

- A. Revoke or rotate the exposed credential
- B. Rename the file and keep using the same credential
- C. Delete the last commit and assume every copy is gone
- D. Print the credential in a log to check whether it still works

**Answer: A.** Treat an exposed credential as compromised. Removing a line does not invalidate the credential or erase earlier Git history.

### 15. Where should a private API key used by an Express server be kept?

- A. In server-side environment configuration or a protected secret store
- B. In a React component that calls the API
- C. In a public README
- D. In the browser's local storage as a private secret

**Answer: A.** Server credentials must stay on the server and should be supplied through protected configuration.

### 16. Why can a value bundled into a React frontend not be treated as secret?

- A. Browser code and its included values can be inspected by users
- B. React encrypts every variable automatically
- C. Frontend code is never sent to a browser
- D. Git hides all client-side values

**Answer: A.** Anything delivered to the browser must be considered public, including variables exposed by build tooling.

### 17. What is a good way to handle an optional numeric PORT value?

- A. Convert it to a number and check that it is an allowed integer
- B. Assume process.env.PORT is already a number
- C. Use it without checking its value
- D. Convert it to a boolean

**Answer: A.** Conversion can produce NaN or an invalid port, so validate the result before starting the server.

### 18. Which default is most appropriate for a required production database credential?

- A. No secret fallback; report a clear startup error when it is missing
- B. A shared password written in source code
- C. An empty string used silently
- D. A developer's local password

**Answer: A.** Required secrets should be supplied by the environment. A missing credential should not be concealed by an unsafe default.

### 19. Why should an application avoid logging process.env?

- A. It may contain credentials and other private settings
- B. It prevents npm from reading package.json
- C. It automatically deletes Git branches
- D. It makes environment variables change type

**Answer: A.** Logs can be stored and shared, so dumping the environment can expose secrets.

### 20. Which statement about NODE_ENV is accurate?

- A. It is a text environment value that an application can read and validate
- B. Node.js automatically enforces only development, test, or production
- C. It is always a boolean
- D. It should contain the database password

**Answer: A.** NODE_ENV is conventionally used for an environment mode, but the application should validate the values it accepts.

## Short-answer questions

### 1. Why keep configuration outside source code?

**Answer:** The same application code can run with different settings in development, testing, and production. It also reduces the chance of committing private values in source files.

### 2. What is the difference between an ordinary setting and a secret?

**Answer:** An ordinary setting, such as a local port, may have a safe default. A secret grants access to a protected resource and needs controlled access, no committed fallback, and careful handling.

### 3. How do you read an environment variable in Node.js?

**Answer:** Read it as a property of process.env, for example process.env.PORT. If it is absent, the value is undefined.

### 4. Why are environment values strings?

**Answer:** The process environment is a text-based key-value interface. Convert and validate values before treating them as numbers, booleans, URLs, or structured data.

### 5. How should a boolean environment value be parsed?

**Answer:** Compare it with explicitly accepted strings such as "true" and "false". Do not use Boolean(value), because any non-empty string, including "false", is truthy.

### 6. How do you set PORT for one command in PowerShell?

**Answer:** Set it with $env:PORT = "4100", then run the Node.js command from that PowerShell session. The value is inherited by child processes started from the session.

### 7. How do you set PORT for one command in a POSIX shell?

**Answer:** Prefix the command with PORT=4100, such as PORT=4100 node src/app.js. This syntax differs from PowerShell.

### 8. Does creating a .env file make Node.js load it?

**Answer:** No. Pass it using Node's --env-file option, or use the configuration loader selected by the project.

### 9. What minimum Node.js version introduced --env-file?

**Answer:** Node.js 20.6.0 introduced the option. Check the project's actual Node.js version before using it.

### 10. Where should you run a command using --env-file=.env?

**Answer:** From the directory where .env is located, because the path is resolved from the command's current working directory.

### 11. Which value wins when a variable is present in both the shell environment and .env?

**Answer:** The value already in the process environment takes precedence over the env-file value.

### 12. What belongs in .env.example?

**Answer:** The variable names the project needs and safe placeholder values. It must not contain usable passwords, private tokens, or production connection strings.

### 13. What should be ignored in Git?

**Answer:** Local .env files that may contain real credentials. A safe .env.example can be committed so developers know which settings to provide.

### 14. Why is deleting a committed secret not enough?

**Answer:** The old credential may still work, and the value may remain in Git history or copies of the repository. Revoke or rotate it and treat it as compromised.

### 15. Why must backend secrets stay out of React code?

**Answer:** React code is delivered to users' browsers and can be inspected. Build-time variables in client code are public values, not private secrets.

### 16. How should an app respond when a required secret is missing?

**Answer:** Fail clearly during startup without printing the secret. Do not silently use a hard-coded or shared fallback.

### 17. How should a port from process.env be checked?

**Answer:** Convert it to a number, then verify it is an integer in the allowed range before using it to start a server.

### 18. What is a safe way to debug whether a secret is configured?

**Answer:** If necessary, log only whether a value is present. Never print the credential itself or dump process.env.

## Review checklist

You are ready to move on when you can:

- Explain configuration and distinguish it from secrets.
- Read, convert, and validate values from process.env.
- Use the appropriate shell syntax to set a variable.
- Load a local env file with a supported Node.js version.
- Explain process-environment precedence over env-file values.
- Keep real .env files out of Git and provide a safe .env.example.
- Keep private server values out of React and logs.
- Respond correctly when a credential is exposed.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md) | [Lesson](../lessons/015-environment-variables-configuration-and-secrets.md) | Q&A | [Example](../examples/015-environment-variables-configuration-and-secrets.md) | [016 - MongoDB concepts: databases, collections, and documents](../lessons/016-mongodb-concepts-databases-collections-and-documents.md) |
