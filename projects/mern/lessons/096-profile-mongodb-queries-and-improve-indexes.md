# 096 - Profile MongoDB queries and improve indexes

An index can make a common query much faster, but each index also consumes memory and storage and adds work to writes. The right improvement starts with a measured query shape and representative data. Adding indexes without evidence can increase operational cost without making the application faster.

This chapter follows a course-list endpoint from its filter, sort, projection, and pagination through an execution plan. It shows how to read explain statistics, design compound indexes for the workload, use Mongoose's lean results deliberately, and deploy index changes safely.

## Learning outcomes

After this chapter, you should be able to:

- Find which API operation and MongoDB query are actually slow.
- Use <code>explain("executionStats")</code> to inspect a query plan.
- Interpret keys and documents examined relative to results returned.
- Recognize collection scans, index scans, fetches, and in-memory sorts.
- Design compound indexes for real filter and sort patterns.
- Apply equality-sort-range reasoning while considering index prefixes.
- Use projection and <code>lean()</code> when a read does not need document behavior.
- Replace deep offset pagination with a stable cursor when suitable.
- Measure index costs on writes, memory, disk, and deployment.
- Avoid using production profiling as an unbounded debug log.

## 1. Start with a real endpoint and workload

Suppose a signed-in user opens a course list. The endpoint:

- Filters by the authenticated owner.
- Optionally filters by status.
- Sorts newest first.
- Returns a small page of fields.
- Runs at a frequency driven by real user behavior.

Write down the query shape and its expected frequency before changing indexes. Ask:

- How many documents does a typical collection contain?
- How many results should one request return?
- Which filter combinations are common?
- Is the sort stable when timestamps are equal?
- Is the request slow in MongoDB, in the API service, or in the browser?
- Does it slow only under concurrency or only for some users?

A query that is fast with ten sample records may perform poorly with millions. Use representative data and measure the entire request as well as the database operation.

## 2. Separate database time from API time

Record safe, useful request metrics such as route, status, elapsed time, and a request ID. Avoid logging complete user documents or sensitive query values.

A slow browser operation can come from:

- DNS, connection setup, TLS, or network transfer.
- API middleware, authentication, or business logic.
- MongoDB query execution or connection-pool wait.
- Serialization of large responses.
- Client rendering or repeated requests.

Measure before attributing all delay to MongoDB. The database execution time is only one part of a user-visible request.

## 3. Capture an explain plan with execution statistics

Use the exact filter, sort, projection, and limit that the application uses. In the MongoDB shell:

~~~~js
db.courses
  .find(
    { ownerId: ObjectId("64b64c0b0000000000000001"), status: "published" },
    { title: 1, status: 1, createdAt: 1 }
  )
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .explain("executionStats");
~~~~

From Mongoose, the query can also request an execution plan:

~~~~js
const plan = await Course.find({
  ownerId,
  status: "published"
})
  .select("title status createdAt")
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .explain("executionStats");
~~~~

The sample owner ID is illustrative. Use an ID and dataset from a controlled test or staging environment. Explain output is version- and query-dependent, so inspect the actual plan instead of assuming every field or stage appears in the same location.

## 4. Read the important execution statistics

Useful values include:

- **nReturned:** documents returned by the winning plan.
- **totalKeysExamined:** index entries examined.
- **totalDocsExamined:** documents examined.
- **executionTimeMillis:** time reported for this explain execution.
- **Winning plan stages:** operations chosen to execute the query.

A large difference between documents examined and documents returned can indicate that the query scans many candidates. A high keys-examined-to-results ratio can indicate an index that is not selective enough for the actual filter.

These numbers are diagnostic signals, not universal pass/fail thresholds. A request that returns 20 documents may need to examine more than 20 keys due to filtering, ties, or query shape. Compare the plan with expected workload, data distribution, latency percentiles, and resource usage.

Do not treat one <code>executionTimeMillis</code> sample as a production latency benchmark. Cache state, hardware, concurrency, and plan selection affect timing.

## 5. Recognize common plan stages

