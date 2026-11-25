# 026 - Data modeling and relationship patterns: Complete example

This standalone Node.js script uses a small learning-platform dataset to demonstrate four relationship patterns:

- A student embeds bounded profile preferences and addresses.
- Comments reference their post as separate child documents.
- Enrollments represent a many-to-many student-course relationship.
- Categories store parent references for a tree.

The example is documentation; this repository does not execute it. Use a practice database. Each run creates a new batch marker and reads only its own data.

## What this example demonstrates

- Embedding one-to-one and bounded one-to-many values.
- Storing a growing child set in a separate collection.
- Giving a many-to-many association its own fields and unique index.
- Querying each direction of a relationship.
- Finding direct children in a parent-reference tree.
- Indexing relationship fields for common filters and sorts.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\data-modeling-relationship-patterns.js
~~~

Save the script below as `data-modeling-relationship-patterns.js`. It writes to the `mern_relationship_patterns_demo` database.

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

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_relationship_patterns_demo");
    const students = db.collection("students");
    const courses = db.collection("courses");
    const enrollments = db.collection("enrollments");
    const posts = db.collection("posts");
    const comments = db.collection("comments");
    const categories = db.collection("categories");
    const batchId = new ObjectId();

    // Index the relationship query and prevent a duplicate enrollment pair.
    await enrollments.createIndex(
      { batchId: 1, studentId: 1, courseId: 1 },
      { unique: true }
    );
    await enrollments.createIndex({
      batchId: 1,
      courseId: 1,
      status: 1,
      studentId: 1
    });

    // Comments can grow, so store each as a separate child document.
    await comments.createIndex({
      batchId: 1,
      postId: 1,
      createdAt: -1,
      _id: -1
    });

    // Parent references make direct-child queries straightforward.
    await categories.createIndex({ batchId: 1, parentId: 1 });

    const studentInsert = await students.insertMany([
      {
        batchId,
        name: "Maya Chen",
        preferences: {
          theme: "dark",
          locale: "en"
        },
        addresses: [
          { label: "home", city: "Pune" },
          { label: "work", city: "Mumbai" }
        ]
      },
      {
        batchId,
        name: "Noah Kim",
        preferences: {
          theme: "light",
          locale: "en"
        },
        addresses: [
          { label: "home", city: "Delhi" }
        ]
      }
    ]);

    const mayaId = studentInsert.insertedIds[0];
    const noahId = studentInsert.insertedIds[1];

    const courseInsert = await courses.insertMany([
      {
        batchId,
        title: "MongoDB schema design"
      },
      {
        batchId,
        title: "Express API basics"
      }
    ]);

    const schemaCourseId = courseInsert.insertedIds[0];
    const expressCourseId = courseInsert.insertedIds[1];

    const enrollmentInsert = await enrollments.insertMany([
      {
        batchId,
        studentId: mayaId,
        courseId: schemaCourseId,
        status: "active",
        enrolledAt: new Date("2026-04-01T09:00:00.000Z")
      },
      {
        batchId,
        studentId: mayaId,
        courseId: expressCourseId,
        status: "active",
        enrolledAt: new Date("2026-04-02T09:00:00.000Z")
      },
      {
        batchId,
        studentId: noahId,
        courseId: schemaCourseId,
        status: "active",
        enrolledAt: new Date("2026-04-03T09:00:00.000Z")
      }
    ]);

    const postInsert = await posts.insertOne({
      batchId,
      title: "Planning relationship data"
    });
    const postId = postInsert.insertedId;

    const commentInsert = await comments.insertMany([
      {
        batchId,
        postId,
        authorId: mayaId,
        text: "The bounded-list example is clear.",
        createdAt: new Date("2026-04-04T09:00:00.000Z")
      },
      {
        batchId,
        postId,
        authorId: noahId,
        text: "The enrollment collection is useful.",
        createdAt: new Date("2026-04-05T09:00:00.000Z")
      }
    ]);

    const programmingInsert = await categories.insertOne({
      batchId,
      name: "Programming",
      parentId: null
    });
    const programmingId = programmingInsert.insertedId;

    await categories.insertMany([
      {
        batchId,
        name: "Databases",
        parentId: programmingId
      },
      {
        batchId,
        name: "Web development",
        parentId: programmingId
      }
    ]);

    const maya = await students.findOne({
      _id: mayaId,
      batchId
    });

    if (maya === null) {
      throw new Error("The demonstration student was not found.");
    }

    // Query the same relationship from each direction.
    const mayaActiveCourses = await enrollments
      .find({
        batchId,
        studentId: mayaId,
        status: "active"
      })
      .toArray();

    const activeSchemaCourseStudents = await enrollments
      .find({
        batchId,
        courseId: schemaCourseId,
        status: "active"
      })
      .toArray();

    const postComments = await comments
      .find({
        batchId,
        postId
      })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    const directChildren = await categories
      .find({
        batchId,
        parentId: programmingId
      })
      .sort({ name: 1 })
      .toArray();

    console.log(
      "Inserted active enrollments: " + enrollmentInsert.insertedCount
    );
    console.log("Embedded addresses for Maya: " + maya.addresses.length);
    console.log("Active courses for Maya: " + mayaActiveCourses.length);
    console.log(
      "Students in schema course: " + activeSchemaCourseStudents.length
    );
    console.log("Comments on post: " + postComments.length);
    console.log("Direct child categories: " + directChildren.length);

    // Keep these variables visible to make each insert operation explicit.
    void commentInsert;
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

