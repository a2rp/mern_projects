# 014 - Create a Node.js Project with ES Modules

## Learning goals

By the end of this lesson, you should be able to:

- Create a Node.js application project with a clear file structure.
- Tell Node.js that a project uses ECMAScript modules (ES modules).
- Export values from one file and import them into another.
- Write correct relative import paths in Node.js.
- Recognize the difference between ES modules and CommonJS.
- Add npm scripts and keep generated dependencies out of version control.
- Diagnose common module and file-path errors.

## What is a Node.js project?

A Node.js project is a directory containing JavaScript files and, usually, a package.json file. The manifest gives Node.js and npm information about the project. It can declare the module system, define scripts, list dependencies, and hold other package settings.

A small application might use this structure:

~~~text
my-app/
|-- package.json
|-- .gitignore
|-- src/
|   |-- app.js
|   |-- math.js
|   +-- greeting.js
+-- package-lock.json
~~~

The src directory groups application source files. It is a convention, not a special Node.js requirement. Node.js can run a JavaScript file from any directory when you provide its path.

The package-lock.json file is created when npm resolves or installs project packages. A project with no dependencies may not need one until npm creates it. When present, commit the lockfile along with package.json so installs can reproduce the resolved package tree.

The node_modules directory holds installed packages. It is generated from the manifest and lockfile and is normally excluded from Git:

~~~gitignore
node_modules/
~~~

## Start a project

Create a directory, move into it, and create a starter manifest:

~~~sh
mkdir my-app
cd my-app
npm init -y
~~~

The -y option accepts npm's default answers. You can also edit package.json directly. JSON requires double-quoted property names and string values, and does not allow comments or trailing commas.

For an application that uses ES modules, add the type field and useful scripts:

~~~json
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "check": "node --check src/app.js"
  }
}
~~~

The private field helps prevent accidentally publishing an application with npm. It does not make the Git repository private and does not affect local scripts.

Run the start script with:

~~~sh
npm start
~~~

Run a custom check script with:

~~~sh
npm run check
~~~

Create the source directory, then create the files in an editor:

~~~sh
mkdir src
~~~

The complete working project appears in the chapter example.

## How Node.js identifies ES modules

JavaScript has two widely used module systems in Node.js: ECMAScript modules (ES modules, often shortened to ESM) and CommonJS.

Node.js recognizes ES modules through explicit file or package markers:

- A file ending in .mjs is an ES module.
- A .js file is an ES module when the nearest applicable package.json sets "type": "module".
- A file ending in .cjs is CommonJS, even inside a package whose type is module.

This course uses "type": "module" and .js source files. It keeps the project consistent and lets examples use ordinary .js filenames.

~~~json
{
  "type": "module"
}
~~~

The type field applies to .js files in that package scope. A nested directory can have its own package.json and establish a different scope. Keep application files inside the intended project so Node.js finds the expected package manifest.

A package does not need a type value to use ESM if its source files use .mjs. Avoid changing a project's module type casually: the same .js file can be interpreted differently after the setting changes.

## Export and import values

A module can export values for other modules to use. ES modules support named exports and a default export.

### Named exports

A named export gives a value an explicit exported name:

~~~js
// math.js
export function add(first, second) {
  return first + second;
}

export const taxRate = 0.08;
~~~

Import named exports by using the same exported names inside braces:

~~~js
// app.js
import { add, taxRate } from "./math.js";

console.log(add(5, 3));
console.log(taxRate);
~~~

You may rename an import locally with as:

~~~js
import { add as sum } from "./math.js";

console.log(sum(5, 3));
~~~

The local name does not change the name exported by the original module.

### Default export

A module may have one default export:

~~~js
// greeting.js
export default function makeGreeting(name) {
  return "Hello, " + name + "!";
}
~~~

Import a default export without braces. The importing module chooses its local name:

~~~js
// app.js
import createGreeting from "./greeting.js";

console.log(createGreeting("Asha"));
~~~

Named and default exports can be used in the same module, but choose a clear pattern. Use named exports when callers should select among several values. A default export is useful when the file represents one primary value or function.

## Write Node.js import paths correctly

An import specifier tells Node.js which module to load. In Node.js ESM, relative file imports should include the file extension:

~~~js
import { add } from "./math.js";
import makeGreeting from "./greeting.js";
~~~

The path is relative to the file containing the import, not to the terminal's current working directory. If app.js and math.js are both in src, then ./math.js points from src/app.js to src/math.js.

Use:

- ./file.js for a file beside the importing file.
- ../file.js to move up one directory.
- node:module-name for a Node.js built-in module.
- A package name such as express for an installed package.

For example, node:path is a built-in module specifier:

~~~js
import path from "node:path";

console.log(path.basename("/projects/my-app/src/app.js"));
~~~

A package import uses a package installed in the project:

~~~js
import express from "express";
~~~

This requires Express to be present in the project's dependencies. Do not use a bare package name when you intend to import a nearby file; use a relative path with ./ or ../.

