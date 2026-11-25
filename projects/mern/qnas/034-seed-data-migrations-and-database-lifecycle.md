# Chapter 034 Q&A: Seed data, migrations, and database lifecycle

Review repeatable seed scripts, migration tracking and rollout, resumable backfills, recovery planning, and application database connection lifecycle.

## Part 1: Multiple-choice questions

### 1. What does a seed script primarily do?

- **A.** Ensures known initial records exist in an environment.
- **B.** Rewrites every production document on each application startup.
- **C.** Replaces the MongoDB connection URI.
- **D.** Automatically changes every Mongoose schema.

**Answer: A.** Seeds provide known data such as local examples or required configuration records.

### 2. What does a migration primarily do?

- **A.** Changes existing stored data or database structure to support an application change.
- **B.** Creates a sample user for every HTTP request.
- **C.** Rebuilds the JavaScript runtime.
- **D.** Starts the database server.

**Answer: A.** Migrations make an explicit, tracked change to existing persisted data or database structure.

### 3. Which option is useful for creating a seed record without overwriting later changes when the record already exists?

- **A.** An upsert with $setOnInsert and a stable key.
- **B.** An unconditional deleteMany call.
- **C.** A random key generated on every run.
- **D.** A query with no filter.

**Answer: A.** The deterministic key identifies the same logical seed, while $setOnInsert only supplies values on insertion.

### 4. Why should a seed use a stable identifier?

- **A.** So later runs can recognize the same logical record.
- **B.** So every run creates a different record.
- **C.** So MongoDB skips authentication.
- **D.** So the collection can be dropped safely.

**Answer: A.** A stable key lets the seed be repeatable without creating duplicates.

### 5. Where should a production migration usually run?

- **A.** As one controlled release job.
- **B.** Independently from every application replica at process startup.
- **C.** From every user's browser.
- **D.** Only from a Mongoose virtual getter.

**Answer: A.** One controlled runner avoids multiple app instances racing to run the same migration.

### 6. What does a migration ledger record?

- **A.** Which migrations completed and when.
- **B.** Every HTTP request body.
- **C.** A copy of the MongoDB server executable.
- **D.** The password for every database user.

**Answer: A.** A ledger helps the runner skip migrations that have already completed.

### 7. What makes a data backfill resumable?

- **A.** It selects only records still needing the change and safely skips completed records.
- **B.** It deletes the migration ledger before every batch.
- **C.** It loads the entire collection into memory.
- **D.** It depends on running exactly once without interruption.

**Answer: A.** A conditional filter and deterministic update allow a rerun to continue after partial progress.

### 8. In an expand-migrate-contract rollout, what usually happens during the expand stage?

- **A.** Add the new representation while keeping compatibility with the old one.
- **B.** Immediately delete the old representation.
- **C.** Drop the entire database.
- **D.** Stop validating all writes permanently.

**Answer: A.** The expand stage prepares code and data for a transition while old and new application versions may coexist.

### 9. Why does changing a Mongoose schema not update old MongoDB documents?

- **A.** The schema affects Mongoose application behavior; it does not automatically backfill stored records.
- **B.** MongoDB cannot store fields.
- **C.** Mongoose deletes all old documents automatically.
- **D.** Schema definitions only work in browsers.

**Answer: A.** Existing records need an explicit migration or a deliberate multi-version reading strategy.

### 10. What should happen before a risky production data migration?

- **A.** Test the transformation, plan recovery, and verify a suitable backup can be restored.
- **B.** Remove all backups to save storage.
- **C.** Run a destructive command without checking the target.
- **D.** Disable application monitoring.

**Answer: A.** A backup should be appropriate for the recovery objective and restore-tested.

### 11. When should a web server accept requests that require MongoDB?

- **A.** After the required database connection is ready.
- **B.** Before the connection attempt begins.
- **C.** Only after receiving a shutdown signal.
- **D.** Only when the seed script is running.

**Answer: A.** Readiness should reflect whether required dependencies can serve requests.

### 12. What is a good first step when handling a graceful shutdown signal?

- **A.** Stop accepting new HTTP requests.
- **B.** Immediately terminate the process before cleanup.
- **C.** Drop all database collections.
- **D.** Create a new connection for every request.

**Answer: A.** Stop new work first, allow in-flight requests to finish, then close the database connection.

### 13. Why should shutdown avoid calling process.exit immediately?

- **A.** It can interrupt in-flight work and asynchronous cleanup.
- **B.** It automatically performs a restore.
- **C.** It keeps the process alive forever.
- **D.** It rewrites the migration ledger.

**Answer: A.** Let the server and database cleanup complete, then set the process exit code when needed.

### 14. Which property describes a migration that can run again without causing an incorrect repeated change?

- **A.** Idempotent.
- **B.** Virtual.
- **C.** Hydrated.
- **D.** Volatile.

**Answer: A.** Idempotence makes retries and recovery safer.

### 15. What is a key trade-off of schema versioning?

- **A.** The application may need to support multiple document shapes.
- **B.** It removes the need to understand old data.
- **C.** It makes every field automatically indexed.
- **D.** It guarantees no migration code is ever needed.

**Answer: A.** Versioning can avoid an immediate full backfill, but readers and queries must account for multiple versions.

## Part 2: Short-answer questions

### 16. How are seed data and migrations different?

