# 029 - Aggregation pipelines

An aggregation pipeline processes documents through a sequence of stages. A stage can filter, reshape, calculate, group, join, sort, or limit the documents it receives. The output of one stage becomes the input of the next.

Aggregation is useful for reports and transformations that combine many records. A simple lookup or paginated list is often clearer with `find()`; use a pipeline when the result needs multiple data-processing steps.

## Learning goals

By the end of this chapter, you should be able to:

- Explain how pipeline stages and aggregation expressions work together.
- Build a pipeline with `$match`, `$project`, `$set`, `$sort`, and `$limit`.
- Group documents and use common accumulators.
- Expand array values with `$unwind` and join collections with `$lookup`.
- Use `$count`, `$facet`, and bucket stages for common reporting tasks.
- Return results from the Node.js driver as a cursor.
- Use indexes and stage ordering thoughtfully.
- Recognize memory, output-size, data-shape, and write-side-effect concerns.

## Pipeline model

A pipeline is an ordered array of stages. In the MongoDB shell:

~~~javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
  { $sort: { orderCount: -1 } },
  { $limit: 10 }
]);
~~~

The same pipeline can be passed to the Node.js driver:

~~~javascript
const pipeline = [
  { $match: { status: "paid" } },
  { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
  { $sort: { orderCount: -1 } },
  { $limit: 10 }
];

const results = await db.collection("orders")
  .aggregate(pipeline)
  .toArray();

console.log(results);
~~~

The aggregation returns a cursor. Calling `toArray()` loads all results into application memory, which is convenient for a small report. For large results, iterate the cursor instead:

~~~javascript
for await (const row of db.collection("orders").aggregate(pipeline)) {
  console.log(row);
}
~~~

Each stage is generally an object with one top-level stage operator. A stage consumes a stream of documents and outputs a stream for the following stage. Some stages change the document shape or the number of documents. Read every pipeline from left to right and track that changing shape.

## Stages, expressions, and field paths

A **stage** decides how a stream of documents is filtered, reshaped, grouped, joined, or ordered. An **expression** computes a value inside a stage. A **field path** such as `"$price"` refers to the value of a field on the current document. A literal string such as `"paid"` is different from the field path `"$status"`.

For example, `$set` is a stage, while `$multiply` is an expression used by the stage:

~~~javascript
{
  $set: {
    lineTotal: { $multiply: ["$quantity", "$unitPrice"] }
  }
}
~~~

Common expression families include arithmetic, comparisons, boolean logic, conditionals, string operations, date operations, array operations, and type conversions. Operators such as `$ifNull`, `$cond`, `$concat`, `$map`, and `$filter` let a pipeline compute values without first loading every document into application code.

Be clear about data types. For example, multiplying a string that looks like a number is not the same as multiplying a stored numeric value. Validate and normalize data at write boundaries, and use conversion expressions only when they match the intended data policy.

## Common pipeline stages

### `$match` - filter documents

`$match` passes through documents that satisfy a filter and removes the rest:

~~~javascript
{ $match: { status: "paid", total: { $gte: 50 } } }
~~~

Its predicates use the familiar query-filter syntax. Place filters that refer to stored fields near the beginning when possible. A leading match can use collection indexes and reduces the documents later stages must process.

A match on a field computed by a preceding stage must remain after that computation. Do not move a condition earlier if it changes which documents qualify.

### `$project` - choose and reshape fields

`$project` controls the output fields and can compute new ones:

~~~javascript
{
  $project: {
    _id: 0,
    customerId: 1,
    total: 1,
    totalWithTax: { $multiply: ["$total", 1.1] }
  }
}
~~~

An inclusion projection keeps listed fields, while an exclusion projection removes listed fields. Do not mix inclusion and exclusion styles in the same projection except for the special handling of `_id`. Use `$project` when the result shape should change or when a downstream stage needs a computed value.

MongoDB can often move or optimize projections automatically. Adding a projection at the very start solely to reduce fields is not always necessary; keep the pipeline readable and inspect its plan when performance matters.

### `$set` and `$addFields` - add or replace fields

`$set` adds fields or replaces fields with the same names. `$addFields` is an equivalent older stage name:

~~~javascript
{
  $set: {
    fullName: { $concat: ["$firstName", " ", "$lastName"] }
  }
}
~~~

The original fields remain unless they are overwritten or removed later. A field created here can be used by subsequent stages.

### `$sort`, `$skip`, and `$limit` - order and page results

These stages sort, skip, and cap documents:

~~~javascript
{ $sort: { createdAt: -1, _id: -1 } },
{ $skip: 20 },
{ $limit: 10 }
~~~

Sort on a stable tie-breaker such as `_id` when multiple records can share the primary sort value. A sort over a large stream can consume substantial memory unless an index or an optimized sort-limit plan helps. A limit can reduce work after a sort when its position preserves the intended result.

Use skip-based pagination for small offsets. For deep pagination over a large collection, a range or cursor-based approach is often more efficient.

### `$group` - summarize documents

`$group` combines documents with the same group identifier and produces one output document per group. The group identifier is specified with `_id`:

~~~javascript
{
  $group: {
    _id: "$status",
    orderCount: { $sum: 1 },
    averageTotal: { $avg: "$total" },
    largestTotal: { $max: "$total" }
  }
}
~~~

Common accumulators include:

- `$sum` for totals or counts. `{ $sum: 1 }` counts input documents in a group.
- `$avg` for an average.
- `$min` and `$max` for extrema.
- `$first` and `$last` for values from the first or last input document.
- `$push` to collect values into an array, including duplicates.
- `$addToSet` to collect distinct values into an array.

For meaningful `$first` or `$last` results, establish the intended input order with a preceding `$sort`. Group stages can use significant memory, and large arrays accumulated with `$push` or `$addToSet` need careful bounds.

### `$unwind` - expand an array

`$unwind` outputs a document for each element in an array:

~~~javascript
{ $unwind: "$items" }
~~~

If an order contains three items, it produces three pipeline documents. This is useful for per-item reporting, but it increases the number of documents being processed.

By default, documents with a missing, null, or empty array do not produce an output document. Options can preserve such documents and can expose the array position:

~~~javascript
{
  $unwind: {
    path: "$items",
    preserveNullAndEmptyArrays: true,
    includeArrayIndex: "itemPosition"
  }
}
~~~

Use this option when empty or absent arrays should still appear in a report. Decide how a later group should represent documents that have no array member.

### `$lookup` - join another collection

`$lookup` performs a left outer join and adds matching documents as an array. Its simple equality form is:

~~~javascript
{
  $lookup: {
    from: "products",
    localField: "items.sku",
    foreignField: "sku",
    as: "product"
  }
}
~~~

The array may contain zero, one, or multiple matches. Follow it with `$unwind` only when the next calculation needs one joined result per pipeline document. An unwind without `preserveNullAndEmptyArrays` drops documents that have no join match.

An index on the foreign join field often matters for lookup performance. A unique index is appropriate when the relationship expects exactly one foreign document per key. A lookup is not the same as a relational foreign key: the application still has to decide what to do with missing or duplicate matches.

For more complex joins, `$lookup` can use a sub-pipeline and variables. Keep the join conditions selective, and examine the plan and data volume.

### `$count` and `$facet` - report shapes

`$count` returns a document containing the number of documents that reached it:

~~~javascript
{ $count: "paidOrders" }
~~~

If no documents reach `$count`, it returns no result document. Account for that in application code if the API must always return a numeric zero.

`$facet` runs multiple sub-pipelines over the same input and returns their results in separate arrays:

~~~javascript
{
  $facet: {
    byStatus: [
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ],
    totals: [
      { $group: { _id: null, revenue: { $sum: "$total" } } },
      { $project: { _id: 0, revenue: 1 } }
    ]
  }
}
~~~

Facets are useful when one response needs several summaries over the same filtered input. Each facet result is an array inside one output document, so keep result sizes bounded.

### Bucket stages

`$bucket` groups values into explicit ranges. `$bucketAuto` chooses approximate ranges based on a requested number of buckets. These stages help build histograms and distribution summaries. Define boundaries and a default bucket deliberately so edge values have a clear destination.

### `$replaceRoot` and `$unset`

`$replaceRoot` promotes an embedded document to become the pipeline document, while `$unset` removes one or more fields. These can simplify a response shape after a join or transformation. Check that any fields needed by later stages are not discarded accidentally.

## Modifying data with an aggregation

Most pipelines return transformed results without modifying their source documents. `$merge` and `$out` are special write-side stages that store pipeline results in a collection. Treat them as writes: choose the destination deliberately, understand overwrite and merge behavior, and protect production data with an appropriate migration or job process.

~~~javascript
await db.collection("orders").aggregate(pipeline).toArray();
~~~

The pipeline above reads and returns results. Adding a terminal `$merge` or `$out` changes the operation's effect. Do not include one casually in an endpoint intended only to display a report.

## Performance and optimization

1. **Filter early.** Put a selective `$match` on stored fields near the start so collection indexes can restrict incoming documents and later stages process fewer records.
2. **Use indexes for initial access.** A leading `$match` and, in appropriate cases, a leading `$sort` can use indexes. Stages such as `$unwind`, `$group`, or a computed projection before a sort may prevent that sort from using the source collection's index.
3. **Index join keys.** For frequent `$lookup` operations, inspect the foreign collection's join-field index and verify that key types and values match.
4. **Reduce expanded data.** Apply a selective match before `$unwind` when semantics allow, and avoid unwinding an unbounded array if a different data model or calculation would work.
5. **Bound sorting and arrays.** Use a meaningful `$limit` after a sort when the result only needs a page. Keep arrays created by accumulators and facets bounded.
6. **Let the optimizer help, then inspect.** MongoDB can reorder or combine eligible stages. The optimized plan may not have a one-to-one display of the pipeline you wrote; explain output can differ across versions and query shapes.
7. **Use disk spill intentionally.** Some memory-intensive stages can spill temporary data to disk depending on server settings and operation options. `allowDiskUse` may help eligible stages, but it adds I/O and is not a substitute for reducing unnecessary input or output.
8. **Keep results within document limits.** Returned BSON documents have a size limit. A group that builds a very large result array or a facet with huge arrays can fail even when the input documents are valid.

Avoid changing stage order without checking semantics. For instance, moving a limit before a group changes which documents are summarized. The optimizer can safely reorder only transformations whose behavior remains equivalent.

## Inspecting an aggregation plan

The Node.js driver supports explain on an aggregation cursor:

~~~javascript
const explanation = await db.collection("orders")
  .aggregate(pipeline)
  .explain("executionStats");

console.log(explanation);
~~~

Aggregation explain output often has a top-level `stages` array. The initial `$cursor` entry, when present, shows the collection access plan, including any index scan or collection scan. Later entries describe aggregation work. Stages may be absorbed or pushed into lower-level execution, so the explain output may not mirror the written pipeline exactly.

Use representative data and inspect the collection access, execution statistics, sort behavior, and lookup work. Do not assume an aggregation is efficient just because its source code has only a few stages.

## Common mistakes

- Treating aggregation as a replacement for every simple `find()` query.
- Forgetting that a stage's output shape becomes the next stage's input shape.
- Using a literal string where a field path beginning with `$` was intended, or vice versa.
- Grouping before filtering and making every later stage process unnecessary input.
- Expecting `$group` output to retain all fields from its input documents.
- Using `$first` or `$last` without defining the input order.
- Forgetting that `$unwind` changes document count and drops empty arrays by default.
- Assuming `$lookup` creates a foreign-key constraint or returns a single object.
- Returning huge arrays from `$push`, `$addToSet`, or `$facet`.
- Expecting a collection index to support a sort after stages that transform or expand documents.
- Adding `$merge` or `$out` without realizing the pipeline writes data.
- Returning every pipeline result through `toArray()` when the result set is large.

## Practical checklist

Before shipping a pipeline:

- Sketch the input and output shape at each stage.
- Put selective source-field filters early when the semantics permit.
- Confirm numeric, date, and identifier types are consistent.
- Check array behavior before and after `$unwind`.
- Define how missing join matches should be handled.
- Add or verify indexes for frequent initial filters, sorts, and join keys.
- Bound sort results and accumulator arrays.
- Use explain and representative data to inspect work.
- Decide whether results should be streamed or safely materialized.
- Review every `$merge` or `$out` as a write operation.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [028 - Indexes and query performance](028-indexes-and-query-performance.md) | [Q&A](../qnas/029-aggregation-pipelines.md) | [Example](../examples/029-aggregation-pipelines.md) | [030 - Transactions and atomic operations](030-transactions-and-atomic-operations.md) |
