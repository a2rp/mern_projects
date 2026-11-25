# 013 - npm Packages, Scripts, and Semantic Version Ranges: Questions and Answers

Use these questions to review npm packages, project manifests, dependency categories, npm scripts, lockfiles, installation commands, and SemVer ranges. Each answer includes a short explanation.

Related lesson: [013 - npm packages, scripts, and semantic version ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md)

## Multiple-choice questions

### 1. What is package.json?

- A. A project manifest describing metadata, scripts, and dependency requirements
- B. A folder containing every installed package
- C. A lockfile containing only exact transitive versions
- D. A Node.js executable

**Answer: A.** package.json describes the package and commonly includes its scripts and dependencies.

### 2. Which command creates a starter package.json using npm defaults?

- A. npm init -y
- B. npm ci --new
- C. node --package
- D. git init npm

**Answer: A.** The -y option accepts default answers and writes the starter manifest in the current directory.

### 3. Where should you run npm install express to add Express to a project?

- A. In the project directory containing package.json
- B. In any directory, because npm always knows which project you meant
- C. In the Node.js installation directory
- D. Inside the browser console

**Answer: A.** Run project dependency commands from the project root so npm updates the intended manifest and lockfile.

### 4. What does npm install express normally do in the project root?

- A. Adds Express as a production dependency and installs it locally
- B. Replaces Node.js with Express
- C. Adds Express to every project globally
- D. Deletes package.json

**Answer: A.** By default, npm adds the package to dependencies and installs it into the project's node_modules directory.

### 5. When is --save-dev appropriate?

- A. For a tool needed during development but not directly at runtime
- B. For every package without considering its purpose
- C. To publish the package immediately
- D. To remove the package from package-lock.json

**Answer: A.** Development tools such as linters or formatters normally belong in devDependencies.

### 6. What is the role of package-lock.json?

- A. Record the resolved dependency tree for a project
- B. Replace all source code files
- C. Store the Node.js executable
- D. List only project scripts

**Answer: A.** The lockfile records resolved package versions and related integrity information for repeatable installs.

### 7. Which files should a typical application commit to share its dependency setup?

- A. package.json and package-lock.json
- B. Only node_modules
- C. Only the npm cache
- D. The Node.js executable and the user's global package directory

**Answer: A.** Commit the manifest and lockfile. The installed node_modules directory can be regenerated from them.

### 8. What does npm ci require?

- A. A project lockfile that matches package.json
- B. An empty package.json
- C. A global installation of every dependency
- D. A published npm account

**Answer: A.** npm ci is a clean project installation based on an existing matching lockfile.

### 9. What happens to an existing node_modules directory when npm ci begins?

- A. npm removes it before installing the locked tree
- B. npm commits it to Git automatically
- C. npm renames it to package.json
- D. npm keeps it and only prints a warning

**Answer: A.** npm ci removes the current node_modules directory as part of its clean installation.

### 10. What is a key difference between npm install and npm ci?

- A. npm ci performs a clean locked install and does not rewrite the manifest or lockfile
- B. npm install can run only on Windows
- C. npm ci adds a single package by name
- D. npm install cannot read a lockfile

**Answer: A.** npm ci is strict about the lockfile and is intended for clean project installs; npm install can add packages and update project dependency data.

### 11. What command runs a custom script named check?

- A. npm run check
- B. node npm check
- C. npm install check
- D. git run check

**Answer: A.** Custom scripts in the package.json scripts field are run with npm run followed by their name.

### 12. What does npm run with no script name generally do?

- A. Lists the project's available scripts
- B. Deletes all scripts
- C. Starts every script at once
- D. Updates Node.js

**Answer: A.** npm can display scripts defined in the package manifest.

### 13. Which version is a patch release after 2.4.7 under SemVer?

- A. 2.4.8
- B. 2.5.0
- C. 3.0.0
- D. 1.4.7

**Answer: A.** A patch release increments the third number while keeping the major and minor numbers fixed.

### 14. Which version is a backward-compatible minor release after 2.4.7?

- A. 2.5.0
- B. 2.4.8
- C. 3.0.0
- D. 2.4.7-beta.1

**Answer: A.** A minor release increments the middle number and resets the patch number.

### 15. What does a caret range such as ^1.2.3 generally allow?

- A. Compatible versions at or above 1.2.3 and below 2.0.0
- B. Only version 1.2.3
- C. Every published version including major 2
- D. Only patch versions below 1.2.3

**Answer: A.** For a stable major version, the caret range permits minor and patch updates below the next major version.

### 16. What does a tilde range such as ~1.2.3 generally allow?

- A. Patch versions at or above 1.2.3 and below 1.3.0
- B. Every version below 2.0.0
- C. Only version 1.2.0
- D. Major updates through 9.0.0

**Answer: A.** The tilde range normally permits patch updates within the same minor version.

### 17. What is a special consideration for the range ^0.2.3?

- A. It stays within the 0.2 line rather than permitting every version below 1.0.0
- B. It means exactly 0.2.3
- C. It permits 1.0.0 and later
- D. It is invalid JSON

