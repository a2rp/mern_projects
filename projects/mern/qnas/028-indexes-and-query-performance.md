# Chapter 028 Q&A: Indexes and query performance

Review how MongoDB indexes support filters and sorts, how compound key order works, and how to use execution statistics to judge whether an index helps.

## Part 1: Multiple-choice questions

### 1. What is the main purpose of a MongoDB index?

- **A.** Help MongoDB locate matching documents without scanning the whole collection
- **B.** Automatically validate every field
- **C.** Replace the collection's documents
- **D.** Guarantee that every query is fast

**Answer: A.** An appropriate index can reduce the work needed to find documents and may also provide a requested sort order. It does not guarantee that every query will be fast.

### 2. What may MongoDB do when no useful index supports a query?

- **A.** Perform a collection scan
- **B.** Create a unique index automatically on every filter field
- **C.** Reject all reads
- **D.** Convert the query into a write

**Answer: A.** A collection scan examines documents in the collection. It can be reasonable for a small collection or a query that returns most documents.

### 3. Which index does MongoDB create automatically for each collection?

- **A.** A unique index on `_id`
- **B.** A text index on every string
- **C.** A TTL index on every date
- **D.** A compound index on every required field

**Answer: A.** Each collection has a unique `_id` index by default. It cannot be dropped.

### 4. What does an index key direction of `1` mean?

- **A.** Ascending order
- **B.** A unique constraint
- **C.** A hashed key
- **D.** A partial index

**Answer: A.** `1` specifies ascending order and `-1` specifies descending order. Direction is especially important for compound sort patterns.

### 5. For a compound index `{ customerId: 1, status: 1, createdAt: -1 }`, which query field is an index prefix by itself?

- **A.** `customerId`
- **B.** `status`
- **C.** `createdAt`
- **D.** None of them

**Answer: A.** A compound index supports its leading field and its leading field combinations. `status` and `createdAt` alone are not prefixes of this index.

### 6. In the ESR guideline, what should usually come first?

- **A.** Equality fields
- **B.** Every range field
- **C.** Projection-only fields
- **D.** Fields in alphabetical order

**Answer: A.** Equality fields usually lead a compound index. After them, choose sort and range order based on the workload.

### 7. When might ERS (range before sort) be preferable?

- **A.** When the range predicate is very selective and reducing scanned keys outweighs avoiding an in-memory sort
- **B.** Whenever the query contains an equality condition
- **C.** When the query has no range predicate
- **D.** To make every query covered

**Answer: A.** ESR is a useful starting point. A highly selective range can justify placing the range key before sort keys, so compare both designs with representative data.

### 8. What does a multikey index support?

- **A.** Queries involving values in an indexed array field
- **B.** Automatic uniqueness of every array value across documents
- **C.** Expiration of documents
- **D.** Search across every string in every collection

**Answer: A.** MongoDB makes an index multikey when it indexes array values. Multikey indexes have additional limits, so inspect the plan for the actual query.

### 9. Which mechanism should enforce that user email addresses are unique across documents?

- **A.** A unique index
- **B.** `minLength`
- **C.** A collection scan
- **D.** A TTL index

**Answer: A.** A unique index enforces a cross-document uniqueness constraint. A validator can check an email's shape but not its uniqueness across records.

### 10. What is the main purpose of a partial index?

- **A.** Index only documents that match a filter expression
- **B.** Index only the first half of every string
- **C.** Automatically divide an index across servers
- **D.** Sort without storing any keys

**Answer: A.** Partial indexes can reduce index size by including only documents that satisfy a specified condition.

### 11. What does a TTL index do?

- **A.** Removes eligible documents after a configured time interval, asynchronously
- **B.** Guarantees deletion at the exact expiration second
- **C.** Automatically archives documents forever
- **D.** Validates date strings in application forms

**Answer: A.** The TTL monitor removes expired documents asynchronously, so TTL should not be treated as precise scheduling or access control.

