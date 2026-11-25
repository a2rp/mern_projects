# 102 - Backups, migrations, recovery, and releases: Q&A

### 1. What is the purpose of a database backup strategy?

**Answer:** It provides a planned way to recover data after accidental deletion, corruption, a failed release, infrastructure failure, or another incident.

### 2. What is an RPO?

**Answer:** Recovery point objective is the maximum acceptable amount of recent data loss, usually described as a time interval before the incident.

### 3. What is an RTO?

**Answer:** Recovery time objective is the maximum acceptable time to restore the service after an incident.

### 4. Why define recovery objectives before choosing a backup schedule?

**Answer:** The acceptable data-loss window and recovery time determine how often data must be protected and what restore capabilities and staffing are needed.

### 5. Does a database snapshot contain every part of a MERN application?

**Answer:** Not necessarily. Uploads, secrets, deployment configuration, external service state, and other data may live outside MongoDB and need separate recovery procedures.

### 6. Why is a successful backup job not enough evidence of recoverability?

**Answer:** The backup may be incomplete, inaccessible, incompatible, or too slow to restore. The team must restore it and validate both data and application behavior.

### 7. What should be considered when selecting a backup method?

**Answer:** RPO, RTO, deployment topology, database size, point-in-time support, restore speed, production impact, retention, permissions, cost, and operational effort.

### 8. Are <code>mongodump</code> and <code>mongorestore</code> equivalent to every managed continuous backup system?

**Answer:** No. They are useful logical tools for some deployments, but do not automatically provide the same point-in-time recovery, scale, consistency, or operational characteristics as every managed backup service.

### 9. Why verify the actual backup capabilities of a managed database plan?

**Answer:** Frequency, restore window, target options, and supported recovery scope can vary by service and plan. The chosen plan must meet the application's documented objectives.

### 10. What should a backup retention policy define?

**Answer:** Backup frequency, duration, deletion behavior, any longer-term retention, regional copies, encryption, responsible roles, and how backup failures are detected.

### 11. Why should the API's normal database account not administer backups?

**Answer:** Separating backup permissions limits the damage if the application credential is compromised and prevents routine application access from deleting recovery copies.

### 12. Why are backups treated as production data?

**Answer:** They contain copies of the same potentially sensitive information as the source database and need comparable encryption, access control, retention, and handling protections.

### 13. Why restore into an isolated target first?

**Answer:** An isolated target allows verification without overwriting production or triggering production integrations such as email, billing, or user notifications.

### 14. What should a restore rehearsal verify beyond job completion?

**Answer:** It should check representative records, collection and index state, application compatibility, important read and controlled write paths, and actual recovery timing.

### 15. What are database migrations in a document database?

**Answer:** They are controlled, versioned changes to stored documents, indexes, or collections as the application's data shape evolves.

### 16. Why keep migration scripts in source control?

**Answer:** Versioning identifies the intended data change, supports review and audit, and lets operators connect a migration to an application release.

### 17. Why should a migration not normally run in every API process's startup path?

**Answer:** Multiple instances can start concurrently and execute the same change, creating contention or duplicate work. A controlled migration runner should have one owner and explicit coordination.

### 18. What does an idempotent migration do?

**Answer:** It can be retried without duplicating side effects or corrupting records, typically by using conditional updates, stable identifiers, and safe progress tracking.

### 19. Why use bounded batches for a large collection migration?

**Answer:** Bounded batches limit memory use, write load, lock or resource pressure, and the amount of work lost if the migration pauses or fails.

### 20. What is a migration checkpoint?

**Answer:** It records safely completed progress so a resumable migration can continue from a known position instead of restarting or skipping records.

### 21. Why should migration progress be observable?

**Answer:** Operators need to know how much work is complete, how quickly it is running, whether it is failing, and whether database load is becoming unsafe.

### 22. What is the expand-and-contract strategy?

**Answer:** First add the new data shape while old code still works, then deploy compatible code, backfill and verify records, switch reads, and remove the old representation only after old code no longer needs it.

### 23. Why maintain compatibility between old and new API versions during a rollout?

**Answer:** Old and new instances can overlap, and browser clients may stay open or cached. Compatibility keeps requests working during deployment and makes application rollback safer.

### 24. Why can an application rollback fail after a destructive data migration?

**Answer:** The old code may expect fields or records that the migration removed or transformed. Code rollback does not automatically restore data.

### 25. What is a roll-forward recovery?

**Answer:** It is deploying a corrective application or migration that safely handles the current data state, instead of trying to reverse a change that may have discarded information.

### 26. Why are index changes production changes?

**Answer:** Index creation, replacement, or removal can consume resources, affect writes, and change query performance or correctness. It needs planning and verification.

### 27. Why avoid creating indexes independently from every API instance?

**Answer:** Several processes may race to perform the same expensive operation and add unpredictable load during startup.

### 28. When might a full restore be more appropriate than reversing a migration?

**Answer:** If the current data has been corrupted or deleted and a safe reverse migration is impossible, restoring an earlier consistent point may be necessary.

### 29. What data risk does a restore create?

**Answer:** It may discard valid writes created after the selected restore point. The team needs a plan to preserve or reconcile those writes.

### 30. What should happen before restoring over production?

**Answer:** Assess impact, preserve evidence if appropriate, select and verify the target point, plan write freeze and reconciliation, confirm compatible application versions, and obtain required operational approval.

### 31. Why rehearse a restore using an isolated application environment?

**Answer:** It helps verify the data and user journeys without sending production email, charging real payments, or exposing restored personal data to unnecessary access.

### 32. What should be recorded during a restore rehearsal?

**Answer:** Backup identifier and timestamp, estimated data-loss window, restore duration, validation time, service recovery time, outcome, and follow-up owners.

### 33. Why measure end-to-end recovery time rather than only database restore time?

**Answer:** Provisioning, credentials, network setup, application compatibility, validation, and traffic routing also contribute to the time users wait for service recovery.

### 34. Why might a backup in the same account or region be insufficient?

**Answer:** A regional outage or compromised account could affect both the live database and its backup. Recovery copies should match the threat model and required failure boundaries.

### 35. Why sanitize production data before using it outside production?

**Answer:** Production records may contain personal or confidential information. Nonproduction environments should not receive real data unless a controlled and approved process protects it.

### 36. What should a recovery runbook contain?

**Answer:** Ownership, recovery targets, backup location and permissions, restore selection, isolated target steps, application compatibility, data validation, traffic switching, approvals, communication, and cleanup.

### 37. A migration stops halfway through a large collection. What design features help resume safely?

**Answer:** Idempotent updates, bounded batches, a stable indexed cursor, durable checkpoints, progress metrics, and a clear completion record allow controlled resumption.

### 38. When should an old field be removed after a replacement is introduced?

**Answer:** Only after the backfill and verification are complete and no supported API version, background job, or browser client still relies on the old field.

### 39. A release writes new-format documents and a rollback is needed. What should the team check?

**Answer:** Confirm that the prior code can still read those documents. If not, keep traffic on a compatible release or roll forward with a correction instead of assuming the old artifact is safe.

### 40. What proves that a recovery plan is operationally ready?

**Answer:** A recent restore rehearsal has completed successfully, the application and data were verified, measured RPO and RTO fit the approved targets, responsibilities are clear, and identified gaps have owners.
