# 062 - Create a React app with modern tooling: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. What does Vite provide in a basic React SPA project?

- A. A development server and a build pipeline.
- B. A MongoDB database.
- C. An Express API automatically.
- D. A replacement for React components.

**Answer: A.** Vite serves and transforms the app during development and builds client assets for production.

### 2. What does React DOM do in a browser application?

- A. Connects React UI to browser DOM roots.
- B. Installs npm packages.
- C. Starts MongoDB.
- D. Replaces the browser's JavaScript engine.

**Answer: A.** React DOM provides the browser integration used to mount React UI into a DOM element.

### 3. What does npm primarily do in this workflow?

- A. Install project packages and run scripts from the package manifest.
- B. Render components in the browser.
- C. Store application records.
- D. Create an Express route automatically.

**Answer: A.** npm manages packages and provides commands declared by the project.

### 4. Which command scaffolds a Vite React JavaScript template named `my-app`?

- A. `npm create vite@latest my-app -- --template react`
- B. `npm run react my-app`
- C. `node create-react --vite`
- D. `npx express my-app`

**Answer: A.** The Vite scaffold command accepts the project name and the `react` template option.

### 5. Why should a developer check the currently supported Node.js version before using Vite?

- A. Vite and its templates can require a minimum runtime version that changes.
- B. React only runs on the newest nightly Node build.
- C. The browser reads Node's version from MongoDB.
- D. Node version controls CSS selectors.

**Answer: A.** Toolchain requirements change across releases, so the current package requirements should be followed.

### 6. Which file commonly provides the HTML entry document for a Vite app?

- A. `index.html`
- B. `server.js`
- C. `package-lock.json`
- D. `node_modules/`

**Answer: A.** Vite uses the project HTML entry and its module script to load the client app.

### 7. What is the role of `src/main.jsx` in a typical starter?

- A. Create a React DOM root and render the top-level component.
- B. Store MongoDB credentials.
- C. Define every API route.
- D. Configure npm's global cache.

**Answer: A.** The client entry imports the app and mounts it into the matching HTML root element.

### 8. Which element is needed in the HTML entry for this code to work?

- A. `<div id="root"></div>`
- B. `<database id="react"></database>`
- C. `<script id="express"></script>`
- D. `<main id="node"></main>` regardless of the code.

**Answer: A.** The ID must match the element selected by the React DOM entry.

### 9. What does `npm run dev` normally do in a Vite template?

- A. Start the local development server.
- B. Upload the app to production.
- C. Delete the lockfile.
- D. Create a MongoDB collection.

**Answer: A.** The generated package script invokes Vite's development server.

### 10. What does `npm run build` normally produce?

- A. Optimized production client assets.
- B. A production database backup.
- C. A new Git branch.
- D. An Express server with all routes.

**Answer: A.** The build command bundles the client application into output files for deployment.

### 11. What is `npm run preview` intended for in a Vite project?

- A. Locally inspect the production build.
- B. Replace the production hosting platform.
- C. Run a MongoDB migration.
- D. Start React Native.

**Answer: A.** Preview is a local way to serve the generated build; it is not a production web server.

### 12. Why should the project commit its npm lockfile?

- A. To record the resolved dependency tree for repeatable installs.
- B. To store secrets.
- C. To replace `package.json`.
- D. To contain the built HTML page.

**Answer: A.** The lockfile makes installs more consistent across developer and automated environments.

### 13. What does `npm ci` do when used with a committed npm lockfile?

- A. Install dependencies according to the lockfile in a clean automated workflow.
- B. Modify the React component tree.
- C. Generate a production API key.
- D. Start a browser.

**Answer: A.** `npm ci` is intended for repeatable installs from the committed lockfile.

### 14. What happens to a Vite environment variable prefixed with `VITE_`?

- A. It can be included in browser-side code and should be treated as public.
- B. It is automatically encrypted as a secret.
- C. It is only readable by MongoDB.
- D. It is never available to application code.

**Answer: A.** Client-exposed values can be inspected by users; do not put secrets in them.

### 15. Which value is generally appropriate for a client-exposed Vite variable?

- A. A public API base URL.
- B. A database password.
- C. A private token-signing key.
- D. A production MongoDB connection string with credentials.

**Answer: A.** A public endpoint URL can be client configuration; credentials and secrets belong on the server.

### 16. Where should `.env.local` usually be kept?

- A. Out of version control if it contains machine-specific or sensitive values.
- B. In the production bundle.
- C. Inside `node_modules`.
- D. In the public assets folder.

**Answer: A.** Local environment files should be ignored by Git; a safe example file can document variable names.

### 17. What does `StrictMode` do in a modern React development entry?

- A. Enables development checks that may expose unsafe patterns.
- B. Encrypts the production build.
- C. Adds a visible HTML wrapper to the page.
- D. Starts the Express server.

**Answer: A.** Strict Mode helps surface problems in development and does not add a visible DOM wrapper.

### 18. Which folder should generally not be committed to Git?

- A. `node_modules/`
- B. `src/`
- C. `public/`
- D. The package lockfile.

**Answer: A.** Dependencies are restored from the package manifest and lockfile rather than committed as installed files.

