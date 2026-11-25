# 102 - Backups, migrations, recovery, and releases

A database backup is useful only if the application can be restored from it in time to meet its needs. Safe releases also require a plan for data changes while old and new API versions may run at once.

This chapter defines recovery targets, compares managed backups and database dumps, practices restoration, and introduces versioned MongoDB migrations with backward-compatible release sequencing. It applies to hosted and self-managed MongoDB deployments; exact backup and restore capabilities depend on the selected service and deployment topology.

## Learning outcomes

After this chapter, you should be able to:

- Define recovery point and recovery time objectives.
- Choose and configure a backup approach for the deployment.
- Protect backup access, retention, and encryption.
- Restore data into an isolated target and verify it.
- Write versioned, observable, resumable data migrations.
- Use expand-and-contract changes during rolling releases.
- Decide when to roll back code and when to roll forward data.
- Record a recovery runbook with ownership and evidence.

## 1. Define what recovery must achieve

A recovery plan starts with product and data requirements, not a button in a database console.

Two useful targets are:

- **Recovery point objective (RPO):** the maximum acceptable amount of recent data loss, expressed as time.
- **Recovery time objective (RTO):** the maximum acceptable time to restore service after an incident.

For example, a service may tolerate losing a small interval of writes but require read access to return quickly. Another service may require very little data loss even if restoration takes longer. Choose targets for the actual application and document who approves them.

Define the recovery scope:

- Which databases, collections, indexes, files, and configuration are required?
- Are user uploads stored outside MongoDB?
- Are session records durable business data or temporary state?
- Which environments and regions must be recoverable?
- Who can request, approve, execute, and verify a restore?
- How will the application remain unavailable or read-only while data is inconsistent?

A database snapshot alone may not restore files, secrets, deployment configuration, or external integrations needed to operate the application.

## 2. Choose a backup method that fits the deployment

Managed MongoDB services may offer scheduled snapshots and continuous point-in-time recovery. The available retention, restore window, target options, and permissions vary by provider and service tier. Read the plan's actual capabilities and include the selected policy in infrastructure configuration.

For self-managed MongoDB, choose a method appropriate to the topology and recovery requirements. Database tooling such as <code>mongodump</code> and <code>mongorestore</code> can suit smaller deployments and logical exports, but they do not provide the same recovery characteristics as every managed or continuous backup system. Filesystem snapshots require consistency planning, and copying live database files without a supported procedure can produce an invalid backup.

Compare methods using:

- Expected RPO and RTO.
- Point-in-time recovery availability.
- Database and cluster size.
- Restore speed and target capacity.
- Impact on production workload.
- Retention and geographic-copy requirements.
- Permissions, auditability, and recovery ownership.
- Cost and operational effort.

Do not assume a backup is suitable merely because a scheduled job reports success.

## 3. Select backup frequency and retention

Set frequency and retention to satisfy recovery objectives and data-retention requirements. Retention may include short-interval copies for recent incidents and longer-term copies for historical recovery, subject to policy and legal obligations.

Document:

- Schedule and time zone.
- Retention duration and any deletion policy.
- Whether snapshots are copied to another region or account.
- Encryption at rest and who can access keys.
- Whether protected or immutable retention is available and required.
- How backup failures are monitored.
- Who can delete backups and how that access is audited.

Keep backups separate from the application's normal database credentials. A compromised API account should not be able to delete recovery copies.

## 4. Protect backup data

Backups contain the same sensitive information as the source database. Treat them as production data.

- Encrypt backup data in storage and during transfer.
- Restrict restore and download permissions.
- Keep backup administration separate from API administration.
- Protect encryption keys and document key recovery.
- Avoid downloading production data to an unmanaged laptop.
- Use approved sanitization before copying data into nonproduction.
- Log and review restore access.
- Expire temporary restore environments and their copies.

A backup in the same failure domain as the source may not survive a region, account, or credential incident. Match the backup location and access boundaries to the threat model.

## 5. Restore into an isolated target first

Practice a restore into an isolated environment before declaring the recovery plan ready. Use a target that cannot send email, charge payment methods, or call production APIs.

A restore rehearsal should:

1. Select a backup point and record its timestamp and identifier.
2. Provision or choose an isolated target with sufficient capacity.
3. Restore the data using the supported provider or database procedure.
4. Apply the required access controls and network restrictions.
5. Connect a compatible application build using temporary credentials.
6. Verify collections, indexes, document counts, and representative records.
7. Exercise important read paths and controlled write paths.
8. Measure elapsed restore and validation time.
9. Record data loss relative to the target point.
10. Remove or retain the rehearsal environment according to policy.

Do not infer consistency only from the restore job status. Verify that the restored data and application behavior are usable.

## 6. Version database changes

MongoDB collections can evolve without a fixed relational schema, but deployed documents and indexes still require deliberate change management.

Keep data migrations in source control with:

- A unique version and descriptive name.
- The intended source and target data shape.
- Preconditions and validation rules.
- A bounded batch size for large collections.
- A checkpoint or resumability strategy.
- Clear logging and progress metrics.
- A completion record that prevents accidental duplicate execution.
- A recovery or roll-forward plan.

Do not start a schema migration automatically in every API instance's startup path. Several instances may run the same migration concurrently. Use a controlled release or migration runner with one owner and explicit locking.

## 7. Make migrations idempotent and observable

An idempotent migration can be safely retried without corrupting records or duplicating side effects. Use stable keys and conditional updates, record progress, and define how to resume after interruption.

For a large data transformation:

1. Estimate records, write volume, index impact, and duration.
2. Test on representative sanitized data.
3. Process bounded batches.
4. Use a stable cursor such as an indexed key.
5. Record a checkpoint only after a batch is safely committed.
6. Limit concurrency and database load.
7. Emit progress and failure metrics without logging personal data.
8. Validate transformed records and totals.
9. Keep the old representation until all application versions no longer need it.

