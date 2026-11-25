# 014 - Create a Node.js Project with ES Modules: Questions and Answers

Use these questions to review Node.js project structure, ES module markers, imports and exports, relative paths, and the difference between ESM and CommonJS. Each answer includes a short explanation.

Related lesson: [014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md)

## Multiple-choice questions

### 1. What does a package.json file commonly describe?

- A. Project metadata, scripts, dependencies, and package settings
- B. Only the JavaScript engine source code
- C. Every installed package's source code
- D. The browser's HTML document

**Answer: A.** package.json is the project's manifest. npm and Node.js use its fields to understand the project.

### 2. Which package.json setting makes ordinary .js files in that package scope use ES modules?

- A. "module": true
- B. "type": "module"
- C. "format": "esm"
- D. "node": "import"

**Answer: B.** The type field set to module marks .js files in that package scope as ES modules.

### 3. How does Node.js interpret a file ending in .mjs?

- A. Always as an ES module
- B. Always as CommonJS
- C. As JSON
- D. Based only on the file's first comment

**Answer: A.** The .mjs extension is an explicit ES module marker.

### 4. What does a .cjs extension indicate?

- A. The file is CommonJS
- B. The file is an ES module only when the package type is module
- C. The file contains CSS
- D. The file is a package lockfile

**Answer: A.** The .cjs extension explicitly identifies a CommonJS file, including inside a package marked as ESM.

### 5. What does the type field in package.json affect?

- A. How Node.js interprets .js files within that package scope
- B. Whether Git makes the repository public
- C. Whether npm scripts can run
- D. Whether the browser supports JavaScript

**Answer: A.** The package type controls how Node.js interprets .js files in its package scope.

### 6. Which line correctly creates a named export?

- A. export function add(a, b) { return a + b; }
- B. publish function add(a, b) { return a + b; }
- C. module function add(a, b) { return a + b; }
- D. require function add(a, b) { return a + b; }

**Answer: A.** ESM uses the export keyword to make a declaration available to importing modules.

### 7. How should a named export called add be imported?

- A. import { add } from "./math.js";
- B. import add from "./math.js";
- C. require { add } from "./math.js";
- D. export add from "./math.js";

**Answer: A.** Named imports use braces and match the exported name unless the import is renamed with as.

### 8. Which import syntax is used for a default export?

- A. import makeGreeting from "./greeting.js";
- B. import { makeGreeting } from "./greeting.js";
- C. require default from "./greeting.js";
- D. export makeGreeting from "./greeting.js";

**Answer: A.** A default import has no braces, and the importing file can choose its local name.

### 9. How many default exports can a module have?

- A. One
- B. None
- C. Exactly two
- D. Any number, if they have different local names

**Answer: A.** A module can have one default export. It can also have multiple named exports.

### 10. Which is the correctly specified Node.js relative ESM import for a nearby file named math.js?

- A. import { add } from "./math.js";
- B. import { add } from "math";
- C. import { add } from "./math";
- D. import { add } from "src/math.js";

**Answer: A.** A nearby file uses a relative specifier and includes its actual extension.

### 11. From which location is a relative module specifier resolved?

- A. From the file that contains the import
- B. Always from the user's home directory
- C. Always from the operating system root
- D. From the browser's current web page

**Answer: A.** A specifier such as ./math.js is relative to the importing module, not the shell's current working directory.

### 12. What does the node: prefix identify in an import specifier?

- A. A Node.js built-in module
- B. A file in the current directory
- C. A module installed globally by npm
- D. A package that must always be downloaded

**Answer: A.** For example, node:path imports Node.js's built-in path module.

### 13. What does a bare specifier such as express normally refer to?

- A. An installed package
- B. A file beside the importing file
- C. A built-in module
- D. A command-line flag

**Answer: A.** A package-name specifier is resolved as a package; the project needs that package installed.

### 14. Where can a static import declaration appear?

- A. At the top level of a module
- B. Only inside an if statement
- C. Only inside a function body
- D. Only inside package.json

**Answer: A.** Static imports are top-level declarations. Use dynamic import() when loading must happen conditionally or later.

### 15. What does dynamic import() return?

- A. A promise for the loaded module
- B. A filesystem path string
- C. A package.json object
- D. A synchronous CommonJS module

**Answer: A.** Await the promise or handle it with then; the resolved value exposes the module's exports.

### 16. Which pair belongs to CommonJS?

- A. require() and module.exports
- B. import and export
- C. package.json and package-lock.json
- D. node: and import.meta

**Answer: A.** CommonJS uses require and module.exports; ESM uses import and export.

### 17. Which statement about require inside an ES module is correct?

- A. It is not provided as a CommonJS global by default
- B. It is always available in every ES module
- C. It is available only in a browser
- D. It replaces the need for package.json

**Answer: A.** An ESM file should use import syntax or a deliberate interoperability method.

