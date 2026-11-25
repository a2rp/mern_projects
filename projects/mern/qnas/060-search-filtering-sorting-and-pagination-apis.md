# 060 - Search, filtering, sorting, and pagination APIs: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included for self-study.

## Multiple-choice questions

### 1. Why should an API parse `req.query` before building a database filter?

- A. Express query values are always trusted strings.
- B. Query values are client-controlled and may have unexpected shapes or values.
- C. Mongoose does not support filters.
- D. It disables pagination.

**Answer: B.** Query parameters are untrusted input. Parsing lets the application validate types and construct database fields and operators itself.

### 2. Which approach is unsafe for a listing endpoint?

- A. Map a known `sort` value to a server-owned field.
- B. Validate a page size against a maximum.
- C. Pass `req.query` directly to `Model.find()`.
- D. Parse a price bound as a strict nonnegative integer.

**Answer: C.** Passing the entire query object can expose database operators and unexpected nested values to clients.

### 3. What does an allowlist for sorting accomplish?

- A. It permits only documented field names and keeps sort behavior controlled.
- B. It makes all MongoDB queries use an index.
- C. It automatically validates user authorization.
- D. It eliminates the need for a tie-breaker.

**Answer: A.** Mapping a small set of public sort names to server-owned fields prevents arbitrary field and sort-object selection.

### 4. Why add a unique tie-breaker such as `_id` to a sort?

- A. To randomize equal values on each request.
- B. To define a deterministic order when primary sort values are equal.
- C. To avoid validating the sort direction.
- D. To make the total count exact.

**Answer: B.** A unique secondary field establishes a stable order for records with the same main sort value.

### 5. What is the usual offset for one-based page number `page` and page size `limit`?

- A. `page + limit`
- B. `page * limit`
- C. `(page - 1) * limit`
- D. `limit - page`

**Answer: C.** Page 1 starts at offset 0, so the number of skipped records is `(page - 1) * limit`.

### 6. Which resource limit is essential for a public collection endpoint?

- A. A maximum page size.
- B. A requirement that every page contain at least one item.
- C. An unlimited offset.
- D. A client-selected database projection.

**Answer: A.** A capped page size bounds response size and helps prevent a single request from forcing excessive work.

### 7. What is one important trade-off of offset pagination?

- A. It cannot be used with sorting.
- B. Deep offsets can become slower as the database walks past earlier matches.
- C. It never supports numbered pages.
- D. It requires a browser session.

**Answer: B.** Large skip values may require traversing many matching records and can become inefficient.

### 8. What information commonly defines a keyset cursor for a sorted result?

- A. The last item's sort values, including a unique tie-breaker.
- B. The current browser window size.
- C. The database password.
- D. The exact stack trace of the previous request.

**Answer: A.** The next query uses the last item from the prior page as a boundary; a unique tie-breaker avoids ambiguity.

### 9. What can fetching `limit + 1` records tell a cursor-paginated endpoint?

- A. Whether there is another page, without counting the full result set.
- B. Whether every record is valid.
- C. Whether the user is an administrator.
- D. Whether the index is unique.

**Answer: A.** If one extra record exists, the endpoint can return the first `limit` and set `hasNextPage` to true.

### 10. What is true about base64-encoding a cursor?

- A. It encrypts and hides the cursor contents.
- B. It prevents clients from changing the cursor.
- C. It is encoding, not encryption or integrity protection.
- D. It makes cursor fields safe to trust without validation.

**Answer: C.** A client can decode and modify base64 data. Validate cursor fields and sign them when tampering must be detected.

### 11. Which behavior should a category filter usually use?

- A. Accept arbitrary MongoDB operators from the URL.
- B. Validate a value against supported categories and build the field condition server-side.
- C. Use the category as a JavaScript property name without checks.
- D. Ignore authorization constraints.

**Answer: B.** The API should validate category values and construct the MongoDB condition itself.

