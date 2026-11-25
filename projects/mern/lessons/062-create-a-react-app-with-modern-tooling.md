# 062 - Create a React app with modern tooling

A React application needs more than component code. It also needs a development server, JSX transformation, dependency management, and a production build. A build tool connects those pieces so you can write modern JavaScript and JSX, get fast local feedback, and produce static assets for deployment.

This chapter creates a client-side React app with Vite. React's current guidance recommends starting a complete production application with a framework when its capabilities fit the project. A Vite app is a useful way to learn React fundamentals, build a client-rendered single-page app, or add React to an existing backend. Vite itself does not provide every framework feature such as server rendering or full-stack routing.

## Learning goals

By the end of this chapter, you should be able to:

- Create a React project from a maintained Vite template.
- Explain the roles of npm, Vite, React, and React DOM.
- Identify the HTML entry point and React root.
- Start the development server and produce a production build.
- Understand how local environment variables reach browser code.
- Keep secrets, generated files, and dependency versions managed safely.
- Decide when a Vite SPA is suitable and when a framework is a better starting point.

## Check the runtime and package manager

Vite and its templates have minimum Node.js requirements that can change between releases. Before creating the app, install a currently supported Node.js LTS release and check the current Vite requirement if a command reports an unsupported runtime.

~~~sh
node --version
npm --version
~~~

Node runs the development tooling and package scripts. npm installs the project's declared packages and records exact dependency versions in a lockfile. Use the package manager selected for the project consistently; do not mix npm, pnpm, and Yarn lockfiles in one app without a migration plan.

## Scaffold a React app with Vite

From the directory where the new app should live, run:

~~~sh
npm create vite@latest my-mern-client -- --template react
cd my-mern-client
npm install
npm run dev
~~~

The scaffold command creates a starter project using the React template. The development server prints a local address; open that address in a browser. Keep the terminal running while you work.

The template is maintained over time, so generated files, scripts, and package versions may differ from an older tutorial. Read the generated `package.json` and the terminal output instead of replacing current template files with stale copies.

Vite is a build tool, not a backend API server. In a MERN app, the React client may request data from an Express API running separately. Configure and secure that connection deliberately.

## Know what the main pieces do

- **React** provides component APIs for describing and updating the interface.
- **React DOM** connects React components to browser DOM roots.
- **Vite** serves source files during development and transforms/bundles the app for production.
- **npm** installs packages and runs commands declared in `package.json`.
- **The browser** executes the built client application and displays its interface.

Vite does not replace React, and React does not replace Express or MongoDB. They have different roles in the application.

## Understand the starter structure

A basic Vite React template commonly contains:

~~~text
my-mern-client/
├── index.html
├── package.json
├── package-lock.json
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
└── vite.config.js
~~~

The exact starter files depend on the template version and options you selected.

- `index.html` is the browser document Vite serves and uses as the HTML entry.
- `src/main.jsx` creates the React root and renders the top-level component.
- `src/App.jsx` is a starter component you can replace with app UI.
- `public/` holds assets served or copied as-is using root-relative URLs.
- `package.json` records project scripts and declared dependencies.
- `package-lock.json` records the npm dependency tree for repeatable installs.
- `vite.config.js` configures Vite and any framework plugins used by the template.

Do not assume every template has the same optional files. Keep the generated configuration unless you have a clear reason to change it.

## Connect the HTML document to React

The HTML entry has a root element and a module script:

~~~html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <title>MERN Client</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.jsx"></script>
    </body>
</html>
~~~

The browser loads the module entry. That entry finds the root element and asks React DOM to render the app there. The Vite development server handles module transformation and reload behavior during development.

## Create the React root

A modern React DOM entry uses `createRoot`:

~~~jsx
// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('The HTML document must contain an element with id="root".');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
~~~

`createRoot` connects React to the chosen DOM element. `StrictMode` enables development checks that can reveal unsafe patterns; it does not add a visible wrapper to the production page. Development behavior may call component logic more than once to help find bugs, so keep rendering pure.

Avoid calling `createRoot` from a component or creating multiple roots for the same application area without a specific integration need.

## Replace the starter UI

A small component is enough to confirm that the entry point, JSX transform, and React rendering work:

~~~jsx
// src/App.jsx
import { useState } from "react";

export default function App() {
    const [count, setCount] = useState(0);

    return (
        <main>
            <h1>MERN Client</h1>
            <p>React is connected to the Vite development server.</p>
            <button
                type="button"
                onClick={() => setCount(previous => previous + 1)}
            >
                Clicked {count} times
            </button>
        </main>
    );
}
~~~