### 12. What does `IXSCAN` generally indicate in an explain plan?

- **A.** MongoDB is scanning index keys
- **B.** MongoDB is creating an index
- **C.** MongoDB is deleting documents
- **D.** The query is automatically covered

**Answer: A.** `IXSCAN` means the winning plan scans index entries. It may still need to fetch matching documents.

### 13. What does `COLLSCAN` indicate?

- **A.** MongoDB scans documents in the collection
- **B.** The query uses a unique index
- **C.** The query is covered
- **D.** An index is being dropped

**Answer: A.** A collection scan can be acceptable for some workloads, but frequent scans over large collections may warrant an index investigation.

### 14. What must be true for a query to be covered by an index?

- **A.** The index contains the fields needed for the predicate and returned projection
- **B.** The collection must contain exactly one document
- **C.** The query must use a TTL index
- **D.** The query must return every document

**Answer: A.** A covered query can match and return the requested fields from index keys without fetching documents. Account for the default inclusion of `_id` in projections.

### 15. What does `totalDocsExamined` measure in execution statistics?

- **A.** How many documents MongoDB examined
- **B.** How many indexes exist in the database
- **C.** How many documents were deleted
- **D.** The size of the collection in bytes

**Answer: A.** Compare documents examined and keys examined with the number returned to understand how much work the query performed.

## Part 2: Short-answer questions

### 16. Why should an application avoid creating indexes for every field?

**Answer:** Every index uses storage and memory. Inserts must maintain index entries, and updates to indexed fields may also change them. Too many indexes can slow writes and compete for cache without improving important reads.

### 17. How do you create a single-field ascending index with the Node.js driver?

**Answer:** Call `await collection.createIndex({ fieldName: 1 })`. You can pass an options object for a custom name or properties such as uniqueness.

### 18. How do you inspect indexes on a collection in the Node.js driver?

**Answer:** Call `await collection.listIndexes().toArray()` to retrieve the collection's index descriptions.

### 19. Explain the prefix property of a compound index.

**Answer:** An index on `{ a: 1, b: 1, c: 1 }` can support queries that use the leading prefix `a`, `a` plus `b`, or all three fields. It does not efficiently support a query using only `b` or `c`.

### 20. What is the Equality, Sort, Range guideline?

**Answer:** It is a common starting point for ordering compound index fields: equality fields first, then sort fields when avoiding an in-memory sort matters, followed by range fields. Data selectivity and workload goals can justify a different order.

### 21. What should developers compare before choosing between ESR and ERS?

**Answer:** Compare representative query plans and work. If a range predicate is highly selective, putting it before sort keys can scan fewer entries; if avoiding an in-memory sort matters more, sort keys may come first. Evaluate the actual workload.

### 22. How can a compound index provide a sort order?

**Answer:** The sort must align with the index key directions or their complete inverse, after equality predicates on preceding keys. A sort that does not align may require a separate `SORT` stage.

### 23. How is a unique index different from a schema validator?

**Answer:** A validator checks one document's shape and field values. A unique index enforces that indexed values are not duplicated across documents. Existing duplicates must be resolved before the unique index can be built.

### 24. What condition should a query meet to safely use a partial index?

**Answer:** Its predicates must ensure that every result the query needs is represented in the partial index. Often the query should include the same partial filter condition; verify index selection with explain.

### 25. Why is TTL not suitable for precise scheduling?

**Answer:** The TTL monitor removes eligible documents asynchronously. A document can remain after its expiry time, so TTL is for eventual cleanup rather than an exact deadline or authorization decision.

### 26. What does a `FETCH` stage commonly mean after an index scan?

**Answer:** MongoDB used an index to find candidate records, then fetched documents from the collection to evaluate or return fields not available from the index keys.

### 27. What is a covered query?

**Answer:** A covered query can evaluate its conditions and produce the requested projection using only index keys, without fetching collection documents. All required fields must be in the index, and projections must handle `_id` explicitly.

