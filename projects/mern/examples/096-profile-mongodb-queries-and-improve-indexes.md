# 096 - Profile MongoDB queries and improve indexes: Example

This example profiles a course feed for one owner and one status, sorted newest first. It compares the query plan before and after a candidate compound index, then uses a narrow projection, lean results, and stable cursor pagination.

The numeric plan output is illustrative, not a performance promise. Run the described measurements against representative data in a controlled environment before changing a production index.

## 1. Write down the query contract

The endpoint returns up to 20 published courses owned by the signed-in user, ordered by creation time and then by ID.

~~~~text
Filter: ownerId = authenticated user
       status = "published"
Sort:   createdAt descending, _id descending
Limit:  20 visible records, plus one look-ahead record
Fields: title, status, createdAt
~~~~

The owner comes from the authenticated session. It is never accepted from a query parameter.

## 2. Reproduce the query in the MongoDB shell

Use the same filter, sort, projection, and limit that the application issues. Substitute an ID from a controlled dataset.

~~~~js
db.courses
  .find(
    {
      ownerId: ObjectId("64b64c0b0000000000000001"),
      status: "published"
    },
    {
      title: 1,
      status: 1,
      createdAt: 1
    }
  )
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .explain("executionStats");
~~~~

The default Mongoose collection name for a <code>Course</code> model is commonly <code>courses</code>; confirm the actual collection name in the application.

## 3. Capture a baseline

Suppose the collection has 100,000 documents and the baseline plan reports values like these:

~~~~text
winningPlan: COLLSCAN followed by SORT
nReturned: 21
totalKeysExamined: 0
totalDocsExamined: 100000
~~~~

This simplified output suggests the query examines the collection and sorts matching documents. It does not prove every workload is slow: the actual user-visible latency, query frequency, cache behavior, and collection size still matter.

Record the exact query shape, data size, plan stages, returned count, documents and keys examined, and API latency percentiles before changing the index.

## 4. Create a candidate compound index in a controlled environment

The two filter fields use equality, followed by the stable sort keys:

~~~~js
db.courses.createIndex({
  ownerId: 1,
  status: 1,
  createdAt: -1,
  _id: -1
});
~~~~

For a frequently used owner-only feed without a status filter, the status field in the middle may prevent this index from providing the desired creation-time order. That workload may need a separate index such as <code>{ ownerId: 1, createdAt: -1, _id: -1 }</code>. Add it only if profiling shows the query matters enough to justify the extra write and storage cost.

## 5. Compare the plan after index creation

Run the exact same query again:

~~~~js
db.courses
  .find(
    {
      ownerId: ObjectId("64b64c0b0000000000000001"),
      status: "published"
    },
    {
      title: 1,
      status: 1,
      createdAt: 1
    }
  )
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .explain("executionStats");
~~~~

A favorable plan might show an index scan and far fewer examined entries:

~~~~text
winningPlan: IXSCAN with FETCH and LIMIT
nReturned: 21
totalKeysExamined: 21
totalDocsExamined: 21
~~~~

These numbers are hypothetical. Actual statistics depend on selectivity, data distribution, query planner choice, and MongoDB version. The query may still need a FETCH because <code>title</code> is not stored in this index.

## 6. Use the same query from Mongoose

~~~~js
// server/src/features/courses/course.service.js
import mongoose from "mongoose";
import { Course } from "./course.model.js";

function clampPageSize(limit) {
  const requested = Number(limit);
  return Number.isSafeInteger(requested)
    ? Math.min(Math.max(requested, 1), 100)
    : 20;
}

