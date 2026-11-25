# Chapter 035 Q&A: MongoDB security, backup, and restore

Review database identities and permissions, network controls, application safeguards, recovery objectives, backup protection, and restore verification.

## Part 1: Multiple-choice questions

### 1. What does authentication establish?

- **A.** The identity of the person or service connecting.
- **B.** The exact fields the identity may update.
- **C.** That a backup can be restored.
- **D.** That the database is reachable from every network.

**Answer: A.** Authentication verifies who is connecting. Authorization determines the operations that identity may perform.

### 2. What does authorization decide?

- **A.** Which resources and operations an authenticated identity may use.
- **B.** Whether a username exists in the source code.
- **C.** When the server should take a snapshot.
- **D.** Whether a request uses JSON.

**Answer: A.** MongoDB roles grant privileges over resources such as databases, collections, or cluster actions.

### 3. What is the principle of least privilege?

- **A.** Give each identity only the permissions needed for its assigned task.
- **B.** Give all services the same administrator account.
- **C.** Grant broad access and rely on the application UI to hide data.
- **D.** Remove authentication from internal services.

**Answer: A.** Narrow privileges limit the impact of mistakes or stolen credentials.

### 4. Which database identity should a web application normally use?

- **A.** A dedicated service user with access scoped to the application's database and required operations.
- **B.** A cluster administrator shared with every developer.
- **C.** The operating-system root account.
- **D.** A user with unrestricted access to every database.

**Answer: A.** Separate service identities make access review, rotation, and incident response clearer.

### 5. What is a good reason to give a backup job its own identity?

- **A.** Its permissions can be limited to backup tasks and managed separately from application writes.
- **B.** It removes the need to protect backup files.
- **C.** It makes every restore safe to run against production.
- **D.** It allows the application to skip input validation.

**Answer: A.** Distinct credentials let operators constrain and audit each responsibility.

### 6. What does enabling MongoDB access control require from clients?

- **A.** Clients must authenticate and have roles granting their requested operations.
- **B.** Clients can connect without credentials from any network.
- **C.** Every client must use a browser cookie.
- **D.** Every database user automatically becomes an administrator.

**Answer: A.** Access control requires authenticated users whose roles grant the required privileges.

### 7. Why use TLS for a database connection that crosses a network?

- **A.** To protect the connection from being read or altered in transit.
- **B.** To make the user's database role unnecessary.
- **C.** To encrypt every backup automatically.
- **D.** To prevent all application bugs.

**Answer: A.** TLS protects network transport. It does not replace authentication, authorization, or backup encryption.

### 8. Which network configuration is safer for a production database?

- **A.** Keep it private and allow connections only from trusted application and administration networks.
- **B.** Expose port 27017 to the public internet and rely only on a strong password.
- **C.** Bind it to every interface without firewall rules.
- **D.** Allow access from any source address for convenience.

**Answer: A.** Private placement and restrictive network rules reduce who can reach the database.

### 9. What does an IP allowlist provide?

- **A.** An additional network filter that complements authentication.
- **B.** Proof that every client on an allowed IP is trustworthy.
- **C.** A replacement for database roles.
- **D.** A guarantee that no credential can be stolen.

**Answer: A.** Allowed networks still need authenticated users and appropriate permissions.

### 10. Where should a production MongoDB URI be kept?

- **A.** In a deployment secret store or protected runtime configuration.
- **B.** In a public source file so deployments can find it.
- **C.** In every API error response.
- **D.** In a committed example database dump.

**Answer: A.** Secret stores and protected runtime configuration keep credentials out of source control and ordinary logs.

### 11. Why may a reserved character in a MongoDB URI username or password need encoding?

- **A.** URI parsing assigns special meaning to some characters.
- **B.** MongoDB rejects all punctuation in passwords.
- **C.** Encoding turns a user into an administrator.
- **D.** Passwords never appear in connection strings.

**Answer: A.** Percent-encoding reserved characters prevents them from being interpreted as URI separators.

