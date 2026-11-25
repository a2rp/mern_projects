# 005 - Terminal, Files, Git, and GitHub Workflow

## Learning goals

By the end of this lesson, you should be able to:

- Navigate folders and inspect files from a terminal.
- Explain the difference between a folder, a Git repository, and a GitHub repository.
- Clone a repository or initialize a new one.
- Review, stage, commit, and push a small change.
- Keep generated files and secrets out of Git.
- Recognize common sync problems and use a safe branch workflow.

## Why this matters for MERN

A MERN project contains several kinds of files: JavaScript source, React components, server code, configuration, and documentation. The terminal helps you move between folders and run commands in the correct project. Git records changes over time. GitHub hosts a remote copy so you can back up, share, and review that history.

The tools have different jobs:

| Tool or concept | What it does |
| --- | --- |
| Terminal | Accepts commands and runs them in a chosen working directory. |
| File system | Organizes files into folders on your computer. |
| Git | Tracks versions of files in a local repository. |
| GitHub | Hosts Git repositories online and adds collaboration features. |
| Remote | A named address for another copy of a Git repository; `origin` is the usual default name. |

Git works without GitHub. GitHub uses Git, but it is a hosting and collaboration service rather than the version-control program itself.

## The terminal and the current folder

A command runs in a **working directory**. A path may be absolute, such as `D:\notes\mern`, or relative to the current directory.

In PowerShell:

~~~powershell
Get-Location
Get-ChildItem
Set-Location "D:\notes\mern"
~~~

`Get-Location` shows the current folder, `Get-ChildItem` lists its contents, and `Set-Location` changes folders. Common aliases include `pwd`, `ls`, and `cd`. Other terminals, such as Git Bash, may use different command names or path formats.

Useful path ideas:

- `.` means the current folder.
- `..` means the parent folder.
- An absolute path starts from a drive or filesystem root.
- A relative path starts from the current folder.
- Put paths containing spaces in quotes, such as `Set-Location "D:\My Notes\MERN"`.

A frequent beginner error is running a command from the wrong folder. Check the working directory before using commands that create, delete, install, or change files.

## Files and folders

PowerShell can create a folder and an empty file:

~~~powershell
New-Item -ItemType Directory -Name "practice"
New-Item -ItemType File -Path "practice\README.md"
~~~

You can also create and edit files in your editor. Git sees their contents and paths; it does not care whether you used the terminal or a graphical editor.

For a Node.js project, folders such as `src`, `server`, and `client` are ordinary project organization. A folder alone is not a Git repository; Git repository data is stored in a hidden `.git` directory at the repository root.

## Git's three local states

Git records work through three main states:

1. **Working tree:** the files you can currently edit.
2. **Staging area:** the exact changes selected for the next commit.
3. **Commit history:** saved snapshots with messages and parent history.

~~~text
Edit files  ->  Stage selected changes  ->  Commit locally  ->  Push to remote
  working tree          staging area          local history      GitHub or another remote
~~~

Staging lets you review which changes will be included. A commit saves the staged snapshot to local history. A push sends commits to a remote. A commit is not automatically pushed.

## Start from a GitHub repository

When a repository already exists online, clone it to create a local working copy:

~~~sh
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
~~~

Replace the sample URL with the repository's clone URL. Cloning creates the project folder, downloads its history and files, and configures a remote, usually named `origin`.

Confirm where you are and which remote is configured:

~~~sh
git status
git remote -v
git branch --show-current
~~~

A freshly cloned repository may have no changes. If the project is private, GitHub authentication is required. Use a credential manager or a configured SSH key; never paste a password or access token into a Git command or commit it into a file.

## Start a new local repository

For a folder that is not already a Git repository:

~~~powershell
Set-Location "D:\path\to\your\project"
git init -b main
git status
~~~

This creates local Git history metadata. It does **not** create or connect a GitHub repository. If you create an empty GitHub repository later, connect it with the clone URL:

~~~sh
git remote add origin https://github.com/OWNER/REPOSITORY.git
git remote -v
~~~

Then make a first commit before pushing:

~~~sh
git add README.md
git diff --cached
git commit -m "Add project README"
git push -u origin main
~~~

The `-u` option sets the upstream tracking relationship for the first push. For an existing repository, prefer cloning it rather than initializing a separate local history and trying to combine two independent first commits. If the GitHub repository already has a README or license commit, clone that repository first to keep the histories connected.

## The everyday change workflow

After editing a file in an existing repository, review and save only the intended changes:

~~~sh
git status
git diff
git add README.md
git diff --cached
git commit -m "Clarify project setup"
git push
~~~

What each step does:

- `git status` shows the branch and modified, staged, and untracked files.
- `git diff` shows unstaged changes.
- `git add README.md` stages the named file. You can stage multiple paths, such as `git add src/App.jsx README.md`.
- `git diff --cached` reviews what is staged for the next commit.
- `git commit -m "..."` records the staged changes in local history.
- `git push` publishes the local commits to the configured remote branch.

A commit message should describe the change, for example `Add task form validation` or `Document local setup`. Avoid vague messages such as `update`. If a push reports that everything is already up to date, there were no new local commits to send.

