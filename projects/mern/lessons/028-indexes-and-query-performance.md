# 028 - Indexes and query performance

MongoDB indexes are data structures that help the database find documents without scanning every document in a collection. They can also provide the order needed by a sort. A well-chosen index can make a frequent query much faster; an unnecessary index consumes storage and makes inserts, updates, and deletes more expensive.

The goal is not to add an index to every field. Start with the queries the application actually runs, then measure whether an index helps. This chapter builds on the MongoDB data modeling and validation chapters and prepares you to reason about query patterns in [Chapter 029](029-aggregation-pipelines.md).

## Learning goals

By the end of this chapter, you should be able to:

- Explain how indexes help queries and why they also have costs.
- Create and remove common MongoDB indexes.
- Choose single-field and compound indexes from real query patterns.
- Apply compound index prefixes and the Equality, Sort, Range guideline.
- Understand unique, partial, multikey, TTL, text, geospatial, hashed, and wildcard indexes at a practical level.
- Read an execution plan using `explain("executionStats")`.
- Recognize collection scans, index scans, fetches, and covered queries.
- Measure index use and avoid speculative or redundant indexes.

## What an index does

An index stores selected field values in an ordered structure, along with references to the documents that contain those values. When a query can use an index, MongoDB can search a smaller set of index entries instead of examining every document. An index can also provide a requested sort order.

Without a useful index, MongoDB may perform a collection scan, shown as `COLLSCAN` in an explain plan. A collection scan is not automatically a problem: it can be reasonable for a small collection, a query that returns most documents, or a one-time operation. The concern is repeated work over a large collection when a selective index could narrow the search.

MongoDB automatically creates a unique index on `_id` for each collection. Other indexes are chosen and managed for the application's query patterns.

## Creating and inspecting indexes

In the MongoDB shell, create a single-field ascending index like this:

~~~javascript
db.products.createIndex({ sku: 1 });
~~~

In the Node.js driver, use the collection method:

~~~javascript
const indexName = await products.createIndex(
  { sku: 1 },
  { name: "sku_ascending" }
);

console.log(indexName);
~~~

A key direction of `1` means ascending; `-1` means descending. For a single field, either direction can support equality lookups. Direction matters more when multiple fields are combined to support a sort.

Use `listIndexes()` in the shell or driver to inspect a collection's current indexes:

~~~javascript
const indexes = await products.listIndexes().toArray();
console.log(indexes);
~~~

An index with the same key specification and options is not recreated each time `createIndex()` is called. Index creation is normally part of controlled deployment or database setup, not something an ordinary API request repeats.

To remove an index by its name:

~~~javascript
await products.dropIndex("sku_ascending");
~~~

Never drop an index just because it appears unused in a short observation window. First confirm its role, check application query patterns and operational metrics, and follow the deployment process for your environment. The `_id` index cannot be dropped.

## Common index types

| Index type | Typical purpose | Key point |
| --- | --- | --- |
| Single-field | Frequent lookups, ranges, or sorts on one field | Can index a top-level or dotted embedded field |
| Compound | A query pattern using multiple fields or a sort | Field order matters; prefixes are useful |
| Multikey | Queries on array values | MongoDB automatically makes an index multikey when it indexes an array field |
| Unique | Prevent duplicate indexed values | Enforces a cross-document constraint that a validator cannot |
| Partial | Index only documents matching a filter | Smaller index; queries must be compatible with the filter |
| TTL | Expire documents after a time interval | Cleanup is asynchronous; expiration is not an exact-time scheduler |
| Text | Basic text search in self-managed MongoDB | Separate from Atlas Search and its search indexes |
| Geospatial | Location and geometry queries | Choose the geospatial index type for the stored coordinate format |
| Hashed | Equality lookup and certain sharding designs | Does not preserve order for range queries or sorting |
| Wildcard | Queries over varying or unknown field paths | Flexible but should not replace deliberate indexes for known patterns |

Additional index properties include sparse behavior, collation, and hidden indexes. Pick these only after understanding their semantics. A partial index is often more expressive than a sparse index because its filter can include conditions beyond field existence.

For embedded fields, index a dotted path such as `"address.city"`. For arrays, a multikey index can support queries on array members. Indexing an array does not mean every query over nested array structures will use it; check the actual plan.

