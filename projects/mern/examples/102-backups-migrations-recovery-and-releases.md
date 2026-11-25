# 102 - Backups, migrations, recovery, and releases: Example

This example plans recovery for the course application and introduces a versioned, resumable data migration. It is provider-neutral: backup controls, restore windows, and target options must be matched to the actual MongoDB service and plan.

All database names and hostnames are illustrative. Never put live credentials in this file.

## 1. Write down recovery targets

The team first records its recovery expectations:

| Item | Example policy decision |
| --- | --- |
| Production data owner | Application operations owner |
| RPO | Product-approved maximum data-loss window |
| RTO | Product-approved maximum service-recovery time |
| Backup type | Managed snapshots, point-in-time recovery, or an appropriate self-managed method |
| Retention | Frequency and duration selected for business and compliance needs |
| Restore target | Isolated cluster with restricted access |
| Restore authority | Named operators with audited recovery permission |
| Verification | Representative records, indexes, and critical API journeys |
| Rehearsal cadence | Scheduled according to risk and operational policy |

The example deliberately does not assign universal RPO, RTO, frequency, or retention numbers. Select values from actual user and business requirements, then verify that the chosen database service can meet them.

## 2. Separate application and backup permissions

Use distinct identities:

| Identity | Permission |
| --- | --- |
| API database user | Required application operations on the application database |
| Migration runner | Temporary, reviewed permissions for a specific schema or data change |
| Backup operator | Manage or select backups according to recovery policy |
| Restore operator | Restore into an approved target and verify the job |
| Developer account | Nonproduction access only |

The API user cannot administer backup retention or restore data. A restore rehearsal does not use a developer's production credential.

## 3. Plan a restore rehearsal

Run the rehearsal in an isolated project, cluster, or account:

1. Choose a recent backup point and record its identifier and timestamp.
2. Provision a target with the needed database version and capacity.
3. Apply restrictive network access and restore-only credentials.
4. Restore the chosen point using the provider's supported procedure.
5. Use an application build compatible with that restored schema.
6. Check collection and index state and representative record counts.
7. Exercise selected read paths and controlled writes.
8. Measure database restore time and full application recovery time.
9. Compare observed data loss and elapsed time with the approved RPO and RTO.
10. Record gaps, owners, and due dates.
11. Remove the temporary target or retain it under the approved policy.

Disable outbound email, payment actions, webhooks, and other production side effects in the rehearsal application. Do not make the restored dataset available to a broad development group.

## 4. Record rehearsal evidence

~~~~text
Restore rehearsal record
------------------------
Restore point ID: <recorded by operator>
Backup timestamp: <recorded timestamp>
Restore started: <timestamp>
Data available: <timestamp>
Validation complete: <timestamp>
Application service recovered: <timestamp>
Estimated data loss: <measured interval>
RPO result: <pass or gap>
RTO result: <pass or gap>
Data checks performed: <collections, indexes, journeys>
Run by: <authorized operator>
Follow-up owner: <name or team>
~~~~

Replace placeholders in the protected operational record, not in source control. Keep user data and live credentials out of the record unless the authorized incident process specifically requires them.

## 5. Make new application writes compatible first

Suppose a user document gains a normalized display-name field. First deploy code that writes the new field whenever a user is created or updated, while still reading older documents that do not have it:

~~~~js
export function normalizeDisplayName(value) {
  return String(value ?? "").trim().toLowerCase();
}

export async function updateDisplayName(userId, displayName) {
  const normalized = normalizeDisplayName(displayName);

  return User.updateOne(
    { _id: userId },
    {
      $set: {
        displayName,
        displayNameNormalized: normalized
      }
    }
  );
}

export function displayNameFor(user) {
  return user.displayNameNormalized ??
    normalizeDisplayName(user.displayName);
}
~~~~

Deploy this compatible code before the backfill. Old and new API instances can then read the current data during rollout, and new writes do not create more missing values.

## 6. Implement a bounded, resumable backfill

The following migration illustrates a fixed high-water mark, stable identifier cursor, idempotent conditional update, and checkpoint. The migration runner and checkpoint store are application-specific helpers; use the project's migration registry and locking mechanism.

~~~~js
// server/src/migrations/20261122-normalize-display-names.js
import { User } from "../features/users/user.model.js";
import { migrationState } from "./migration-state.js";
import { normalizeDisplayName } from "../features/users/display-name.js";

const migrationId = "20261122-normalize-display-names";
const batchSize = 250;

