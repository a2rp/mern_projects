# Chapter 029 Q&A: Aggregation pipelines

Use these questions to review pipeline flow, common stages and expressions, array expansion, joins, performance, and safe result handling.

## Part 1: Multiple-choice questions

### 1. What is an aggregation pipeline?

- **A.** An ordered sequence of stages that transforms a stream of documents
- **B.** A schema file that validates every collection
- **C.** A transaction that always updates documents
- **D.** A single index on a collection

**Answer: A.** Each stage processes documents from the prior stage and passes its output to the next stage.

### 2. What does a `$match` stage do?

- **A.** Filters documents using query-style predicates
- **B.** Joins every collection automatically
- **C.** Deletes documents that do not match
- **D.** Creates an index

**Answer: A.** `$match` passes matching documents to later stages and excludes the others from the pipeline result.

### 3. When is an early `$match` especially useful?

- **A.** When it can filter source documents before later work and use an index
- **B.** Only after `$group`
- **C.** When it needs to modify collection data
- **D.** When every document must reach every stage

**Answer: A.** A selective leading match can reduce the input to later stages and may use indexes on the source collection.

### 4. In `{ $multiply: ["$quantity", "$unitPrice"] }`, what does `"$quantity"` mean?

- **A.** The value of the current document's `quantity` field
- **B.** A literal string named `quantity`
- **C.** A collection name
- **D.** A new field being created automatically

**Answer: A.** A field path string beginning with `$` refers to the current document's field value.

### 5. What does `$project` commonly do?

- **A.** Selects, removes, or computes fields in the pipeline output
- **B.** Creates a database user
- **C.** Sorts documents automatically
- **D.** Enforces uniqueness across records

**Answer: A.** A projection reshapes a document by controlling output fields and can calculate values.

### 6. Which stage adds or replaces fields while retaining the other fields?

- **A.** `$set`
- **B.** `$group`
- **C.** `$count`
- **D.** `$skip`

**Answer: A.** `$set` adds fields or replaces same-named fields. `$addFields` is an equivalent stage name.

### 7. What does `$group` use as its group key?

- **A.** Its `_id` expression
- **B.** Its `$sort` field
- **C.** The collection's index name
- **D.** The first field in the input document

**Answer: A.** Documents with the same evaluated `_id` group together. The output also contains any accumulator fields specified in the stage.

### 8. How can `$group` count input documents in each group?

- **A.** `{ $sum: 1 }`
- **B.** `{ $count: 1 }` inside every field
- **C.** `{ $size: "$$ROOT" }`
- **D.** `{ $limit: 1 }`

**Answer: A.** Summing 1 for each input document counts the documents in the group.

### 9. What does `$unwind` do to an array field?

- **A.** Emits a pipeline document for each array element
- **B.** Sorts the array alphabetically
- **C.** Removes the entire collection
- **D.** Converts the array into an index

**Answer: A.** Unwinding increases the number of pipeline documents when arrays contain multiple members.

### 10. By default, what happens to documents whose unwound array is missing, null, or empty?

- **A.** They produce no output document
- **B.** They always produce one output document
- **C.** They are added to a new collection
- **D.** They cause the whole pipeline to fail

**Answer: A.** Set `preserveNullAndEmptyArrays: true` when those documents should remain in the pipeline.

### 11. What does the simple equality form of `$lookup` add to each input document?

- **A.** An array containing matching documents from another collection
- **B.** A unique index
- **C.** A transaction result
- **D.** A scalar foreign key

**Answer: A.** `$lookup` is a left outer join that adds matching documents as an array, which may be empty or contain multiple matches.

### 12. Which stage produces one count result document when at least one document reaches it?

- **A.** `$count`
- **B.** `$unwind`
- **C.** `$skip`
- **D.** `$unset`

**Answer: A.** `$count` returns a document containing the count. If no documents reach it, it returns no result document.

### 13. What does `$facet` do?

- **A.** Runs multiple sub-pipelines over the same input and returns their results in separate arrays
- **B.** Automatically creates an index for every facet
- **C.** Converts every result to a string
- **D.** Writes every input document to a new database

**Answer: A.** Facets support multiple summaries over the same input stream, but their output arrays should be kept bounded.

### 14. Which stages can make a pipeline write results to a collection?

- **A.** `$merge` and `$out`
- **B.** `$match` and `$sort`
- **C.** `$project` and `$set`
- **D.** `$limit` and `$skip`

**Answer: A.** Most aggregation pipelines return transformed results. `$merge` and `$out` are terminal write-side stages.

### 15. What does `collection.aggregate(pipeline)` return in the Node.js driver?

- **A.** An aggregation cursor
- **B.** A single plain object in every case
- **C.** A transaction handle
- **D.** A schema validator

**Answer: A.** The cursor can be iterated or materialized with `toArray()` when the result is safely bounded.

## Part 2: Short-answer questions

### 16. What is the difference between an aggregation stage and an aggregation expression?

**Answer:** A stage processes the document stream, for example `$match`, `$group`, or `$set`. An expression computes a value inside a stage, for example `$multiply` inside `$set`.

### 17. What does `"$price"` mean in an aggregation expression?

**Answer:** It is a field path that refers to the current document's `price` value. A string without the leading `$` is generally a literal string value.

### 18. Why should the data shape be tracked from stage to stage?

**Answer:** Stages such as `$group` replace input documents with grouped output documents, while `$unwind` creates multiple documents and `$project` can remove fields. A later stage can only use fields still present in its input.