Avoid an unbounded transaction or collection-wide rewrite during a busy release unless the database and workload are designed for it.

## 8. Use expand-and-contract for incompatible data shapes

An application release often overlaps old and new API instances. Make data changes compatible across that overlap.

A safe sequence is:

1. **Expand:** add the new field, index, or collection while old code still works.
2. **Deploy compatible code:** read both representations or write both as needed.
3. **Backfill:** migrate old records in bounded, resumable batches.
4. **Verify:** compare coverage and behavior.
5. **Switch reads:** prefer the new representation while preserving a fallback.
6. **Contract:** remove the old representation only after old code and old clients are outside the compatibility window.

This sequence allows a code rollback during rollout without requiring an immediate destructive database rollback.

## 9. Treat indexes as production changes

Creating, replacing, or dropping an index can affect write performance, storage, and query availability. Before a release:

- Confirm the index matches a real query or uniqueness rule.
- Estimate build cost for the collection size and topology.
- Confirm whether the database creates it automatically or a migration owns it.
- Check whether the operation blocks or competes with production work.
- Verify the index definition and query behavior after creation.
- Do not drop an index while an older application version still needs it.

Avoid letting every application instance race to perform expensive index or schema work at startup.

## 10. Plan releases around data compatibility

A release includes application code, database shape, runtime configuration, and sometimes frontend assets. Write down the order and rollback boundary before deploying.

For a compatible release:

1. Confirm a recent backup and the recovery procedure.
2. Deploy any additive schema support.
3. Run the migration or backfill in a controlled way.
4. Verify data shape and application behavior.
5. Deploy the API and frontend versions.
6. Monitor errors, latency, database load, and migration progress.
7. Remove obsolete fields or code in a later release.

For an emergency rollback, restore the previous compatible artifact and configuration. Prefer rolling the application forward with a corrective release when data has already changed in a way that the older application cannot safely use.

## 11. Know when a restore is safer than a migration rollback

Restoring a backup rewinds data and may discard valid writes made after the restore point. Reversing a migration may also be impossible if the old data was deleted or transformed lossily.

Before restoring:

- Stop or limit writes if they could further corrupt the data.
- Preserve the current state for investigation where appropriate.
- Select a restore point before the damaging event.
- Decide whether a full database, selected collections, or another recovery scope is supported.
- Define how valid writes after that point will be reconciled.
- Confirm the application and schema versions that can use the restored data.
- Obtain the required operational approval.

Do not restore production over the current database until the impact, target, and write-reconciliation plan are clear.

## 12. Measure recovery objectives in rehearsals

Record actual restore and service-recovery durations. Compare them with RTO and RPO targets.

A rehearsal should record:

| Measure | What to record |
| --- | --- |
| Backup point | Identifier and timestamp |
| Data-loss window | Difference between incident point and restored data |
| Restore duration | Start to completed data restore |
| Validation duration | Time to verify data and application behavior |
| Service recovery duration | Time until the required user journeys work |
| Outcome | Pass, failure, gaps, owner, and due date |

A provider's advertised restore capability does not automatically equal the application's end-to-end RTO. Provisioning, credentials, network setup, verification, and traffic routing also take time.

## 13. Write the recovery runbook

The runbook should be accessible during an incident and contain:

- Service and data owner.
- RPO and RTO targets.
- Backup schedule, retention, and restore permissions.
- How to identify a valid restore point.
- Safe target provisioning and network steps.
- Application and schema compatibility guidance.
- Data validation and traffic-switch procedure.
- Write freeze or reconciliation procedure.
- Approval and communications roles.
- Cleanup and evidence-retention requirements.
- Date and result of the latest restore rehearsal.

Do not put live database credentials or encryption keys in the runbook. Link the authorized operator to the protected credential process through internal controls, without exposing secret values.

## Common mistakes

- Treating a successful backup job as proof that restore works.
- Choosing backup frequency without defining acceptable data loss.
- Forgetting that uploads, secrets, and external service state may sit outside MongoDB.
- Storing backups where the same compromised identity can delete them.
- Restoring production data into a broadly accessible development environment.
- Running a long migration independently in every API instance.
- Making a non-idempotent script that cannot resume after interruption.
- Updating or deleting fields while old and new code overlap.
- Dropping an index before older code stops using it.
- Assuming a down migration can recover data that was discarded.
- Restoring over valid new writes without a reconciliation plan.
- Measuring database restore time but not application recovery time.
- Keeping no record of when a restore was last rehearsed.

## Manually inspect the recovery plan

1. Confirm documented RPO and RTO match product requirements.
2. Confirm the backup method supports those targets for this deployment.
3. Confirm schedule, retention, encryption, and restore permissions.
4. Confirm API credentials cannot delete or administer backups.
5. Confirm restore access and backup copies survive the intended failure scenarios.
6. Restore a recent point into an isolated target.
7. Verify data, indexes, application access, and restore timing.
8. Confirm sensitive data is not exposed in the rehearsal environment.
9. Review migrations for idempotency, batching, checkpoints, and observability.
10. Confirm old and new application versions are compatible during deployment.
11. Confirm rollback does not require an unsafe destructive data reversal.
12. Update the runbook and record gaps from the latest rehearsal.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [101 - Monitoring, logs, and health checks](101-monitoring-logs-and-health-checks.md) | [Lesson](102-backups-migrations-recovery-and-releases.md) | [Q&A](../qnas/102-backups-migrations-recovery-and-releases.md) | [Example](../examples/102-backups-migrations-recovery-and-releases.md) | [103 - Capstone: plan and build a complete MERN application](103-capstone-plan-and-build-a-complete-mern-application.md) |