### 12. Which credential rotation sequence is safest for a live service?

- **A.** Provision a replacement, deploy and verify it, then revoke the old credential.
- **B.** Revoke the old credential first and discover which services break.
- **C.** Put both credentials in a public repository.
- **D.** Change the password without updating background jobs.

**Answer: A.** A planned overlap allows dependent services to switch before the old credential is removed.

### 13. Why should an API avoid passing a client-supplied object directly as a MongoDB filter?

- **A.** The client may control unexpected fields or operator-shaped values.
- **B.** MongoDB cannot query documents with objects.
- **C.** It disables indexes.
- **D.** It turns all reads into backups.

**Answer: A.** Validate input and construct filters from a fixed set of allowed fields.

### 14. Does Mongoose validation prove that a user is authorized to update a record?

- **A.** No. Validation checks data rules; authorization checks whether the caller may perform that action.
- **B.** Yes, schema validation grants owner access automatically.
- **C.** Yes, if the record has an ObjectId.
- **D.** No, because validation is never useful.

**Answer: A.** Validate shape and business rules, then separately authorize the specific resource and operation.

### 15. Why is a replica not a complete backup strategy?

- **A.** Replication can copy accidental deletions or malicious writes to the replica.
- **B.** A replica never contains application data.
- **C.** A replica cannot help availability.
- **D.** Replicas automatically meet every recovery objective.

**Answer: A.** Replication may improve availability, but independent retained backups are needed for recovery from bad changes or broader failures.

### 16. What does RPO describe?

- **A.** The maximum acceptable amount of recent data loss, expressed as a time interval.
- **B.** The maximum time allowed to restore service.
- **C.** The database user's role.
- **D.** The number of collections in a dump.

**Answer: A.** RPO helps determine how frequently recovery points must be created.

### 17. What does RTO describe?

- **A.** The maximum acceptable time to restore service after an interruption.
- **B.** The oldest document in a collection.
- **C.** The time needed to authenticate one client.
- **D.** The retention period of every log.

**Answer: A.** RTO guides the restore process, infrastructure, staffing, and rehearsal requirements.

### 18. For which situation are mongodump and mongorestore commonly useful?

- **A.** Smaller deployments, migrations, and portable logical backups.
- **B.** Guaranteed continuous point-in-time recovery for every sharded cluster.
- **C.** Replacing authorization policy.
- **D.** Encrypting all stored data without configuration.

**Answer: A.** These tools are useful for logical dumps, but they are not a universal production backup strategy.

### 19. What is the purpose of an oplog-aware replica-set dump and restore procedure?

- **A.** To capture and replay writes around the dump so the restored data can include them.
- **B.** To grant the application administrator privileges.
- **C.** To replace encryption at rest.
- **D.** To restore only the newest index.

**Answer: A.** When correctly supported and used, oplog capture and replay helps include writes made while a replica-set dump is in progress.

### 20. Which statement about backup protection is correct?

- **A.** Backup archives need access controls, encryption, retention rules, and protected key storage.
- **B.** A backup is harmless to expose because it is not the live database.
- **C.** Every employee should be able to delete backups.
- **D.** An archive should be stored only beside the database files.

**Answer: A.** A backup contains data and can be as sensitive as the live deployment.

## Part 2: Short-answer questions

### 21. Explain the difference between authentication and authorization.

**Answer:** Authentication verifies the identity of a user or service. Authorization determines which database resources and operations that identity may access.

### 22. Why should development and production use separate database credentials?

**Answer:** Separate credentials limit the consequences of a local leak or development mistake, make access review clearer, and allow each environment to rotate credentials independently.

### 23. Why is a database network allowlist not enough by itself?

**Answer:** An allowed host can be compromised or shared. Authentication and least-privilege roles are still needed to identify the client and limit its actions.

### 24. Name three secret-handling mistakes to avoid.

**Answer:** Do not commit a real URI, print credentials in logs or errors, or reuse one broad credential across unrelated environments and services. Use protected runtime configuration and rotate leaked secrets.