### 19. What is a common reason to put `$match` near the beginning?

**Answer:** It filters early so later stages process fewer documents and, when it is an initial source filter, may use collection indexes.

### 20. What does `$group` return besides fields defined by accumulators?

**Answer:** Each group result includes the value computed for `_id`, which is the group key. It does not automatically preserve every original input field.

### 21. When are `$first` and `$last` meaningful?

**Answer:** They are meaningful when the input order has been defined for the result, commonly by a preceding `$sort`. Without an intended order, the selected value may not represent the desired first or last record.

### 22. How do `$push` and `$addToSet` differ?

**Answer:** `$push` collects values into an array and can include duplicates. `$addToSet` collects distinct values. Both can create large arrays, so keep the number and size of accumulated values in mind.

### 23. What does `preserveNullAndEmptyArrays` change in `$unwind`?

**Answer:** When true, documents with a missing, null, or empty array can remain in the pipeline instead of disappearing. The later stages must then handle the absent array element correctly.

### 24. How should an application reason about the result of `$lookup`?

**Answer:** The join result is an array that may be empty, contain one match, or contain multiple matches. Use `$unwind` only if subsequent logic needs one joined record per pipeline document, and decide how unmatched documents should be handled.

### 25. Why can an index on a `$lookup` foreign field matter?

**Answer:** The foreign collection may need to find matching records for each input key. An appropriate foreign-field index can support those lookups; verify the actual workload and plan.

### 26. What does `$count` return when no documents reach the stage?

**Answer:** It returns no result document. Application code should map an empty cursor to zero if an API contract requires a numeric zero.

### 27. What is a useful use for `$facet`?

**Answer:** It can compute multiple bounded summaries over the same filtered input, such as counts by status and a total in separate output arrays.

### 28. Do aggregation pipelines always modify their source collection?

**Answer:** No. Most pipelines return results without changing source documents. `$merge` and `$out` write the pipeline results to a collection.

### 29. Why might the optimized explain output differ from the pipeline as written?

**Answer:** MongoDB can reorder, combine, or absorb eligible stages into lower-level query execution. The displayed plan depends on server version and query shape and may not list one entry for every source stage.

### 30. When is `toArray()` appropriate in the Node.js driver?

**Answer:** It is convenient when the result set is known to be small and bounded. For a large result, iterate the aggregation cursor so the application does not load every result into memory at once.

## Part 3: Practical scenarios

### 31. A report groups all orders by status, but first sends every order through `$unwind` and then filters to paid orders. What should be reviewed?

**Answer:** Move a selective stored-field `$match` earlier if doing so preserves the intended result. Filtering first can avoid unwinding and processing documents that the report does not need.

### 32. A pipeline groups orders by customer and needs each customer's newest order date. How can it select that date deterministically?

**Answer:** Sort the input by the intended date order and a unique tie-breaker, then group and use `$first` or `$last` as appropriate. The sort must establish which record is considered newest.

### 33. An order's `items` array has four elements. What happens after `{ $unwind: "$items" }`?

**Answer:** The order becomes four pipeline documents, one per array element. Any later group or count now operates on item-level rows unless the pipeline groups back to orders.

### 34. A pipeline uses `$lookup`, then `$unwind`, and some source documents disappear. Why might that happen?

**Answer:** The lookup may have returned an empty array and default unwind removes documents with empty arrays. Use `preserveNullAndEmptyArrays` when unmatched source documents should remain and handle missing joined fields downstream.

### 35. Historical revenue changes after a product's current catalog price is edited. The report looks up current price for each old order. What is the modeling problem?

**Answer:** The report is recomputing past revenue from mutable current catalog data. Store a purchase-time price snapshot on each order item, and use that snapshot for historical revenue. A lookup can still enrich current product details, but should not rewrite the historical transaction price.

### 36. An aggregation contains `$match` on a computed field, but the field is created by an earlier `$set`. Can that match be moved before the set?

**Answer:** No, not if the condition depends on the computed value. The match must run after the computation. Move only filters that are independent of earlier transformations.

### 37. A facet response sometimes contains a very large array and fails or consumes substantial resources. What should be changed?

**Answer:** Filter the shared input appropriately and bound each facet's output with relevant grouping, sorting, and limits. Reconsider whether every result belongs in one response document; stream or separate large reports when appropriate.

### 38. An API uses `$count` and returns no JSON body when the collection has no matching documents. What should application code do?

**Answer:** Check whether the aggregation cursor returned a row. If empty, return a count of zero in the API response when that is the expected contract.

### 39. A production aggregation sorts a large stream and reaches memory limits. What should the team investigate first?

**Answer:** Check whether a selective early match can reduce input, whether an index can support the initial access or sort, and whether a sort followed by a meaningful limit is possible. Consider eligible disk spill options after optimizing the input; spill uses I/O and does not fix an unnecessarily broad pipeline.

### 40. A developer adds `$merge` to a reporting pipeline so the output is “cached.” What additional review is needed?

**Answer:** Treat it as a write job. Define and verify the destination, merge or replacement behavior, concurrency and scheduling, permissions, and recovery process. Ensure the pipeline is not unexpectedly invoked by a read-only endpoint.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [028 - Indexes and query performance](../lessons/028-indexes-and-query-performance.md) | [Lesson](../lessons/029-aggregation-pipelines.md) | [Example](../examples/029-aggregation-pipelines.md) | [030 - Transactions and atomic operations](../lessons/030-transactions-and-atomic-operations.md) |
