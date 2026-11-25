# 035 - MongoDB security, backup, and restore

A MERN application stores important data in MongoDB, so database access and recovery need deliberate safeguards. This chapter introduces practical security layers, backup choices, and a restore workflow that you can rehearse before an incident.

The examples are operational guidance. Practice commands against a local or disposable database first. Do not paste production credentials into a lesson, terminal transcript, or Git repository.

## Learning goals

By the end of this chapter, you should be able to:

- Explain authentication, authorization, least privilege, and network controls.
- Give an application and a backup job separate database identities.
- Keep connection credentials out of source code and logs.
- Reduce injection risks by validating input and constructing query objects deliberately.
- Choose a backup approach using recovery point objective (RPO) and recovery time objective (RTO).
- Back up data, protect the backup, and restore it to an isolated target.
- Verify a restored database and rehearse recovery without overwriting the source.

## Protect the whole path

A database security plan covers more than a password. Consider the browser, API server, database, deployment platform, network, operators, and backup storage. A weakness at any boundary can expose data.

A useful set of security goals is:

- **Confidentiality:** only authorized users and services can read protected data.
- **Integrity:** unauthorized or invalid changes are prevented or detected.
- **Availability:** the application and data can recover from failures and attacks.

Use multiple controls together. Authentication does not compensate for an open network, and an encrypted backup does not compensate for credentials that are committed to Git.

## Authentication and authorization

**Authentication** answers “who is connecting?” **Authorization** answers “what may that identity do?” MongoDB access control uses users and roles. A successfully authenticated account still needs only the roles required for its job.

Create distinct identities for distinct responsibilities, such as:

- An application user scoped to the application's database.
- A read-only reporting user, if reporting needs independent access.
- A backup or restore identity with only the privileges needed by its backup procedure.
- Human administrator accounts that are not used by application processes.

Do not run an application using a root, cluster administrator, or broad all-databases account. If an application credential is stolen, its role should limit the damage to the smallest practical database and set of operations.

An illustrative self-managed shell setup for a dedicated application database:

~~~javascript
use mern_app

db.createUser({
  user: "mern_app_service",
  pwd: passwordPrompt(),
  roles: [
    { role: "readWrite", db: "mern_app" }
  ]
})
~~~

Run administrative user-creation commands only through a trusted administrative connection. Use your deployment's supported authentication method. For a managed database, create the database user in its control plane and follow its network access rules. Do not assume a local development setup has production-safe access control.

MongoDB connection strings contain credentials. Reserved characters in a username or password must be percent-encoded in a URI. Prefer a secret manager or deployment-provided secret variable, and avoid printing the full URI when diagnosing a connection.

## Network and transport controls

- Keep MongoDB on a private network where possible.
- Restrict inbound access with firewall rules, security groups, or the managed service's network allowlist.
- Permit connections only from known application and administration networks.
- Do not expose port 27017 directly to the public internet.
- Use TLS for connections across networks, especially outside a trusted private boundary.
- For replica sets and sharded deployments, configure internal member authentication as well as client authentication.
- Keep the database server, drivers, and tools patched on a planned schedule.

A network allowlist is an additional layer, not a substitute for authentication. An IP address can change, be shared, or belong to a compromised host.

## Keep secrets out of code and logs

Load connection credentials from the runtime environment or a secret manager. Keep local environment files out of version control, and use separate credentials for development, staging, and production.

~~~text
MONGODB_URI=<secret supplied by the environment>
~~~

Never commit a real URI, password, private key, or backup encryption key. Avoid logging connection strings, authorization headers, cookies, reset tokens, or full documents containing personal data. When reporting a database error, return a safe public message and keep detailed diagnostics in access-controlled logs.

Rotate a credential using a planned overlap: create or update the replacement credential, deploy the application with it, verify new connections, and then revoke the old credential. Confirm that background jobs and rollback plans will not unexpectedly depend on the revoked value.

## Protect the application layer

Database roles limit what a compromised service can do, but application code must still validate requests and authorize each operation.

- Validate request shape, field types, lengths, and allowed values at the API boundary.
- Build filters from explicitly allowed fields rather than passing a client-supplied object directly to MongoDB.
- Allowlist update fields. Do not spread an arbitrary request body into a database update.
- Check that the signed-in user may access the specific record being requested; knowing an identifier is not authorization.
- Keep database schema validation and Mongoose validation, but do not treat either as a substitute for access control.
- Return only fields the caller is allowed to see.
- Avoid unsafe query construction and review user-controlled values that could be interpreted as MongoDB operators.

For example, this is risky because the client controls the shape of the filter:

~~~javascript
const user = await User.findOne(req.body);
~~~

Instead, validate and select the intended field:

~~~javascript
const email = validateEmail(req.body.email);
const user = await User.findOne({ email }).select("_id email displayName");
~~~

The validation function here represents application code that rejects malformed input before the query. The database query itself uses a fixed field name. Apply authorization after lookup, and do not assume that a valid email makes the requested action permissible.