### 19. Which statement about Vite is accurate?

- A. It supplies a development and build toolchain; it does not automatically provide a complete backend or all framework features.
- B. It is the MongoDB query engine.
- C. It replaces every React component.
- D. It automatically authorizes API requests.

**Answer: A.** Vite is tooling for the client build workflow; APIs and other application capabilities need their own implementation.

### 20. What should be considered when choosing a React framework instead of a Vite SPA?

- A. Whether the app needs integrated routing, server rendering, static generation, or full-stack features.
- B. The color of the terminal.
- C. Whether the project has a `public` folder.
- D. Whether a component uses JSX.

**Answer: A.** Application requirements determine whether a plain client-side SPA or a framework is a better starting point.

## Short-answer questions

### 21. Distinguish React, React DOM, Vite, and npm.

**Answer:** React provides component APIs; React DOM connects components to a browser DOM root; Vite provides the development server and build pipeline; npm installs packages and runs project scripts.

### 22. What is the purpose of `index.html` in a basic Vite React project?

**Answer:** It is the browser document entry. It contains document metadata, the root element, and a module script that loads the React entry point.

### 23. What does `createRoot()` connect?

**Answer:** It creates a React root associated with a DOM element so the application can be rendered into that region of the page.

### 24. Why should a developer read the generated `package.json` after scaffolding?

**Answer:** Templates change. The package manifest shows the actual scripts, dependencies, and versions generated for that project.

### 25. Explain the difference between the development server and the production build.

**Answer:** The development server serves source modules with development tooling and fast feedback. The production build emits optimized client assets intended for deployment.

### 26. Why should the lockfile be committed?

**Answer:** It records resolved dependency versions so local and automated installs can use a consistent dependency tree.

### 27. Why is the Vite preview server not a production host?

**Answer:** It is intended for local inspection of build output. A real deployment needs the project's selected static host, web server, CDN, or application framework/server.

### 28. What types of values are appropriate for a client-exposed environment variable?

**Answer:** Public configuration such as a public API base URL. Anything bundled for the browser must be treated as visible to users, so secrets are inappropriate.

### 29. When could a React framework be a better fit than a basic Vite SPA?

**Answer:** When the application needs capabilities such as integrated routing, server-side rendering, static generation, server features, or a broader full-stack React architecture.

### 30. What should be verified after changing a Vite or plugin version?

**Answer:** Check that the Node.js runtime is supported, review dependency changes and lockfile updates, run the project's development and production workflows, and review relevant configuration changes.

## Application questions

### 31. Scaffolding fails with a message that the Node.js version is unsupported. What should you do?

**Answer:** Check the current Node.js requirement of the Vite version and selected template, install a supported runtime, then rerun the scaffold or package command.

### 32. The browser shows a blank page because `main.jsx` looks for `root`, but the HTML contains `app-root`. What needs to change?

**Answer:** Make the selected DOM ID and the HTML element ID match. For example, use `id="root"` in HTML or update the React entry to select `app-root`.

### 33. Development works, but the production build fails. What should be added to the project's workflow?

**Answer:** Run the build command as part of regular local verification and CI/deployment checks. A successful development server does not prove that production bundling succeeds.

### 34. A developer places a MongoDB password in `VITE_MONGO_PASSWORD`. Why is this unsafe and what should replace it?

**Answer:** Vite-prefixed variables can be bundled into public browser code. Keep database credentials in server-side environment configuration and let the browser call an authenticated backend API.

### 35. A developer cannot find `vite.config.js` in a generated starter. Is the project necessarily broken?

**Answer:** No. Generated templates vary and may not need an explicit configuration file. Inspect the generated files and scripts before adding unnecessary configuration.

### 36. The default development port is already in use, and Vite prints a different local URL. What should the developer do?

**Answer:** Open the address printed by the dev server or deliberately configure an available port. Do not assume the app always uses a hard-coded port.

### 37. CI installs dependencies but produces different versions than local development because no lockfile is committed. What should change?

**Answer:** Commit the lockfile for the selected package manager and use its reproducible install command, such as `npm ci` for npm-based CI.

### 38. A client app stores a private signing key in a local `.env.local` file and Git is about to commit it. What safeguards are needed?

**Answer:** Ensure local environment files are ignored, keep the key exclusively in server-side secret configuration, and use a safe placeholder-only example file if documenting the variable name.

### 39. A product requires server-rendered pages and integrated routing, but the team picked Vite only because it is popular. What should be reconsidered?

**Answer:** Evaluate a React framework that provides the required capabilities. Choose the architecture based on product requirements, not tool popularity alone.

### 40. A developer commits `dist/` and `node_modules/` without a deployment requirement. What should the repository normally contain instead?

**Answer:** Keep source code, package manifest, and lockfile under version control. Ignore installed dependencies and generated build output unless the hosting workflow explicitly requires those artifacts to be committed.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [061 - React mental model and declarative UI](../lessons/061-react-mental-model-and-declarative-ui.md) | [Lesson](../lessons/062-create-a-react-app-with-modern-tooling.md) | [Example](../examples/062-create-a-react-app-with-modern-tooling.md) | [063 - JSX and rendering values](../lessons/063-jsx-and-rendering-values.md) |