### 12. Why should a client not supply arbitrary regular-expression syntax for search?

- A. It may create expensive patterns and expose database query behavior.
- B. Regex cannot represent text.
- C. Express rejects every query string containing punctuation.
- D. Sorting will stop working.

**Answer: A.** Unbounded or pathological regex patterns can consume substantial query resources; define search semantics and constrain input.

### 13. What should authorization filters such as tenant ID be based on?

- A. The client's requested `tenantId` query parameter alone.
- B. Server-side authenticated identity and authorization rules.
- C. The sort field.
- D. The requested page number.

**Answer: B.** A client filter must never replace access control. Tenant and ownership scope should come from trusted server-side identity.

### 14. What does a database index do for a query?

- A. It can improve supported read patterns while adding storage and write-maintenance cost.
- B. It guarantees every query is fast.
- C. It makes validation unnecessary.
- D. It automatically supports every combination of filters.

**Answer: A.** Indexes help selected query patterns, but consume resources and do not automatically optimize all possible combinations.

### 15. Why can a separate page query and total-count query disagree slightly?

- A. Concurrent writes can occur between the two operations.
- B. JSON cannot represent numbers.
- C. The sort direction changes the database clock.
- D. Mongoose always caches a count.

**Answer: A.** Without stronger consistency guarantees, two independent operations may observe different collection states.

### 16. When is cursor pagination often preferable to offset pagination?

- A. For large feeds or deep navigation where stable continuation and bounded work matter.
- B. Whenever users must jump directly to any numbered page.
- C. For every in-memory array.
- D. Only when no sort is applied.

**Answer: A.** Cursors are useful for sequential navigation through large or changing datasets; they are less suited to jumping to arbitrary page numbers.

### 17. What is a robust response to an unsupported sort field?

- A. Use it directly and return whichever records MongoDB finds.
- B. Reject it with the documented client-error response.
- C. Return a server stack trace.
- D. Silently sort by a random field.

**Answer: B.** Rejecting unsupported values makes the API contract explicit and prevents arbitrary query control.

### 18. What should a public response do with raw Mongoose documents?

- A. Return every field automatically.
- B. Map or project only the documented public fields.
- C. Include model methods in JSON.
- D. Add database credentials for debugging.

**Answer: B.** Explicitly mapping the public shape avoids accidental exposure of internal fields and keeps the response contract stable.

### 19. Why should a count be optional in some list APIs?

- A. Counting all matches can add cost when the client only needs to know whether another page exists.
- B. Counts cannot be sent in JSON.
- C. A count disables sort.
- D. Pagination never needs metadata.

**Answer: A.** If the interface only needs a next-page indicator, a cursor plus one extra fetched item can avoid an expensive full count.

### 20. What should guide compound-index design?

- A. Real filter-and-sort patterns measured with representative data.
- B. Alphabetical order of schema fields.
- C. The number of frontend components.
- D. The assumption that every field needs an index.

**Answer: A.** Index design depends on actual query patterns, sort order, selectivity, data size, and write costs.

## Short-answer questions

### 21. Why should duplicate query parameters have a documented behavior?

**Answer:** A repeated key may be parsed as an array or another shape. The API should explicitly reject duplicates or define how they are handled so clients cannot rely on ambiguous behavior.

### 22. How should a server handle a requested limit above its configured maximum?

**Answer:** Follow a documented policy: reject it or clamp it consistently, and return metadata that makes the effective limit clear. Never allow an unbounded page size.

### 23. Explain the difference between filtering and authorization.

**Answer:** Filtering narrows the results the caller asks to view. Authorization determines which records the caller is allowed to access and must be derived from trusted server-side identity and policy.

### 24. What must an API define when it offers a `q` search parameter?

**Answer:** It should define the matching semantics, such as prefix, substring, full-text, or external search; input bounds; case/language behavior where relevant; and expected limitations or ranking.

### 25. Why should a sort allowlist be small?