export async function up() {
  const existingCheckpoint = await migrationState.getCheckpoint(migrationId);
  const upperBound =
    existingCheckpoint?.upperBound ??
    await User.findOne()
      .sort({ _id: -1 })
      .select("_id")
      .lean()
      .then((user) => user?._id ?? null);

  if (!upperBound) {
    await migrationState.markComplete(migrationId);
    return;
  }

  let lastId = existingCheckpoint?.lastId ?? null;

  while (true) {
    const filter = {
      _id: {
        ...(lastId ? { $gt: lastId } : {}),
        $lte: upperBound
      },
      displayNameNormalized: { $exists: false }
    };

    const batch = await User.find(filter)
      .sort({ _id: 1 })
      .limit(batchSize)
      .select("_id displayName")
      .lean();

    if (batch.length === 0) break;

    await User.bulkWrite(
      batch.map((user) => ({
        updateOne: {
          filter: {
            _id: user._id,
            displayNameNormalized: { $exists: false }
          },
          update: {
            $set: {
              displayNameNormalized:
                normalizeDisplayName(user.displayName)
            }
          }
        }
      })),
      { ordered: false }
    );

    lastId = batch[batch.length - 1]._id;

    await migrationState.saveCheckpoint(migrationId, {
      lastId,
      upperBound
    });

    console.log("Migration batch completed", {
      migrationId,
      processed: batch.length,
      lastId: String(lastId)
    });
  }

  await migrationState.markComplete(migrationId);
}
~~~~

Run this once through the controlled migration runner, not from every API process. Confirm that the migration registry uses a lock or another single-run mechanism. The checkpoint must be durable and written only after its batch is committed.

The stable upper bound limits this backfill to records present when it started. The earlier application release writes the normalized value for new and updated records. Verify that all documents are covered before switching reads to require the field.

If a migration has side effects, unique constraints, or references across collections, design and test those conditions before applying the same pattern.

## 7. Verify the backfill before contracting

After completion, inspect missing values and compare expected records:

~~~~js
const missingNormalizedNames = await User.countDocuments({
  displayNameNormalized: { $exists: false }
});

if (missingNormalizedNames !== 0) {
  throw new Error("The display-name backfill is incomplete.");
}
~~~~

Also verify representative normalized values, duplicate behavior if a unique index is planned, and query performance. Do not create a unique index until collisions have been identified and resolved according to product rules.

Keep the fallback read path until the migration and verification are complete.

## 8. Use an expand-and-contract release sequence

| Stage | Code and data behavior | Rollback position |
| --- | --- | --- |
| 1. Expand | Deploy code that reads old or new field and writes both | Old and new shapes remain usable |
| 2. Backfill | Run the bounded migration with checkpoints | Stop and resume; application remains compatible |
| 3. Verify | Check missing values, collisions, and query behavior | Keep dual-read behavior |
| 4. Switch reads | Prefer the new field while retaining a temporary fallback | Prior compatible code still works |
| 5. Contract later | Remove fallback and old field only after old clients and jobs are retired | Requires a deliberate later release |

Do not combine every stage into one deployment when the data volume or risk warrants separate observation windows.

## 9. Plan rollback and recovery choices

Before a release, write down the answers:

- Can the previous API version read all data written by the new version?
- Can the previous frontend still use the new API responses?
- Does the migration delete or overwrite information?
- Can the backfill stop and resume safely?
- If application rollback is unsafe, what corrective release is available?
- If data corruption occurs, which backup point is appropriate?
- How will valid writes after that backup point be preserved or reconciled?

Use an application rollback only when the prior code is compatible with the current data. Use a restore only after evaluating the data loss and write-reconciliation plan. A down script cannot reconstruct information that has already been discarded.

## 10. Example release runbook

### Before release

1. Confirm the latest backup completed and its restore procedure is known.
2. Confirm RPO and RTO targets and the operator responsible for recovery.
3. Review the migration, query plan, data volume, and batch size.
4. Verify the migration on representative sanitized data.
5. Confirm a rollback artifact and compatible configuration are available.

### During release

1. Deploy code that writes both representations and reads both.
2. Confirm readiness and error rate remain stable.
3. Run the migration once using the controlled runner.
4. Observe progress, database load, failures, and checkpoints.
5. Verify coverage and duplicate or index constraints.
6. Switch reads only after the verification succeeds.

### After release

1. Monitor API errors, latency, database pool pressure, and migration records.
2. Keep the fallback period required by the release policy.
3. Remove old fields or compatibility code in a later reviewed release.
4. Update the recovery runbook and record any operational gaps.

## 11. Review checklist

- [ ] RPO and RTO are documented and approved.
- [ ] Backup capability, retention, encryption, and access match those objectives.
- [ ] API credentials cannot delete backups or perform restores.
- [ ] A recent restore was rehearsed in an isolated target.
- [ ] Rehearsal verified application behavior and recorded measured timing.
- [ ] Migrations are versioned, reviewed, and run through one controlled runner.
- [ ] Backfills use bounded batches, stable cursors, and durable checkpoints.
- [ ] New code remains compatible with the old data during migration.
- [ ] Old and new application versions remain compatible during rollout.
- [ ] Rollback and restore choices account for writes and possible data loss.
- [ ] Production data and credentials are protected during rehearsals.
- [ ] Runbook gaps have owners and follow-up dates.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [101 - Monitoring, logs, and health checks](101-monitoring-logs-and-health-checks.md) | [Lesson](../lessons/102-backups-migrations-recovery-and-releases.md) | [Q&A](../qnas/102-backups-migrations-recovery-and-releases.md) | [Example](102-backups-migrations-recovery-and-releases.md) | [103 - Capstone: plan and build a complete MERN application](103-capstone-plan-and-build-a-complete-mern-application.md) |