### 25. What application checks should happen before a database write?

**Answer:** Validate the request shape and allowed fields, authenticate the caller, authorize that caller for the specific record and action, and construct the database update from trusted fields.

### 26. Why should logs avoid full connection strings and unnecessary document contents?

**Answer:** Logs are often copied to shared systems and retained. Secrets or personal data in them can create a second exposure path and complicate incident response.

### 27. What should an RPO and RTO influence?

**Answer:** They should influence backup frequency and method, retention, restore infrastructure, staffing, automation, and how often recovery is rehearsed.

### 28. Why does a database-directory copy taken while MongoDB is writing risk inconsistency?

**Answer:** A plain multi-file copy is not necessarily an atomic snapshot. Data files may represent different moments unless a coordinated, supported snapshot method is used.

### 29. What should be verified after restoring a backup?

**Answer:** Confirm the target and namespaces, expected collections and document counts, indexes and validators, important records, application configuration, and representative application behavior. Measure recovery time and compare it with the RTO.

### 30. Why should a restore rehearsal use an isolated target?

**Answer:** An isolated target reduces the chance of overwriting live data, exposes missing permissions or configuration safely, and lets the team verify recovery before an incident.

## Part 3: Practical scenarios

### 31. The API connects with an account that has broad administrator privileges. What should change?

**Answer:** Create a dedicated service user scoped to the application's database and required operations, update the protected runtime credential, verify the API works, and revoke the overly broad app credential.

### 32. A developer accidentally committed a production connection URI. Is deleting it in a new commit enough?

**Answer:** No. Treat the credential as exposed: rotate or revoke it, check relevant access logs, remove it from current source where appropriate, and follow the repository's secret-incident process. Past Git history or clones may still contain it.

### 33. MongoDB is reachable publicly, but the team has a long password. What should be done?

**Answer:** Restrict network exposure immediately with private networking and firewall or provider network rules, then verify authentication and TLS settings. A strong password is not a reason to expose the database broadly.

### 34. A report generator only reads from the database. Which access should it receive?

**Answer:** Give it a separate identity with read-only privileges limited to the required database or collections. Do not reuse the app's write credential.

### 35. An API handler uses a request body directly in findOne. What is a safer approach?

**Answer:** Validate the expected input fields and types, create a query object with fixed field names, and authorize access to the result. Reject unexpected fields instead of allowing the client to shape the MongoDB filter.

### 36. A nightly backup succeeds, but the business allows at most five minutes of data loss. What should be reviewed?

**Answer:** The nightly schedule misses the stated RPO. Select and configure a backup or point-in-time recovery method that can provide recovery points within the five-minute window, then verify the promised window with restore rehearsals.

### 37. A team has a valid archive but has never restored it. Can it claim the system meets its RTO?

**Answer:** Not yet. Perform a timed restore to a suitable isolated environment, verify the application and data, record the elapsed time, and compare it with the RTO.

### 38. An operator wants to restore a dump directly over production to check whether it works. What should be done?

**Answer:** Restore it to a separate, isolated deployment or namespace first. Verify the contents and application behavior there. A restore that overwrites production can destroy newer data and is not a safe rehearsal.

### 39. A backup archive is encrypted, but the encryption key is stored beside it with the same broad access policy. What is the weakness?

**Answer:** Anyone who obtains both can decrypt the backup. Restrict and separate key access from archive access, and define key rotation and recovery procedures.

### 40. A replica quickly reflects a mistaken delete. What recovery protection was missing?

**Answer:** An independent backup or recovery point that can restore data from before the deletion. Replication supports availability but also propagates writes, including harmful ones.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [034 - Seed data, migrations, and database lifecycle](../lessons/034-seed-data-migrations-and-database-lifecycle.md) | [Lesson](../lessons/035-mongodb-security-backup-and-restore.md) | [Example](../examples/035-mongodb-security-backup-and-restore.md) | [036 - REST API design and resource modeling](../lessons/036-rest-api-design-and-resource-modeling.md) |
