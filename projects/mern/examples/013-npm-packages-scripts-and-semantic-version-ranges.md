# Example 013 - npm Packages, Scripts, and Semantic Version Ranges

## Question

How do you declare a package dependency, install it into a project, run repeatable npm scripts, and check whether release versions satisfy caret and tilde ranges?

## Goal

Create a small Node.js package that uses the `semver` package to evaluate version ranges. This example shows:

- A `package.json` manifest with a production dependency and npm scripts.
- npm creating a lockfile and local `node_modules` directory.
- A script command run through npm.
- Deterministic checks for caret and tilde ranges.
- A clean reinstall from the lockfile.

The dependency's allowed range is declared in the manifest. npm resolves a specific package version and records the resolved tree in the lockfile.

## 1. Create the project files

Create a folder named `npm-semver-demo`. Inside it, create `package.json`:

~~~json
{
  "name": "npm-semver-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node app.mjs",
    "check": "node --check app.mjs"
  },
  "dependencies": {
    "semver": "^7.0.0"
  }
}
~~~

The `semver` package is a production dependency because `app.mjs` imports and uses it while running. The caret range allows compatible releases below the next major version.

Now create `app.mjs`:

~~~js
import semver from "semver";

const caretRange = "^1.2.3";
const tildeRange = "~1.2.3";

console.log("Caret range: " + caretRange);
console.log(
  "1.4.0 matches: " +
    semver.satisfies("1.4.0", caretRange),
);
console.log(
  "2.0.0 matches: " +
    semver.satisfies("2.0.0", caretRange),
);

console.log("Tilde range: " + tildeRange);
console.log(
  "1.2.9 matches: " +
    semver.satisfies("1.2.9", tildeRange),
);
console.log(
  "1.3.0 matches: " +
    semver.satisfies("1.3.0", tildeRange),
);
~~~

## 2. Install the dependency

Open a terminal in `npm-semver-demo` and run:

~~~sh
npm install
~~~

npm reads `package.json`, installs the dependency and its dependencies into `node_modules`, and creates `package-lock.json` with the resolved package tree.

Commit `package.json` and `package-lock.json` with the project. Do not commit `node_modules`; it can be recreated from the manifest and lockfile.

## 3. Check and run the npm scripts

First run the syntax check script:

~~~sh
npm run check
~~~

Then run the version-range example:

~~~sh
npm start
~~~

`npm start` runs the `start` script from `package.json`. For a custom script name such as `check`, use `npm run check`.

## Expected application output

~~~text
Caret range: ^1.2.3
1.4.0 matches: true
2.0.0 matches: false
Tilde range: ~1.2.3
1.2.9 matches: true
1.3.0 matches: false
~~~

npm may print its own script heading before the application output. The results from `app.mjs` stay the same because the sample versions and ranges are fixed.

## 4. Reinstall from the lockfile

After `npm install` has created the lockfile, you can recreate the project dependency tree with:

~~~sh
npm ci
~~~

`npm ci` removes the existing `node_modules` directory and performs a clean installation from the lockfile. Do not run it if removing the current installed dependencies is not intended.

## What the project demonstrates

| Feature | Where it appears | What it does |
| --- | --- | --- |
| Package manifest | `package.json` | Declares project metadata, scripts, and dependency requirements. |
| Private application | `"private": true` | Helps prevent accidental publication of this application package. |
| ES module project | `"type": "module"` and `app.mjs` | Allows the example to use an import statement. |
| Production dependency | `"dependencies"` | Declares `semver` because the application imports it at runtime. |
| Semantic range | `"^7.0.0"` | Allows compatible `semver` package versions below major version 8. |
| Lockfile | `package-lock.json` | Records the resolved dependency tree for this project. |
| Local installation | `node_modules` | Holds the installed package files for this project. |
| npm scripts | `start` and `check` | Give short, repeatable commands for running and checking the application. |
| Caret range | `^1.2.3` | Accepts compatible minor and patch versions below 2.0.0. |
| Tilde range | `~1.2.3` | Accepts patch versions below 1.3.0. |
| Clean install | `npm ci` | Recreates the locked dependency tree and removes the current node_modules first. |

## Explanation

The manifest declares `semver` as a runtime dependency because the application imports it. The `^7.0.0` range accepts compatible releases in the same major line. npm uses the manifest to decide which package versions are acceptable and writes the resolved package tree to `package-lock.json`.

The `start` script runs the program. The `check` script asks Node.js to parse the source without running the example. npm scripts use the project's local command paths, so the project does not need a global copy of the package.

The first range test uses `^1.2.3`. A caret range for a stable major version permits minor and patch releases below the next major, so `1.4.0` matches and `2.0.0` does not.

The second test uses `~1.2.3`. A tilde range permits patch updates in the same minor line, so `1.2.9` matches and `1.3.0` does not.

The range describes acceptable versions; the lockfile records the versions npm resolved for this project. Another project can use the same manifest and lockfile to reproduce the dependency tree with `npm ci`.

## Try these changes

1. Change the caret range to `^1.2.3` in the manifest, then update the app's test range to `^1.2.3` and check how a minor version compares.
2. Change the tilde range to `~1.2.3` and test a later patch version.
3. Test `^0.2.3` with `0.2.9` and `0.3.0` to see the special behavior of zero-major versions.
4. Run `npm run` without a script name to list the project's scripts.
5. Run `npm ci` after installation and observe that npm rebuilds the local dependency directory from the lockfile.
6. Add a development-only tool with `npm install --save-dev <package>` and observe that npm records it under `devDependencies`.
7. Change the dependency range in `package.json`, run `npm install`, and review how the lockfile changes.

## Key takeaways

- Declare project dependencies in `package.json` and install them locally.
- Commit `package.json` and `package-lock.json`; recreate `node_modules` when needed.
- Use npm scripts for repeatable project commands.
- A caret range usually permits minor and patch changes within a stable major line.
- A tilde range usually permits patch changes within the same minor line.
- The lockfile records the resolved dependency tree; use `npm ci` for a clean install from it.

## Related chapter files

- [Lesson 013 - npm packages, scripts, and semantic version ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md)
- [Q&A 013 - npm packages, scripts, and semantic version ranges](../qnas/013-npm-packages-scripts-and-semantic-version-ranges.md)
- [Example 012 - Install and verify Node.js and npm](012-install-and-verify-node-js-and-npm.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md) | [Lesson](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Q&A](../qnas/013-npm-packages-scripts-and-semantic-version-ranges.md) | [014 - Create a Node.js project with ES modules](../lessons/014-create-a-node-js-project-with-es-modules.md) |
