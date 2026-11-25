# 096 - Profile MongoDB queries and improve indexes: Q&A

### 1. Why should query optimization start with a measured workload?

**Answer:** An index helps particular query shapes and adds write, memory, and storage costs. Measuring the real filter, sort, projection, result size, frequency, and data distribution helps target an actual bottleneck instead of adding speculative indexes.

### 2. Why can a query that is fast on a small collection become slow later?

**Answer:** A small collection may be scanned cheaply. As document count, indexes, and concurrent requests grow, the same scan or sort may examine far more data and consume more I/O and CPU.

### 3. What does explain("executionStats") show?

**Answer:** It reports the chosen plan and execution statistics for a query, including returned rows, index keys examined, documents examined, and plan stages. It helps reveal how much work the database performed to produce the result.

### 4. What does nReturned mean?

**Answer:** It is the number of results produced by the winning plan. Compare it with keys and documents examined to understand whether the query examined many candidates before finding the requested results.

### 5. What does totalKeysExamined measure?

**Answer:** It counts index entries examined during the query. A high count relative to results can indicate that the relevant index range is broad or that additional filtering discards many candidate keys.

### 6. What does totalDocsExamined measure?

**Answer:** It counts document examinations, including documents later filtered out. It is not the count of unique documents and may exceed the number of results returned.

### 7. Is COLLSCAN always a problem?

**Answer:** No. A collection scan can be appropriate for a small collection or a query expected to match much of the data. Evaluate its work, latency, frequency, and expected growth rather than treating the stage name as an automatic failure.

### 8. Is IXSCAN enough to prove that a query is efficient?

**Answer:** No. An index scan may still examine a large range and fetch many documents. Check keys and documents examined, plan stages, application latency, and write cost.

### 9. What is a FETCH stage?

**Answer:** It retrieves full documents after an index has identified candidate records. If the projection needs fields that are not in the index, a fetch may be needed. Adding fields to make the query covered also makes the index larger, so measure the trade-off.

### 10. What does a SORT stage indicate?

**Answer:** The query is sorting results after scanning rather than obtaining the requested order directly from an index. For a frequent query, a compound index may be able to provide the sort if its key order and directions match.

### 11. What does the Equality-Sort-Range guideline recommend?

**Answer:** A common compound-index starting point is to put equality predicates first, sort keys next, and range predicates after them when index-provided sorting is a priority. It is a guideline to test against the actual workload, not a universal rule.

### 12. Does every compound index need to follow Equality-Sort-Range exactly?

**Answer:** No. Query selectivity, range width, sort needs, index prefixes, and other query shapes may justify a different order. Measure the candidate index with representative data.

### 13. Why does compound index key order matter?

**Answer:** It determines which prefixes of the index can support a query and whether MongoDB can use the index for a requested sort. An index with the correct fields in the wrong order may not efficiently support the desired shape.

### 14. What is an index prefix?

**Answer:** It is a leading sequence of keys in a compound index. An index on owner, status, and creation time can serve queries using owner alone or owner plus status, but generally not a query that filters only by status.

### 15. Can MongoDB use a compound index for any subset of its fields?

**Answer:** Not generally. The leading prefix is important. A query that skips earlier keys may not use the index efficiently for its filter. Check existing index prefixes before adding another index.

### 16. How can equality key order be chosen?

**Answer:** Equality fields can be ordered based on useful prefix reuse, selectivity, and other query patterns. For a single query specifying every equality field, several orders may constrain the same equality portion, but prefix usefulness across the workload differs.

### 17. How should index directions relate to sort directions?

**Answer:** The index pattern must support the requested combination. MongoDB can often traverse a matching index backward for the complete inverse ordering, but mixed direction patterns need a compatible index definition.

### 18. Why include _id in a timestamp sort?

**Answer:** Multiple records can share the same timestamp. A unique tie-breaker makes result order deterministic, which prevents duplicate or skipped results across pages when timestamps tie.

### 19. Why can skip-based pagination slow down on deep pages?

**Answer:** The database must advance past earlier results to reach a large offset, so the amount of work can grow with the page depth. Concurrent inserts can also shift what an offset represents.

### 20. What is cursor pagination?

**Answer:** It uses values from the last result, such as creation time and ID, as a boundary for the next query. A matching index can seek from that position, and the API can return an opaque next cursor.

### 21. Is a cursor an authorization token?

**Answer:** No. It only describes a position in a result order. Every page must still filter by the authenticated owner and check authorization.

### 22. What should a cursor contain?

