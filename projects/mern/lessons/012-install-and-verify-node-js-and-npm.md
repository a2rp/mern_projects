# 012 - Install and Verify Node.js and npm

## Learning goals

By the end of this lesson, you should be able to:

- Choose a suitable Node.js installation method for your computer.
- Explain the difference between Node.js and npm.
- Install an actively supported LTS release and open a fresh terminal.
- Confirm which Node.js and npm versions your terminal can run.
- Locate the Node.js executable and investigate PATH problems.
- Run a JavaScript file and use the Node.js REPL.
- Keep one predictable Node.js installation active for a project.

## Node.js and npm

**Node.js** is the runtime that executes JavaScript outside a browser. **npm** is a command-line package manager commonly installed alongside Node.js. You will use Node.js to run server-side JavaScript and npm to manage project packages and commands in later chapters.

They are related, but their version numbers are independent. A Node.js release includes an npm version that is compatible with that release. You can check both separately:

~~~sh
node --version
npm --version
~~~

These commands print the versions available through your current terminal's PATH. The exact numbers change over time and can differ between computers.

## Choose a Node.js version

For a learning project, install a supported **LTS (Long-Term Support)** release. LTS releases are maintained for production use and are a dependable baseline for libraries and course projects.

Before installing, check the project's README or its version configuration if it specifies a Node.js version. Use that version when one is required. When there is no project-specific requirement, choose a supported LTS release.

Avoid choosing an experimental or unsupported release for a beginner project. A newer release can contain features or behavior that a dependency does not yet support.

## Choose an installation method

You can install Node.js with a version manager or with an operating-system installer.

### Use a version manager when you need to switch versions

A Node.js version manager can install multiple Node.js releases and select one for the current shell or project. It is useful when you work on projects that require different versions.

Choose a version manager designed for your operating system and follow its installation instructions. Install Node.js through that manager, then open a new terminal and verify which version is active. Avoid mixing several installation methods unless you understand which one your PATH selects.

### Use an installer for a simple system setup

An official Node.js installer is a straightforward choice when you need one system-wide version. On Windows, the official LTS Windows Installer is an MSI package. The installer includes Node.js and npm and can configure the PATH so terminal commands can find them.

Use the installer for your operating system, keep the standard options unless you have a reason to change them, and finish the setup. Close existing terminals and open a new one so it loads the updated PATH.

On macOS or Linux, use a suitable version manager or the installation instructions for your platform. Instructions and package availability differ by operating system; choose a supported LTS release and then verify both commands in a new terminal.

## Verify the installation

Open a new terminal and run:

~~~sh
node --version
npm --version
~~~

If both commands print version numbers, the shell can find Node.js and npm.

To confirm which Node executable is active, run:

~~~sh
node -p "process.execPath"
~~~

On Windows, you can also list the matching executables with:

~~~powershell
where.exe node
where.exe npm
~~~

On macOS or Linux, use:

~~~sh
command -v node
command -v npm
~~~

If more than one path appears, your computer may have multiple installations. The first matching executable is typically the one the terminal runs. Check the selected version manager and PATH order so a project uses the intended version.

## Run a small JavaScript check

Create a file named `hello.mjs`:

~~~js
console.log("Node.js can run this file.");
console.log("Version: " + process.version);
~~~

From the directory containing the file, run:

~~~sh
node hello.mjs
~~~

The output should include the first message and the Node.js version. This checks that the runtime can execute a file, not just print a version number.

You can also try the interactive Node.js REPL by running `node` without a filename:

~~~text
> 2 + 3
5
~~~

Exit the REPL with `.exit` or the terminal's end-of-input shortcut.

## Run npm's basic version check

Use npm's version command:

~~~sh
npm --version
~~~

This confirms that the npm command-line tool is available to the current terminal. The course will use npm to create project metadata, install packages, and run scripts later. Do not install a global npm update as a first troubleshooting step; the npm version bundled with Node.js is a compatible starting point.

## Understand PATH and terminal refresh

The terminal searches directories listed in the PATH environment variable when you enter commands such as `node` and `npm`. An installer or version manager can update PATH, but an already-open terminal may keep the old environment.

If a command is not recognized:

1. Close the terminal and open a new one.
2. Check whether the installer or version manager finished successfully.
3. Locate the executable with the operating system's command lookup.
4. Check that the installation directory is on PATH.
5. Look for older installations or a version manager selecting a different version.
6. If the command still cannot be found, repair or reinstall using one installation method, then open a new terminal and verify again.

Do not copy random executable files into system folders or change permissions blindly. Find out which installation method owns the active Node.js version.

## Global and project packages

npm can install packages in a project or globally. Project dependencies are recorded with the project and can be installed by other contributors. Global packages are available as command-line tools for the current user or machine.

For a course project, prefer local dependencies unless a tool specifically requires a global command. Installing packages globally can create permission or PATH confusion. You do not need to install a global package to verify that npm works.

Package files, scripts, and dependency versions are covered in later chapters.

## Common setup problems

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| `node` is not recognized or not found | Terminal has stale PATH, installation did not complete, or Node is not on PATH | Open a new terminal; inspect the selected installation and command path. |
| `npm` is not recognized | npm was not installed or its command path is missing | Verify the Node installation method and locate the npm executable. |
| Version is different from the expected one | Another installation or version manager is active | Check command paths and the project's required Node version. |
| Terminal shows an old version after installation | Existing shell has not refreshed, or PATH selects an older executable first | Open a new shell and inspect all matching command paths. |
| Global package install reports a permission error | Global install directory is not writable for the current account | Prefer local project tools or use a version manager with user-owned directories. |
| A package says the Node version is unsupported | The project or dependency requires another Node release | Read the project's version requirement and select a compatible supported release. |

## Keep the setup reproducible

The same project should use a compatible Node.js version across your own terminal, editor, and automation. When a repository specifies a version, make sure your version manager or environment uses it. Avoid committing machine-specific executable paths or secrets.

Node.js and npm versions will change as new releases arrive. Record the version requirement for a project, rather than assuming one version number will work forever.

## Key takeaways

- Node.js runs JavaScript; npm manages packages and project commands.
- Choose a supported LTS Node.js release unless a project requires another supported version.
- A version manager is helpful when switching between projects; an installer is a simple option for one system-wide version.
- Open a new terminal after installation so it can read the updated PATH.
- Check both versions and the selected Node executable path.
- Use local project dependencies for project tools and avoid unnecessary global installs.
- Diagnose multiple installations by checking which executable the terminal selects.

## Review checklist

You are ready to move on when you can:

- Explain what Node.js and npm each do.
- Select an installation method appropriate for one version or multiple projects.
- Check Node.js and npm versions in a terminal.
- Find the active Node executable path and diagnose a PATH conflict.
- Run a JavaScript file and enter the Node.js REPL.
- Explain why project dependencies are usually installed locally.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [011 - Node.js runtime and process model](011-node-js-runtime-and-process-model.md) | Lesson | [Q&A](../qnas/012-install-and-verify-node-js-and-npm.md) | [Example](../examples/012-install-and-verify-node-js-and-npm.md) | [013 - npm packages, scripts, and semantic version ranges](013-npm-packages-scripts-and-semantic-version-ranges.md) |