### 28. What do `nReturned`, `totalKeysExamined`, and `totalDocsExamined` tell you?

**Answer:** They report how many documents were returned, how many index entries were examined, and how many collection documents were examined. Their relationship helps assess query work, though no single ratio is a universal performance verdict.

### 29. Why should query plans be checked with realistic data?

**Answer:** Data volume, value distribution, selectivity, server version, and planner decisions affect index usefulness. A plan on a tiny or uniform development dataset may not represent production behavior.

### 30. Why should index creation normally happen through a controlled deployment or management workflow?

**Answer:** Index creation can consume resources and affect a populated collection. Repeating it in request handlers adds operational work to normal traffic. A controlled workflow makes changes reviewable and avoids recurring index-management commands.

## Part 3: Practical scenarios

### 31. A query frequently filters orders by `customerId` and `status`, sorts by newest creation time, and returns a small page. What index should be evaluated?

**Answer:** Start by evaluating `{ customerId: 1, status: 1, createdAt: -1 }`. Equality fields lead, and the date key supports the newest-first sort. Confirm the actual plan and whether the date-range predicate changes the best field order.

### 32. A compound index is `{ department: 1, status: 1, dueAt: 1 }`. A query filters only on `status` and sorts by `dueAt`. Why might this index not help as expected?

**Answer:** `status` is not a prefix because `department` comes first. Design an index for the real query pattern, or revise the query if the department filter is part of its intended access path.

### 33. Explain shows `IXSCAN`, but the query still examines many documents and takes too long. What should be investigated?

**Answer:** Check `totalKeysExamined`, `totalDocsExamined`, and `nReturned`; inspect index bounds and selectivity, compound key order, extra filters, sort stages, and whether many candidate documents must be fetched. An index scan alone does not prove the query is efficient.

### 34. Explain shows `COLLSCAN` for an administrative query that reads most of a tiny collection once a month. Must the team add an index?

**Answer:** Not necessarily. A collection scan may be the simplest and most efficient choice when most documents are needed or the collection is small. Add an index only if measured workload value justifies its write and storage costs.

### 35. An application repeatedly queries open orders by customer, but most orders are closed. What index design might reduce index size?

**Answer:** Evaluate a partial index on the customer and sort fields with a filter for `status: "open"`. Make sure the query implies the partial filter and confirm the planner can use it.

### 36. An index supports a filter, but explain shows a `SORT` stage for a frequent list endpoint. What should be checked?

**Answer:** Check whether the compound key order and directions match the filter and requested sort, including equality predicates on leading fields. Add or adjust an index only after confirming the sort cost with representative data.

### 37. A query returns only fields that are indexed but still has a `FETCH` stage. What common projection issue should be checked?

**Answer:** Check whether `_id` is being returned implicitly. If the index does not contain it and the response does not need it, explicitly project `_id: 0`. Also confirm every filter and output field is present in the index.

### 38. A team adds a unique index and index creation fails because of duplicate emails. What is the correct next step?

**Answer:** Find and resolve existing duplicates according to the product's data policy, then retry the unique index build. Do not use a validator as a substitute for the cross-document uniqueness rule.

### 39. A team proposes a TTL index to make expired login sessions unusable at the exact expiry time. Is this sufficient?

**Answer:** No. TTL deletion is asynchronous. The application must check session expiry during authorization; TTL can remove expired records later as cleanup.

### 40. A candidate index appears unused in a monitoring snapshot from a quiet day. Should it be dropped immediately?

**Answer:** No. Check a representative observation period, application query patterns, scheduled jobs, rare but important paths, and operational metrics. Follow a controlled change process and verify the effect after removal.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [027 - Schema validation and data integrity](../lessons/027-schema-validation-and-data-integrity.md) | [Lesson](../lessons/028-indexes-and-query-performance.md) | [Example](../examples/028-indexes-and-query-performance.md) | [029 - Aggregation pipelines](../lessons/029-aggregation-pipelines.md) |