The state setter requests a render with the new count. React updates the displayed text while the surrounding app stays mounted.

## Use the project scripts

Inspect `package.json` and run the scripts provided by the selected template:

~~~sh
npm run dev
npm run build
npm run preview
~~~

- `dev` starts the local development server with fast feedback.
- `build` creates the optimized production output, commonly in `dist/`.
- `preview` serves that built output locally so you can inspect the production bundle.

The preview server is for local verification, not a production web server. Deploy the generated static assets to the hosting environment chosen for the project, or use a framework/server when the app needs server-side rendering or server functionality.

A Vite template may also include linting or other scripts. Use those scripts when present and keep their configuration aligned with the codebase.

## Understand development and production behavior

The development server serves modules and transforms source code for a fast feedback loop. The production build bundles and optimizes client assets. A successful development session does not guarantee that the production build succeeds, so include the build command in the project's normal verification and deployment process.

Vite may use a different local port if its default port is already occupied. Read the address printed in the terminal rather than assuming the app always runs at one specific port.

## Configure a backend API address safely

For local development, create a local environment file such as `.env.local`:

~~~dotenv
VITE_API_BASE_URL=http://localhost:3000/api
~~~

Read it in browser code:

~~~js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
~~~

Variables with the `VITE_` prefix are substituted into client-side code. Anyone who can load the app can inspect those values. Store only public configuration there, such as a public API base URL. Never put database passwords, signing keys, private API tokens, or server-only secrets in a `VITE_` variable.

Keep local secret-bearing files out of version control. A committed `.env.example` may document required variable names with safe placeholder values. The Express server should keep its own private environment configuration separate from the React client.

For development, the Vite dev server can optionally proxy API requests to Express. Configure that intentionally and keep production routing/hosting aligned with the deployment setup. A development proxy does not change how the production client reaches the API.

## Manage dependencies and generated files

- Commit `package.json` and the lockfile used by the chosen package manager.
- Use `npm ci` in automated environments when installing from a committed npm lockfile.
- Do not commit `node_modules/` or the generated production directory unless the hosting workflow specifically requires it.
- Keep local environment files such as `.env.local` out of Git.
- Review dependency changes and update the lockfile intentionally.
- Check the current runtime requirement when upgrading Vite or its plugins.
- Do not install a separate JSX compiler or bundler unless the project needs a different setup; the selected template already configures its toolchain.

## Choose Vite or a framework deliberately

A Vite SPA is a good fit when the application is intentionally client-rendered, when you are learning React fundamentals, or when React is one part of an existing site or backend.

Consider a React framework when the application needs integrated routing, server rendering, static generation, server actions, or a broader full-stack React architecture. Start with the requirements of the product instead of assuming a client-side bundler supplies those features automatically.

Create React App is deprecated. For new learning projects in this chapter, use the maintained Vite template; for production applications, evaluate React's current framework guidance against the product's needs.

## Common setup mistakes

- Using a Node.js version unsupported by the current Vite release.
- Copying a package manifest from a different template or an older tutorial.
- Editing the wrong HTML entry or removing the root element.
- Forgetting to import the top-level component or stylesheet in the React entry.
- Putting secret values in a `VITE_` environment variable.
- Committing `.env.local`, `node_modules/`, or generated output unintentionally.
- Assuming the development server is the production deployment server.
- Assuming Vite provides routing, server rendering, or backend APIs by itself.
- Ignoring production build errors because the development server worked.
- Treating Strict Mode's development checks as production rendering behavior.

## Review checklist

- [ ] The current Node.js runtime meets the selected Vite template's requirements.
- [ ] The generated template and package scripts are understood.
- [ ] The HTML document contains the root element referenced by the React entry.
- [ ] The React root renders the top-level component.
- [ ] The app starts in development and produces a production build.
- [ ] The npm lockfile is committed and used consistently.
- [ ] Client environment values contain no secrets.
- [ ] Local environment files and generated folders are ignored by Git.
- [ ] The choice between a Vite SPA and a framework matches the app's needs.

## Summary

A Vite React template supplies the development server and production build pipeline, while React and React DOM describe and display the UI. The HTML entry connects to a React root, and package scripts provide the development and build workflow. Keep the lockfile, respect current runtime requirements, and treat every Vite-exposed environment variable as public. Choose a framework when the application needs capabilities beyond a client-rendered SPA.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [061 - React mental model and declarative UI](061-react-mental-model-and-declarative-ui.md) | [Q&A](../qnas/062-create-a-react-app-with-modern-tooling.md) | [Example](../examples/062-create-a-react-app-with-modern-tooling.md) | [063 - JSX and rendering values](063-jsx-and-rendering-values.md) |
