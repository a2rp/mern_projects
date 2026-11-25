# 012 - Install and Verify Node.js and npm: Questions and Answers

Use these questions to review Node.js and npm, release choices, installation methods, version checks, PATH troubleshooting, and basic runtime verification. Each answer includes a short explanation.

Related lesson: [012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md)

## Multiple-choice questions

### 1. What does Node.js do?

- A. Runs JavaScript outside a browser
- B. Installs only CSS files
- C. Stores every project in the npm registry
- D. Replaces the JavaScript language

**Answer: A.** Node.js is a JavaScript runtime. It provides the environment and APIs for running JavaScript programs outside a browser.

### 2. What does npm commonly help you do?

- A. Manage packages and project commands
- B. Render a browser's document object model
- C. Compile JavaScript into the Node executable
- D. Replace the operating system terminal

**Answer: A.** npm is a package manager and command-line tool used to manage dependencies and scripts.

### 3. Which Node.js release is usually a good baseline for a new learning project?

- A. A supported LTS release
- B. An unsupported release chosen at random
- C. An experimental build
- D. Any version without checking project requirements

**Answer: A.** A supported Long-Term Support release is maintained and is a dependable default. Use a project's specified version when it has one.

### 4. Which commands display the active Node.js and npm versions?

- A. node --version and npm --version
- B. node --install and npm --delete
- C. git --version and code --version
- D. process --node and process --npm

**Answer: A.** These commands show the versions available from the current terminal's PATH.

### 5. Why can the Node.js and npm version numbers differ?

- A. They are separate tools with separate release numbers
- B. One of the commands must be broken
- C. npm always uses the same version number as Node.js
- D. Node.js changes version every time npm runs

**Answer: A.** Node.js and npm are related but versioned independently. An installer or version manager selects a compatible npm version with Node.js.

### 6. When is a Node.js version manager especially useful?

- A. When different projects need different Node.js versions
- B. When a project has no JavaScript files
- C. When the terminal cannot run any commands
- D. When a browser page needs a DOM

**Answer: A.** A version manager can install and select different Node.js versions for separate projects or shells.

### 7. What is a simple option when you need one system-wide Node.js version?

- A. An official installer for a supported LTS release
- B. Copying node.exe into a random system folder
- C. Installing an experimental build
- D. Running npm without installing Node.js

**Answer: A.** An operating-system installer is a straightforward way to set up one Node.js version. On Windows, the official MSI includes Node.js and npm.

### 8. Why should you open a new terminal after installing Node.js?

- A. A new shell can load the updated PATH
- B. npm only works after a computer is replaced
- C. Node.js removes the current terminal's files
- D. The shell must download the JavaScript language

**Answer: A.** A terminal opened before installation may not have the updated environment or PATH.

### 9. What does PATH help the terminal do?

- A. Find executables such as node and npm when you enter their commands
- B. Choose which JavaScript syntax is valid
- C. Store every npm package's source code
- D. Start the browser's developer tools

**Answer: A.** The terminal searches PATH directories to find executable commands.

### 10. What does node -p "process.execPath" show?

- A. The path to the Node.js executable selected by the current command
- B. The current npm package name
- C. The value of every environment variable
- D. The contents of the current directory

**Answer: A.** It evaluates the expression and prints the selected Node.js executable path.

### 11. What can multiple results from where.exe node suggest on Windows?

- A. More than one matching Node.js executable may be on PATH
- B. Node.js is missing from the computer
- C. The project has too many dependencies
- D. npm is running a server

**Answer: A.** Multiple paths may indicate several installations. Check which one the current PATH selects.

### 12. Why should a value from process.env be checked before using it as a port number?

- A. Environment values are strings and may be missing or invalid
- B. Environment values are always secure integers
- C. Node.js converts every value to a network socket automatically
- D. npm uses all environment variables as package names

**Answer: A.** Convert and validate environment values before relying on them as numbers or other types.

### 13. What does node hello.mjs do?

- A. Runs the JavaScript file with Node.js
- B. Installs a package named hello
- C. Opens a browser tab for the file
- D. Creates an npm account

**Answer: A.** Node.js executes the file. The mjs extension marks the file as an ECMAScript module.

### 14. What happens when you run node without a file name?

- A. Node.js opens its interactive REPL
- B. npm removes local packages
- C. Node.js uninstalls itself
- D. The shell automatically starts a web server

**Answer: A.** The REPL lets you enter JavaScript expressions interactively.

### 15. Which command exits the Node.js REPL?

- A. .exit
- B. npm close
- C. node --delete
- D. git stop

**Answer: A.** Enter .exit or use the terminal's end-of-input shortcut.

### 16. What should you check if node works but npm is not recognized?

- A. Whether npm was installed and its command path is available
- B. Whether the browser has a global variable named npm
- C. Whether package.json contains React
- D. Whether the computer has a second monitor

**Answer: A.** Verify the installation method, open a new terminal, and inspect the npm command path.

