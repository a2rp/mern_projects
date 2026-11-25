# Example 012 - Install and Verify Node.js and npm

## Question

How can you check that the terminal can find Node.js and npm, run a JavaScript file, identify the active Node executable, and pass values through arguments and the environment?

## Goal

Use terminal commands and one small JavaScript file to verify the setup. This example does not install packages or require an npm project.

The installed version numbers and executable path vary by computer, so the expected output marks those values as placeholders.

## 1. Check the terminal commands

Open a new terminal and run:

~~~sh
node --version
npm --version
~~~

Both commands should print version numbers. If either command is not found, review the installation and PATH steps in the lesson before continuing.

To see the executable path selected by Node, run:

~~~sh
node -p "process.execPath"
~~~

On Windows, you can also list matching command paths:

~~~powershell
where.exe node
where.exe npm
~~~

## 2. Create a JavaScript verification file

Create a folder named `node-install-check`. Inside it, create a file named `verify-installation.mjs` with this code:

~~~js
import process from "node:process";

const commandLineMode = process.argv[2] ?? "local";
const appMode = process.env.APP_MODE ?? "(not set)";

console.log("Node.js version: " + process.version);
console.log("Node executable: " + process.execPath);
console.log("Command-line mode: " + commandLineMode);
console.log("APP_MODE: " + appMode);
console.log("JavaScript file check: passed");
~~~

The file reports the active runtime version and executable path, then shows one command-line argument and one environment value.

## 3. Set a value and run the file

In PowerShell, set the environment value for the current terminal session and run the file:

~~~powershell
$env:APP_MODE = "practice"
node verify-installation.mjs staging
~~~

In a macOS or Linux shell, set the value for this command and run the file:

~~~sh
APP_MODE=practice node verify-installation.mjs staging
~~~

Both commands pass `staging` as the first argument after the file name and set `APP_MODE` to `practice` for the process.

## Expected output

~~~text
Node.js version: v<installed version>
Node executable: <path to the active Node executable>
Command-line mode: staging
APP_MODE: practice
JavaScript file check: passed
~~~

Replace the first two placeholders with values from your computer. The executable path varies by installation method and operating system.

## 4. Verify npm separately

Run:

~~~sh
npm --version
~~~

The command should print the installed npm version. Node.js and npm use different version numbers, so the output values do not need to match.

## What the example demonstrates

| Feature | Where it appears | What it verifies |
| --- | --- | --- |
| Node.js version | `process.version` | The JavaScript file is running inside Node.js and reports its active version. |
| Active executable | `process.execPath` | Identifies which Node.js installation the current command selected. |
| Command-line input | `process.argv[2]` | Confirms that an argument can be passed after the script filename. |
| Environment configuration | `process.env.APP_MODE` | Confirms that the process can read an environment value. |
| ES module execution | The `.mjs` extension and `import` statement | Confirms that Node.js can load and run an ES module file. |
| npm command | `npm --version` | Confirms npm is available through the terminal. |

## Explanation

The version commands are the quickest first check. They confirm that the shell can find the Node.js and npm commands. The small script verifies a bit more: Node.js can load an ES module, execute its JavaScript, and expose process information.

`process.execPath` is useful when more than one Node.js installation exists. It shows which executable the current terminal selected. On Windows, `where.exe node` and `where.exe npm` can list all matching paths, which helps when the selected version is surprising.

`process.argv[2]` reads the first extra command-line argument. The code uses a default value if no argument was provided. `process.env.APP_MODE` reads an environment variable, also with a fallback when it is absent.

The script does not depend on a fixed Node.js or npm version. Its version and path output should match the installation on your computer.

## Troubleshooting

- If `node` or `npm` is not recognized, open a new terminal and check the installation and PATH.
- If the version is unexpected, inspect `process.execPath` and command lookup paths. Another installation or version manager may be active.
- If `APP_MODE` displays `(not set)`, confirm the environment value was assigned in the same terminal or command that starts Node.js.
- If the file does not run, confirm that your terminal is in the folder containing `verify-installation.mjs` and that the file has the exact name.
- If npm reports a permission error during a global install, note that this example does not require a global install. Project packages and scripts are covered later.

## Try these changes

1. Run `node verify-installation.mjs` without arguments. The command-line mode should use the default `local`.
2. Change `staging` to `production` and observe the command-line value.
3. Change `practice` to another environment value and run the program again.
4. Remove the environment assignment and check the `(not set)` fallback.
5. Run `node --version` and `npm --version` again, then compare those versions with the values printed by the script.
6. If multiple Node.js paths are listed, switch to the intended installation and repeat the checks.

## Key takeaways

- Check both Node.js and npm from a new terminal.
- Use `process.execPath` to identify the active Node executable.
- A small .mjs file confirms that Node.js can execute JavaScript.
- The first extra command-line argument is at `process.argv[2]`.
- Environment values are read from `process.env` and should be checked before use.
- Node.js and npm have separate version numbers; no particular numeric output is required for this check.

## Related chapter files

- [Lesson 012 - Install and verify Node.js and npm](../lessons/012-install-and-verify-node-js-and-npm.md)
- [Q&A 012 - Install and verify Node.js and npm](../qnas/012-install-and-verify-node-js-and-npm.md)
- [Example 011 - Node.js runtime and process model](011-node-js-runtime-and-process-model.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [011 - Node.js runtime and process model](../lessons/011-node-js-runtime-and-process-model.md) | [Lesson](../lessons/012-install-and-verify-node-js-and-npm.md) | [Q&A](../qnas/012-install-and-verify-node-js-and-npm.md) | [013 - npm packages, scripts, and semantic version ranges](../lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) |
