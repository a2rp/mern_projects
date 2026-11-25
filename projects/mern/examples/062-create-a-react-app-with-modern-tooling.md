# 062 - Create a React app with modern tooling: example

This walkthrough creates a small client-side React app with Vite. It shows the scaffold command, the HTML entry, the React root, a starter component, public client configuration, Git ignore rules, and the development and production commands.

The code is educational material and is not run. Run the commands from the directory where you want the project created. Vite templates change over time, so preserve the generated package versions and configuration unless there is a clear reason to replace them.

## 1. Check Node.js and npm

~~~sh
node --version
npm --version
~~~

If the current Vite template reports that Node.js is too old, install a currently supported runtime and repeat the check. Requirements can change between tool releases.

## 2. Create the React project

~~~sh
npm create vite@latest mern-client -- --template react
cd mern-client
npm install
npm run dev
~~~

The scaffold asks any setup questions required by the current release, installs or prepares a React template, and prints a local development address. Open the address shown in the terminal; if its usual port is occupied, Vite may select a different one.

Do not run the scaffold command inside an existing project unless you intend to add a nested project directory. In an existing app, follow its established package manager and file layout.

## 3. Review the generated files

A basic template commonly has a structure like this:

~~~text
mern-client/
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

Some optional files and scripts vary by template version. Inspect the generated project before editing it:

~~~sh
npm run
~~~

This lists scripts available in the project's package manifest.

## 4. Set the HTML entry

Replace or adapt the generated `index.html` with the project title, essential metadata, root element, and module entry:

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

The `id` on the root element must match what the React entry selects. Vite starts from this HTML document and loads the JavaScript module.

## 5. Create the React DOM entry

Adapt `src/main.jsx`:

~~~jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('Missing the required element with id="root".');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
~~~

`createRoot()` attaches React to the selected DOM element. Strict Mode adds development checks and does not render a visible wrapper element.

## 6. Add a small component

Replace or adapt `src/App.jsx`:

~~~jsx
import { useState } from "react";

export default function App() {
    const [count, setCount] = useState(0);

    return (
        <main className="page">
            <p className="eyebrow">MERN learning project</p>
            <h1>React client is ready</h1>
            <p>
                Vite serves this page during development and builds it for
                deployment.
            </p>
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

This checks that JSX, React imports, the root element, and the development server are connected. The counter is only client state; it does not save data to Express or MongoDB.

## 7. Add basic styling

Create or adapt `src/index.css`:

~~~css
:root {
    font-family: system-ui, sans-serif;
    color: #172033;
    background: #f4f6fa;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
}

* {
    box-sizing: border-box;
}

body {
    min-width: 320px;
    min-height: 100vh;
    margin: 0;
}

.page {
    width: min(100% - 2rem, 48rem);
    margin: 5rem auto;
    padding: 2rem;
    border: 1px solid #d8deea;
    border-radius: 1rem;
    background: #fff;
}

.eyebrow {
    color: #4254b5;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

button {
    padding: 0.7rem 1rem;
    border: 0;
    border-radius: 0.5rem;
    color: white;
    background: #4254b5;
    font: inherit;
    cursor: pointer;
}

button:focus-visible {
    outline: 3px solid #172033;
    outline-offset: 3px;
}
~~~

## 8. Configure a public API address

For local development, a local environment file can hold the API's public base URL:

~~~dotenv
# .env.local
VITE_API_BASE_URL=http://localhost:3000/api
~~~

Client code can read it with:

~~~js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
~~~

Every value with the `VITE_` prefix can be included in browser code and inspected by users. A public API address is suitable; a database URL, password, private token, or signing key is not. Keep server secrets in the Express environment, not in this client project.

After changing environment files, restart the development server if the new value is not picked up.

## 9. Keep generated and local files out of Git

Check the scaffold's `.gitignore` and keep entries equivalent to these:

~~~gitignore
node_modules/
dist/
.env.local
.env.*.local
~~~

Preserve other useful generated ignore rules. Commit `package.json` and the npm lockfile, not the installed dependency directory. A safe `.env.example` can document required variable names with non-secret placeholder values.

## 10. Use the project scripts

During development:

~~~sh
npm run dev
~~~

Create production assets:

~~~sh
npm run build
~~~

Vite writes the built client assets to the configured output directory, which is commonly `dist/`. Inspect the build locally:

~~~sh
npm run preview
~~~

Use the local address printed by the preview command. The preview server helps inspect the build; deploy the generated assets to the project's actual hosting environment.

In CI, install from the committed lockfile and build:

~~~sh
npm ci
npm run build
~~~

Use scripts actually present in the generated package manifest. Some templates also provide a lint command.

## Expected result

The development terminal prints that Vite is ready and shows a local URL. Opening that URL displays:

- The heading **React client is ready**.
- A sentence explaining the Vite development and build roles.
- A button labeled **Clicked 0 times**.
- Clicking the button changes it to **Clicked 1 times**, then increments it on subsequent clicks without reloading the page.

After the production build, the output directory contains the static assets for deployment. The exact generated filenames and terminal formatting depend on the Vite template and build version.

## Connect the client to the MERN backend

Vite does not create or start the Express API. In development, run the API using its own project command and configure the client to reach it. The client may use the API base URL above, or the development server may use an intentional proxy for same-origin requests.

In production, configure the public API endpoint and hosting routes for the deployed environments. Keep CORS, authentication, authorization, and server-side validation in the Express application. Do not treat a client-visible environment variable or client-side validation as a secret or security boundary.

## Common setup errors

- **Unsupported Node.js:** follow the current Vite and template runtime requirements.
- **Blank page:** confirm the root element ID and the selector used by `main.jsx` match.
- **Missing component:** check the import path and filename capitalization.
- **No styles:** confirm that the entry imports the CSS file and the path is correct.
- **Unexpected port:** open the exact address printed by Vite.
- **Build fails:** check the production build output; a working dev server does not guarantee a valid build.
- **Environment value is undefined:** check the `VITE_` prefix, file name, and whether the dev server needs a restart.
- **Secret appears in client code:** remove it from client environment files, rotate it if it was exposed, and configure it only on the server.
- **Git shows huge changes:** ensure `node_modules/`, generated output, and local environment files are ignored.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [061 - React mental model and declarative UI](../lessons/061-react-mental-model-and-declarative-ui.md) | [Q&A](../qnas/062-create-a-react-app-with-modern-tooling.md) | [063 - JSX and rendering values](../lessons/063-jsx-and-rendering-values.md) |
