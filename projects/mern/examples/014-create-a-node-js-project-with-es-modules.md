# Example 014 - Create a Node.js Project with ES Modules

## Question

How can you set up a small Node.js application, split its code into ES modules, and connect the files with correct imports?

## Goal

Create a dependency-free Node.js application that demonstrates:

- A package.json manifest that marks the project as ESM.
- A start script for running the application.
- Named exports and named imports.
- A default export and default import.
- Relative import paths that include the .js extension.
- A Node.js built-in module imported with the node: prefix.
- A .gitignore entry for generated dependencies.

## 1. Create the project structure

Create a folder named `esm-project-demo` and add these files:

~~~text
esm-project-demo/
|-- package.json
|-- .gitignore
+-- src/
    |-- app.js
    |-- math.js
    |-- greeting.js
    +-- tasks.js
~~~

Open a terminal in `esm-project-demo`. The npm command in the next section should be run from the directory containing package.json.

## 2. Add package.json

Create `package.json`:

~~~json
{
  "name": "esm-project-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/app.js"
  }
}
~~~

The type field tells Node.js to interpret .js files in this package scope as ES modules. The start script gives the application a consistent run command. The private field helps prevent accidental publication to npm; it does not affect the visibility of a Git repository.

This project has no third-party dependencies, so there is no npm install step. If you later add a dependency, use npm to install it and commit the updated manifest and lockfile.

## 3. Ignore generated dependencies

Create `.gitignore`:

~~~gitignore
node_modules/
~~~

npm can recreate node_modules from the project manifest and lockfile when dependencies are added, so do not commit that generated directory.

## 4. Create a named-export module

Create `src/math.js`:

~~~js
export function add(first, second) {
  return first + second;
}
~~~

The add function is a named export. Another module can import it by that name.

## 5. Create a default-export module

Create `src/greeting.js`:

~~~js
export default function makeGreeting(name) {
  return "Hello, " + name + "!";
}
~~~

This file has one default export. The importing module can choose a local name for it.

## 6. Create a module with data and behavior

Create `src/tasks.js`:

~~~js
export const tasks = [
  { title: "Plan the feature", done: false },
  { title: "Write the first module", done: true },
  { title: "Review imports", done: false }
];

export function countOpenTasks(taskList) {
  return taskList.filter((task) => !task.done).length;
}
~~~

This module demonstrates two named exports: the tasks array and a function that counts unfinished tasks.

## 7. Import the modules in the application

Create `src/app.js`:

~~~js
import process from "node:process";
import { add } from "./math.js";
import makeGreeting from "./greeting.js";
import { tasks, countOpenTasks } from "./tasks.js";

console.log("Application started");
console.log("Node.js: " + process.version);
console.log("Sum: " + add(8, 6));
console.log("Greeting: " + makeGreeting("Asha"));
console.log("Open tasks: " + countOpenTasks(tasks));
console.log("Tasks: " + tasks.map((task) => task.title).join(", "));
~~~

The local imports use paths relative to app.js, and each path includes its .js extension. The process module is built into Node.js, so no package installation is needed. The code uses both named and default imports.

## 8. Run the project

From the esm-project-demo directory, run:

~~~sh
npm start
~~~

You can also start the application directly:

~~~sh
node src/app.js
~~~

Both commands start the same file. npm start reads the start script from package.json.

## Expected application output

The Node.js version line depends on the version installed on your computer. The remaining lines should be:

~~~text
Application started
Node.js: vXX.YY.Z
Sum: 14
Greeting: Hello, Asha!
Open tasks: 2
Tasks: Plan the feature, Write the first module, Review imports
~~~

Replace vXX.YY.Z with the version printed by your local Node.js installation.

## How the imports connect

- app.js is the entry point used by the start script.
- math.js exports add by name; app.js imports it inside braces.
- greeting.js has a default export; app.js imports it without braces.
- tasks.js exports both an array and a function by name.
- The paths beginning with ./ identify files relative to app.js.
- The node:process specifier loads a Node.js built-in module.
- package.json marks the project's .js files as ES modules.

No browser is needed for this example. Node.js runs the application and prints its output in the terminal.

## Common mistakes to avoid

- Leaving out the extension in a relative import, such as writing ./math instead of ./math.js.
- Writing a local file import as a bare name such as math.js instead of ./math.js.
- Importing a named export without braces or using a name that the module does not export.
- Importing a default export with braces.
- Using require or module.exports in a .js file marked as ESM.
- Running npm start from a directory that does not contain the project's package.json.
- Expecting node_modules to exist even though this example installs no packages.

## Try these changes

1. Change the numbers passed to add and predict the new sum.
2. Add another task to the tasks array and observe the task list and open-task count.
3. Mark one unfinished task as done and run the application again.
4. Add a named export called multiply to math.js, import it in app.js, and print a product.
5. Change the greeting function's parameter and output.
6. Remove .js from one local import, run the app, then restore the extension and compare the result.
7. Temporarily change type from module to commonjs and observe why ESM imports need an ESM marker. Restore the original value afterward.
8. Add an npm script named check that runs node --check src/app.js, then run it with npm run check.

## Key takeaways

- A Node.js project can split its code across files using ES modules.
- Set type to module in package.json when using .js files with ESM syntax.
- Use named exports and imports for values identified by name, and use default exports for a module's primary value.
- Write explicit relative paths, including file extensions, for Node.js ESM imports.
- Built-in modules can be imported with the node: prefix.
- Keep node_modules out of Git; this example has no third-party dependencies.

## Related chapter files

- [Lesson 014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md)
- [Q&A 014 - Create a Node.js project with ES modules](../qnas/014-create-a-node-js-project-with-es-modules.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [013 - npm Packages, Scripts, and Semantic Version Ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Lesson](../lessons/014-create-a-node-js-project-with-es-modules.md) | [Q&A](../qnas/014-create-a-node-js-project-with-es-modules.md) | [015 - Environment Variables, Configuration, and Secrets](../lessons/015-environment-variables-configuration-and-secrets.md) |