**Answer: A.** Caret behavior for zero-major versions is more restrictive because early package versions can make breaking changes.

### 18. What does the version range in package.json describe?

- A. Which versions are acceptable to resolve
- B. The exact versions of every transitive dependency in all cases
- C. The local filesystem path to node.exe
- D. The output of every npm script

**Answer: A.** A range describes acceptable versions. The lockfile records the resolved project tree.

### 19. Why is node_modules usually not committed?

- A. npm can regenerate it from the manifest and lockfile, and it can be large
- B. Git cannot store folders
- C. Node.js refuses to read committed folders
- D. npm requires the folder to be hidden

**Answer: A.** The directory contains installed package files and is normally recreated during setup.

### 20. What does private: true in package.json do?

- A. Helps prevent accidental publication of an application package
- B. Makes all dependencies globally private
- C. Prevents npm from installing packages
- D. Encrypts the project's source code

**Answer: A.** The private field is a publication safeguard. It does not prevent local development or dependency installation.

## Short-answer questions

### 1. What does an npm package contain or describe?

**Answer:** A package is reusable software with metadata, often described by package.json. It may be a library, a command-line tool, or an application package.

### 2. What is the difference between package.json and package-lock.json?

**Answer:** package.json declares metadata, scripts, and acceptable dependency requirements. package-lock.json records the resolved dependency tree for the project.

### 3. What does the node_modules directory contain?

**Answer:** It contains the installed package files for the project. npm can recreate it from the manifest and lockfile.

### 4. When should a package go in dependencies?

**Answer:** When the application needs that package in its production runtime.

### 5. When should a package go in devDependencies?

**Answer:** When it is a development or build tool that is not directly needed to run the deployed application, such as a linter or formatter.

### 6. What does npm install <package> do in a project?

**Answer:** It installs the package locally, records it in dependencies by default, and updates the lockfile.

### 7. What does npm install --save-dev <package> do?

**Answer:** It installs a package locally and records it under devDependencies for development-time use.

### 8. Why should the package-lock.json file usually be committed?

**Answer:** It records the resolved dependency versions so collaborators and automation can install a consistent dependency tree.

### 9. What does npm install without a package name do?

**Answer:** It installs the dependencies declared by the project, using the lockfile when the resolved versions satisfy the manifest ranges. It may update the lockfile when requirements need resolving.

### 10. What does npm ci do?

**Answer:** It installs the complete project from a matching lockfile as a clean install. It removes node_modules first and does not rewrite package.json or package-lock.json.

### 11. Why can npm ci fail when npm install succeeds?

**Answer:** npm ci requires the manifest and lockfile to be in sync. If their dependency requirements differ, it stops rather than updating the lockfile.

### 12. What is an npm script?

**Answer:** It is a named command in package.json's scripts field. It gives the project a repeatable way to run tasks such as starting an application or checking a file.

### 13. What command runs a custom script named dev?

**Answer:** Run npm run dev. Built-in command forms such as npm start exist for some conventional script names.

### 14. Why can npm scripts use a locally installed command-line tool?

**Answer:** npm adds local package executable directories to the script PATH while the command runs. This lets the project use its own tool version without requiring a global install.

### 15. What do the three parts of a SemVer version represent?

**Answer:** MAJOR is the breaking-change number, MINOR is the backward-compatible feature number, and PATCH is the backward-compatible bug-fix number.

### 16. What is the general difference between ^1.2.3 and ~1.2.3?

**Answer:** ^1.2.3 normally accepts minor and patch releases below 2.0.0. ~1.2.3 normally accepts patch releases below 1.3.0.

### 17. Why should you pay attention to caret ranges for 0.x packages?

**Answer:** Zero-major versions have special range behavior. For example, ^0.2.3 stays below 0.3.0 rather than allowing every version below 1.0.0.

### 18. Does a version range alone guarantee the exact same dependency tree on every machine?

**Answer:** No. A range states which versions are acceptable. A lockfile records the resolved tree so npm can reproduce the project's selected versions.

### 19. Why should you update the lockfile through npm instead of editing it manually?

**Answer:** npm maintains the relationship between the manifest and the resolved dependency graph. Manual edits can make the lockfile inconsistent or invalid.

### 20. Why is npm ci not the command for adding one new package?

**Answer:** npm ci installs the whole project from an existing lockfile. Add or remove a package with npm install or npm uninstall, review the updated manifest and lockfile, and then use npm ci for a clean install if needed.

### 21. What is one reason to include private: true in an application package?

**Answer:** It helps prevent accidental publication of an application that is intended to remain a private project.

## Review checklist

You are ready to move on when you can:

- Describe the purpose of package.json, package-lock.json, and node_modules.
- Choose dependencies or devDependencies based on runtime needs.
- Add a dependency, remove a dependency, and define an npm script.
- Explain the clean-install behavior of npm ci.
- Read major, minor, and patch version numbers.
- Explain what caret and tilde ranges permit, including the zero-major caveat.
- Explain why version ranges and lockfiles work together.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md) | [Lesson](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) | Q&A | [Example](../examples/013-npm-packages-scripts-and-semantic-version-ranges.md) | [014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md) |
