# 035 - MongoDB security, backup, and restore — complete example

This practice walkthrough creates a small local MongoDB dataset, saves a compressed logical backup, restores it into a new database name, and verifies the restored records and indexes. The restore target gets a timestamped name so the procedure does not overwrite the source or collide with an earlier rehearsal. This repository documents the commands and does not run them.

## Question

How can you rehearse a MongoDB backup and restore while keeping the source data untouched?

## What this example demonstrates

- Using a disposable local MongoDB instance and a clearly named practice database.
- Preparing repeatable sample records with upserts.
- Creating a compressed archive with mongodump.
- Remapping the dumped namespace to a separate restore database with mongorestore.
- Checking the restored document count, a known record, and its indexes.
- Keeping the archive outside the repository and avoiding destructive restore options.

## Prerequisites

1. Use a **disposable local MongoDB instance** that you control and that listens only on 127.0.0.1:27017. Do not point this exercise at production or a local instance containing important data.
2. Install and make available in PowerShell: mongosh, mongodump, and mongorestore.
3. Start the local MongoDB server. This example uses a local URI without credentials only for an isolated practice instance.
4. Run the database setup commands in the next section using mongosh.

If your local database requires authentication, do not paste credentials into this sample or commit them. Use a protected, deployment-appropriate secret/configuration method for the database tools. Production connections should use the deployment's network restrictions and TLS configuration.

## 1. Create repeatable practice data

Open mongosh against the local practice instance and enter:

~~~javascript
use mern_security_practice

db.accounts.updateOne(
  { _id: "acct-001" },
  {
    $set: {
      email: "ada@example.test",
      status: "active",
      balanceCents: 1250
    }
  },
  { upsert: true }
)

db.accounts.updateOne(
  { _id: "acct-002" },
  {
    $set: {
      email: "grace@example.test",
      status: "active",
      balanceCents: 4800
    }
  },
  { upsert: true }
)

db.accounts.createIndex({ email: 1 }, { unique: true })

db.accounts.countDocuments()
db.accounts.getIndexes()
~~~

The count should be 2. The email index should be unique. The upserts make setup repeatable without inserting another copy of either fixed practice record.

## 2. Create the compressed backup

Run these commands in PowerShell. The archive is placed in the current Windows user's temporary directory, outside the Git working tree.

~~~powershell
$ErrorActionPreference = "Stop"

$mongoUri = "mongodb://127.0.0.1:27017"
$sourceDb = "mern_security_practice"
$backupDir = Join-Path $env:TEMP "mern-security-practice"
$archivePath = Join-Path $backupDir "practice.archive.gz"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

mongodump --uri $mongoUri --db $sourceDb --archive $archivePath --gzip

if ($LASTEXITCODE -ne 0) {
  throw "mongodump failed; do not treat this backup as successful."
}

$archive = Get-Item -LiteralPath $archivePath
if ($archive.Length -le 0) {
  throw "The backup archive is empty."
}

Write-Output "Backup archive created: $($archive.FullName)"
Write-Output "Archive bytes: $($archive.Length)"
~~~

A successful process exit and non-empty file are useful initial checks. They do not prove that the archive can be restored or that the recovered application will work.

## 3. Restore into a separate database

Continue in the same PowerShell session. This creates a unique restore database name for each rehearsal and maps only the practice source namespace into it.

~~~powershell
$restoreDb = "mern_security_restore_check_$(Get-Date -Format 'yyyyMMddHHmmss')"

mongorestore --uri $mongoUri --archive $archivePath --gzip --nsInclude "$sourceDb.*" --nsFrom "$sourceDb.*" --nsTo "$restoreDb.*"

if ($LASTEXITCODE -ne 0) {
  throw "mongorestore failed; inspect the target before continuing."
}

Write-Output "Restore target: $restoreDb"
~~~

The source database remains named mern_security_practice. No --drop option is used. The destination has a new timestamped name, so a previous restore rehearsal is not overwritten.

## 4. Verify the restored data

Use mongosh to inspect the new database:

~~~powershell
$restoreUri = "$mongoUri/$restoreDb"

mongosh $restoreUri --quiet --eval '
  const accountCount = db.accounts.countDocuments();
  const firstAccount = db.accounts.findOne({ _id: "acct-001" });
  const indexNames = db.accounts.getIndexes().map((index) => index.name);

  printjson({
    accountCount,
    firstAccount,
    indexNames
  });
'
~~~

Expected result, with formatting and shell output depending on tool versions:

~~~text
{
  accountCount: 2,
  firstAccount: {
    _id: 'acct-001',
    email: 'ada@example.test',
    status: 'active',
    balanceCents: 1250
  },
  indexNames: [ '_id_', 'email_1' ]
}
~~~

If the count is not 2, the expected record is missing, or the email index is absent, stop and investigate the dump scope and restore output. Do not report the recovery procedure as verified until the discrepancy is understood.

## How it works

1. The setup uses a dedicated database name and fixed document IDs. Rerunning its upserts updates the same practice records.
2. mongodump writes one gzip-compressed archive for the selected practice database.
3. PowerShell checks the command exit code and verifies that the archive exists and has nonzero size.
4. mongorestore reads only namespaces matching the practice database and remaps them to a new timestamped database.
5. The verification query checks a document count, known record, and restored index names.
6. Neither the original database nor a previous restore target is dropped.

## Security and operational notes

- This is a local learning exercise, not a production backup schedule or disaster-recovery plan.
- Never substitute a production URI into these commands. A command-line URI containing credentials can be exposed through shell history, process inspection, or logs.
- Keep real backup archives out of Git. A temporary directory is convenient for practice but is not a durable or protected production backup location.
- Production backups need appropriate encryption, access controls, off-host storage, retention, monitoring, and a tested key-recovery process.
- Use separate least-privilege identities for the application, backup job, and restore operation. The required privileges depend on the deployment and backup options.
- A logical dump is suitable for learning and smaller deployments. Confirm that the selected backup method, consistency guarantees, and restore path meet the deployment's RPO and RTO.
- For replica sets and sharded clusters, use a supported coordinated backup and restore procedure rather than assuming this single-database walkthrough covers the whole deployment.
- After a rehearsal, retain or clean up only the named practice databases after confirming the target. Do not add a broad drop command to an operational script.
- A verified archive is not the same as a verified application recovery. Test representative application reads and writes against the restored copy and record the elapsed recovery time.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [034 - Seed data, migrations, and database lifecycle](../lessons/034-seed-data-migrations-and-database-lifecycle.md) | [Q&A](../qnas/035-mongodb-security-backup-and-restore.md) | [035 - MongoDB security, backup, and restore](../lessons/035-mongodb-security-backup-and-restore.md) |