Common stages include:

- **COLLSCAN:** scans collection documents. This may be fine for a small collection or a query expected to inspect much of the collection; it may be costly for a large selective lookup.
- **IXSCAN:** walks an index range.
- **FETCH:** reads full documents after locating matching index entries.
- **SORT:** sorts results after scanning rather than satisfying the sort directly from an index.
- **LIMIT:** stops after enough matching results are produced.
- **PROJECTION:** returns only selected fields.

A plan with IXSCAN is not automatically fast. It may scan a large index range and fetch many documents. A COLLSCAN is not automatically wrong. Evaluate the actual work and user latency.

## 6. Design compound indexes from filters and sorts

A compound index stores keys in a defined order. That order determines which query prefixes it can support and whether it can supply a requested sort.

For many workloads, use the **Equality, Sort, Range** guideline:

1. Put fields matched by equality predicates first.
2. Put sort fields next when the query needs index-provided sorting.
3. Put range fields after those when avoiding an in-memory sort is the priority.

This is a design guideline, not a mechanical rule. A highly selective range may deserve earlier placement when reducing scanned entries matters more than satisfying a particular sort. Test the actual query.

For the owner-and-status feed above:

~~~~js
// server/src/features/courses/course.model.js
courseSchema.index({
  ownerId: 1,
  status: 1,
  createdAt: -1,
  _id: -1
});
~~~~

Both <code>ownerId</code> and <code>status</code> are equality filters, followed by the descending stable sort. Index key directions should match the requested order, or the full inverse order where the query can traverse the index backward. Mixed-direction sorts require matching index direction patterns.

## 7. Understand compound index prefixes

An index on <code>{ ownerId: 1, status: 1, createdAt: -1 }</code> can support queries using the prefix <code>ownerId</code> and queries using the prefix <code>ownerId, status</code>. It does not generally serve a query filtering only by <code>status</code> as efficiently because that field is not the prefix.

Before creating a new index, list the read patterns that could use an existing index prefix. An index that appears redundant for one endpoint may support another endpoint; an index that looks broadly useful may not support the actual filter order.

Index key order is part of the data model's performance contract.

## 8. Make sort and pagination deterministic

Sorting only by a timestamp can be unstable when several documents share the same timestamp. Add a unique tie-breaker such as <code>_id</code>:

~~~~js
.sort({ createdAt: -1, _id: -1 })
~~~~

Offset pagination with <code>skip()</code> becomes more expensive as the offset grows and can shift when records are inserted between requests. For a long feed, use cursor pagination based on the last returned sort tuple:

~~~~js
const filter = { ownerId };

if (cursor) {
  filter.$or = [
    { createdAt: { $lt: cursor.createdAt } },
    {
      createdAt: cursor.createdAt,
      _id: { $lt: cursor.id }
    }
  ];
}

const items = await Course.find(filter)
  .sort({ createdAt: -1, _id: -1 })
  .limit(pageSize + 1)
  .select("title status createdAt")
  .lean();
~~~~

Validate and encode cursor values. The cursor is not authorization; continue to scope every page by the authenticated owner. Return an opaque next cursor based on the last visible item, and use one extra result to determine whether another page exists.

## 9. Use projection to reduce returned fields

If the client needs only title, status, and timestamp, select those fields instead of returning a whole document:

~~~~js
const courses = await Course.find({ ownerId })
  .select("title status createdAt")
  .sort({ createdAt: -1, _id: -1 })
  .limit(21);
~~~~

Projection reduces serialization and network payload. A query may still need to fetch a full document when the selected values are not all present in the index. Adding every response field to an index can make the index larger, so measure before attempting a covered query.

## 10. Use lean reads when document behavior is unnecessary

Mongoose normally hydrates query results into Mongoose documents with change tracking and document methods. For a read-only API response, <code>lean()</code> can skip that hydration and return plain JavaScript objects.

~~~~js
const courses = await Course.find({ ownerId })
  .select("title status createdAt")
  .sort({ createdAt: -1, _id: -1 })
  .limit(21)
  .lean();
