# 034 - Seed data, migrations, and database lifecycle

Application data changes over time. A new feature may need a new field, a renamed value, or a transformed representation. Seed scripts and migrations help introduce that data in a repeatable, observable way. Connection lifecycle practices ensure application instances and one-off jobs open and close database connections deliberately.

A migration is an explicit change to stored data or database structure. It is different from editing a Mongoose schema: changing the JavaScript schema does not automatically transform every existing MongoDB document. Plan the code rollout and data change together.

## Learning goals

By the end of this chapter, you should be able to:

- Distinguish seed data, migrations, and schema definitions.
- Make seed scripts repeatable with stable keys and upserts.
- Track applied migrations and run a migration as a controlled release step.
- Design resumable, idempotent backfills that process bounded batches.
- Roll out a document-shape change while old and new app versions may coexist.
- Verify a migration and plan for recovery before a risky data change.
- Start an application only after its required database connection is ready.
- Stop accepting new requests and close database connections gracefully.

## Schema changes do not migrate existing documents

MongoDB documents in one collection can have different shapes. Changing a Mongoose schema changes how current application code creates, casts, validates, and reads documents. It does not automatically rewrite all existing documents in the collection.

Suppose an older document has:

~~~json
{
  "_id": "post-101",
  "authorName": "Ada Lovelace"
}
~~~

A newer application wants:

~~~json
{
  "_id": "post-101",
  "author": {
    "displayName": "Ada Lovelace"
  }
}
~~~

Updating the Mongoose schema alone does not transform the stored record. The application must either continue to support both shapes, transform old documents, or use an intentional versioning approach.

MongoDB's flexible document model makes gradual transitions possible, but every reader and writer must have a clear compatibility plan. Do not assume all records change at the same instant.

## Seed data

Seed data provides known records for development, demonstrations, tests, or required initial application configuration. Examples include sample products in a local database or a required settings document.

Keep development sample data separate from production business data. A script that clears and repopulates a local database must not be pointed at a production database. Production bootstrap data should be explicitly scoped, reviewed, and repeatable.

### Make seeding repeatable

A repeatable seed script can run more than once without creating unwanted duplicates or overwriting later user changes. Use a deterministic key and an upsert with setOnInsert when the seed should only initialize a record that is absent:

~~~javascript
await Setting.updateOne(
  { _id: "default-site-settings" },
  {
    $setOnInsert: {
      siteName: "Example Learning Site",
      supportEmail: "support@example.invalid"
    }
  },
  { upsert: true }
);
~~~

The stable key identifies the same logical seed record on each run. setOnInsert fills values only when the record is first created. Do not use a random ID for a seed that must be recognized on later runs.

If seed values need to change over time, decide whether the seed script owns those fields after creation. A blind $set can overwrite data that an administrator or user changed. Use explicit ownership rules for every field.

### Separate seeds from migrations

A seed script answers, “Which known records should exist in this environment?”

A migration answers, “How should existing stored data change to meet a new application contract?”

Keep these purposes separate. The seed command should not silently rewrite every production record. A migration should not recreate a large body of sample records.

## Migration tracking

A migration runner commonly stores one record per applied migration. A migration identifier should be stable and unique, and the record can include an applied timestamp and release metadata.

A simple ledger might look like:

~~~text
migration id                         applied at
2026-11-add-author-display-name-v1    2026-11-22T10:00:00Z
~~~

The runner should:

1. Connect using an explicit environment configuration.
2. Read the migration ledger.
3. Skip an already recorded migration.
4. Apply the migration using a safe, bounded strategy.
5. Verify its result.
6. Record completion only after the work succeeds.
7. Close the connection whether the migration succeeds or fails.

Run a production migration as one controlled release job, not once from every application replica during startup. Multiple runners can race, contend for locks, or repeat work. If concurrent execution is a requirement, add an explicit locking design rather than relying on timing.

## Idempotent and resumable backfills

An idempotent migration can run again without producing a different incorrect result. A resumable migration can continue after a process stops partway through.

For a backfill, use a filter that selects only records still needing the new value. Write the transformed value with a deterministic function. If the job fails, the next run can skip records already migrated and continue with the remaining set.

~~~javascript
const filter = {
  authorName: { $type: "string" },
  "author.displayName": { $exists: false }
};

for await (const post of Post.find(filter)
  .select("_id authorName")
  .lean()
  .cursor()) {
  const displayName = post.authorName.trim().replace(/\s+/g, " ");

  await Post.updateOne(
    {
      _id: post._id,
      "author.displayName": { $exists: false }
    },
    {
      $set: { "author.displayName": displayName }
    }
  );
}
~~~

The conditional filter on the update protects against overwriting a value that another operation has already supplied. For a large collection, process bounded batches, record progress, monitor duration and database load, and make the transformation safe to retry. Avoid loading an entire collection into application memory.

A migration marker should be written after all required records have been updated and checked. If a crash occurs after some records were changed but before the marker is written, a properly idempotent migration can safely resume.

## Expand, migrate, contract

A low-risk application rollout often separates a change into stages:

1. **Expand:** Add the new field or representation while keeping the old one readable. Deploy code that understands both shapes and can write the new shape.
2. **Migrate:** Backfill existing records. Monitor progress, failures, and application behavior.
3. **Verify:** Confirm the expected records have the new value and that current application code no longer depends on the old shape.
4. **Contract:** In a later release, remove compatibility code and, if appropriate, retire the old field.

