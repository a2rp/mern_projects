# 100 - Continuous integration: lint, test, and build

Continuous integration (CI) runs the same quality checks on a proposed change before it is merged. For a MERN application, a useful pipeline installs locked dependencies, checks the server and client, runs automated tests against isolated data, and builds the browser artifact.

CI makes failures visible and repeatable. It does not prove an application is secure or correct, and it must never use production credentials or production user data.

## Learning outcomes

After this chapter, you should be able to:

- Define CI and identify the checks it should run.
- Install dependencies reproducibly from lockfiles.
- Run lint, server tests, client tests, and a frontend production build.
- Provide an isolated database for integration tests.
- Keep CI permissions and secrets limited.
- Require the workflow before merging a pull request.
- Diagnose failed jobs and control nondeterministic checks.
- Separate verification from deployment and production access.

## 1. Understand the CI workflow

A typical change moves through these steps:

~~~~text
Developer branch
  -> pull request
  -> CI checks
  -> review and merge
  -> release artifact
  -> deployment
~~~~

CI runs checks on a clean runner instead of relying on a developer's current machine. A failing required check should block the pull request from merging.

Keep the checks focused on repository commands that developers can run locally. CI should not depend on hidden state in a runner, a production service, or an undocumented manual step.

## 2. Define a clear set of checks

A practical starter pipeline for the course app includes:

- Install server and client dependencies with <code>npm ci</code>.
- Lint server and client code.
- Run server unit and integration tests.
- Run client unit and component tests.
- Build the production React frontend.
- Publish a build artifact only if a later workflow needs it.

Add end-to-end browser checks when the course application has a stable test setup. Keep them separate from fast unit checks if they need a browser or a longer-lived service.

The exact scripts depend on the application's package files. A possible arrangement is:

~~~~json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "build": "vite build"
  }
}
~~~~

Define scripts in each package or in the root workspace. Use the same command names locally and in CI.

## 3. Make installation reproducible

Commit a lockfile for every independently installed package. CI should use <code>npm ci</code>, which installs the locked dependency tree and fails when the manifest and lockfile disagree.

For a course application with separate packages:

~~~~text
client/package.json
client/package-lock.json
server/package.json
server/package-lock.json
~~~~

If the project uses npm workspaces, use its root manifest and lockfile consistently instead. Do not mix package managers or regenerate the lockfile in a CI job.

Choose the Node.js version from the project's runtime policy. A committed version file such as <code>.nvmrc</code> or a <code>package.json</code> engine declaration can keep development and CI aligned. Update the declared version deliberately when the application runtime changes.

## 4. Add a pull-request workflow

This example assumes a React client and Express server with separate lockfiles. The MongoDB service is an isolated CI database, not staging or production.

~~~~yaml
# .github/workflows/ci.yml
name: MERN CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      mongodb:
        image: mongo:8.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      NODE_ENV: test
      MONGODB_URI: mongodb://127.0.0.1:27017/mern_ci
      SESSION_SECRET: ci-only-session-secret-change-before-any-deployment
      CLIENT_ORIGINS: http://localhost:5173
      TRUST_PROXY_HOPS: 0

    steps:
      - name: Check out the proposed revision
        uses: actions/checkout@v7

      - name: Set up the project Node.js version
        uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: |
            client/package-lock.json
            server/package-lock.json
          package-manager-cache: false

      - name: Install server dependencies
        run: npm ci --prefix server

      - name: Install client dependencies
        run: npm ci --prefix client

      - name: Lint the server
        run: npm run lint --prefix server

      - name: Lint the client
        run: npm run lint --prefix client

      - name: Test the server
        run: npm test --prefix server

      - name: Test the client
        run: npm test --prefix client

      - name: Build the production frontend
        run: npm run build --prefix client
~~~~

The action tags and database image in this sample are illustrative major-version references. Review workflow dependencies and keep the service version compatible with the application's supported MongoDB version. For a hardened workflow, pin actions to reviewed immutable commit identifiers and update them through a deliberate review process.

The workflow has only read access to repository contents and does not define production secrets. The session secret shown is a test-only placeholder; it must never be reused outside CI. If the test suite does not need a session secret or database, remove those values instead of adding more credentials.

## 5. Keep tests isolated from real data

A CI database must be disposable and contain only synthetic data. The sample service is started for the job and is discarded afterward. Configure tests to use a dedicated database name and clean up records they create.

Never pass production credentials to a pull-request workflow. A contribution may come from a fork or include code that can read the job environment. Tests should not use production accounts, user records, uploads, email services, billing APIs, or admin credentials.

For tests that use external services:

- Use a local fake or test double when it exercises the behavior adequately.
- Use a short-lived isolated service when integration behavior must be verified.
- Use dedicated test credentials with minimal privileges when an external test system is unavoidable.
- Restrict secret-bearing workflows to trusted branches and protected environments.
- Avoid workflows that execute untrusted pull-request code with privileged deployment tokens.

## 6. Understand what each check proves

| Check | What it can catch | What it cannot prove by itself |
| --- | --- | --- |
| Lint | Style problems and selected static errors | Runtime correctness or security |
| Unit tests | Behavior of a focused function or module | Correct wiring to every real service |
| Integration tests | Interactions between application components and a test dependency | Production capacity or real user behavior |
| Component tests | UI behavior for tested component states | Full browser and network behavior |
| Production build | Bundler, imports, asset compilation, and build-time configuration issues | Successful hosting or runtime API connectivity |
| End-to-end tests | A chosen user journey across the running app | All possible workflows or production conditions |