### 17. Why are project dependencies usually installed locally?

- A. The project can record and share its dependency requirements
- B. They then become available in every operating system automatically
- C. They never need version information
- D. Local packages always require administrator permission

**Answer: A.** Project dependencies are associated with that project, making setup more reproducible for collaborators.

### 18. What is one possible problem with unnecessary global package installs?

- A. Permission or PATH confusion
- B. Node.js stops supporting JavaScript
- C. The project loses its README
- D. npm changes every file extension

**Answer: A.** A global executable may need a writable install location and must be discoverable through PATH.

### 19. What should you do when a project specifies a Node.js version?

- A. Use a compatible version for that project
- B. Ignore the requirement and select an experimental version
- C. Use the newest version number regardless of compatibility
- D. Remove every version file from the project

**Answer: A.** Project requirements and dependencies can rely on a particular supported Node.js version.

### 20. How can you confirm that Node.js can execute JavaScript, not just print its version?

- A. Run a small .mjs file with node
- B. Open npm's settings page
- C. Rename the terminal
- D. Run git status

**Answer: A.** Executing a small file verifies that the runtime can start and run JavaScript source.

## Short-answer questions

### 1. What is the difference between Node.js and npm?

**Answer:** Node.js is the runtime that executes JavaScript. npm is a command-line package manager commonly installed with Node.js and used for dependencies and project commands.

### 2. What does LTS mean, and why is it a useful default?

**Answer:** LTS means Long-Term Support. A supported LTS release is maintained and is a reliable default for learning and project work when the project does not specify a version.

### 3. Why should a project-specific Node.js requirement take precedence over a general recommendation?

**Answer:** A project's tools and dependencies may support or require a particular Node.js version. Matching that requirement helps prevent compatibility problems.

### 4. What is the benefit of a version manager?

**Answer:** It can install multiple Node.js versions and select the one required by a project, so projects with different requirements can coexist.

### 5. What is the benefit of using an installer?

**Answer:** It is a straightforward way to install one system-wide Node.js version and commonly includes npm. On Windows, an official MSI installer can configure PATH.

### 6. Why is a new terminal needed after installation?

**Answer:** An already-open shell may still have the old environment. A new terminal loads the updated PATH and can find newly installed commands.

### 7. What commands check the installed Node.js and npm versions?

**Answer:** Run node --version and npm --version in the terminal. They show the versions selected by that shell.

### 8. How can you check the active Node.js executable path?

**Answer:** Run node -p "process.execPath". On Windows, where.exe node can list matching paths; on macOS or Linux, command -v node shows the selected command.

### 9. What can cause a version different from the one you expected?

**Answer:** A version manager may have selected another version, or an older installation may appear earlier in PATH. Inspect the command path and the project's version requirement.

### 10. What does PATH do?

**Answer:** PATH is a list of directories the terminal searches for executable commands such as node and npm.

### 11. What is the Node.js REPL useful for?

**Answer:** It is an interactive prompt for quickly evaluating JavaScript expressions without creating a file.

### 12. Why should you validate values from process.env?

**Answer:** Environment values are strings and can be missing or malformed. Convert and check them before using them as ports, flags, or other typed settings.

### 13. Why should you avoid installing every project tool globally?

**Answer:** Global tools can cause permission and PATH problems and are not recorded as project dependencies. Local tools make project setup easier to reproduce.

### 14. What should you check if the terminal cannot find node?

**Answer:** Open a new terminal, confirm the installation completed, inspect the active command paths, and verify that the intended installation directory is on PATH.

### 15. What is the purpose of a small JavaScript smoke-check file?

**Answer:** Running it verifies that Node.js can execute source code. A version command alone confirms the command exists, but does not exercise a source file.

### 16. Why should course notes avoid hard-coding a specific current Node.js version as the only correct version?

**Answer:** New releases arrive and support status changes. Notes should tell learners to use a supported LTS release or follow the project's version requirement.

### 17. What should you do before upgrading npm independently of Node.js?

**Answer:** Check whether the project or tooling requires a particular npm version and whether it is compatible with the active Node.js version. The bundled npm is a suitable starting point.

### 18. What does it mean if where.exe node lists several paths?

**Answer:** Several Node.js installations may be available. The shell selects one according to PATH order; use the intended version manager or adjust the installation setup deliberately.

## Review checklist

You are ready to move on when you can:

- Explain the roles of Node.js and npm.
- Choose a supported LTS release or follow a project's required version.
- Use a version manager when projects need different Node.js versions.
- Check both version commands and inspect the selected Node executable.
- Diagnose a command-not-found or unexpected-version issue.
- Run a JavaScript file and use the Node.js REPL.
- Explain why dependencies are usually managed locally by the project.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md) | [Lesson](../lessons/012-install-and-verify-node-js-and-npm.md) | Q&A | [Example](../examples/012-install-and-verify-node-js-and-npm.md) | [013 - npm packages, scripts, and semantic version ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) |