**Answer:** Every supported field can affect performance, indexes, and information exposure. A small documented set is easier to validate, optimize, and support.

### 26. What are the key fields in a cursor for a compound sort?

**Answer:** The values needed to resume after the last returned record for every sort key, including a unique tie-breaker such as `_id`.

### 27. Why should a cursor be tied to its sort and filters?

**Answer:** Reusing a cursor with a different query can skip or duplicate results. The server should validate that the cursor belongs to the same sort and relevant filter state.

### 28. Name two costs of adding a database index.

**Answer:** Indexes consume storage and add work to writes and index maintenance. They also require planning and monitoring as data and query patterns change.

### 29. Why might page metadata report `hasNextPage` instead of a total page count?

**Answer:** Determining the total can require counting all matching records. A next-page flag can be cheaper, especially when the query fetches one extra record.

### 30. How should a collection endpoint respond to an invalid range such as a minimum price greater than the maximum?

**Answer:** Reject it with the documented client-error status and stable error shape. Do not silently swap values or issue a query with contradictory bounds.

## Application questions

### 31. The API uses `Product.find(req.query)`. What should be changed?

**Answer:** Parse and validate recognized scalar parameters, then construct a new filter from fixed field names and server-defined operators. Ignore or reject unsupported keys rather than passing the request object to Mongoose.

### 32. Products with the same price appear twice or disappear between pages while the collection is unchanged. What likely needs improvement?

**Answer:** Add a unique tie-breaker such as `_id` to the sort and use the same compound ordering when computing page boundaries.

### 33. A client can set `?sort=passwordHash`. How should the endpoint change?

**Answer:** Accept only named sort options from an allowlist, map each option to an approved server field, and reject unsupported values.

### 34. A listing endpoint allows `limit=1000000`. What should the team do?

**Answer:** Strictly parse the value, impose a documented maximum page size, and consider rate limits or query time bounds for expensive endpoints.

### 35. The product owner needs to browse a feed with millions of records. Page 5000 is slow. What pagination strategy should be considered?

**Answer:** Use keyset or cursor pagination with an indexed stable sort and a cursor based on the last returned sort values plus a unique tie-breaker. Bound or deprecate deep offset access if appropriate.

### 36. A cursor is base64-encoded JSON and a user changes its `tenantId`. What protections are missing?

**Answer:** Do not trust decoded client data. Validate cursor fields, derive authorization scope from the authenticated identity, and sign the cursor if tamper detection is needed. Bind it to the sort and filter state.

### 37. A page query returns items and a parallel count occasionally reports a total that does not exactly match the page snapshot. Why, and what could the API do?

**Answer:** Concurrent writes may occur between the independent operations. Document the total as current rather than snapshot-exact, omit it if unnecessary, or use stronger consistency only when the product requires it.

### 38. Search by arbitrary case-insensitive regex causes slow queries. What are safer options?

**Answer:** Bound the term, escape metacharacters if regex is used, and define the matching mode. Prefer an indexed prefix strategy, MongoDB text search, or a dedicated search service when the dataset and product requirements justify it.

### 39. A user supplies `category=electronics`, but the product belongs to another tenant. Why is that not enough to prevent access?

**Answer:** Category is a client-selected filter, not access control. The server must add tenant/ownership constraints using the authenticated identity independently of the query parameters.

### 40. The team has added indexes for every optional filter combination and writes have slowed. What should they do?

**Answer:** Measure the real query patterns and inspect query plans with representative data. Keep indexes that support frequent or important filter-and-sort combinations, and remove unnecessary indexes while weighing read performance against write and storage cost.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [059 - Test Express routes and services](../lessons/059-test-express-routes-and-services.md) | [Lesson](../lessons/060-search-filtering-sorting-and-pagination-apis.md) | [Example](../examples/060-search-filtering-sorting-and-pagination-apis.md) | [061 - React mental model and declarative UI](../lessons/061-react-mental-model-and-declarative-ui.md) |
