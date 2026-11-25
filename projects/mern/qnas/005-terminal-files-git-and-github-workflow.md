# 005 - Terminal, Files, Git, and GitHub Workflow: Questions and Answers

Use these questions to review terminal navigation, files and folders, Git's local workflow, remote repositories, branches, GitHub, and common safety practices. Each answer includes a short explanation.

Related lesson: [005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md)

## Multiple-choice questions

### 1. What does the current working directory tell you?

- A. Which files are staged
- B. The folder where terminal commands currently run
- C. The GitHub repository visibility
- D. The last commit message

**Answer: B.** Commands use the current working directory unless a path or tool changes that behavior.

### 2. In a relative path, what does `..` mean?

- A. The current folder
- B. The parent folder
- C. The GitHub remote
- D. The hidden Git database

**Answer: B.** The double-dot path component refers to the parent directory.

### 3. What does `git clone` do?

- A. Creates a local copy of a remote repository and its history
- B. Publishes a local commit
- C. Deletes a branch
- D. Stages all modified files

**Answer: A.** Cloning downloads repository history and files and configures a remote, usually named `origin`.

### 4. What does `git init -b main` do?

- A. Creates a GitHub repository and publishes it
- B. Initializes a local Git repository with an initial branch named main
- C. Clones the main branch from GitHub
- D. Pushes the current files to origin

**Answer: B.** Initialization creates local repository metadata. It does not create or connect a GitHub repository.

### 5. Which Git state contains the files you are currently editing?

- A. Working tree
- B. Remote
- C. Commit history
- D. Tag list

**Answer: A.** The working tree is the checked-out set of files on disk.

### 6. What is the staging area for?

- A. Selecting changes for the next commit
- B. Uploading files automatically
- C. Storing a second copy of GitHub
- D. Creating a new working directory

**Answer: A.** Staging records which changes will be included in the next commit.

### 7. What is a reliable command for checking the current branch and file state?

- A. `git status`
- B. `git push`
- C. `git init`
- D. `git config`

**Answer: A.** Git status summarizes the branch, staged changes, unstaged changes, and untracked files.

### 8. What does `git diff` normally show?

- A. Unstaged changes in tracked files
- B. GitHub authentication details
- C. The remote repository's full file list
- D. All commits on GitHub

**Answer: A.** It shows changes in the working tree that are not staged.

### 9. What does `git diff --cached` show?

- A. Changes staged for the next commit
- B. All ignored files
- C. Only remote branches
- D. Files deleted from GitHub

**Answer: A.** It lets you review the staged snapshot before recording it.

### 10. What does `git commit` do?

- A. Saves staged changes to local Git history
- B. Uploads files to GitHub automatically
- C. Creates a pull request
- D. Updates the project dependencies

**Answer: A.** A commit is local until it is pushed to a remote.

### 11. What does `git push` do?

- A. Sends local commits to a remote repository
- B. Downloads remote commits
- C. Adds files to the staging area
- D. Opens a terminal in the repository root

**Answer: A.** Push updates remote references with local commits and transfers the required data.

### 12. What is `origin` usually?

- A. The default name for a configured remote repository
- B. The first commit message
- C. A special staging area
- D. The main branch's working folder

**Answer: A.** Clone commonly configures the source remote under the name origin.

### 13. What does `git push -u origin main` do the first time?

- A. Pushes the local main branch and sets its upstream
- B. Deletes the remote main branch
- C. Initializes a new local repository
- D. Merges every branch

**Answer: A.** The upstream relationship lets later push and pull commands refer to the tracked remote branch more simply.

### 14. What is a branch useful for?

- A. Isolating a line of work from another branch
- B. Hiding files from Git status
- C. Replacing the remote repository
- D. Storing passwords

**Answer: A.** A feature branch lets work be developed and reviewed separately before merging.

### 15. What does a pull request primarily provide?

- A. A review and merge workflow for proposed changes
- B. An automatic backup of local uncommitted files
- C. A replacement for Git commits
- D. A way to store environment variables

**Answer: A.** A pull request lets collaborators inspect and discuss a branch before merging it.

### 16. What should you do first if a push is rejected because the remote has new commits?

- A. Force push immediately
- B. Inspect status and history, then integrate remote work safely
- C. Delete the remote branch
- D. Run `git init` again

**Answer: B.** The remote may contain work you do not have locally. Inspect and preserve it rather than overwriting it.

### 17. What does `.gitignore` do?

- A. Tells Git which untracked paths to ignore
- B. Deletes tracked files from history
- C. Encrypts secrets
- D. Prevents all other contributors from editing files

**Answer: A.** Ignore rules do not untrack files that were already committed.

### 18. A real database password was committed. Is deleting the file in a later commit enough?

- A. Yes, the earlier commit disappears automatically.
- B. No. The secret can remain in history; rotate it and follow the repository's response process.
- C. Yes, if the branch is called main.
- D. No, but changing the commit message solves it.

**Answer: B.** Removing a secret from the current file does not erase previous commits containing it.

### 19. Where should real credentials normally go for local development?

- A. In a committed README
- B. In a local environment file excluded from Git
- C. In a public issue
- D. In the remote URL

**Answer: B.** Keep actual secrets out of version control and provide safe placeholder names in an example environment file.

### 20. Which authentication approach is appropriate for GitHub command-line access?

- A. Paste your account password into every Git command
- B. Use a configured credential manager or SSH key
- C. Put an access token directly into a committed remote URL
- D. Disable repository permissions

**Answer: B.** Use a secure credential helper or SSH key; never expose a password or token in command text or committed files.

### 21. What information does Git's commit identity configure?

- A. The author name and email recorded in commits
- B. The database hostname
- C. The remote branch contents
- D. The Node.js version

