# 020 - Create and read MongoDB documents: Complete example

This example inserts a small batch of course documents, reads one inserted document by its generated ID, then reads the run's documents through a cursor. It is a standalone Node.js script you can copy into a local Node project and run with a configured MongoDB deployment.

## What this example demonstrates

- Selecting a database and collection with the Node.js driver.
- Adding a unique run marker to each document.
- Inserting a bounded batch with `insertMany()`.
- Reading one inserted document with `findOne()`.
- Reading a set of documents with `find()` and asynchronous cursor iteration.
- Using projections to return only the fields needed.
- Closing the MongoDB client after the script finishes.

Each execution generates a new `batchId`, so rerunning the script does not collide with earlier generated document IDs. Each run leaves three demo records in the database. Use a practice database and remove records only through a deliberate cleanup operation if you want to keep it tidy.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If the project does not already use ESM, add `"type": "module"` to its `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` to a URI for a MongoDB deployment that you are allowed to use. Keep credentials out of the script and source control.

In PowerShell, set the variable for the current terminal session:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\create-and-read-documents.js
~~~

Save the JavaScript below as `create-and-read-documents.js` in the Node.js project.

## Complete code

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Set the MONGODB_URI environment variable before running this script.");
}

const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_learning_demo");
    const courses = db.collection("courses");

    // Give this run a unique marker so its records can be read as a group.
    const batchId = new ObjectId();

    const documents = [
      {
        batchId,
        title: "MongoDB fundamentals",
        level: "beginner",
        published: true,
        createdAt: new Date()
      },
      {
        batchId,
        title: "Express request handling",
        level: "intermediate",
        published: true,
        createdAt: new Date()
      },
      {
        batchId,
        title: "React data fetching",
        level: "intermediate",
        published: false,
        createdAt: new Date()
      }
    ];

    // Insert this finite batch and inspect the generated identifiers.
    const insertResult = await courses.insertMany(documents);

    console.log("Inserted document count:", insertResult.insertedCount);
    console.log("Inserted IDs:", insertResult.insertedIds);

    // Read back exactly the first document using the ObjectId from the result.
    const firstCourse = await courses.findOne(
      { _id: insertResult.insertedIds[0] },
      {
        projection: {
          _id: 1,
          title: 1,
          level: 1,
          published: 1
        }
      }
    );

    if (firstCourse === null) {
      console.log("The first inserted course was not found.");
    } else {
      console.log("First inserted course:", firstCourse);
    }

    // find() returns a cursor. Iterate it instead of materializing every match.
    const cursor = courses
      .find(
        { batchId },
        {
          projection: {
            _id: 0,
            title: 1,
            level: 1,
            published: 1
          }
        }
      )
      .sort({ title: 1 });

    console.log("Courses from this run:");

    for await (const course of cursor) {
      console.log(
        "- " + course.title + " (" + course.level + "; published: " + course.published + ")"
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("The MongoDB example failed:", error.message);
  process.exitCode = 1;
});
~~~

## How it works

### 1. Read the connection URI from the environment

The script reads `process.env.MONGODB_URI` rather than embedding a credential-bearing connection string in the file. It stops early if the variable is missing. Do not paste real credentials into a committed example or log the full URI.

### 2. Connect and select a practice database

`client.connect()` establishes the connection before the database operations begin. `client.db("mern_learning_demo")` selects the database handle, and `db.collection("courses")` selects the collection handle. MongoDB creates the database and collection on the first write if they do not already exist.

Use a database that is safe for practice. This example writes records and does not delete or modify existing ones.

### 3. Create a unique batch marker

`new ObjectId()` creates a fresh marker for this execution. The same marker is stored on each document in the batch. This lets the script query only records from this run even if the collection contains records from earlier runs.

### 4. Insert and inspect results

`insertMany(documents)` inserts the three-document batch. `insertedCount` reports the number inserted, while `insertedIds` contains generated IDs indexed by their input positions. The first ID is used in the subsequent single-document lookup.

### 5. Read a single document

`findOne()` receives the first generated ID and a projection. Its result is either a document or `null`. The explicit check handles the missing-result case before the script logs the document.

### 6. Read the batch through a cursor

`find({ batchId })` returns a cursor, not an array. The projection returns only the title, level, and published state. The cursor is sorted by title, then consumed with `for await...of`. This does not require collecting every matching document into one array.

### 7. Close the client

The `finally` block closes the MongoDB client after the work completes or an operation throws. The outer error handler reports a concise error and sets a nonzero process exit code.

## Expected output

The actual ObjectId values and timestamps change on each run. The general output shape is:

~~~text
Inserted document count: 3
Inserted IDs: {
  '0': new ObjectId('...'),
  '1': new ObjectId('...'),
  '2': new ObjectId('...')
}
First inserted course: {
  _id: new ObjectId('...'),
  title: 'MongoDB fundamentals',
  level: 'beginner',
  published: true
}
Courses from this run:
- Express request handling (intermediate; published: true)
- MongoDB fundamentals (beginner; published: true)
- React data fetching (intermediate; published: false)
~~~

The exact object formatting can vary by Node.js driver version. The three course lines are sorted by title. If the script cannot connect or an operation fails, it prints an error instead of the successful output.

## Variations to try

1. Add a fourth course to the documents array and check the inserted count.
2. Change a document's `published` value and observe it in the cursor output.
3. Change the projection to include `createdAt`.
4. Add a `limit(2)` to the cursor chain and check that no more than two documents are printed.
5. Replace the batch query with `{ batchId, published: true }` and compare the results.
6. Use a separate practice collection to keep the demo records apart from other learning data.

Do not remove records with an unrestricted delete. If you decide to clean up this demo data, target only the exact `batchId` created by the run and deliberately verify the filter before running a delete operation in your own environment.

## Common issues

- **Missing URI:** set `MONGODB_URI` in the same terminal session where you run Node.
- **Authentication or network error:** confirm the URI, deployment availability, network access, and database user's permissions.
- **ES module import error:** ensure the project is configured for ESM or adapt the imports to the project's module system.
- **Duplicate data after reruns:** each run intentionally adds three new documents. The unique batch marker keeps each run's read separate; it does not automatically clean earlier records.
- **Unexpectedly empty read:** make sure the same `batchId` value is present in the inserted documents and the cursor filter.
- **String/ObjectId mismatch:** the filter uses the actual ObjectId value. A hexadecimal string with the same printed characters is a different BSON type.

## Key takeaways

- Insert results provide the identifiers needed to refer to newly created documents.
- A unique run marker makes a repeatable demonstration easy to query.
- `findOne()` reads one document or returns `null`.
- `find()` creates a cursor that can be consumed asynchronously.
- Projections select the fields an operation needs.
- The script uses a practice database and leaves its inserted records in place.

## Related chapter files

- [Lesson 020 - Create and read MongoDB documents](../lessons/020-create-and-read-mongodb-documents.md)
- [Q&A 020 - Create and read MongoDB documents](../qnas/020-create-and-read-mongodb-documents.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [019 - MongoDB Node.js driver and connection lifecycle](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [Lesson](../lessons/020-create-and-read-mongodb-documents.md) | [Q&A](../qnas/020-create-and-read-mongodb-documents.md) | Example | [021 - Query filters and projection](../lessons/021-query-filters-and-projection.md) |