This sequence helps during a rolling deployment when old and new application instances can run at the same time. The exact order depends on whether old code can tolerate new documents and whether new code can read old documents.

Do not remove the old field in the same step that first introduces the new one unless the deployment guarantees that every reader and writer is already compatible. Keep transitional code only as long as needed, then remove it intentionally.

## Schema versioning

Sometimes old documents should retain their original representation. For example, historical records may need to preserve what the application knew at the time they were created. A schemaVersion field can tell application code how to interpret each document.

Versioning avoids an immediate all-record backfill but means application code must support multiple document versions. Query and index design must account for those versions. Use versioning when historical shape or gradual adoption is useful, not as a way to avoid deciding how old data should behave.

## Verification and recovery

Before a production migration:

- Identify the exact records and fields it will change.
- Estimate the number of records and the expected runtime.
- Test against representative data, including malformed and old shapes.
- Ensure the transformation is idempotent or has a clear recovery plan.
- Capture a suitable backup or snapshot according to the deployment's recovery strategy.
- Verify that a restore can be performed; an untested backup is not a proven recovery process.
- Monitor application errors, database load, and migration progress.
- Keep the old application path available until the new data is verified if the rollout requires it.

A rollback of application code does not necessarily roll back a data migration. Prefer forward-compatible changes and a deliberate compensating migration when data must be transformed back. Avoid destructive changes such as dropping a collection as a shortcut for schema evolution.

Backups and restores are deployment-specific. A dump-and-restore tool may be suitable for a small self-managed deployment, while managed or large deployments may use snapshots or provider backup services. Check consistency, performance impact, and restore requirements for the actual environment.

## Application connection lifecycle

For a web application, establish the database connection before accepting requests that require it:

~~~javascript
await mongoose.connect(process.env.MONGODB_URI);

const server = app.listen(port, () => {
  console.log("HTTP server is ready.");
});
~~~

If the initial connection fails, decide whether the process should fail startup so the process manager can retry, or use an explicit degraded-mode design. Do not report the service as ready while required database operations cannot succeed. Mongoose can buffer model commands before connecting, but buffering is not a substitute for readiness checks.

A long-running process should also observe connection events and report its readiness accurately. Distinguish an initial connection failure from losing connectivity after startup. Apply a deliberate health-check and retry policy; do not repeatedly create new clients for every request.

### Graceful shutdown

When the process receives a shutdown signal, first stop accepting new HTTP requests. Wait for the HTTP server to finish active requests, then close the database connection. Avoid calling process.exit immediately because it can cut off in-flight work.

~~~javascript
let isShuttingDown = false;

async function shutdown(server, signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log("Received " + signal + "; shutting down.");

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    await mongoose.disconnect();
    console.log("HTTP server and database connection closed.");
  } catch (error) {
    console.error("Shutdown failed: " + error.message);
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => {
  void shutdown(server, "SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown(server, "SIGINT");
});
~~~

This example assumes server and mongoose are defined in the application module. Production shutdown behavior should also have a bounded timeout so a stuck request cannot keep a deployment alive forever. Use the process manager's termination grace period to allow active work to finish.

### One-off scripts

A seed or migration process is not a web server. It should connect, perform its bounded work, report success or failure, and disconnect in a finally block:

~~~javascript
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    await runSeedOrMigration();
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Database job failed: " + error.message);
  process.exitCode = 1;
});
~~~

Do not let a failed database job print success or mark a migration as complete. Return a failing process exit code so the release workflow can stop and report the problem.

## Common mistakes

- Assuming a changed Mongoose schema updates existing records.
- Running sample seed data against production without an explicit environment guard.
- Generating new random IDs each time a seed script runs.
- Using a seed update that overwrites fields owned by users or administrators.
- Treating seeds and migrations as the same job.
- Running the same production migration from every application instance.
- Marking a migration complete before its data changes are verified.
- Writing a non-idempotent backfill that cannot safely resume.
- Loading every document in a large collection into memory.
- Removing old fields before all running application versions can handle the new shape.
- Assuming application rollback automatically restores database contents.
- Accepting HTTP traffic before a required database connection is ready.
- Closing the database before active HTTP requests have finished.
- Calling process.exit before asynchronous cleanup completes.
- Assuming a backup is usable without performing a restore rehearsal.

## Practical checklist

Before releasing a seed or migration:

- Scope the database and environment explicitly.
- Use stable seed identifiers and safe upsert behavior.
- Give each migration a stable identifier and record its completion.
- Ensure a migration is run by one controlled release process.
- Make long backfills idempotent, bounded, observable, and resumable.
- Deploy code that tolerates the old and new data shape during transition.
- Verify transformed data before removing compatibility code.
- Plan and rehearse backup restoration for the recovery objective.
- Start the server only after required connections are ready.
- Stop new requests before waiting for active work and disconnecting.
- Set a nonzero exit code when a seed or migration fails.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [033 - Mongoose validation, hooks, and virtuals](033-mongoose-validation-hooks-and-virtuals.md) | [Q&A](../qnas/034-seed-data-migrations-and-database-lifecycle.md) | [Example](../examples/034-seed-data-migrations-and-database-lifecycle.md) | [035 - MongoDB security, backup, and restore](035-mongodb-security-backup-and-restore.md) |
