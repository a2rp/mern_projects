# 034 - Seed data, migrations, and database lifecycle — complete example

This standalone Node.js job seeds one stable practice record and migrates a legacy authorName field into a current authorName field. It uses a migration ledger, a filter that makes the backfill safe to resume, and a finally block that closes the database connection. The script does not drop collections or databases. This repository documents the code and does not run it.

## What this example demonstrates

- Using a dedicated, fixed practice database name.
- Seeding a deterministic record with an upsert and setOnInsert.
- Recording one applied migration with a stable identifier.
- Backfilling only records that still need the new field.
- Making the migration safe to resume after partial progress.
- Skipping a migration that already has a ledger record.
- Closing a one-off script's database connection in a finally block.
- Reporting failure with a nonzero process exit code.

## Prerequisites

1. Use a supported Node.js release and an ES module project. If needed, set "type": "module" in package.json.
2. Install Mongoose:

~~~powershell
npm install mongoose
~~~

3. Set MONGODB_URI in the same PowerShell session where you run the script. The script explicitly selects the mern_seed_migration_demo practice database:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\seed-and-migrate-demo.js
~~~

Use a database account with permissions appropriate for this practice database. Do not use a production URI for a learning example.

## Complete code

Save this as seed-and-migrate-demo.js:

~~~javascript
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const databaseName = "mern_seed_migration_demo";
const migrationId = "2026-11-22-add-author-name-v1";

const postSchema = new mongoose.Schema(
  {
    _id: String,
    title: {
      type: String,
      required: true,
      trim: true
    },
    legacyAuthorName: String,
    authorName: {
      type: String,
      trim: true,
      minLength: 1
    }
  },
  {
    collection: "posts",
    versionKey: false
  }
);

const migrationSchema = new mongoose.Schema(
  {
    _id: String,
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "schema_migrations",
    versionKey: false
  }
);

const Post = mongoose.model("MigrationDemoPost", postSchema);
const Migration = mongoose.model("MigrationDemoRecord", migrationSchema);

async function ensureSeedRecord() {
  await Post.updateOne(
    { _id: "seed-post-001" },
    {
      $setOnInsert: {
        title: "Migration demo post",
        legacyAuthorName: "Ada Lovelace"
      }
    },
    { upsert: true }
  );

  console.log("Seed record ensured.");
}

function normalizeAuthorName(value) {
  return value.trim().replace(/\s+/g, " ");
}

async function applyAuthorNameMigration() {
  const existingMigration = await Migration.findById(migrationId).lean();

  if (existingMigration) {
    console.log("Migration already applied: " + migrationId);
    return;
  }

  let updatedCount = 0;

  const cursor = Post.find({
    authorName: { $exists: false },
    legacyAuthorName: { $type: "string" }
  })
    .select("_id legacyAuthorName")
    .lean()
    .cursor();

  for await (const post of cursor) {
    const authorName = normalizeAuthorName(post.legacyAuthorName);

    if (!authorName) {
      throw new Error(
        "Post " + post._id + " has an empty legacy author name."
      );
    }

    const result = await Post.updateOne(
      {
        _id: post._id,
        authorName: { $exists: false }
      },
      {
        $set: { authorName }
      },
      { runValidators: true }
    );

    updatedCount += result.modifiedCount;
  }

  // Record completion only after the backfill has finished successfully.
  await Migration.create({ _id: migrationId });

  console.log(
    "Migration applied; posts updated: " + updatedCount
  );
}

async function main() {
  let connected = false;

  try {
    await mongoose.connect(uri, { dbName: databaseName });
    connected = true;

    console.log("Connected to practice database: " + databaseName);

    await ensureSeedRecord();
    await applyAuthorNameMigration();

    const migratedPost = await Post.findById("seed-post-001")
      .select("title authorName")
      .lean();

    if (!migratedPost || !migratedPost.authorName) {
      throw new Error("The practice post has no migrated authorName.");
    }

    console.log("Migrated author: " + migratedPost.authorName);
  } finally {
    if (connected) {
      await mongoose.disconnect();
      console.log("Disconnected cleanly.");
    }
  }
}

main().catch((error) => {
  console.error("Database job failed: " + error.message);
  process.exitCode = 1;
});
~~~

## Expected output on the first run

~~~text
Connected to practice database: mern_seed_migration_demo
Seed record ensured.
Migration applied; posts updated: 1
Migrated author: Ada Lovelace
Disconnected cleanly.
~~~

## Expected output on later runs

~~~text
Connected to practice database: mern_seed_migration_demo
Seed record ensured.
Migration already applied: 2026-11-22-add-author-name-v1
Migrated author: Ada Lovelace
Disconnected cleanly.
~~~

The same seed key is used on every run, so the seed does not create duplicate copies. The migration ledger prevents completed work from running again. If the job fails before it writes the ledger record, its filter selects only posts that still lack authorName, so a later run can continue the backfill.

## How it works

1. The script requires a URI from the environment and overrides the URI's database name with a dedicated practice database.
2. The seed operation uses a fixed document ID. Its setOnInsert update adds initial values only if the document does not already exist.
3. The migration looks for its stable ID in the schema_migrations collection. If the ID exists, it skips the transformation.
4. If the migration is pending, a cursor streams only posts with a string legacyAuthorName and no authorName.
5. The transformation trims the legacy name and collapses repeated whitespace. Each update checks again that authorName is still missing and enables schema validators.
6. The migration ledger entry is created only after the loop finishes. If an earlier update fails, the job exits without marking the migration complete.
7. The final read verifies the seeded record has the migrated value.
8. The finally block disconnects after successful work or after a failure that occurred once connected. The top-level error handler sets a failing process exit code.

## Safety and operational notes

- Run a production migration as one controlled release job. Do not start this example concurrently from every application replica.
- The migration updates only the dedicated practice database selected in the script. It does not drop any database or collection.
- This job is sequential for clarity. For a large collection, add bounded batching, progress reporting, rate control, and monitoring before using a similar migration operationally.
- A real migration must be tested against representative old and new documents and be compatible with the application rollout plan.
- A database migration ledger does not replace a backup or a recovery rehearsal.
- Remove the practice database manually when you are finished reviewing it.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [033 - Mongoose validation, hooks, and virtuals](../lessons/033-mongoose-validation-hooks-and-virtuals.md) | [Q&A](../qnas/034-seed-data-migrations-and-database-lifecycle.md) | [035 - MongoDB security, backup, and restore](../lessons/035-mongodb-security-backup-and-restore.md) |