**Answer:** It should contain the fields required to continue the stable sort, be validated and encoded safely, and avoid exposing sensitive data. Include a unique tie-breaker if the primary sort field can repeat.

### 23. What does projection do?

**Answer:** It limits which document fields are returned. A narrow projection can reduce serialization and network payload, though the database may still fetch the full document if the selected fields are not covered by an index.

### 24. What is a covered query?

**Answer:** It is a query whose filter and returned projection can be satisfied from an index without fetching full documents. Covered queries can reduce document reads, but adding many projected fields can make indexes large and expensive to maintain.

### 25. What does Mongoose lean() do?

**Answer:** It tells Mongoose to return plain JavaScript objects instead of hydrating full Mongoose documents. That can reduce per-result application memory and hydration work for read-only endpoints.

### 26. What Mongoose behavior can lean() skip?

**Answer:** Lean results do not have normal document methods and may not apply getters, virtuals, defaults, change tracking, or other document behavior in the same way. Confirm that serialization does not depend on those features.

### 27. Should every Mongoose query use lean()?

**Answer:** No. Use it when the endpoint only reads and returns plain data. If the code needs document methods, change tracking, setters, or configured virtual behavior, use a normal document or configure lean behavior deliberately.

### 28. What should be considered when optimizing aggregation pipelines?

**Answer:** Inspect the actual plan, filter early when semantics allow, limit and project carefully, and understand the cost of blocking stages and joins. Reordering stages must not change the meaning of the pipeline.

### 29. Does explain executionTimeMillis provide a reliable production latency benchmark?

**Answer:** No. It is one measurement influenced by cache, hardware, plan selection, data, and concurrency. Compare plan work statistics and measure representative application latency over time.

### 30. Why is application latency different from database execution time?

**Answer:** User-visible latency includes network connection, TLS, middleware, authentication, service code, pool wait, database execution, serialization, response transfer, and frontend rendering. Database execution is only one part.

### 31. How do indexes affect writes?

**Answer:** Inserts and updates to indexed fields must maintain each relevant index. More indexes also consume storage and memory and can increase index-build time, so read gains must justify write and operations cost.

### 32. Should an index be added for every possible filter?

**Answer:** No. That can create a large, redundant index set and make writes slower. Prioritize common and costly query shapes, inspect existing prefixes, and measure candidate indexes before deployment.

### 33. Is index intersection a substitute for a compound index?

**Answer:** Not necessarily. MongoDB may combine indexes for some query shapes, but one compound index designed for a frequent filter and sort can be more effective. Inspect the actual winning plan instead of assuming index intersection will be selected.

### 34. Should production automatically build every Mongoose-declared index on startup?

**Answer:** Not always. Large index builds can use significant resources and should be planned against data volume and deployment topology. Many production teams manage index changes through a deliberate migration or operations process.

### 35. How should index removal be approached?

**Answer:** Confirm index usage across the workload and deployment period, check whether it serves another query prefix, and remove it through a controlled change with monitoring and a rollback plan. Do not drop an index just because one endpoint does not use it.

### 36. What is the risk of production profiling?

**Answer:** Detailed profiling can consume resources and store sensitive query values. Use targeted slow-operation logging or short, access-controlled profiling windows with appropriate sampling and retention.

### 37. What should be logged when investigating a slow query?

**Answer:** Log safe route and request identifiers, operation name, status, elapsed time, and relevant aggregate metrics. Avoid dumping full sensitive query values or result documents.

### 38. How should regex search be handled?

**Answer:** A user-provided regular expression can be expensive or match far more data than intended. Prefer an explicit search feature, escape text when it is intended as literal input, bound its length, and choose an indexable search strategy for a large collection.

### 39. Why use representative data when comparing an index?

**Answer:** Selectivity and distribution affect the plan. A sample with too few records or unrealistically uniform values can make an index seem useful or useless in ways that do not match production.

### 40. What is a disciplined query optimization process?

**Answer:** Identify a slow user-visible operation, capture its exact query shape and baseline, inspect the explain plan and work counts, create one targeted candidate index, repeat with representative data, measure application latency and write costs, then deploy and monitor deliberately.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [095 - Validation across the full stack](../lessons/095-validation-across-the-full-stack.md) | [Lesson](../lessons/096-profile-mongodb-queries-and-improve-indexes.md) | [Q&A](096-profile-mongodb-queries-and-improve-indexes.md) | [Example](../examples/096-profile-mongodb-queries-and-improve-indexes.md) | [097 - Deployment architecture and environment separation](../lessons/097-deployment-architecture-and-environment-separation.md) |
