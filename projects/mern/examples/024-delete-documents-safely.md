# 024 - Delete documents safely: Complete example

This standalone Node.js script inserts five practice tasks into a fresh batch. It then deletes one completed task, removes the highest-priority queued task while returning its document, and deletes an eligible archived task after previewing the count.

The example is documentation; this repository does not execute it. Use a practice database. Every run has a new batch marker, so it only operates on its own records. It deletes three of the five records it creates and leaves two.

## What this example demonstrates

- Scoping every delete by both batch and owner.
- Deleting one matching record with `deleteOne()`.
- Choosing a record with a sort using `findOneAndDelete()`.
- Previewing a cleanup and checking `deletedCount`.
- Understanding that a preview and a later delete are separate operations.
- Keeping repeated runs isolated with a unique batch marker.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\delete-documents-safely.js
~~~

Save the script below as `delete-documents-safely.js`. It writes to the `mern_delete_demo` database and the `tasks` collection.

## Complete code

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

function requireScopedFilter(filter) {
  if (!filter.batchId || !filter.ownerId) {
    throw new Error("Every demo delete must include batchId and ownerId.");
  }

  return filter;
}

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_delete_demo");
    const tasks = db.collection("tasks");
    const batchId = new ObjectId();
    const ownerId = "learner-024-demo";

    const demoTasks = [
      {
        batchId,
        ownerId,
        taskId: "task-1",
        title: "Clean up notes",
        status: "completed",
        createdAt: new Date("2026-04-01T09:00:00.000Z")
      },
      {
        batchId,
        ownerId,
        taskId: "task-2",
        title: "Review quiz",
        status: "completed",
        createdAt: new Date("2026-04-02T09:00:00.000Z")
      },
      {
        batchId,
        ownerId,
        taskId: "task-3",
        title: "Temporary draft",
        status: "archived",
        archivedAt: new Date("2026-03-01T09:00:00.000Z")
      },
      {
        batchId,
        ownerId,
        taskId: "task-4",
        title: "Queued import",
        status: "queued",
        priority: 1,
        createdAt: new Date("2026-04-03T09:00:00.000Z")
      },
      {
        batchId,
        ownerId,
        taskId: "task-5",
        title: "Urgent export",
        status: "queued",
        priority: 5,
        createdAt: new Date("2026-04-04T09:00:00.000Z")
      }
    ];

    const insertResult = await tasks.insertMany(demoTasks);
    console.log("Inserted tasks: " + insertResult.insertedCount);

    // Delete exactly the completed task identified by this batch and owner.
    const singleDelete = await tasks.deleteOne(
      requireScopedFilter({
        batchId,
        ownerId,
        taskId: "task-1",
        status: "completed"
      })
    );

    console.log("Single delete: " + singleDelete.deletedCount);

    // Select the highest-priority queued task and return the deleted document.
    const removedJob = await tasks.findOneAndDelete(
      requireScopedFilter({
        batchId,
        ownerId,
        status: "queued"
      }),
      {
        sort: {
          priority: -1,
          createdAt: 1,
          taskId: 1
        },
        projection: {
          _id: 0,
          title: 1,
          priority: 1
        }
      }
    );

    if (removedJob === null) {
      console.log("No queued task matched.");
    } else {
      console.log("Next queued task removed: " + removedJob.title);
    }

    // Preview and delete with the same scoped eligibility filter.
    const cutoff = new Date("2026-05-01T00:00:00.000Z");
    const archivedFilter = requireScopedFilter({
      batchId,
      ownerId,
      status: "archived",
      archivedAt: { $lt: cutoff }
    });

    const previewCount = await tasks.countDocuments(archivedFilter);
    console.log("Archived tasks matching cleanup: " + previewCount);

    const archivedDelete = await tasks.deleteMany(archivedFilter);
    console.log("Archived tasks deleted: " + archivedDelete.deletedCount);

    const remainingCount = await tasks.countDocuments({
      batchId,
      ownerId
    });
    console.log("Tasks left in this batch: " + remainingCount);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
~~~

## Expected output

The connection details and random batch ID are not printed:

~~~text
Inserted tasks: 5
Single delete: 1
Next queued task removed: Urgent export
Archived tasks matching cleanup: 1
Archived tasks deleted: 1
Tasks left in this batch: 2
~~~

## How the code works

### 1. Isolate the demonstration data

A fresh `ObjectId` is created for `batchId`. All five inserted tasks have that marker and the same demo `ownerId`. Every delete includes both values, so it cannot target tasks from earlier runs or another owner.

The helper rejects delete filters missing either scope field. In a real application, also authenticate the user, derive tenant and owner IDs from trusted server-side context, and validate the operation’s authorization.

### 2. Delete one completed task

`deleteOne()` receives the exact batch, owner, task ID, and completed status. It returns a delete result; `deletedCount` is one when a record was removed and zero when no document satisfies the full filter.

### 3. Choose and return one queued task

`findOneAndDelete()` matches queued tasks in the current batch and sorts by descending priority, then creation time and task ID. The highest-priority task, “Urgent export,” is removed and returned. The projection limits the returned fields.

A unique identity filter is preferable when the operation targets a known task. This example uses a sorted operation because its purpose is to demonstrate a queue rule that chooses one item among several matches.

### 4. Preview and run an archived cleanup

The same `archivedFilter` is used first with `countDocuments()` and then with `deleteMany()`. This makes the preview and delete scopes consistent in the code.

The count is still only a snapshot from its own operation. Another request could change which documents match before the delete runs. Do not treat the preview as a lock or an exact promise about the later count.

### 5. Verify what remains

The final count includes only tasks in the current batch and owner scope. Three tasks were deleted: the completed task, the highest-priority queued task, and the archived task. The other completed task and the lower-priority queued task remain.

Each run leaves those two records in the practice database. The script does not delete data from prior runs.

## Variations to try

1. Change `task-1` to an unknown task ID and observe a zero delete count.
2. Change the queued sort to ascending priority and compare which task is removed.
3. Add a second archived task before the cleanup and compare preview and delete counts.
4. Add a required tenant key to the helper and all task records.
5. Remove the `status` condition from the single delete and consider what wider set it could match.
6. Change the preview filter, then ensure the delete filter changes with it.
7. Replace the hard delete with a `$set` update that adds `deletedAt` and consider how reads must change.
8. Add a related collection and decide whether cleanup needs a transaction or an asynchronous workflow.

## Common issues

- **The delete count is zero:** confirm every identity, owner, state, and batch condition.
- **An empty filter slips through:** reject missing scope parameters before calling the driver.
- **The wrong matching record is selected:** use a unique identity or an explicit sort with a deterministic tie-breaker.
- **The preview and delete counts differ:** another operation may have changed the data between commands.
- **A related document remains:** define relationship cleanup explicitly; MongoDB does not infer a cascade.
- **A task is still stored after soft deletion:** soft deletion changes application state, it does not remove the record.
- **Old demo batches appear in reads:** include the current `batchId` in every demonstration query.
- **The connection fails:** set `MONGODB_URI` in the same terminal session and confirm it targets the practice deployment.

## Key takeaways

- Build delete filters from trusted, validated identity and scope values.
- `deleteOne()` removes one match; `deleteMany()` removes all matches.
- An empty filter can match every record, so reject missing scope instead of broadening a delete.
- Use `findOneAndDelete()` when a sorted selection or the removed document is needed.
- Check `deletedCount` and handle no-match outcomes.
- A count-before-delete is a preview, not a lock or guarantee.
- Each run creates five demo tasks, removes three of them, and leaves two in the practice database.

## Related chapter files

- [Lesson 024 - Delete documents safely](../lessons/024-delete-documents-safely.md)
- [Q&A 024 - Delete documents safely](../qnas/024-delete-documents-safely.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [023 - Update, replace, and upsert documents](../lessons/023-update-replace-and-upsert-documents.md) | [Lesson](../lessons/024-delete-documents-safely.md) | [Q&A](../qnas/024-delete-documents-safely.md) | Example | [025 - Schema design: embedding versus referencing](../lessons/025-schema-design-embedding-versus-referencing.md) |