export async function listPublishedCourses({ ownerId, limit = 20 }) {
  const safeLimit = clampPageSize(limit);

  return Course.find({
    ownerId,
    status: "published"
  })
    .select("title status createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit + 1)
    .lean();
}
~~~~

The API validates the limit before it reaches the service. The service still caps it as a second safeguard. It obtains <code>ownerId</code> from authentication. The extra row indicates whether another page exists.

## 7. Create a stable cursor

When a feed grows, use the last visible result's creation time and ID instead of skipping many rows.

~~~~js
function parseCursor(cursor) {
  if (cursor == null) return null;

  if (
    typeof cursor !== "object" ||
    typeof cursor.createdAt !== "string" ||
    typeof cursor.id !== "string" ||
    !/^[a-f\d]{24}$/i.test(cursor.id)
  ) {
    const error = new Error("The page cursor is invalid.");
    error.status = 400;
    throw error;
  }

  const createdAt = new Date(cursor.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    const error = new Error("The page cursor is invalid.");
    error.status = 400;
    throw error;
  }

  return {
    createdAt,
    id: new mongoose.Types.ObjectId(cursor.id)
  };
}

function buildFeedFilter({ ownerId, cursor }) {
  const filter = {
    ownerId,
    status: "published"
  };
  const position = parseCursor(cursor);

  if (position) {
    filter.$or = [
      { createdAt: { $lt: position.createdAt } },
      {
        createdAt: position.createdAt,
        _id: { $lt: position.id }
      }
    ];
  }

  return filter;
}
~~~~

Decode the opaque cursor token before this function and pass only its validated object. Encode a next cursor from the last visible row and bind it to the same sort definition.

~~~~js
export async function listPublishedCoursesPage({ ownerId, cursor, limit = 20 }) {
  const safeLimit = clampPageSize(limit);
  const records = await Course.find(buildFeedFilter({ ownerId, cursor }))
    .select("title status createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = records.length > safeLimit;
  const items = hasMore ? records.slice(0, safeLimit) : records;
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last
        ? {
            createdAt: last.createdAt.toISOString(),
            id: String(last._id)
          }
        : null
  };
}
~~~~

A public API should encode the cursor as an opaque token rather than trusting arbitrary object fields from the caller. Reapply the authenticated owner filter on every request.

## 8. Compare an owner-only feed query separately

The status-filtered compound index has the key order <code>ownerId, status, createdAt, _id</code>. If the application also has an owner-only feed sorted by creation time, test that query independently:

~~~~js
db.courses
  .find(
    { ownerId: ObjectId("64b64c0b0000000000000001") },
    { title: 1, status: 1, createdAt: 1 }
  )
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .explain("executionStats");
~~~~

A distinct index can support that shape:

~~~~js
db.courses.createIndex({
  ownerId: 1,
  createdAt: -1,
  _id: -1
});
~~~~

Do not create both indexes automatically. Measure both query frequencies and costs, and verify whether an existing index already serves another required access pattern.

## 9. Inspect indexes and collection statistics

~~~~js
db.courses.getIndexes();
db.courses.stats();
~~~~

Index listing helps identify duplicate or overlapping prefixes. Collection statistics provide context about document count and storage. Production index-use statistics should be interpreted over a representative observation window; a recently deployed feature may not have received enough traffic yet.

## 10. Choose projection and lean based on response needs

~~~~js
const page = await Course.find({ ownerId, status: "published" })
  .select("title status createdAt")
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .lean();
~~~~

The projection avoids sending fields the UI does not use. The lean query returns plain objects without normal Mongoose document behavior. If the API needs virtuals, getters, or document methods, either keep hydrated documents or configure the needed transformation deliberately.

Do not add every returned property to a compound index just to avoid a FETCH. A covering index may reduce document reads but increases index size and write maintenance.

## 11. Compare an aggregation explain plan

If the feature uses aggregation, inspect that actual pipeline:

~~~~js
const pipeline = [
  {
    $match: {
      ownerId: ObjectId("64b64c0b0000000000000001"),
      status: "published"
    }
  },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: 21 },
  { $project: { title: 1, status: 1, createdAt: 1 } }
];

db.courses.explain("executionStats").aggregate(pipeline);
~~~~

The aggregation's result may include plan details with a different structure than a simple find query. Inspect the stages for the deployed MongoDB version.

## 12. Measure the API request too

Capture elapsed time around the service call with a monotonic clock and log only safe metadata.

~~~~js
const start = process.hrtime.bigint();

try {
  const data = await listPublishedCoursesPage({
    ownerId: req.user.id,
    cursor: req.validatedQuery.cursor,
    limit: req.validatedQuery.limit
  });

  const elapsedMs =
    Number(process.hrtime.bigint() - start) / 1_000_000;

  logger.info({
    requestId: req.id,
    operation: "courses.listPublished",
    status: 200,
    elapsedMs,
    returnedCount: data.items.length
  });

  res.json({ data });
} catch (error) {
  next(error);
}
~~~~

This service duration may still include Mongoose and application work. Measure total request latency separately, and never log the full user record or sensitive filter value just to identify a slow request.

## 13. Plan index deployment

Before production:

1. Check the current index list and query use.
2. Create the candidate index in a representative staging environment.
3. Compare plans and latency with the same query.
4. Estimate index build time, disk use, and write effects.
5. Decide how the index will be deployed and rolled back.
6. Observe the endpoint after release.
7. Remove an old index only after confirming it is unused across the workload.

A schema declaration in Mongoose does not by itself prove that a production index was built successfully. Verify index state in the actual database.

## Common mistakes

- Running an explain on a different query shape than the application.
- Treating illustrative plan counts as a guaranteed outcome.
- Assuming the presence of IXSCAN means little work.
- Adding the status-filtered index and expecting it to serve every owner-only feed sort.
- Sorting on a timestamp without an ID tie-breaker.
- Using deep skip values for a long-lived feed.
- Treating a cursor as a permission check.
- Adding response fields to an index without evaluating its size and write costs.
- Calling lean and then reading virtuals that were not configured.
- Creating multiple indexes before measuring the workload.
- Enabling detailed production profiling indefinitely.
- Forgetting to verify that production indexes actually exist.

## Manual walkthrough

1. Use representative data in an isolated database.
2. Capture the baseline plan and record examined keys, examined documents, and returned rows.
3. Create the candidate compound index in that controlled environment.
4. Run the same filter, projection, sort, and limit and compare the plan.
5. Test the owner-only query separately from the status-filtered query.
6. Compare API latency at representative load, not only explain time.
7. Verify equal timestamps still sort deterministically by ID.
8. Verify cursor pages neither duplicate nor skip records during normal inserts.
9. Review overlapping index prefixes and write costs.
10. Plan production index creation and rollback before rollout.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [095 - Validation across the full stack](../lessons/095-validation-across-the-full-stack.md) | [Lesson](../lessons/096-profile-mongodb-queries-and-improve-indexes.md) | [Q&A](../qnas/096-profile-mongodb-queries-and-improve-indexes.md) | [Example](096-profile-mongodb-queries-and-improve-indexes.md) | [097 - Deployment architecture and environment separation](../lessons/097-deployment-architecture-and-environment-separation.md) |
