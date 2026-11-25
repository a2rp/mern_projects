# Example 005 - Terminal, Files, Git, and GitHub Workflow

## Question

How do you make a small change in a project folder, review it, commit it locally, push it to GitHub, and use a branch for a pull request?

## Goal

This guided exercise creates a safe practice repository and walks through two changes:

1. Clone a GitHub repository, edit files, review the staged change, commit, and push.
2. Make a second change on its own branch and merge it through a pull request.

The commands below use PowerShell for Windows. Git commands are the same in other shells, though folder commands and path formats differ.

## Before you begin

You need:

- Git installed and available in the terminal.
- A GitHub account where you can create a practice repository.
- A code editor.
- A folder on your computer where you keep projects.

Do this in a new practice repository, not inside an existing MERN project. Replace sample usernames and paths with your own. Do not use real credentials or secrets in this exercise.

## Part 1: Clone, edit, commit, and push

### 1. Create a practice repository on GitHub

On GitHub, create a repository named **mern-practice**. Turn on the option to add a README so the repository has an initial commit on its main branch. This lets you clone the existing history instead of creating a separate local history.

### 2. Clone it into your projects folder

In PowerShell, move to a folder where you want the practice project. Replace the sample path with a folder that already exists on your computer:

~~~powershell
Set-Location "C:\Users\YourName\Documents"
Get-Location
~~~

Copy the repository's HTTPS clone URL from GitHub and run:

~~~sh
git clone https://github.com/YOUR-USERNAME/mern-practice.git
cd mern-practice
git status
git remote -v
git branch --show-current
~~~

Replace `YOUR-USERNAME` with your GitHub username. The status should show a clean working tree. The branch should usually be `main`, and `origin` should point to your practice repository.

If Git requests authentication, use your configured credential manager or SSH setup. Do not place a password or access token in the URL or in a committed file.

### 3. Edit the README and add a .gitignore

Open the cloned `mern-practice` folder in your editor. Replace the README content with:

~~~markdown
# MERN Practice

A small repository for practicing the MERN development workflow.

## What I am learning

- How to navigate a project from the terminal
- How to review and commit changes with Git
- How to publish a branch and review it with a pull request
~~~

Create a file named **.gitignore** in the repository root with:

~~~gitignore
node_modules/
.env
.env.*
!.env.example
dist/
~~~

This sample excludes dependencies, environment files, and build output. It leaves room for a safe `.env.example` template if the project later needs one. Never put real credentials in that template.

### 4. Review and stage only these files

Return to the terminal and inspect the work:

~~~sh
git status --short
git diff -- README.md
~~~

You should see a modified README and an untracked `.gitignore` file, similar to:

~~~text
 M README.md
?? .gitignore
~~~

`git diff` shows the tracked README edit. It does not show the contents of a new untracked file yet. Stage both intended files by name, then review the exact staged snapshot:

~~~sh
git add README.md .gitignore
git status
git diff --cached
~~~

Check that the staged diff contains only the README update and the intended ignore rules. If an unexpected file appears, unstage it with `git restore --staged path/to/file` and review again.

### 5. Commit locally and publish

Create a commit with a message that describes this change:

~~~sh
git commit -m "Document MERN practice setup"
~~~

Then push the commit to the remote main branch:

~~~sh
git push origin main
~~~

A successful push reports an update to the remote branch. Check the final local state and latest commit:

~~~sh
git status --short --branch
git log -1 --oneline
~~~

The working tree should be clean. Open the GitHub repository page and confirm that the README and `.gitignore` are present and the new commit appears in the history.

### Expected result for Part 1

- The GitHub repository shows the updated README and ignore file.
- The commit is visible on `main`.
- `git status --short --branch` shows `main` with no pending file changes.

A commit saves the change locally; a successful push publishes it to GitHub. If the push says everything is up to date, check whether a new commit was actually created and whether you are on the expected branch.

## Part 2: Use a branch and pull request

### 6. Create a branch for a separate change

Start from the updated main branch, then create a new branch:

~~~sh
git switch main
git pull --ff-only
git switch -c docs/add-development-notes
~~~

In the README, add this section:

~~~markdown
## Development workflow

1. Make one focused change.
2. Review the diff before staging.
3. Commit with a message that describes the change.
4. Push the branch and open a pull request for review.
~~~

Check and stage the change:

~~~sh
git status --short
git diff -- README.md
git add README.md
git diff --cached
~~~

If the staged diff looks right, commit and push the new branch:

~~~sh
git commit -m "Add development workflow notes"
git push -u origin docs/add-development-notes
~~~

### 7. Review and merge on GitHub

Open the repository page on GitHub. Use the prompt to compare `docs/add-development-notes` with `main` and create a pull request.

On the pull request page:

1. Read the change summary and inspect the file diff.
2. Confirm the change belongs in the practice repository.
3. Merge the pull request when you are satisfied with the review.
4. If GitHub offers to delete the merged remote branch, you may do so.

Pushing a branch publishes it; it does not merge it into `main`. The pull request is where the changes are reviewed and merged.

### 8. Update the local main branch

After the pull request is merged, return to PowerShell:

~~~sh
git switch main
git pull --ff-only
git branch -d docs/add-development-notes
git status --short --branch
~~~

The local `main` branch should now contain the merged README section. The working tree should be clean. Delete the local feature branch only after confirming the change is merged.

## Troubleshooting practice

- If a command says it cannot find a Git repository, use `Get-Location` and move into `mern-practice`.
- If a push is rejected because the remote is ahead, inspect `git status` and `git log --oneline --decorate -5`. Integrate the remote commit safely; do not force-push.
- If GitHub asks for authentication, use a credential manager or your SSH setup. Never share a token in chat, a commit message, or a repository file.
- If a conflict occurs, inspect every conflicted file, keep the intended content, remove conflict markers, stage the resolution, and complete the merge.

## Explanation

This exercise follows the same loop used while building a MERN application:

- The terminal operates on files in one working directory.
- Git shows which files changed and lets you choose what enters the next commit.
- A commit records a local checkpoint with a descriptive message.
- A remote stores the published branch.
- A pull request gives people a place to review a branch before merging it.
- The ignore file prevents common local-only files from being added as untracked content; it does not erase files already committed.

## Further practice

1. Change a sentence in the README, inspect the diff, and undo the edit before staging it.
2. Add a harmless file to the practice repository and stage only that file.
3. Create another short-lived branch, push it, and follow its pull request from review through merge.
4. Find the repository's remote URL and current branch without opening GitHub.
5. Explain what you would do if a real credential were accidentally committed.

## Important note

This is a practice repository, not an application deployment. The example teaches local file review and Git collaboration; it does not configure a production server, database, authentication, or deployment. Keep practice commits focused, and do not put real secrets in the repository.

## Related chapter files

- [Lesson 005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md)
- [Q&A 005 - Terminal, files, Git, and GitHub workflow](../qnas/005-terminal-files-git-and-github-workflow.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md) | [Lesson](../lessons/005-terminal-files-git-and-github-workflow.md) | [Q&A](../qnas/005-terminal-files-git-and-github-workflow.md) | [006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md) |