**Answer:** Seed data ensures known initial records exist in an environment. A migration deliberately transforms existing data or database structure to meet a new application contract.

### 17. Why should a development seed script be explicitly separated from production data operations?

**Answer:** Sample data and destructive local reset logic can damage production if pointed at the wrong database. Scope scripts to an explicit environment and use reviewed production bootstrap steps.

### 18. What is the benefit of using $setOnInsert in an upsert seed?

**Answer:** It inserts initial values only when the deterministic key is absent, avoiding overwriting existing user or administrator changes on a later run.

### 19. What fields might a migration ledger record?

**Answer:** A stable migration identifier and application time are typical. A system may also record release or runner metadata needed for auditing.

### 20. Why should one controlled process run a production migration?

**Answer:** Multiple application replicas can race, duplicate work, or contend. A single release job makes execution and reporting predictable; concurrent operation requires an explicit lock design.

### 21. What makes a migration idempotent?

**Answer:** Running it more than once produces the same correct end state instead of repeating an unintended change. Stable transformations and filters for only unmigrated documents help.

### 22. What makes a migration resumable?

**Answer:** It can safely continue after partial progress, usually by selecting only records that still need the transformation and recording completion only after verification.

### 23. Why should large backfills use bounded batches?

**Answer:** Batches limit application memory and database load, enable progress monitoring, and make pauses or retries more manageable.

### 24. What are the stages of expand-migrate-contract?

**Answer:** Add a compatible new representation, backfill and verify existing records, then remove the old representation in a later step after no running code depends on it.

### 25. When might schema versioning be preferable to a full migration?

**Answer:** When old records should retain their historical shape, the migration would take a long time, or the application needs to support gradual conversion. The application must then interpret each version correctly.

### 26. Why does application rollback not necessarily undo a database migration?

**Answer:** Code rollback changes the running application version, but stored documents remain transformed. Recovery needs a compatible application, a compensating migration, or a restored backup.

### 27. Why is a restore rehearsal important?

**Answer:** It verifies that the backup can actually be restored and that the recovery procedure meets the deployment's needs. Merely possessing backup files does not prove recoverability.

### 28. What should a migration do if the process fails before recording completion?

**Answer:** It should leave the ledger unmarked and be safe to rerun. The data transformation should be idempotent or have explicit recovery steps.

### 29. Why should a web app connect to MongoDB before reporting ready?

**Answer:** Otherwise the app may accept requests that require a dependency that is unavailable. Readiness should match the service's ability to perform required work.

### 30. What is the correct high-level order for graceful database shutdown?

**Answer:** Stop accepting new HTTP work, wait for active requests to finish, then close the Mongoose connection and let the process exit naturally.

## Part 3: Practical scenarios

### 31. A seed script inserts a new copy of a default setting every time it runs. What should change?

**Answer:** Use a deterministic identity for the setting and an upsert with setOnInsert when existing values should be preserved. Avoid generating a new random identifier each run.

### 32. An administrator edits a seeded support email, but the next seed run resets it. What is the issue?

**Answer:** The seed update overwrites a field that is no longer fully owned by the seed. Use setOnInsert for initialization or define explicit ownership and update rules for fields that the seed is expected to manage.

### 33. The application schema adds a nested author object, but old records still have authorName. What is needed?

**Answer:** Update application code to read both shapes during transition, then run a controlled backfill and verify it. Remove the old shape only after all active application versions no longer depend on it.

### 34. A migration updates half the records, then the process crashes before writing the ledger record. What design allows a safe retry?

**Answer:** Filter for records whose new field is still absent, apply a deterministic transformation, and write the completion marker only after the entire operation is verified. The rerun then continues with the remaining records.

### 35. Every service replica runs the migration during startup. What can go wrong?

**Answer:** Replicas can race to perform the same work, compete for resources, or write duplicate ledger entries. Move it to one controlled release job or build an explicit migration lock.

### 36. A migration loops through a million records and stores them all in an array first. What should improve?

**Answer:** Stream or process the records in bounded batches, track progress, and monitor load. Avoid loading the entire collection into application memory.

### 37. New code requires a field that old application instances do not write. What rollout risk exists?

**Answer:** During a rolling deploy, old instances may keep producing documents without the field. First deploy compatible code or make the new field optional during expansion, backfill, and require it only after old writers are gone.

### 38. A service starts listening before mongoose.connect finishes. What should change?

**Answer:** Await the required database connection before starting the listener or reporting readiness. If startup cannot connect, fail clearly or implement an intentional degraded mode.

### 39. A process receives SIGTERM and immediately exits. What can be lost?

**Answer:** Active HTTP requests, pending database operations, or cleanup work may be interrupted. Stop new requests, wait for in-flight work, disconnect the database, and allow a bounded graceful period.

### 40. A backup file exists, but no one has tried restoring it. Is the recovery plan verified?

**Answer:** No. Restore the backup to an appropriate test deployment and check that the data and procedure meet the recovery objective.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [033 - Mongoose validation, hooks, and virtuals](../lessons/033-mongoose-validation-hooks-and-virtuals.md) | [Lesson](../lessons/034-seed-data-migrations-and-database-lifecycle.md) | [Example](../examples/034-seed-data-migrations-and-database-lifecycle.md) | [035 - MongoDB security, backup, and restore](../lessons/035-mongodb-security-backup-and-restore.md) |