Identifiers and the connection URI are not printed:

~~~text
Inserted active enrollments: 3
Embedded addresses for Maya: 2
Active courses for Maya: 2
Students in schema course: 2
Comments on post: 2
Direct child categories: 2
~~~

## How the code works

### 1. Embed bounded student data

Preferences and addresses are nested in each student document. This example treats the address list as small and bounded, and assumes the profile view commonly reads it with the student.

If addresses gained independent access rules or an unbounded history, that would be a reason to revisit this schema.

### 2. Use an enrollment document for many-to-many data

The `enrollments` collection connects students and courses. The association has its own `status` and `enrolledAt` values, so it is a first-class relationship document.

The unique index prevents duplicate student-course pairs within a batch. The second index supports listing active students for a course. Add indexes only for queries the application needs.

The two queries show the relationship from both directions: active courses for Maya, and active students in the schema course.

### 3. Keep growing comments separate

Each comment stores its `postId` and `batchId`. The query filters by those fields and sorts newest first. This avoids putting a potentially unbounded comment list on the post.

### 4. Store parent references in a category tree

Each category stores its `parentId`. The root has `parentId: null`; the two child records point to the root’s generated ID. The index supports the direct-child lookup.

This is a simple representation for parent and immediate-child queries. A different tree pattern may fit better if subtree traversal or large numbers of children dominate.

### 5. Isolate each example run

A new `batchId` is attached to every record. Queries include the marker so previous runs do not affect these expected counts. The script does not delete existing records.

## Variations to try

1. Add a third address for Maya and decide whether the list remains bounded.
2. Attempt to insert the same student-course pair again and observe the unique index behavior.
3. Add an enrollment status filter such as `status: "active"` to both relationship queries.
4. Add a third comment and keep the query sorted and bounded with `limit()`.
5. Add another category level and compare a direct-child query with a subtree traversal.
6. Add a maximum number of child references to a parent, then decide what to do if it is exceeded.
7. Add a role field to an enrollment and explain why it belongs to the relationship.
8. Replace the category parent reference with a child-ID array and evaluate how moves and growth would work.
9. Add a derived preview of a few latest comments to the post and define how it stays refreshed.
10. Define what should happen to comments and enrollments when a student, course, or post is removed.

## Common issues

- **A child query returns no data:** verify the child stores the expected parent ID and that the query includes the correct batch or tenant.
- **The parent becomes large:** move an unbounded child set to a separate collection.
- **Relationship rows duplicate:** use a unique compound index if duplicate pairs are invalid in the domain.
- **One lookup direction is slow:** add an index that matches that filter and sort.
- **Two-way arrays disagree:** store the relationship once or define a reliable synchronization strategy.
- **A tree query only returns immediate children:** parent references do not automatically return an entire subtree.
- **A referenced target is missing:** define validation and cleanup behavior; the ID alone is not a foreign-key constraint.
- **Example counts change across runs:** include the current batch marker in the relevant reads.
- **The data shape cannot represent relationship status:** make the association its own document.

## Key takeaways

- Embed small bounded values that are commonly read with the parent.
- Put the parent reference on each child when a one-to-many set can grow.
- Use a relationship collection when a many-to-many association has its own data.
- Choose a tree pattern according to parent, child, or subtree query needs.
- Index the relationship filters and sorts used by the workload.
- Define uniqueness, deletion, and missing-target behavior explicitly.
- Each run creates three enrollments, two comments, and two child categories in an isolated batch.

## Related chapter files

- [Lesson 026 - Data modeling and relationship patterns](../lessons/026-data-modeling-and-relationship-patterns.md)
- [Q&A 026 - Data modeling and relationship patterns](../qnas/026-data-modeling-and-relationship-patterns.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [025 - Schema design: embedding versus referencing](../lessons/025-schema-design-embedding-versus-referencing.md) | [Lesson](../lessons/026-data-modeling-and-relationship-patterns.md) | [Q&A](../qnas/026-data-modeling-and-relationship-patterns.md) | Example | [027 - Schema validation and data integrity](../lessons/027-schema-validation-and-data-integrity.md) |
