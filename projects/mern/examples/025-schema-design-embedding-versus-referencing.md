# 025 - Schema design: embedding versus referencing: Complete example

This standalone Node.js example models a book with bounded chapter data embedded in the book document, an author stored separately, and reviews stored as separate child documents because the review set can grow.

It also keeps the author’s name at publication time as an intentional snapshot, queries reviews by their book reference, and demonstrates an aggregation with `$lookup`.

The example is documentation; this repository does not execute it. Use a practice database. Each run uses a new batch marker, so its reads and writes stay isolated from prior runs.

## What this example demonstrates

- Embedding a bounded list that is usually read with its parent.
- Referencing an independently managed author record.
- Keeping a deliberate historical author-name snapshot.
- Storing a potentially growing review set separately.
- Indexing the child query by book and batch.
- Reading referenced children with a direct query or `$lookup`.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\embedding-versus-referencing.js
~~~

Save the script below as `embedding-versus-referencing.js`. It writes to the `mern_schema_design_demo` database.

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

    const db = client.db("mern_schema_design_demo");
    const authors = db.collection("authors");
    const books = db.collection("books");
    const reviews = db.collection("reviews");
    const batchId = new ObjectId();

    // Reviews are separate child documents and are commonly found by book.
    await reviews.createIndex({
      bookId: 1,
      batchId: 1,
      createdAt: -1,
      _id: -1
    });

    const author = {
      batchId,
      name: "Asha Rao",
      bio: "Writes practical database guides."
    };

    const authorInsert = await authors.insertOne(author);
    const authorId = authorInsert.insertedId;

    const book = {
      batchId,
      isbn: "978-1-55555-025-0",
      title: "MongoDB for Builders",
      authorId,
      // This copy records the name when this book entry was created.
      authorNameAtPublication: author.name,
      publisher: {
        name: "Northstar Learning",
        city: "Pune"
      },
      // The chapter list is small and has a known upper bound.
      chapters: [
        { number: 1, title: "Documents and collections" },
        { number: 2, title: "Model related data" }
      ]
    };

    const bookInsert = await books.insertOne(book);
    const bookId = bookInsert.insertedId;

    const reviewDocuments = [
      {
        batchId,
        bookId,
        reviewId: "review-1",
        rating: 5,
        title: "A useful introduction",
        createdAt: new Date("2026-04-04T09:00:00.000Z")
      },
      {
        batchId,
        bookId,
        reviewId: "review-2",
        rating: 4,
        title: "Clear examples",
        createdAt: new Date("2026-04-05T09:00:00.000Z")
      },
      {
        batchId,
        bookId,
        reviewId: "review-3",
        rating: 5,
        title: "Good pacing",
        createdAt: new Date("2026-04-06T09:00:00.000Z")
      }
    ];

    const reviewInsert = await reviews.insertMany(reviewDocuments);
    console.log("Inserted reviews: " + reviewInsert.insertedCount);

    // Read the parent, then resolve its author reference and review children.
    const savedBook = await books.findOne({ _id: bookId, batchId });

    if (savedBook === null) {
      throw new Error("The demonstration book was not found.");
    }

    const savedAuthor = await authors.findOne({
      _id: savedBook.authorId,
      batchId
    });

    const savedReviews = await reviews
      .find({
        bookId: savedBook._id,
        batchId
      })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    console.log("Chapters embedded in book: " + savedBook.chapters.length);
    console.log(
      "Canonical author: " +
        (savedAuthor === null ? "not found" : savedAuthor.name)
    );
    console.log(
      "Author name snapshot: " + savedBook.authorNameAtPublication
    );
    console.log("Reviews found by reference: " + savedReviews.length);

    // Alternative read: combine the book and its reviews in one aggregation.
    const bookWithReviews = await books
      .aggregate([
        {
          $match: {
            _id: bookId,
            batchId
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "bookId",
            as: "reviews"
          }
        }
      ])
      .next();

    if (bookWithReviews === null) {
      throw new Error("The joined demonstration book was not found.");
    }

    console.log(
      "Reviews returned by $lookup: " + bookWithReviews.reviews.length
    );
    console.log("Latest review: " + savedReviews[0].title);
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

The script does not print the connection URI or random batch identifier:

~~~text
Inserted reviews: 3
Chapters embedded in book: 2
Canonical author: Asha Rao
Author name snapshot: Asha Rao
Reviews found by reference: 3
Reviews returned by $lookup: 3
Latest review: Good pacing
~~~

## How the code works

### 1. Create an isolated batch

A fresh `ObjectId` is stored on the author, book, and reviews. Queries include the current `batchId`, so each run reads only its own demonstration data.

The generated book identifier is also placed in each review as `bookId`. This is a reference value; the database does not automatically enforce that the book exists.

### 2. Embed bounded book data

The publisher details and two chapter summaries are embedded in the book. They are small, are typically displayed with the book, and the chapter list has a known bound.

The book also contains `authorNameAtPublication`. That field is an intentional snapshot, so it can preserve the name associated with this book even if the author’s current name changes later.

### 3. Reference the canonical author

The book stores `authorId`, while the current author document remains in the `authors` collection. The script queries the author separately to get its canonical name.

The snapshot and reference serve different purposes: the snapshot records the publication-time value; the reference locates the current author record.

### 4. Reference reviews as a growing child set

Reviews are stored as documents in their own collection. Each review has a `bookId` and `batchId`. This keeps a potentially growing review list out of the book document.

The compound index starts with the fields used by the query and then includes the sort fields. Index design should follow the actual filter and sort patterns of a production workload.

### 5. Compare two read strategies

The first read fetches the book, author, and reviews with separate queries. This can be clear and selective when the application needs only a subset of related data.

The second uses `$lookup` to return the book with its reviews in one aggregation result. This is useful when a combined server-side result matches the endpoint’s needs. It does not create a foreign-key constraint or cascade behavior.

## Variations to try

1. Change the author’s current name after inserting the book and compare it with the stored snapshot.
2. Add a third chapter and consider whether the chapter list still has a known upper bound.
3. Add many more reviews and keep them in the separate collection.
4. Change the review query to return only recent reviews with a bounded limit.
5. Add a status field to reviews and decide whether the index should reflect the new filter.
6. Remove one review’s `bookId` and observe why the relationship query no longer returns it.
7. Compare the direct queries with the `$lookup` result when the endpoint needs only a book title and review count.
8. Add a policy for what should happen to reviews if a book is permanently deleted.
9. Consider whether the current author name should be a snapshot, a live reference, or both.
10. Review indexes and data sizes before using the example shape with realistic production volumes.

## Common issues

- **A child cannot be found:** verify that the child stores the correct parent ID and that the query includes its scope.
- **An embedded array keeps growing:** move the unbounded child set to a separate collection.
- **A copied value becomes stale:** define whether it is a snapshot or a mutable duplicate and document its update policy.
- **A reference points to a missing document:** validate and maintain the relationship in application logic.
- **A `$lookup` returns an unexpectedly large array:** bound the relationship or use a query that returns only the subset the endpoint needs.
- **The index does not support the query:** compare index field order with the equality filters and sort used by the actual workload.
- **Old example data appears in the output:** include the current `batchId` in reads that are not keyed by a newly generated unique ID.
- **A parent delete leaves child records:** implement the chosen cleanup, archive, or retention policy explicitly.

## Key takeaways

- Embed the bounded chapter list and publisher data because the book is usually read with them.
- Reference the author because it is independently managed, while retaining a deliberate publication-time snapshot.
- Store potentially growing reviews separately with a book identifier.
- Query references directly or combine them with `$lookup` according to the endpoint’s access pattern.
- Index fields used by child filters and sorts.
- References do not automatically enforce existence or cleanup.
- The model mixes embedding and referencing because different fields have different access and lifecycle needs.

## Related chapter files

- [Lesson 025 - Schema design: embedding versus referencing](../lessons/025-schema-design-embedding-versus-referencing.md)
- [Q&A 025 - Schema design: embedding versus referencing](../qnas/025-schema-design-embedding-versus-referencing.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [024 - Delete documents safely](../lessons/024-delete-documents-safely.md) | [Lesson](../lessons/025-schema-design-embedding-versus-referencing.md) | [Q&A](../qnas/025-schema-design-embedding-versus-referencing.md) | Example | [026 - Data modeling and relationship patterns](../lessons/026-data-modeling-and-relationship-patterns.md) |