Use `git add .` only after checking `git status` and understanding every changed or untracked file. Staging specific paths makes it easier to avoid committing unrelated work.

## Set your commit identity

Git records an author name and email in each commit. Configure them once if Git asks:

~~~sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
~~~

Check the current values with `git config user.name` and `git config user.email`. Choose an email you are comfortable associating with your commits; commit metadata may be visible to people who can view the repository.

## Keep generated files and secrets out of Git

A MERN application can create dependency folders, build output, logs, and local configuration. A `.gitignore` file tells Git which untracked paths to ignore.

A small Node project might start with:

~~~gitignore
node_modules/
.env
.env.*
!.env.example
dist/
coverage/
~~~

Keep `.gitignore` in the repository so every contributor uses the same rules. An `.env.example` can document required variable names with safe placeholder values, but never include real database passwords, API keys, tokens, or private credentials.

Ignoring a file does not remove it from Git if it was already tracked. Before the first commit, inspect `git status` and the staged diff. If a secret was committed, deleting it in a later commit does not erase it from history; rotate the exposed credential and follow the repository owner's incident process.

## Work on a branch

A branch gives a change its own line of work. A simple collaboration workflow is:

~~~sh
git switch main
git pull --ff-only
git switch -c docs/improve-setup
~~~

Make and review the change, then commit and publish the branch:

~~~sh
git status
git diff
git add README.md
git diff --cached
git commit -m "Improve project setup instructions"
git push -u origin docs/improve-setup
~~~

Open a pull request on GitHub from that branch to `main`. Review the changes, address feedback if needed, and merge the pull request. A pull request is a review and merge workflow; pushing a branch alone does not merge it into `main`.

After the branch is merged, update the local main branch:

~~~sh
git switch main
git pull --ff-only
git branch -d docs/improve-setup
~~~

Delete the local feature branch only after confirming the work has been merged. The remote branch may be removed through the pull request page after merge.

## Pull before pushing and resolve conflicts carefully

If another commit reached GitHub before your push, Git may reject your push because your branch is behind. First inspect the repository state:

~~~sh
git status
git log --oneline --decorate -5
git remote -v
~~~

If your local branch can be updated by fast-forwarding, use `git pull --ff-only`. If Git reports that it cannot fast-forward, stop and inspect the branch histories or ask a collaborator to coordinate. Do not use `git push --force` to make the error disappear; it can overwrite commits on the remote.

A merge conflict means Git could not automatically combine overlapping edits. Open each conflicted file and look for markers:

Git shows a start marker (`<<<<<<< HEAD`), a separator (`=======`), and an incoming end marker (`>>>>>>> origin/main`) around the conflicting versions.

Choose or combine the intended content, remove all conflict markers, save the file, and review the result. Then stage the resolved file and complete the merge as Git indicates. Never commit the marker lines by mistake.

## Common problems and first checks

| Problem | First check |
| --- | --- |
| `fatal: not a git repository` | Use `Get-Location` or `pwd` and change into the project root. |
| A file is missing from the commit | Check `git status`, then stage the intended path with `git add`. |
| The commit says nothing to commit | Check whether any file changed and whether the change is staged. |
| Push is rejected as non-fast-forward | Inspect status and history, then integrate remote work safely; do not force push by default. |
| Authentication fails | Confirm the remote URL and GitHub access; use a configured credential manager or SSH key. |
| A merge conflict appears | Open the listed files, resolve the markers carefully, stage the result, and follow Git's merge instructions. |
| The wrong file was staged | Review `git diff --cached` before committing; unstage a path with `git restore --staged path/to/file`. |

Before asking Git to change history, confirm the branch, remote, working tree, and intended paths.

## Practice

1. Use `Get-Location` and `Get-ChildItem` to inspect your MERN project root.
2. Run `git status`. Identify the current branch and whether the working tree is clean.
3. Edit a small documentation file. Review its changes with `git diff`.
4. Stage only that file, review `git diff --cached`, and create a descriptive commit.
5. Push the commit and verify that the branch on GitHub shows it.
6. Create a branch named `docs/practice-workflow`, make a small separate change, and push the branch.
7. In a practice repository, open a pull request, inspect its diff, and merge it. Update local `main` afterward.
8. Inspect `.gitignore` and verify that real environment files and dependency folders are not staged.
9. If Git rejects a push, read the message and inspect status and history before choosing the next command. Explain why force pushing is risky.

## Key takeaways

- The terminal runs commands in the current working directory, so verify the folder first.
- Git tracks local changes; GitHub hosts a remote copy and collaboration tools.
- Review changes, stage intentionally, inspect the staged diff, commit locally, and then push.
- Commits are local until pushed; a successful push updates a remote branch.
- Keep generated files and secrets out of version control.
- Use feature branches and pull requests to review changes before merging.
- When sync or conflict errors appear, inspect the repository state and preserve remote work.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [004 - JSON and API data basics](004-json-and-api-data-basics.md) | [Q&A](../qnas/005-terminal-files-git-and-github-workflow.md) | [Example](../examples/005-terminal-files-git-and-github-workflow.md) | [006 - JavaScript essentials for MERN development](006-javascript-essentials-for-mern-development.md) |