## Compound indexes

A compound index stores multiple keys in the order you specify:

~~~javascript
db.orders.createIndex({
  customerId: 1,
  status: 1,
  createdAt: -1
});
~~~

This index can support queries on the leading prefix fields, including:

- `customerId`
- `customerId` and `status`
- `customerId`, `status`, and `createdAt`

It does not efficiently support a query only on `status` or only on `createdAt` because those fields are not a prefix of this index. Compound index order is part of the design, not merely a list of fields.

A query that filters by one leading field may still use the compound index even if it does not use every field. But adding fields to an index makes the index larger and adds write work. Avoid adding fields “just in case.”

### Equality, Sort, Range (ESR)

For many compound query patterns, use the Equality, Sort, Range guideline:

1. Put equality-match fields first.
2. Then put sort fields if avoiding an in-memory sort is important.
3. Put range fields after the sort when that priority fits the workload.

For example, suppose an application often finds open orders for one customer, sorts newest first, and then restricts a date range:

~~~javascript
db.orders.find({
  customerId: ObjectId("65a000000000000000000001"),
  status: "open",
  createdAt: { $gte: ISODate("2026-01-01T00:00:00Z") }
}).sort({ createdAt: -1 }).limit(20);
~~~

A candidate index is:

~~~javascript
db.orders.createIndex({
  customerId: 1,
  status: 1,
  createdAt: -1
});
~~~

The equality fields lead the index, and the date key can support the sort and range. ESR is a starting guideline, not a universal law. If the range condition is highly selective and reducing scanned keys matters more than avoiding an in-memory sort, placing the range field before sort fields (often called ERS) may perform better. Compare candidate indexes with representative data and explain plans.

### Compound sort direction

A compound index can support a sort that follows its key direction pattern, or the complete inverse direction pattern, subject to equality predicates on earlier keys.

For example, an index on `{ customerId: 1, createdAt: -1 }` can support a query fixed to one `customerId` and sorted by `createdAt: -1`. Reversing the sort to `createdAt: 1` can also use the index in the opposite direction. A mixed sort such as `{ customerId: -1, createdAt: -1 }` does not match either direction pattern for that index.

If MongoDB cannot get the requested order from an index, the explain plan may show a `SORT` stage. A sort stage can use memory and may spill depending on the operation and server settings. Use a compatible index when a sort is frequent and costly, then verify the plan.

## Unique and partial indexes

A unique index enforces that indexed values are unique across documents:

~~~javascript
await users.createIndex(
  { email: 1 },
  { unique: true, name: "email_unique" }
);
~~~

Before adding a unique index to existing data, find and resolve duplicates. The index build will fail if current records violate the uniqueness rule. A validator can require an email string or constrain its format, but only a unique index can enforce cross-document uniqueness.

A partial index contains only documents that match a filter:

~~~javascript
await orders.createIndex(
  { customerId: 1, createdAt: -1 },
  {
    partialFilterExpression: { status: "open" },
    name: "open_orders_by_customer"
  }
);
~~~

This can reduce index size when the application repeatedly queries a well-defined subset. A query can use the partial index only when its conditions ensure that using the index cannot omit matching documents. Include the partial filter condition in the query when needed and confirm index use with explain.

## Other specialized behavior

### Multikey indexes

When an indexed field contains an array, MongoDB creates multikey index entries for the array values. This supports common membership queries. Multikey indexes have additional rules and cannot support every sort, compound-array, or covered-query shape. Inspect the plan for the exact query rather than assuming an array index will help.

### TTL indexes

A TTL index automatically removes documents after a configured interval based on a date field:

~~~javascript
await sessions.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "sessions_expire_at" }
);
~~~

The TTL monitor removes expired documents asynchronously. A document may remain for a while after its expiration time, so TTL is appropriate for eventual cleanup, not for precise scheduling or access control. A TTL index is a single-field index.

### Text and Atlas Search

A self-managed MongoDB text index supports basic text search through text query operators. MongoDB Atlas Search is a separate search capability with its own index definitions and richer search features. Do not assume that creating a regular text index creates an Atlas Search index.

### Geospatial, hashed, and wildcard