Treat the pipeline as a layered signal. Add focused tests when a failure reveals a missing behavior; do not treat a green badge as a guarantee.

## 7. Make lint and test commands deterministic

CI should run commands with stable outcomes:

- Use the committed lockfile and a supported runtime version.
- Avoid tests that depend on current time, random ordering, or shared state without controlling them.
- Give tests unique records and clean up their resources.
- Use explicit timeouts for operations that can hang.
- Keep test databases separate from developer and production databases.
- Do not make a lint command silently return success when a required configuration is missing.
- Avoid tests that depend on a network service unless the service is part of an isolated test job.

When a check is flaky, find the race or uncontrolled dependency. Do not hide recurring failures by rerunning until one attempt passes.

## 8. Control workflow permissions and dependencies

Start with the minimum <code>GITHUB_TOKEN</code> permissions needed. A verification-only workflow usually needs read access to repository contents and no deployment permission.

Use trusted actions and review their source and permissions. Full commit-SHA pinning makes the selected action revision immutable; if a repository uses version tags for readability, maintain an explicit update process and review action changes. Do not use an action solely because it appears in a sample.

Use <code>pull_request</code> for normal contributor verification. Be cautious with event types that run privileged workflows against untrusted pull-request code. Separate deployment workflows from ordinary CI and give production credentials only to a protected deployment environment after the relevant checks pass.

## 9. Cache dependencies without caching build state

Dependency caching can reduce install time. Key the cache with the lockfiles, and use the package manager's supported cache rather than blindly preserving a runner's entire <code>node_modules</code> directory.

A cache is an optimization, not a correctness requirement. A clean install from the lockfile must still work when the cache is empty. Do not cache generated files in a way that lets stale output make a broken build pass.

If the workflow handles secrets or privileged operations, review whether caching is necessary and whether untrusted changes could affect data later consumed by a privileged job.

## 10. Build and retain the intended artifact

A passing frontend build can be uploaded as a CI artifact for later inspection or deployment. Tie the artifact to the source revision and retain it only as long as needed.

Do not publish every pull-request build to production. Separate:

- **Verification:** lint, tests, and builds on proposed changes.
- **Artifact creation:** produce a versioned release artifact after merge or approval.
- **Deployment:** release to staging or production with protected environment controls.

If the workflow builds once and promotes the same artifact, make sure public frontend configuration is handled intentionally. A build-time API URL can make the artifact environment-specific; a public runtime configuration file can support promotion but needs its own cache and release policy.

## 11. Require checks before merge

Configure repository rules so the relevant CI job must pass before a pull request can merge. Protect the default branch from direct pushes according to the team's workflow. Require review where appropriate.

Choose the required checks carefully. A check that is not run for a particular event can leave a merge unprotected or stuck. Give required jobs stable names and verify branch rules after renaming a workflow.

CI can only block changes if repository settings treat the checks as required. A green workflow that is optional does not prevent an unsafe merge.

## 12. Diagnose a failed workflow

Start with the first failing step, not the last summary line:

1. Open the failed job and identify the command and exit code.
2. Compare the runner's Node.js version with the project version file and production runtime.
3. Confirm the package lockfile matches the package manifest.
4. Read the first meaningful lint or test error and locate the failing file.
5. Check whether a service container was healthy before integration tests ran.
6. Confirm the test used the isolated CI database and expected environment variables.
7. Reproduce the same command locally from a clean install.
8. Fix the underlying issue and rerun the workflow.
9. If the workflow definition changed, confirm the intended job still runs on pull requests and pushes.

Do not post raw environment dumps, access tokens, cookies, or secret-bearing command output in a public issue. Masking is not a reason to print secrets.

## Common mistakes

- Using <code>npm install</code> in CI when the repository expects a locked install.
- Committing package manifests without their lockfiles.
- Letting CI use a different Node.js version from the project.
- Connecting integration tests to staging or production.
- Passing deployment secrets to untrusted pull-request code.
- Granting the verification job write access it does not need.
- Treating lint or a build as a substitute for tests.
- Treating a green workflow as proof that no bugs or vulnerabilities exist.
- Caching <code>node_modules</code> without a reliable lockfile-based key.
- Allowing retries to hide a flaky test instead of fixing it.
- Building a frontend with a localhost or unintended production API URL.
- Keeping a required workflow check optional in repository rules.
- Automatically deploying every pull-request build with production credentials.

## Manually inspect CI configuration

1. Confirm each package installs from its committed lockfile.
2. Confirm CI and the supported deployment runtime use compatible Node.js versions.
3. Confirm lint, server tests, client tests, and frontend build all run.
4. Confirm integration tests use only isolated disposable data.
5. Confirm the workflow has minimal token permissions.
6. Confirm no production secrets are available to pull-request jobs.
7. Confirm actions and external dependencies are reviewed and updated deliberately.
8. Confirm a failed required job blocks merging.
9. Confirm caches can be empty without breaking a clean build.
10. Confirm release artifacts can be traced to a source revision.
11. Confirm deployment is separate from untrusted pull-request verification.
12. Inspect logs for accidental secret, cookie, or personal-data output.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [099 - Deploy the frontend and production API URLs](099-deploy-the-frontend-and-production-api-urls.md) | [Lesson](100-continuous-integration-lint-test-and-build.md) | [Q&A](../qnas/100-continuous-integration-lint-test-and-build.md) | [Example](../examples/100-continuous-integration-lint-test-and-build.md) | [101 - Monitoring, logs, and health checks](101-monitoring-logs-and-health-checks.md) |