### 18. What does import.meta.url provide?

- A. A URL identifying the current module
- B. The npm version range for the current project
- C. The current user's home directory
- D. The current module's exported function

**Answer: A.** It identifies the module as a URL. Convert it to a filesystem path when a path is required.

### 19. What does the private field in the example package.json help prevent?

- A. Accidental publication of the application package to npm
- B. Other people from reading a public Git repository
- C. Node.js from loading modules
- D. npm scripts from running locally

**Answer: A.** private is an npm publishing safeguard. It does not change Git repository visibility.

### 20. Which statement about node_modules is generally correct?

- A. It is generated by package installation and is normally ignored by Git
- B. It replaces package.json and should be the only committed dependency file
- C. It contains only the application's own source files
- D. Node.js creates it every time the program starts

**Answer: A.** npm can recreate installed packages from the manifest and lockfile, so projects normally do not commit node_modules.

## Short-answer questions

### 1. What is the role of package.json in a Node.js application?

**Answer:** It is the project manifest. It can contain project metadata, the module type, scripts, and dependency requirements.

### 2. What is the difference between ESM and CommonJS syntax?

**Answer:** ESM uses import and export. CommonJS uses require and module.exports. A project should use module markers and syntax consistently.

### 3. How can a Node.js project mark its .js files as ESM?

**Answer:** Set "type": "module" in the nearest applicable package.json. Alternatively, use the .mjs extension for an ESM file.

### 4. When should a .cjs file be used?

**Answer:** Use .cjs when a file intentionally uses CommonJS, especially inside a package whose type is module.

### 5. What is the difference between a named export and a default export?

**Answer:** A named export is imported using its exported name inside braces. A module can have several named exports. A module can have one default export, imported without braces under a local name chosen by the importer.

### 6. Why should a relative Node.js ESM import include the extension?

**Answer:** Node.js ESM resolves relative file specifiers as written and does not normally search for omitted extensions. Writing ./math.js identifies the exact file.

### 7. What is the difference between ./math.js and math?

**Answer:** ./math.js is an explicit relative file path. math is a bare specifier and is generally resolved as a package name.

### 8. What is the difference between a relative module path and the terminal's current directory?

**Answer:** A relative module path is resolved from the file containing the import. The terminal's current directory is the process working directory and can affect commands or filesystem operations.

### 9. When is dynamic import() useful?

**Answer:** It is useful when a module should load later or only under a condition. It returns a promise, so the loading code must handle asynchronous completion.

### 10. Why can require() fail inside a .js file?

**Answer:** If Node.js treats the file as an ES module, CommonJS require is not available as a global. Use ESM import syntax or deliberately place CommonJS code in a .cjs file.

### 11. What does node:path mean?

**Answer:** It refers to the path built-in module supplied by Node.js. The node: prefix makes the built-in module explicit.

### 12. What is import.meta.url?

**Answer:** It is a URL identifying the currently executing ES module. It is not itself a plain filesystem path.

### 13. How can an ES module derive its own directory?

**Answer:** Convert import.meta.url to a filesystem path with fileURLToPath from node:url, then use dirname from node:path.

### 14. What does private: true do in package.json?

**Answer:** It helps stop accidental npm publication of the package. It does not make the GitHub repository private.

### 15. Which files should normally be committed for an npm application, and which generated folder should usually be ignored?

**Answer:** Commit package.json and package-lock.json when a lockfile exists. Usually ignore node_modules because npm can recreate it from those files.

### 16. What should you check when Node.js reports that it cannot find an imported module?

**Answer:** Check that the local path begins with ./ or ../, is relative to the importing file, uses the correct capitalization and extension, and points to an existing file. For a package import, confirm that the package is installed.

### 17. Why can changing the type field break existing code?

**Answer:** It changes how Node.js interprets .js files in the package scope. Code written with CommonJS globals can stop working when its file becomes ESM.

### 18. Why keep module top-level code small?

**Answer:** A module's top-level initialization runs when it is loaded. Keeping repeatable work in functions makes imports easier to reason about and avoids unexpected side effects.

## Review checklist

You are ready to move on when you can:

- Explain package.json, the type field, and the role of package scope.
- Identify .mjs, .cjs, and .js module markers.
- Write and import named and default exports.
- Explain why Node.js relative ESM imports include file extensions.
- Distinguish relative paths, built-in module specifiers, and package names.
- Explain when to use static import and dynamic import().
- Diagnose common ESM and CommonJS errors.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [013 - npm Packages, Scripts, and Semantic Version Ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Lesson](../lessons/014-create-a-node-js-project-with-es-modules.md) | Q&A | [Example](../examples/014-create-a-node-js-project-with-es-modules.md) | [015 - Environment Variables, Configuration, and Secrets](../lessons/015-environment-variables-configuration-and-secrets.md) |
