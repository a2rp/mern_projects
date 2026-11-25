# 100 - Continuous integration: lint, test, and build: Example

This example adds a GitHub Actions workflow to a MERN application with separate <code>client/</code> and <code>server/</code> packages. Every pull request and every push to <code>main</code> installs locked dependencies, runs lint and tests, and creates a production frontend build.

The MongoDB service is temporary CI data. This workflow has no production credentials and does not deploy the application.

## 1. Confirm the repository layout

The example expects this general structure:

~~~~text
.github/
  workflows/
    ci.yml
.nvmrc
client/
  package.json
  package-lock.json
server/
  package.json
  package-lock.json
~~~~

If the application uses npm workspaces, a single root lockfile, or different package names, adapt the commands and cache paths to that actual structure.

Choose a supported Node.js runtime for the project and record it in <code>.nvmrc</code>. For example:

~~~~text
24
~~~~

The example runtime value is illustrative. Use the same supported major version for local work, CI, and deployment, then upgrade it deliberately with the application.

## 2. Define package scripts

Each required CI command must exist in the corresponding package. Example client scripts:

~~~~json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "build": "vite build"
  }
}
~~~~

Example server scripts when the project uses ESLint and Node's test runner:

~~~~json
{
  "scripts": {
    "lint": "eslint .",
    "test": "node --test"
  }
}
~~~~

Use the test and lint tools already chosen by the application. Commit the lockfile changes when adding a tool. Do not add an empty placeholder command that always succeeds just to make CI green.

## 3. Add the workflow

Create <code>.github/workflows/ci.yml</code>:

~~~~yaml
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
    name: verify
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

      - name: Set up Node.js
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

      - name: Lint server
        run: npm run lint --prefix server

      - name: Lint client
        run: npm run lint --prefix client

      - name: Test server
        run: npm test --prefix server

      - name: Test client
        run: npm test --prefix client

      - name: Build frontend
        run: npm run build --prefix client
        env:
          VITE_API_BASE_URL: /api
~~~~

The action tags and MongoDB image tag are readable examples. Review and update workflow dependencies deliberately. For immutable action references, replace tags with verified full commit SHAs and maintain an update process. Match the MongoDB service version to the application's tested database version; for stricter reproducibility, pin the service image digest.

The test-only session value is fake and exists only to let application configuration load in this job. Do not store a real session secret or production database credential in the workflow.

## 4. Keep integration data isolated

The service exposes MongoDB only to this job's runner. Tests should use the database named <code>mern_ci</code>, create their own test records, and remove those records or use a fresh database per test run.

The test suite should wait for its database connection before executing database-dependent assertions. Do not let a test silently fall back to the developer's local database or a shared staging URI.

If tests do not need MongoDB, remove the service and <code>MONGODB_URI</code> rather than retaining unused infrastructure.

## 5. Confirm the commands work locally

From the repository root, reproduce the package-specific commands:

~~~~text
npm ci --prefix server
npm ci --prefix client
npm run lint --prefix server
npm run lint --prefix client
npm test --prefix server
npm test --prefix client
npm run build --prefix client
~~~~

Use the same Node.js version named in <code>.nvmrc</code>. If a command requires a database, start an isolated local test database and use a test-only URI.

## 6. Read the workflow result

A pull request should display the <code>verify</code> check. If it fails:

1. Open the failed run and locate the first unsuccessful step.
2. Read the first useful error from that step.
3. Check whether the expected package lockfile exists and is current.
4. Compare the job's Node.js version with <code>.nvmrc</code>.
5. Check the MongoDB service health before investigating database-dependent tests.
6. Reproduce the same command locally with a clean install.
7. Fix the cause and push a new change so CI runs again.

Do not mask a failing command with a success exit code or add broad retries to flaky tests.

## 7. Require the check before merging

In repository branch rules for <code>main</code>:

1. Require pull requests instead of unreviewed direct changes where that is the team's process.
2. Require the <code>verify</code> status check before merging.
3. Require a review if the project uses code review.
4. Revisit the required check after renaming the workflow or job.

The workflow's existence alone does not block a merge. The repository rule must require the check.

## 8. Keep deployment credentials out of CI verification

This workflow only verifies code. It does not need:

- A production MongoDB URI.
- A production session secret.
- A deployment token.
- Production user data.
- Private upload credentials.

If a later release workflow deploys the app, keep it separate from pull-request verification. Grant deployment access only to the reviewed release job and use a protected environment for production credentials. Do not execute untrusted pull-request changes in a workflow that can deploy.

## 9. Update an action safely

When an action needs an update:

1. Identify the new release from its trusted source repository.
2. Review its changes and required runner version.
3. Update the tag or full commit SHA consistently.
4. Run the workflow on a pull request.
5. Confirm that permissions and outputs remain correct.
6. Record the change in the action update commit.

Avoid copying a commit SHA from an unrelated fork. A full SHA should identify the intended action's source repository.

## 10. Keep the pipeline result meaningful

A required green check should mean every intended command ran and returned success. Review the workflow when package scripts are renamed, packages are added, or the test architecture changes.

Do not treat a lint-only pass as the full MERN check. Confirm the server, client, tests, database-dependent integration paths, and production build are all covered by the job appropriate to the change.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [099 - Deploy the frontend and production API URLs](099-deploy-the-frontend-and-production-api-urls.md) | [Lesson](../lessons/100-continuous-integration-lint-test-and-build.md) | [Q&A](../qnas/100-continuous-integration-lint-test-and-build.md) | [Example](100-continuous-integration-lint-test-and-build.md) | [101 - Monitoring, logs, and health checks](101-monitoring-logs-and-health-checks.md) |