~~~~

Lean results do not have normal Mongoose document methods or all document features such as getters, virtuals, and defaults unless configured or added separately. Use them when the endpoint only reads and serializes data, and verify the response does not depend on document behavior.

## 11. Inspect aggregation pipelines too

Profile aggregation queries with the same discipline. Match and limit as early as correctness allows, project only required fields, and inspect the execution plan. A pipeline can still scan many documents, perform blocking stages, or create expensive joins.

~~~~js
const pipeline = [
  { $match: { ownerId } },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: 21 },
  { $project: { title: 1, status: 1, createdAt: 1 } }
];

const plan = await Course.aggregate(pipeline).explain("executionStats");
~~~~

Pipeline reordering has semantic constraints. Preserve the meaning of pagination, joins, and calculations when moving stages.

## 12. Keep the index set small and useful

Indexes speed up some reads and add costs elsewhere:

- Every index occupies storage and memory.
- Inserts must update the indexes.
- Updates to indexed fields add more write work.
- Large index builds consume resources.
- Too many indexes compete for cache and complicate operations.

Avoid one index per possible filter combination. Identify high-value query shapes, check existing prefixes, estimate data selectivity, and validate that the index improves the target workload without unacceptable write cost.

## 13. Deploy index changes safely

Treat index changes as operational changes:

1. Check the current indexes and their use.
2. Reproduce the query with representative data.
3. Create the index in a controlled environment.
4. Compare the before-and-after plan and application latency.
5. Check build time, disk use, and write impact.
6. Roll the change out under a deployment plan.
7. Remove an unused index only after confirming it is not needed by another query.

Do not assume application startup should build every production index automatically. Many deployments manage index creation through a deliberate migration or operations process. Coordinate index changes with the MongoDB version, data volume, and deployment topology.

## 14. Use production profiling carefully

A database profiler can reveal slow operations, but profiling itself has storage, CPU, privacy, and operational effects. Prefer targeted slow-query logs, sampling, short observation windows, and access-controlled diagnostics. Avoid recording sensitive values or enabling verbose profiling indefinitely without a plan.

Application logs should include safe request IDs and query names so a slow API request can be correlated without dumping the full query payload or document.

## Common mistakes

- Adding an index before measuring the endpoint.
- Assuming any IXSCAN plan is automatically efficient.
- Treating one explain duration as a stable benchmark.
- Looking only at time and ignoring keys and documents examined.
- Forgetting that compound key order determines useful prefixes.
- Sorting on a field combination the index cannot support.
- Paginating deeply with large offsets on a fast-growing collection.
- Using an unstable timestamp-only sort.
- Returning full documents when the client needs a few fields.
- Calling <code>lean()</code> and then depending on Mongoose document methods or virtuals.
- Creating indexes for every speculative filter.
- Forgetting index maintenance cost on writes.
- Enabling noisy production profiling without a retention and privacy plan.

## Manually inspect the query improvement

1. Write down the endpoint's exact filter, sort, projection, limit, and expected frequency.
2. Capture an execution plan before changing an index.
3. Compare returned rows with keys and documents examined.
4. Check for an avoidable collection scan or blocking sort.
5. Add one candidate index in a controlled environment.
6. Repeat the same query with representative data and compare plan stages and work counts.
7. Measure the API's user-visible latency separately from the database plan time.
8. Confirm that list ordering stays stable for equal timestamps.
9. Check the index set for overlapping prefixes and unnecessary duplicates.
10. Review write cost, storage, and production rollout before creating or removing an index.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [095 - Validation across the full stack](095-validation-across-the-full-stack.md) | [Lesson](096-profile-mongodb-queries-and-improve-indexes.md) | [Q&A](../qnas/096-profile-mongodb-queries-and-improve-indexes.md) | [Example](../examples/096-profile-mongodb-queries-and-improve-indexes.md) | [097 - Deployment architecture and environment separation](097-deployment-architecture-and-environment-separation.md) |