Use a geospatial index such as `2dsphere` for supported location queries on GeoJSON-style coordinates. Hashed indexes store hashed key values and are useful for equality-oriented workloads, but they do not maintain the original value order for range queries or sorting. Wildcard indexes can help when the queried field paths vary, but a targeted index is usually easier to reason about when fields and query shapes are known.

## Reading an explain plan

Use `explain("executionStats")` to inspect a query plan and its observed work:

~~~javascript
const explanation = await orders
  .find({ status: "open" })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats");

console.log(explanation.queryPlanner.winningPlan);
console.log(explanation.executionStats);
~~~

Plan stage names are nested and can differ by server version and query shape. Common stages include:

- `COLLSCAN`: MongoDB scans the collection.
- `IXSCAN`: MongoDB scans index keys.
- `FETCH`: MongoDB reads matching documents after using an index to find candidates.
- `SORT`: MongoDB performs a sort not provided by the index.
- `LIMIT`: The plan limits the number of results.

Look at these execution statistics:

- `nReturned`: documents returned by the operation.
- `totalKeysExamined`: index entries examined.
- `totalDocsExamined`: documents examined.

Compare work to useful results. If a query returns 10 documents but examines thousands of keys or documents, investigate selectivity, index key order, predicates, and sort support. A large keys-to-results ratio is a clue, not an automatic proof that an index is bad; data distribution and query intent matter.

A covered query can satisfy its predicates and return its projected fields using only an index, without fetching documents. To make this possible, all fields needed by the query and projection must be available in the index. MongoDB normally includes `_id` in a projection unless you explicitly exclude it. Extra fields enlarge indexes, so design a covering index only when the read pattern justifies that cost.

The `explain` operation is diagnostic. Its results are not a substitute for measuring representative application workloads, and explain plans can vary with data size, distribution, server version, and planner decisions. Use `executionStats` thoughtfully on production systems because it executes the winning plan to gather statistics.

## Indexes and application query patterns

Design indexes from observed and expected query shapes:

1. Record common filters, sorts, projections, and limits from the application.
2. Rank them by frequency, latency, and impact.
3. Design a small set of indexes that supports important reads and uniqueness rules.
4. Use realistic data volumes and distributions to compare plans and timings.
5. Observe write latency and index storage after deployment.
6. Recheck index usage as the product and data change.

A list endpoint that filters by a fixed status, sorts by creation time, and pages through records may need a compound index. A lookup by a unique account email needs a unique index. A rarely used ad hoc filter on a tiny collection may not need a dedicated index.

When sorting by a non-unique field for pagination, add a stable unique tie-breaker (often `_id`) to the sort and, when useful, to the index. This keeps page ordering deterministic when multiple documents have the same sort value.

## Index costs and common mistakes

Every index consumes disk space and memory. Inserts must add index entries; updates to indexed fields may change them; deletes remove them. Large or numerous indexes can increase write latency and compete for cache.

Common mistakes include:

- Creating an index for every field without checking workload value.
- Reversing compound key order without considering prefixes and query patterns.
- Assuming an index is useful because one of its fields appears somewhere in a filter.
- Expecting an index to support a sort that conflicts with its key order.
- Forgetting to resolve duplicates before building a unique index.
- Using a partial index for a query that does not imply its filter condition.
- Treating TTL expiry as an exact deadline.
- Building a covering index that becomes too large for a small read benefit.
- Trusting a development explain plan that uses tiny or unrealistic data.
- Dropping an index based on a short sample of usage.
- Creating indexes repeatedly in a request handler.

## Practical checklist

Before shipping an index:

- Identify the query pattern it should support.
- Check equality fields, sort order, ranges, projection, and limit together.
- Verify compound prefixes and sort directions.
- Resolve existing duplicates before adding uniqueness.
- Check whether a partial filter matches the intended queries.
- Inspect the winning plan and execution statistics with realistic data.
- Measure read improvement alongside write cost and storage.
- Monitor usage after deployment and review indexes periodically.
- Keep index creation and removal in a controlled deployment or database-management workflow.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [027 - Schema validation and data integrity](027-schema-validation-and-data-integrity.md) | [Q&A](../qnas/028-indexes-and-query-performance.md) | [Example](../examples/028-indexes-and-query-performance.md) | [029 - Aggregation pipelines](029-aggregation-pipelines.md) |
