# 013 - npm Packages, Scripts, and Semantic Version Ranges

## Learning goals

By the end of this lesson, you should be able to:

- Explain what a package and the package.json manifest do.
- Create a package manifest and add dependencies with npm.
- Distinguish production dependencies from development dependencies.
- Explain the role of package-lock.json and node_modules.
- Define project scripts and run them through npm.
- Read major, minor, and patch versions.
- Understand common exact, caret, and tilde version ranges.
- Choose npm install or npm ci for the task.

## What is an npm package?

An npm package is reusable software described by package metadata. It can be a library that your application imports, a tool that provides a command, or a package that your own project makes available to others.

A project can depend on packages created by other people and packages it creates itself. npm resolves those dependencies, installs them into the project, and records information that lets the project be installed again.

## package.json is the project manifest

The `package.json` file describes a Node.js package or application. It commonly includes:

- The project name and version.
- Commands in a `scripts` field.
- Runtime packages in `dependencies`.
- Development tools in `devDependencies`.
- Additional metadata such as the module type, entry point, or supported Node.js version.

Create a starter manifest in the current directory with:

~~~sh
npm init -y
~~~

The `-y` option accepts npm's default answers. You can also create or edit `package.json` directly. It must be valid JSON: use double-quoted keys and strings, and do not add comments or trailing commas.

~~~json
{
  "name": "task-notes-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node app.mjs",
    "check": "node --check app.mjs"
  }
}
~~~

The `private` field helps prevent accidental publication of an application package. It does not prevent local dependencies or scripts from working. The `type` field declares how Node.js interprets `.js` files in this package; this course also uses the explicit `.mjs` extension for ES modules.

## Add and remove packages

Run package commands from the project directory that contains `package.json`.

~~~sh
npm install express
~~~

This adds Express to `dependencies` by default, installs it and its dependencies into `node_modules`, and updates the lockfile. Your application uses a production dependency at runtime.

Use `--save-dev` (short form `-D`) for tools needed to develop, lint, format, or test the project but not required to run the deployed application:

~~~sh
npm install --save-dev eslint
~~~

Remove a package with:

~~~sh
npm uninstall express
~~~

The command updates the manifest, lockfile, and installed dependency tree.

### dependencies and devDependencies

- **dependencies** are packages the application needs at runtime.
- **devDependencies** are tools needed during development or build workflows.

A tool can be needed to build production files and still belong in `devDependencies` if the built output, rather than the tool itself, runs in production. Think about what must be present in the deployed runtime.

## package-lock.json and node_modules

When npm installs a project, it creates or updates a lockfile, commonly `package-lock.json`. The manifest describes acceptable dependency requirements; the lockfile records the resolved package tree, including exact versions and integrity information used for repeatable installation.

Commit the manifest and lockfile so collaborators and automation can install the same resolved dependency tree. Do not edit the lockfile by hand; use npm commands to update it.

The `node_modules` directory contains installed package files. It can be large and is normally regenerated from the manifest and lockfile, so projects commonly ignore it in version control:

~~~gitignore
node_modules/
~~~

### npm install versus npm ci

- `npm install` can add or update packages and can update the lockfile when the manifest changes.
- `npm install` without package arguments installs the dependencies described by the project, using the lockfile when its resolved versions still satisfy the manifest.
- `npm ci` is for a clean project installation when a lockfile exists. It removes the existing `node_modules` directory, installs the complete locked tree, and does not rewrite the manifest or lockfile.
- `npm ci` fails if the manifest and lockfile are out of sync. Update them deliberately with `npm install`, then commit the matching files.

Use `npm ci` in automation or when you need a clean installation of an existing locked project. Remember that it removes the current `node_modules` directory before installing.

## Add useful project scripts

A script in the `scripts` section gives a short name to a command:

~~~json
{
  "scripts": {
    "start": "node app.mjs",
    "check": "node --check app.mjs",
    "hello": "node hello.mjs"
  }
}
~~~

Run a custom script with:

~~~sh
npm run hello
~~~

npm runs package scripts from the package root and adds locally installed package executables to the script PATH. That means a project can use its local tool without requiring a global installation.

You can list scripts with:

~~~sh
npm run
~~~

Some conventional script names have direct command forms. For example, `npm start` runs the `start` script and `npm test` runs the `test` script. For custom names, use `npm run <name>`.

Scripts are commands interpreted by the configured shell. Keep them portable where possible, and avoid shell-specific syntax if contributors use different operating systems.

## Semantic versioning

Semantic versioning, commonly shortened to **SemVer**, uses a version with three main numbers:

~~~text
MAJOR.MINOR.PATCH
~~~

For example, in version `2.4.7`:

- **MAJOR** is `2`.
- **MINOR** is `4`.
- **PATCH** is `7`.

When a package follows SemVer:

