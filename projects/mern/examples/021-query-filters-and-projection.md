# 021 - Query filters and projection: Complete example

This example creates a small, isolated group of sample user documents, then demonstrates common MongoDB filters and projections against that group. Each run uses a new ObjectId marker, so queries only inspect records created during that run.

The code is study material. Copy it into a local Node.js project if you want to run it; this repository does not execute it.

## What this example demonstrates

- Equality and comparison filters.
- Combining field conditions with logical `$or`.
- Dot notation for embedded fields.
- Array scalar matching, `$all`, and `$elemMatch`.
- The difference between explicit null and a missing field.
- Inclusion projections and explicit `_id` exclusion.
- Consuming query cursors with asynchronous iteration.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, add `"type": "module"` to `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\query-filters-and-projection.js
~~~

Save the complete script below as `query-filters-and-projection.js`. Use a practice database. Every run inserts four new sample documents and leaves them in place.

## Complete code

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Set the MONGODB_URI environment variable before running this script.");
}

const client = new MongoClient(uri);

async function printNames(label, cursor) {
  const names = [];

  for await (const document of cursor) {
    names.push(document.name);
  }

  // Sort in JavaScript only to make the printed demo output predictable.
  names.sort();

  console.log(label + ": " + (names.length > 0 ? names.join(", ") : "(none)"));
}

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_query_projection_demo");
    const users = db.collection("users");
    const batchId = new ObjectId();

    await users.insertMany([
      {
        batchId,
        name: "Asha",
        role: "frontend",
        yearsOfExperience: 3,
        active: true,
        skills: ["JavaScript", "React"],
        address: { city: "Delhi", country: "India" },
        managerId: null,
        projects: [
          { name: "Storefront", status: "active", year: 2025 },
          { name: "Docs", status: "complete", year: 2023 }
        ]
      },
      {
        batchId,
        name: "Bilal",
        role: "backend",
        yearsOfExperience: 5,
        active: true,
        skills: ["JavaScript", "Node.js", "MongoDB"],
        address: { city: "Mumbai", country: "India" },
        managerId: "lead-7",
        projects: [
          { name: "API", status: "complete", year: 2024 },
          { name: "Billing", status: "active", year: 2025 }
        ]
      },
      {
        batchId,
        name: "Cora",
        role: "full-stack",
        yearsOfExperience: 2,
        active: false,
        skills: ["React", "Node.js"],
        address: { city: "Delhi", country: "India" },
        // managerId is intentionally missing from this document.
        projects: [
          { name: "Portfolio", status: "active", year: 2024 }
        ]
      },
      {
        batchId,
        name: "Dev",
        role: "backend",
        yearsOfExperience: 7,
        active: true,
        skills: ["PHP", "MongoDB"],
        address: { city: "Pune", country: "India" },
        managerId: "lead-2",
        projects: [
          { name: "Importer", status: "complete", year: 2022 }
        ]
      }
    ]);

    console.log("Inserted records: 4");

    // Equality: role must equal the string "frontend".
    await printNames(
      "Role frontend",
      users
        .find({ batchId, role: "frontend" })
        .project({ _id: 0, name: 1 })
    );

    // Range: both conditions on yearsOfExperience must be true.
    await printNames(
      "Experience from 3 through 5",
      users
        .find({
          batchId,
          yearsOfExperience: { $gte: 3, $lte: 5 }
        })
        .project({ _id: 0, name: 1 })
    );

    // Implicit AND with an OR group:
    // the user must be active and either frontend or highly experienced.
    await printNames(
      "Active frontend OR highly experienced",
      users
        .find({
          batchId,
          active: true,
          $or: [
            { role: "frontend" },
            { yearsOfExperience: { $gte: 6 } }
          ]
        })
        .project({ _id: 0, name: 1 })
    );

    // Dot notation matches a nested field.
    await printNames(
      "Address city Delhi",
      users
        .find({ batchId, "address.city": "Delhi" })
        .project({ _id: 0, name: 1 })
    );

    // A scalar match checks whether the array contains that value.
    await printNames(
      "Contains React",
      users
        .find({ batchId, skills: "React" })
        .project({ _id: 0, name: 1 })
    );

    // $all requires every listed value to appear in the array.
    await printNames(
      "Contains both React and Node.js",
      users
        .find({
          batchId,
          skills: { $all: ["React", "Node.js"] }
        })
        .project({ _id: 0, name: 1 })
    );

    // $elemMatch makes both conditions apply to the same project object.
    await printNames(
      "Has an active project from 2025 onward",
      users
        .find({
          batchId,
          projects: {
            $elemMatch: {
              status: "active",
              year: { $gte: 2025 }
            }
          }
        })
        .project({ _id: 0, name: 1 })
    );

    // A null equality query matches explicit null and a missing field.
    await printNames(
      "managerId null (null or missing)",
      users
        .find({ batchId, managerId: null })
        .project({ _id: 0, name: 1 })
    );

    // Add $exists to distinguish the two data states.
    await printNames(
      "managerId explicitly null",
      users
        .find({
          batchId,
          managerId: { $exists: true, $eq: null }
        })
        .project({ _id: 0, name: 1 })
    );

    await printNames(
      "managerId missing",
      users
        .find({
          batchId,
          managerId: { $exists: false }
        })
        .project({ _id: 0, name: 1 })
    );

    // Inclusion projection: select needed fields and omit _id explicitly.
    const projectedUser = await users.findOne(
      { batchId, name: "Asha" },
      {
        projection: {
          _id: 0,
          name: 1,
          role: 1,
          "address.city": 1
        }
      }
    );

    console.log("Projected profile:");
    console.dir(projectedUser, { depth: null });
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("The MongoDB example failed:", error.message);
  process.exitCode = 1;
});
~~~

## Expected output

The generated batch marker is not printed. Since the helper sorts names in JavaScript, the output order is stable:

~~~text
Inserted records: 4
Role frontend: Asha
Experience from 3 through 5: Asha, Bilal
Active frontend OR highly experienced: Asha, Dev
Address city Delhi: Asha, Cora
Contains React: Asha, Cora
Contains both React and Node.js: Cora
Has an active project from 2025 onward: Asha, Bilal
managerId null (null or missing): Asha, Cora
managerId explicitly null: Asha
managerId missing: Cora
Projected profile:
{ name: 'Asha', role: 'frontend', address: { city: 'Delhi' } }
~~~

The exact formatting of the printed object may vary by Node.js version. The match sets should remain the same for the sample documents.

## How the filters work

### Equality and comparisons

`{ role: "frontend" }` matches Asha's role. The experience query applies both `$gte` and `$lte` to one field, so the value must be between 3 and 5 inclusive.

### Logical conditions

The active-role query has an implicit AND between `active: true` and the `$or` group. That is why Asha matches through her role, while Dev matches through his experience. Cora's role matches neither branch and she is not active.

### Nested fields

`"address.city"` addresses the city value inside the embedded `address` object. It matches Asha and Cora.

### Arrays

A scalar condition such as `skills: "React"` finds arrays containing that value. `$all` requires both React and Node.js. `$elemMatch` ensures project status and year belong to one same project object.

### Null versus missing

Asha stores `managerId: null`; Cora has no `managerId` field. A null equality query matches both. Adding `$exists: true` with `$eq: null` matches Asha only, while `$exists: false` matches Cora only.

### Projection

The final query returns only the selected name, role, and nested city. The explicit `_id: 0` removes the identifier. The projection does not affect which document matched.

## Variations to try

1. Change the role filter to `{ role: { $in: ["frontend", "full-stack"] } }` and observe the match set.
2. Change the experience condition to `{ $gt: 3 }` and compare the results.
3. Add a country condition using `"address.country": "India"`.
4. Remove `$elemMatch` and compare behavior after constructing a document whose active project and newer project are different array elements.
5. Change the final projection to include `_id` and remove the explicit exclusion.
6. Add an allowed filter option to a server-side filter builder, validate its type, and reject unsupported input.

The sample database keeps documents from earlier runs. Every query includes the current run's `batchId`, so old records do not affect the displayed results. The script does not delete data.

## Safety notes

- Use a practice database because each run inserts four records.
- Do not accept a raw client-supplied query object as a database filter.
- Construct filters from validated fields and allowed values.
- Keep the run marker in every query so reads stay limited to this example's documents.
- A projection is not an authorization system; never include sensitive fields in a response without an access-control decision.

## Related chapter files

- [Lesson 021 - Query filters and projection](../lessons/021-query-filters-and-projection.md)
- [Q&A 021 - Query filters and projection](../qnas/021-query-filters-and-projection.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [020 - Create and read MongoDB documents](../lessons/020-create-and-read-mongodb-documents.md) | [Lesson](../lessons/021-query-filters-and-projection.md) | [Q&A](../qnas/021-query-filters-and-projection.md) | Example | [022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md) |
