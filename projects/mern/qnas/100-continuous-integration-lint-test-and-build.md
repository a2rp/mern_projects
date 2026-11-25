# 100 - Continuous integration: lint, test, and build: Q&A

### 1. What is continuous integration?

**Answer:** Continuous integration automatically checks proposed code changes in a clean environment. A MERN pipeline can install locked dependencies, lint the client and server, run tests, and build the frontend.

### 2. What does CI help reveal?

**Answer:** It can reveal code-quality problems, failing tests, dependency or runtime mismatches, and build errors before a change is merged.

### 3. Does a green CI workflow prove that an application is correct and secure?

**Answer:** No. It means only that the configured checks passed for that revision. The checks may miss untested behaviors, vulnerabilities, production configuration errors, and operational problems.

### 4. Why run CI on a clean runner?

**Answer:** A clean runner reduces dependence on undocumented files, local environment state, and developer-specific configuration. It makes the checks easier to reproduce.

### 5. Why run the same commands locally and in CI?

**Answer:** Matching commands reduce differences between developer feedback and the automated pipeline and make CI failures easier to reproduce.

### 6. What does <code>npm ci</code> provide in a CI job?

**Answer:** It installs the dependency tree from the committed lockfile and fails if the package manifest and lockfile are inconsistent.

### 7. Why commit a lockfile for an application package?

**Answer:** It records dependency resolution so developers, CI, and deployment builds can install a consistent dependency tree.

### 8. What should a repository do if its frontend and server have separate package manifests?

**Answer:** Keep a lockfile for each independently installed package and have CI install each package using its corresponding lockfile.

### 9. Why should CI and the application runtime use compatible Node.js versions?

**Answer:** Different Node versions can have different language support, APIs, dependency compatibility, and build behavior. A version file or engines declaration helps keep development and CI aligned.

### 10. What is linting useful for?

**Answer:** Linting catches selected style problems, suspicious patterns, and static errors before code is merged. It does not prove runtime behavior is correct.

### 11. What does a unit test focus on?

**Answer:** It checks a small function or module in isolation, often using controlled inputs and substituting external dependencies.

### 12. What does an integration test focus on?

**Answer:** It checks how application components work together, sometimes with a real isolated database or other test service.

### 13. Why can a frontend production build pass while the deployed app still fails?

**Answer:** A build verifies bundling and compilation, but not necessarily the deployed API URL, hosting routes, CORS, cookies, runtime configuration, or server availability.

### 14. Why use an isolated MongoDB service for CI integration tests?

**Answer:** It gives tests disposable data and avoids connecting CI to developer, staging, or production databases.

### 15. Should a pull-request workflow use production data or credentials?

**Answer:** No. Pull-request code may be untrusted and should not have access to production resources or user data.

### 16. What is the purpose of a test-only session secret in a CI example?

**Answer:** It lets tests initialize session-dependent code without exposing a real secret. The placeholder must never be reused in a deployed environment.

### 17. What permissions does a verification-only workflow usually need?

**Answer:** Usually only read access to repository contents. It should not receive write or deployment permission unless a specific trusted task requires it.

### 18. What is the risk of giving every workflow broad token permissions?

**Answer:** A compromised action or malicious code could use those permissions to change repository content or access resources the job did not need.

### 19. Why use <code>pull_request</code> for normal contributor checks?

**Answer:** It runs the verification job for proposed changes without granting the workflow the special trust model associated with privileged events. Do not run untrusted code in a privileged deployment workflow.

### 20. What does pinning a workflow action to a full commit SHA provide?

**Answer:** It identifies an immutable action revision, so the workflow runs the code that was reviewed instead of code that a movable version tag may later point to.

### 21. Why do action tags still need deliberate maintenance?

**Answer:** Tags can move and action behavior can change across releases. Review action updates and their permissions instead of assuming that a sample version is permanently safe.

### 22. What does dependency caching do in CI?

**Answer:** It reuses package-manager download data to reduce repeated installation time. It is an optimization and should not be required for a correct clean install.

### 23. Why key a dependency cache with lockfiles?

**Answer:** A lockfile change changes the dependency resolution, so including it in the key prevents reuse of data associated with a different dependency tree.

### 24. Why avoid blindly caching <code>node_modules</code>?

**Answer:** It can preserve platform-specific or stale installed state and hide problems that a clean lockfile install would reveal.

### 25. What makes a test flaky?

**Answer:** It passes and fails inconsistently because it depends on uncontrolled timing, random order, shared state, race conditions, or an unreliable external service.

### 26. Why is repeatedly rerunning a flaky test until it passes a poor fix?

**Answer:** It hides the failure without correcting the nondeterministic behavior and makes the pipeline less trustworthy.

### 27. Why give jobs a timeout?

**Answer:** A timeout prevents a hung process or unavailable dependency from consuming runner resources indefinitely and helps surface the need for explicit test limits.

### 28. What is a workflow concurrency group used for?

**Answer:** It can identify overlapping runs for the same workflow and branch so obsolete runs, such as an earlier commit's checks, can be cancelled when a newer change arrives.

### 29. How does a required status check protect a branch?

**Answer:** Repository rules can prevent merging until the named CI job succeeds. A passing but optional job does not block a merge.

### 30. Why should required job names remain stable?

**Answer:** Branch protection refers to check names. Renaming a required job without updating the rule can leave merges blocked or allow the wrong check to satisfy the rule.

### 31. What should a workflow do with a production build artifact?

**Answer:** If it is needed later, publish it with its source revision or artifact identifier so it can be inspected or promoted. Avoid publishing every pull-request build to production.

### 32. How are verification, artifact creation, and deployment different?

**Answer:** Verification runs checks on changes. Artifact creation produces a versioned release output. Deployment gives that artifact to an environment. Separating them lets production access be restricted independently.

### 33. Why separate deployment from ordinary pull-request CI?

**Answer:** Pull-request code can be untrusted. Production credentials and deployment permission should be limited to reviewed, approved release workflows.

### 34. Why can a pull-request build need no production API URL?

**Answer:** CI should validate the code without contacting production. It can use local routing, a test configuration, or build-time placeholders that contain no private information.

### 35. What should happen if a package manifest changes but its lockfile does not?

**Answer:** The clean install should fail. Update and review the lockfile with the intended dependency change rather than allowing CI to resolve a new tree silently.

### 36. Why should integration tests clean up their test records?

**Answer:** Cleanup limits cross-test interference and keeps repeated runs from accumulating or accidentally depending on old data.

### 37. What is a useful first step when a workflow fails?

**Answer:** Open the failed job and find the first command that returned a failure. Later errors may only be consequences of that initial problem.

### 38. A test passes locally but cannot connect to MongoDB in CI. What should be checked?

**Answer:** Check that the CI service started and passed its health check, that the job uses the correct host and port, that the URI names an isolated test database, and that tests wait for readiness as needed.

### 39. Why should workflow logs avoid environment dumps?

**Answer:** Environment dumps can reveal secrets, cookies, tokens, or private identifiers. Log specific sanitized diagnostics rather than printing every variable.

### 40. Which CI checks should block merging a full-stack feature?

**Answer:** At minimum, the relevant lint checks, server and client test suites, and production frontend build should pass. Add integration or end-to-end checks when the change requires those behaviors, and configure the checks as required repository rules.