- A **patch** release fixes a backward-compatible bug: `2.4.7` to `2.4.8`.
- A **minor** release adds backward-compatible functionality: `2.4.7` to `2.5.0`.
- A **major** release includes an incompatible change: `2.4.7` to `3.0.0`.

This is the package author's versioning promise. It helps consumers reason about updates, but it cannot guarantee that every package author follows the rules perfectly.

A pre-release label can mark a version such as `3.0.0-beta.2`. A pre-release is not the same as the final `3.0.0` release.

## Version requirements in package.json

A dependency's version field is a requirement. Common forms include:

| Requirement | General meaning |
| --- | --- |
| `"1.2.3"` | Use version `1.2.3` for this direct dependency. |
| `"^1.2.3"` | Allow compatible releases at or above `1.2.3`, below `2.0.0`. |
| `"~1.2.3"` | Allow patch releases at or above `1.2.3`, below `1.3.0`. |
| `"1.2.x"` | Allow patch versions in the `1.2` line. |
| `">=1.2.3 <2.0.0"` | Combine lower and upper bounds explicitly. |

For a stable major version, a caret range normally allows later minor and patch versions within that major. A tilde range normally allows patch updates while staying within the same minor line.

Zero-major versions have special caret behavior. For example, `^0.2.3` does not mean "any version below 1.0.0"; its compatible range remains within the `0.2` line. Check the actual range before relying on it.

A version range says what is acceptable. It does not by itself pin every transitive dependency to one exact version. The lockfile records the resolved tree for the project.

## How an update is selected

Suppose the manifest allows `^1.2.3`. npm can choose a matching version in that range, subject to the lockfile and the dependency tree. If an acceptable resolved version is recorded in `package-lock.json`, npm uses that locked resolution. When the manifest's range changes or no longer matches the lockfile, npm can resolve an updated tree and update the lockfile.

That is why a manifest and lockfile work together:

- The manifest describes acceptable package versions.
- The lockfile records the versions resolved for this project.
- npm commands update those files according to the operation you request.

Do not assume that running an install always upgrades every package to the newest published version. A package update should be deliberate and followed by reviewing the manifest and lockfile changes.

## A simple dependency workflow

1. Start in the project root and confirm that `package.json` is there.
2. Install a runtime package with `npm install <package>` or a development tool with `npm install --save-dev <package>`.
3. Review the manifest and lockfile changes.
4. Use a script from `package.json` to run project commands consistently.
5. Commit the manifest and lockfile.
6. For a clean install from the committed lockfile, use `npm ci`.

## Common mistakes

### Installing in the wrong directory

npm looks for project context from the current working directory. If you run a command outside the project, you may add packages to the wrong manifest or create a new one. Check the directory before installing.

### Putting a development-only tool in dependencies

A test runner or formatter usually belongs in `devDependencies`. Keeping dependency categories clear helps identify what a production runtime needs.

### Treating a version range as an exact pin

`^1.2.3` allows more than one version. Use the lockfile to record the resolved tree for a project. An exact requirement can restrict a direct dependency version, but the lockfile is still important for the full tree.

### Deleting or editing the lockfile to fix every issue

The lockfile is project data. Do not delete or manually edit it as a routine troubleshooting step. First understand the mismatch and update dependencies through npm intentionally.

### Assuming npm run can find any global command

npm adds local package executables to the script PATH. Prefer a local development dependency for a project tool so the project records which tool it uses.

### Running npm ci without understanding its cleanup behavior

`npm ci` removes an existing `node_modules` directory before installing. Use it when a clean, lockfile-based install is intended.

## Key takeaways

- `package.json` describes the package, scripts, and dependency requirements.
- `dependencies` are needed at runtime; `devDependencies` are development tools.
- `package-lock.json` records a resolved dependency tree; commit it with the manifest.
- `npm install` manages dependencies and can update the lockfile; `npm ci` performs a clean install from a matching lockfile.
- npm scripts make repeatable project commands and can use local tools.
- SemVer uses major, minor, and patch numbers; caret and tilde ranges permit different updates.
- Ranges describe acceptable versions, while the lockfile records the resolved project tree.

## Review checklist

You are ready to move on when you can:

- Explain the purpose of `package.json`, `package-lock.json`, and `node_modules`.
- Choose between `dependencies` and `devDependencies`.
- Add and remove a package with npm.
- Define and run a custom npm script.
- Explain the difference between `npm install` and `npm ci`.
- Read a major.minor.patch version and explain common caret and tilde ranges.
- Explain why a version range and a lockfile serve different purposes.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [012 - Install and verify Node.js and npm](012-install-and-verify-node-js-and-npm.md) | Lesson | [Q&A](../qnas/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Example](../examples/013-npm-packages-scripts-and-semantic-version-ranges.md) | [014 - Create a Node.js project with ES modules](014-create-a-node-js-project-with-es-modules.md) |
