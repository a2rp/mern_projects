# 022 - Sort, limit, skip, and pagination: Complete example

This standalone Node.js script inserts eight practice articles with intentionally repeated timestamps. It then reads the second page using offset pagination and reads the first two pages using cursor-based pagination.

Repeated timestamps make the unique tie-breaker visible: the query sorts by creation time and then by a per-batch unique order value. In a real collection, use a field that is unique for the matching result set, commonly `_id`.

The example is documentation. It is not executed by this repository.

## What this example demonstrates

- Sorting with a primary field and a unique tie-breaker.
- Limiting results to a page size.
- Calculating an offset for a numbered page.
- Using `pageSize + 1` to determine whether another page exists.
- Continuing after the last returned sort values with a range filter.
- Keeping demo reads isolated with a per-run marker.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, add `"type": "module"` to `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\sort-limit-skip-pagination.js
~~~

Save the script below as `sort-limit-skip-pagination.js`. Use a practice database. Each run inserts eight new documents and does not delete or modify older records.

## Complete code

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Set the MONGODB_URI environment variable before running this script.");
}

const client = new MongoClient(uri);
const pageSize = 3;
const sortOrder = { createdAt: -1, order: -1 };

function printPage(label, page) {
  console.log(label);

  for (const article of page.items) {
    console.log("- " + article.title);
  }

  console.log("Has next page: " + page.hasNextPage);
}

async function getKeysetPage(articles, batchId, size, afterCursor = null) {
  let filter = { batchId };

  if (afterCursor !== null) {
    filter = {
      batchId,
      $or: [
        { createdAt: { $lt: afterCursor.createdAt } },
        {
          createdAt: afterCursor.createdAt,
          order: { $lt: afterCursor.order }
        }
      ]
    };
  }

  const fetched = await articles
    .find(filter)
    .sort(sortOrder)
    .limit(size + 1)
    .project({
      _id: 0,
      title: 1,
      createdAt: 1,
      order: 1
    })
    .toArray();

  const hasNextPage = fetched.length > size;
  const items = fetched.slice(0, size);
  const lastItem = items[items.length - 1];

  const nextCursor =
    hasNextPage && lastItem !== undefined
      ? {
          createdAt: lastItem.createdAt,
          order: lastItem.order
        }
      : null;

  return { items, hasNextPage, nextCursor };
}

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_pagination_demo");
    const articles = db.collection("articles");
    const batchId = new ObjectId();

    const demoArticles = [
      {
        order: 1,
        title: "MERN introduction",
        createdAt: new Date("2026-05-01T10:00:00.000Z")
      },
      {
        order: 2,
        title: "MongoDB setup",
        createdAt: new Date("2026-05-01T10:00:00.000Z")
      },
      {
        order: 3,
        title: "MongoDB queries",
        createdAt: new Date("2026-05-01T11:00:00.000Z")
      },
      {
        order: 4,
        title: "Express APIs",
        createdAt: new Date("2026-05-01T11:00:00.000Z")
      },
      {
        order: 5,
        title: "React state",
        createdAt: new Date("2026-05-01T12:00:00.000Z")
      },
      {
        order: 6,
        title: "React forms",
        createdAt: new Date("2026-05-01T12:00:00.000Z")
      },
      {
        order: 7,
        title: "Authentication basics",
        createdAt: new Date("2026-05-01T13:00:00.000Z")
      },
      {
        order: 8,
        title: "Deploy app",
        createdAt: new Date("2026-05-01T13:00:00.000Z")
      }
    ];

    await articles.insertMany(
      demoArticles.map((article) => ({
        ...article,
        batchId
      }))
    );

    console.log("Inserted demo records: " + demoArticles.length);

    // Offset pagination: page numbers are one-based.
    const offsetPageNumber = 2;
    const offset = (offsetPageNumber - 1) * pageSize;

    const offsetFetched = await articles
      .find({ batchId })
      .sort(sortOrder)
      .skip(offset)
      .limit(pageSize + 1)
      .project({
        _id: 0,
        title: 1,
        createdAt: 1,
        order: 1
      })
      .toArray();

    const offsetPage = {
      items: offsetFetched.slice(0, pageSize),
      hasNextPage: offsetFetched.length > pageSize
    };

    printPage("Offset page 2 (3 per page):", offsetPage);

    // Cursor pagination: first fetch the initial page and its look-ahead row.
    const firstCursorPage = await getKeysetPage(
      articles,
      batchId,
      pageSize
    );

    printPage("Keyset page 1:", firstCursorPage);

    if (firstCursorPage.nextCursor !== null) {
      const secondCursorPage = await getKeysetPage(
        articles,
        batchId,
        pageSize,
        firstCursorPage.nextCursor
      );

      printPage("Keyset page 2:", secondCursorPage);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("The pagination example failed:", error.message);
  process.exitCode = 1;
});
~~~

## Expected output

The batch marker is not printed, and each page sorts newest first. The order value breaks ties between articles that share a timestamp.

~~~text
Inserted demo records: 8
Offset page 2 (3 per page):
- React state
- Express APIs
- MongoDB queries
Has next page: true
Keyset page 1:
- Deploy app
- Authentication basics
- React forms
Has next page: true
Keyset page 2:
- React state
- Express APIs
- MongoDB queries
Has next page: true
~~~

The same three articles appear on page two with both approaches. The offset query calculates page two as `(2 - 1) * 3 = 3`. The cursor query instead continues after the last item on page one.

## How the code works

### 1. Insert a bounded practice dataset

The script generates a new `batchId` for each run and stores it with all eight articles. Earlier runs remain in the database, but all the demonstration queries filter by the current marker.

The `order` values are unique within this batch. Several articles share a timestamp on purpose, so sorting by timestamp alone would not fully define their order.

### 2. Sort with a tie-breaker

`sortOrder` is `{ createdAt: -1, order: -1 }`. The timestamp sorts newest first, and the order value sorts records with equal timestamps in a repeatable order.

Production data should use a tie-breaker that is unique for the matching result set and has a stable type. A common choice is `_id`.

### 3. Read an offset page

For page two, the script skips three records, then fetches at most one visible page plus one extra record. It returns the first three and uses the extra record to set `hasNextPage`.

Offset pagination is easy for numbered pages. For a very deep page, skipping all earlier results can take more work, and inserts or deletes can move records between pages.

### 4. Read cursor-based pages

The first cursor page sorts and fetches `pageSize + 1` records. The helper returns only the visible items and saves the last visible item's `createdAt` and `order` as the continuation cursor.

The next request matches records with an earlier timestamp, or the same timestamp and a smaller order value. That is the continuation rule for this example's descending sort.

The helper uses `toArray()` only for a bounded page of at most `size + 1` records. It does not load all matching articles.

## Using a cursor token in an API

This script passes a JavaScript object as its cursor for clarity. An HTTP API generally serializes the cursor values into a token and decodes them on the next request. Validate the token's shape and types before building the MongoDB filter. If clients must not alter cursor values, sign the token or store its state server-side.

Use the same sort fields and directions in both the initial query and continuation filter. If the sort includes a non-unique field, include a unique tie-breaker. If the base filter already has an `$or`, combine the base and continuation conditions with an `$and`.

Cursor pagination reduces dependence on large offsets, but it does not create a snapshot across multiple requests. Changes to documents between requests can still affect what a user sees.

## Variations to try

1. Change `pageSize` to 2 and compare the page contents.
2. Change one article's timestamp so it no longer ties with its neighbor.
3. Reverse the order to ascending and update the continuation comparisons.
4. Use `_id` as the tie-breaker in a collection whose IDs are stable and unique.
5. Add a filter such as `{ batchId, category: "database" }` and make sure it is preserved on every page.
6. Compare the filter and sort behavior for a shallow offset with a cursor page.

## Common issues

- **Unstable page order:** add a unique tie-breaker to the sort.
- **Incorrect offset:** use one-based page numbers and calculate `(page - 1) * pageSize`.
- **Deep pages become slow:** consider range-based pagination instead of a large `skip()`.
- **Look-ahead record is skipped:** create the cursor from the last visible record, not the extra record.
- **Cursor condition uses the wrong direction:** match the comparison operators to every sort direction.
- **Old demo data changes results:** include the current `batchId` in every query.
- **Client alters a cursor token:** validate its fields and sign or store it when tamper resistance matters.
- **Expecting a snapshot:** separate HTTP requests do not automatically share one consistent database view.

## Key takeaways

- Sort whenever result order matters, and add a unique tie-breaker.
- Use `limit()` to bound each response.
- Offset pagination uses `skip()` and is suitable for shallow numbered pages.
- Cursor pagination continues using the last visible sort values and avoids large numeric offsets.
- Fetch one extra document to compute `hasNextPage`.
- Validate page parameters and continuation tokens.
- Every run writes eight practice records and leaves them in the practice database.

## Related chapter files

- [Lesson 022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md)
- [Q&A 022 - Sort, limit, skip, and pagination](../qnas/022-sort-limit-skip-and-pagination.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [021 - Query filters and projection](../lessons/021-query-filters-and-projection.md) | [Lesson](../lessons/022-sort-limit-skip-and-pagination.md) | [Q&A](../qnas/022-sort-limit-skip-and-pagination.md) | Example | [023 - Update, replace, and upsert documents](../lessons/023-update-replace-and-upsert-documents.md) |