**Answer: A.** Git stores author metadata with each commit; choose an email you are comfortable associating with that history.

### 22. What does `git pull --ff-only` request?

- A. Update the current branch only when it can move forward without creating a merge commit
- B. Overwrite every local file
- C. Push the current branch
- D. Delete unmerged remote changes

**Answer: A.** Fast-forward-only mode stops if histories have diverged, giving you a chance to inspect and choose how to integrate the work.

### 23. Which command creates and switches to a new feature branch?

- A. `git switch -c docs/improve-setup`
- B. `git remote -v docs/improve-setup`
- C. `git add -c docs/improve-setup`
- D. `git status docs/improve-setup`

**Answer: A.** `git switch -c` creates a branch and checks it out.

### 24. A file is staged by mistake but should remain on disk. What can unstage it?

- A. `git restore --staged path/to/file`
- B. `git clean -fd`
- C. `git push --force`
- D. `git rm --cached --all`

**Answer: A.** This removes the path from the staging area while keeping the working file.

### 25. What does `git remote -v` show?

- A. Configured remote names and their fetch/push URLs
- B. Staged file contents
- C. Every local commit message
- D. All ignored filenames

**Answer: A.** It helps verify which remote addresses the repository uses.

## Short-answer questions

### 26. What is the difference between Git and GitHub?

**Answer:** Git is version-control software that records project history. GitHub is an online service that hosts Git repositories and provides collaboration features such as pull requests.

### 27. Why should you check the current folder before running project commands?

**Answer:** Commands act relative to the working directory. Being in the wrong folder can make you edit, create, or run commands against a different project.

### 28. Explain the working tree, staging area, and commit history.

**Answer:** The working tree contains the current files you edit. The staging area selects changes for the next snapshot. A commit saves that staged snapshot in local history.

### 29. Does a commit automatically appear on GitHub?

**Answer:** No. A commit is local. Push it to the configured remote to publish it there.

### 30. Why review `git diff` and `git diff --cached` before committing?

**Answer:** `git diff` reviews unstaged edits; `git diff --cached` reviews the exact staged changes. Reviewing both helps catch accidental or missing changes before saving the commit.

### 31. Why is staging individual files often safer than blindly running `git add .`?

**Answer:** Staging named paths helps keep unrelated or sensitive files out of the next commit. If staging everything, inspect status and the staged diff first.

### 32. What is the difference between cloning a repository and initializing one?

**Answer:** Cloning copies an existing repository's files and history and configures its remote. Initializing creates local Git metadata in a folder but does not download history or create a GitHub repository.

### 33. Why should you clone a GitHub repository that already has a README instead of initializing a separate local repository?

**Answer:** Cloning preserves the existing remote history. A separate initialization creates a different history that may not connect cleanly to the GitHub repository.

### 34. If a file is already tracked, will adding it to `.gitignore` stop Git from tracking it?

**Answer:** No. Ignore rules apply to untracked files. A tracked file stays tracked until it is deliberately removed from the index or repository.

### 35. What should you do after a credential is committed?

**Answer:** Treat it as exposed, rotate or revoke it, and follow the repository owner's incident process. Removing the file in a later commit is not enough to make the old credential safe.

### 36. Describe a safe basic feature-branch workflow.

**Answer:** Update `main`, create a feature branch, edit and review files, stage specific changes, commit, push the branch, open a pull request, review and merge it, then update local `main`.

### 37. Does pushing a feature branch merge it into main?

**Answer:** No. Push publishes the branch. A pull request provides a review and merge workflow; merging is a separate action.

### 38. What is a merge conflict?

**Answer:** It occurs when Git cannot automatically combine overlapping edits. Review the conflicting files, choose or combine the intended content, remove the markers, stage the resolved files, and complete the merge.

### 39. What is a good first response to a Git error?

**Answer:** Read the message and inspect `git status`, the current branch, and the configured remotes. Understand the repository state before running a command that changes history or deletes data.

### 40. Why should commit messages describe the change?

**Answer:** Clear messages help you and collaborators understand the history later. A message such as `Document setup steps` is more useful than `update`.

### 41. How can you check the commit's destination before pushing?

**Answer:** Inspect the current branch with `git branch --show-current` and the remote URLs with `git remote -v`. Confirm the branch and destination are the intended ones.

### 42. What does it mean if `git push` says everything is up to date?

**Answer:** Git has no additional local commits to send to that remote branch. If you expected a change, check whether it was staged and committed and verify the current branch and remote.

### 43. Why quote a Windows path that contains spaces?

**Answer:** Quotes keep the path together as one command argument. Without them, the shell may interpret the spaces as separators between arguments.

### 44. What should you do before deleting a local feature branch?

**Answer:** Confirm its work has been merged or otherwise safely preserved, switch to another branch, then delete the local branch. Do not delete the only copy of unmerged work.

## Review checklist

You are ready to move on when you can:

- Check and change the current working directory.
- Explain Git versus GitHub, and cloning versus initializing.
- Describe the working tree, staging area, commits, and remotes.
- Review changes before and after staging.
- Commit with a useful message and push to the intended branch.
- Use a branch and pull request for a separate piece of work.
- Explain what `.gitignore` can and cannot ignore.
- Keep credentials out of committed files and know what to do if one leaks.
- Inspect status and history instead of force-pushing when a push is rejected.
- Recognize a merge conflict and resolve it deliberately.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md) | [Q&A](005-terminal-files-git-and-github-workflow.md) | [Example](../examples/005-terminal-files-git-and-github-workflow.md) | [006 - JavaScript essentials for MERN development](../lessons/006-javascript-essentials-for-mern-development.md) |