## Sensitive data and auditability

Collect only the personal data the application needs. Restrict access to production data, separate duties where practical, and define how long data and backups are retained. Encrypt network connections and backup storage. For sensitive fields, consider whether application-side field encryption is appropriate and plan key storage and rotation separately from database backups.

Keep security-relevant events and backup job outcomes observable. Logs should help operators identify failed authentication, unexpected access, backup failures, and restore activity without copying secrets or unnecessary personal data into the log stream. Restrict who can read logs and backup archives.

## Plan recovery before choosing a backup

A backup strategy starts with two targets:

- **RPO (recovery point objective):** the maximum acceptable amount of recent data that could be lost.
- **RTO (recovery time objective):** the maximum acceptable time to restore service.

A nightly backup may satisfy an RPO of one day but cannot satisfy a five-minute RPO. A backup stored on the same host may be unavailable after a host failure. Write the targets down, choose a method that can meet them, and rehearse it.

Common choices include:

- **Managed snapshots and point-in-time recovery:** useful for production deployments that need frequent recovery points and operational support. Confirm retention, region or account separation, restore permissions, and the exact recovery window offered by the provider.
- **Filesystem or block-storage snapshots:** can be fast when coordinated with the MongoDB deployment and storage system. A casual copy of a live data directory is not automatically a consistent backup.
- **mongodump and mongorestore:** convenient for smaller deployments, migrations, and portable logical backups. These tools are not a complete point-in-time recovery system and may be unsuitable as the sole high-scale production strategy.
- **Replicas:** improve availability, but a replica can also reproduce accidental deletion or malicious changes. Replication is not a backup.

For replica sets, oplog-aware procedures can capture writes during a dump and replay them during a restore. Sharded clusters require a coordinated strategy across shards and configuration metadata; do not treat one shard's dump as a complete cluster backup.

## Protect backup copies

A backup is another copy of the data and needs its own security controls:

- Encrypt it in transit and at rest.
- Store it separately from the database host and, when possible, in a separate failure or access boundary.
- Restrict backup read, delete, and restore permissions.
- Keep encryption keys separate from the encrypted archive.
- Set retention and deletion rules that match recovery, privacy, and business requirements.
- Monitor job success, archive size, available storage, and the age of the latest verified recovery point.
- Protect against an attacker who can delete both the live database and its backups.

The backup identity should not receive general application write privileges. The restore identity may need additional permissions, so use it only for a controlled restore process and protect its credentials accordingly.

## Restore and verify safely

A restore procedure should identify the source backup, target deployment, expected database namespace, required tool versions, credentials, and verification steps. Restore into an isolated environment first whenever possible.

A reliable rehearsal follows this order:

1. Select a known backup and confirm its integrity and metadata.
2. Prepare a separate target with enough disk space and a compatible MongoDB version.
3. Restrict access to the target while the restore runs.
4. Restore without targeting or dropping the source database.
5. Check expected databases, collections, document counts, indexes, validators, and important records.
6. Run application-level checks against the restored copy, including representative reads and writes where safe.
7. Record elapsed recovery time and compare data loss and recovery time with the RPO and RTO.
8. Document any manual steps, permission issues, or missing configuration.
9. Keep the original backup until the restored copy has been accepted and the retention policy allows deletion.

A successful command exit is not enough. A restore can complete while the wrong namespace, stale data, missing index, or unavailable application secret makes the recovered service unusable. Backup and restore rehearsals should be repeated after meaningful infrastructure or version changes.

## Common mistakes

- Using one powerful account for the app, developers, backups, and administration.
- Treating a private IP allowlist as authentication.
- Storing a production URI in source code, a sample file, or command output.
- Assuming a Mongoose schema validates authorization or every possible database writer.
- Backing up to the same machine and treating that as disaster recovery.
- Assuming a replica protects against operator mistakes.
- Copying a live data directory without a coordinated consistent-snapshot method.
- Keeping backup archives indefinitely or leaving them readable by every operator.
- Running a restore against production before testing the procedure on an isolated target.
- Calling a backup verified without restoring it and checking application behavior.

## Practical checklist

Before launch or a production data change:

- Enable authentication and access control.
- Assign each service and operator a distinct identity with least privilege.
- Restrict database network access and enable TLS where required.
- Load secrets from a controlled runtime source and keep them out of Git and logs.
- Validate inputs, allowlist query and update fields, and authorize record access.
- Define RPO, RTO, backup scope, retention, encryption, and ownership.
- Store protected copies outside the database host's failure boundary.
- Alert on failed or stale backups.
- Restore a copy into an isolated target and verify data plus application behavior.
- Record the restore steps and repeat the rehearsal periodically.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [034 - Seed data, migrations, and database lifecycle](034-seed-data-migrations-and-database-lifecycle.md) | [Q&A](../qnas/035-mongodb-security-backup-and-restore.md) | [Example](../examples/035-mongodb-security-backup-and-restore.md) | [036 - REST API design and resource modeling](036-rest-api-design-and-resource-modeling.md) |