Node.js does not automatically try common file extensions or directory index files for relative ESM imports. Write the actual filename and extension. An import such as ./math may work in some bundlers or other runtimes, but it is not the normal fully specified relative import used by Node.js ESM.

## Static imports and dynamic imports

A static import declaration appears at the top level of a module:

~~~js
import { add } from "./math.js";
~~~

Static imports make dependencies clear before the module body runs. They cannot be placed inside an if statement or function body.

Use the dynamic import() function when a module should be loaded later or conditionally:

~~~js
async function loadOptionalFeature() {
  const feature = await import("./optional-feature.js");
  feature.run();
}
~~~

Dynamic import returns a promise. The loaded module's named exports are available on the resolved module object. Use it only when loading at runtime is useful; ordinary dependencies are clearer as static imports.

## Keep ESM and CommonJS distinct

CommonJS uses require() and module.exports:

~~~js
const math = require("./math.cjs");
module.exports = math;
~~~

ES modules use import and export:

~~~js
import { add } from "./math.js";
export { add };
~~~

Do not copy CommonJS syntax into a .js file in a package marked "type": "module". In that context, require, module, exports, __filename, and __dirname are not provided as CommonJS globals.

For a CommonJS file inside an ESM package, use the .cjs extension. For an ES module, use .mjs or the package's "type": "module" setting. Node.js supports interoperability between the systems, but the details can be surprising; this course uses ESM consistently in its application code.

## ESM-specific module information

ES modules provide import.meta, which contains metadata about the current module. One useful property is import.meta.url, a URL identifying the current module file:

~~~js
console.log(import.meta.url);
~~~

This is usually a file URL when the module is loaded from disk. It is not the same as a plain filesystem path. If code needs a filesystem path, Node.js provides utilities for converting file URLs.

ES modules do not define __dirname by default. When a program needs a path relative to its own file, derive it from import.meta.url with Node.js file URL utilities rather than assuming the process started in a particular working directory.

~~~js
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
~~~

A module's initialization code runs when it is first loaded into a process. Later imports of the same resolved module in that process use the loaded module rather than rerunning its top-level code. Keep top-level code focused on declarations and setup; put repeatable actions in functions.

## A practical project workflow

1. Create the project directory and run npm init -y.
2. Add "type": "module" to package.json.
3. Add scripts such as start and check.
4. Put application source files in a directory such as src.
5. Use export to expose a value and import to use it elsewhere.
6. Include .js in relative Node.js ESM import paths.
7. Run the application with npm start.
8. Add a dependency with npm only when the project needs it.
9. Commit package.json and, when generated, package-lock.json.
10. Keep node_modules out of version control.

## Common errors and how to fix them

### "Cannot use import statement outside a module"

Node.js is treating the file as CommonJS. Use a .mjs extension or set "type": "module" in the nearest project package.json. Confirm that the file is inside the intended package directory.

### "require is not defined in ES module scope"

The file is running as ESM, but its code uses CommonJS require. Convert the import to ESM syntax or deliberately use a .cjs file for CommonJS code.

### "Cannot find module" or "Module not found"

Check each part of the specifier:

1. Is the import relative (./ or ../) when it targets a local file?
2. Is the path relative to the importing file?
3. Does the capitalization match the real filename?
4. Did you include the file extension?
5. Does the target file exist at that location?
6. If it is a package import, is that package installed in this project?

### JSON syntax error in package.json

package.json is JSON, not JavaScript. Use double quotes, remove comments, and remove trailing commas. Validate the braces and commas if Node.js cannot read the manifest.

### A script works from one directory but imports fail from another

A relative module import is resolved from the importing file. Commands and files opened through relative filesystem paths may depend on the process working directory. Run npm commands from the directory containing package.json, and use module-relative paths for files that must be located beside the current module.

## Key takeaways

- A Node.js project is organized around its directory and usually a package.json manifest.
- Use "type": "module" to make .js files in that package scope ES modules; .mjs is also always ESM and .cjs is CommonJS.
- ESM uses export and import; CommonJS uses module.exports and require.
- Node.js relative ESM imports should name the real file and its extension.
- Relative imports are resolved from the importing file, not the shell's current directory.
- node: identifies Node.js built-in modules.
- Use import.meta.url when code needs information about its own module location.
- Commit project manifests and lockfiles, and ignore generated node_modules.

## Review checklist

You are ready to move on when you can:

- Create a project with a package.json and a src directory.
- Configure the package to use ES modules.
- Write and import both named and default exports.
- Explain why a relative Node.js ESM import includes a file extension.
- Tell an ESM file from a CommonJS file using its marker.
- Fix a module type error, a missing path, or an invalid JSON manifest.
- Explain the roles of package.json, package-lock.json, and node_modules.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [013 - npm Packages, Scripts, and Semantic Version Ranges](013-npm-packages-scripts-and-semantic-version-ranges.md) | Lesson | [Q&A](../qnas/014-create-a-node-js-project-with-es-modules.md) | [Example](../examples/014-create-a-node-js-project-with-es-modules.md) | [015 - Environment Variables, Configuration, and Secrets](015-environment-variables-configuration-and-secrets.md) |
