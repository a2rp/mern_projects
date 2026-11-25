# 022 - Sort, limit, skip, and pagination: Questions and Answers

Use these questions to review cursor sorting, bounded results, offset pages, range-based cursor pagination, and reliable next-page detection. Answers include the reasoning behind each choice.

Related lesson: [022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md)

## Multiple-choice questions

### 1. What does `sort({ createdAt: -1 })` request?

- A. Sort by creation time in descending order
- B. Sort by creation time in ascending order
- C. Skip the newest record
- D. Limit the result to one record

**Answer: A.** A sort direction of `-1` is descending; `1` is ascending.

### 2. What order should you assume when a query has no sort?

- A. The collection's insertion order
- B. The order of the generated ObjectIds
- C. No guaranteed order
- D. Alphabetical order

**Answer: C.** MongoDB does not guarantee query result order unless the query specifies a sort.

### 3. Why add a unique field such as `_id` after a non-unique sort field?

- A. To make ordering among ties deterministic
- B. To limit the number of documents
- C. To create a new document
- D. To remove duplicate values from the collection

**Answer: A.** If several records share the primary sort value, a unique tie-breaker gives the records a defined relative order.

### 4. What does `limit(10)` mean?

- A. Return at most ten matching documents
- B. Return exactly ten documents in every case
- C. Skip ten matching documents
- D. Return ten fields per document

**Answer: A.** A limit caps the maximum; fewer documents can be returned if fewer match.

### 5. What does `skip(20)` do?

- A. Omits the first 20 documents in the query result order
- B. Omits all documents after the twentieth
- C. Limits the result to 20 documents
- D. Skips 20 fields from each document

**Answer: A.** `skip()` selects an offset into the result set. Use a defined sort when that offset must refer to predictable records.

### 6. What is the offset for one-based page 4 with 10 results per page?

- A. 40
- B. 30
- C. 14
- D. 4

**Answer: B.** The formula is `(page - 1) * pageSize`, so `(4 - 1) * 10 = 30`.

### 7. What risk comes from using `skip()` without a sort?

- A. It may omit arbitrary documents because result order is not guaranteed.
- B. It automatically deletes skipped documents.
- C. It converts results to a cursor.
- D. It always returns an empty page.

**Answer: A.** Offsets are meaningful only when the order is defined.

### 8. Why can a deep offset be slower than an early page?

- A. The database must advance past the skipped results.
- B. Each skipped document is copied to the client.
- C. The sort direction reverses automatically.
- D. MongoDB creates one collection per page.

**Answer: A.** As the offset grows, the server has to do more work advancing through the result set.

### 9. What can happen to offset pages if a new record is inserted near the beginning between requests?

- A. Records can shift between pages, causing a duplicate or a missed record during navigation.
- B. Every page becomes a snapshot automatically.
- C. The inserted record is discarded.
- D. The page size changes permanently.

**Answer: A.** Offset positions are relative to the current result set. Changes between requests can move page boundaries.

### 10. Which is a good fit for offset pagination?

- A. Shallow pages where users need to jump to numbered pages
- B. Very deep pages in a huge, rapidly changing feed
- C. A query that must never sort results
- D. A request with an unlimited page size

**Answer: A.** Offset pagination is simple and supports numbered pages, particularly when offsets remain modest.

### 11. Which is a common benefit of range-based cursor pagination?

- A. It can continue after the last sort values without scanning a large numeric offset.
- B. It guarantees a database snapshot across all HTTP requests.
- C. It removes the need for a sort.
- D. It always returns every matching document.

**Answer: A.** A continuation filter can use the last seen sort values to find the next range. It does not by itself freeze the dataset.

### 12. For descending order by `createdAt` and `_id`, what does a continuation cursor need?

- A. The last returned document's createdAt and _id values
- B. Only the requested page number
- C. The whole collection
- D. The MongoDB connection URI

**Answer: A.** Both sort values are needed to continue through the lexicographic order, especially when timestamps tie.

### 13. Why must the cursor filter account for ties in `createdAt`?

- A. Several records may have the same date, so the unique tie-breaker must continue the order.
- B. Dates cannot be sorted.
- C. A tie means the record is invalid.
- D. MongoDB deletes tied records.

**Answer: A.** The continuation condition compares the primary field first and the tie-breaker when primary values are equal.

### 14. If a descending cursor page sorts by date and then ID, what is the tie branch of the next-page filter?

- A. Same date and a smaller ID
- B. Same date and a larger ID
- C. Any date and the same ID
- D. Missing date only

**Answer: A.** In descending order, the next records after the cursor have smaller sort values; when the date is equal, compare the ID in its descending direction.

### 15. Why request `pageSize + 1` records?

- A. The extra record tells whether at least one more result exists.
- B. It makes the database return a full page even when fewer match.
- C. It produces a stable sort automatically.
- D. It is needed to create an index.

**Answer: A.** If the query returns more than the visible page size, the caller can set `hasNextPage` to true.

### 16. Which record should define the next cursor after a look-ahead fetch?

- A. The last record actually returned to the caller
- B. The extra look-ahead record
- C. The first record in the collection
- D. A random record

**Answer: A.** The next request must continue after the last visible result. Using the extra record would skip it.

### 17. Does a unique sort order guarantee an unchanged dataset across multiple HTTP page requests?

- A. Yes, unique sorting creates a snapshot.
- B. No, records can still be inserted, updated, or removed between requests.
- C. Yes, but only when using skip.
- D. No, because MongoDB cannot sort by unique fields.

**Answer: B.** Deterministic ordering resolves ties for a data state, but independent requests do not automatically share a snapshot.

### 18. What is a safe policy for a user-supplied page size?

- A. Validate it and enforce a reasonable maximum.
- B. Use it directly without checking.
- C. Treat it as a MongoDB operator document.
- D. Allow any value, including negative fractions.

**Answer: A.** Validation prevents malformed offsets and unexpectedly large result payloads.

### 19. What should be considered when choosing an index for a frequent page query?

- A. The query's filter and sort pattern
- B. Only the visual page number
- C. The CSS class of the page
- D. The text of the button label

**Answer: A.** Indexes should support real query patterns, including their filters and sort fields.

### 20. How should an API treat a client-provided cursor token?

- A. Validate and decode its expected sort values before constructing a server-side filter.
- B. Pass it as a raw MongoDB query object.
- C. Use it as the database password.
- D. Trust every field and operator in it.

**Answer: A.** Cursor tokens are client input. Validate their shape and types, and encode or sign them if clients must not alter their contents.

## Short-answer questions

### 21. What does a sort direction of `1` mean? What does `-1` mean?

**Answer:** `1` means ascending; `-1` means descending.

### 22. Why should a query that feeds a paginated UI include an explicit sort?

**Answer:** Without a sort, MongoDB does not guarantee result order. Page offsets or continuation cursors need a defined order to refer to predictable positions.

### 23. Why is sorting only by a timestamp insufficient for deterministic pagination?

**Answer:** Multiple documents can share a timestamp. Add a unique tie-breaker, such as `_id`, to establish the order among equal timestamps.

### 24. Calculate the offset for page 5 with a page size of 12.

**Answer:** `(5 - 1) * 12 = 48`. Skip 48 matching results before returning that page.

### 25. What does a limit of 10 guarantee?

**Answer:** It guarantees at most ten documents are returned. If fewer than ten documents match, the query can return fewer.

### 26. Why is a limit useful even when the application uses cursor iteration?

**Answer:** A limit bounds the number of results for a page or sample. Cursor iteration avoids materializing all matches, while the limit bounds how many are requested for that operation.

### 27. What should a server validate in page and page-size parameters?

**Answer:** Require integer values, require a positive page number and page size, and impose a reasonable maximum page size. A policy may also cap the maximum offset.

### 28. Why should skip pagination normally combine `sort()`, `skip()`, and `limit()`?

**Answer:** The sort defines the order, skip selects the starting position in that order, and limit caps the number returned.

### 29. What can go wrong when records change between offset page requests?

**Answer:** Insertions or deletions before the current offset shift later records. A user can see the same item twice or miss an item.

### 30. Why can a deep `skip()` query be expensive?

**Answer:** The server must advance past the skipped portion of the ordered results. The work grows as the offset gets larger.

### 31. When is offset pagination a reasonable choice?

**Answer:** It is often suitable for modest, relatively stable result sets where users need numbered pages or direct jumps to a page number.

### 32. What is cursor-based pagination?

**Answer:** It uses the last returned record's sort values to build a range filter for the next page instead of skipping a numeric offset.

### 33. Write a descending sort by creation date with a unique ID tie-breaker.

**Answer:**

~~~js
const sort = {
  createdAt: -1,
  _id: -1
};
~~~

The ID makes the order deterministic when creation dates are equal.

### 34. For that descending sort, how can the next-page filter continue after a record with date `lastDate` and ID `lastId`?

**Answer:**

~~~js
const after = {
  $or: [
    { createdAt: { $lt: lastDate } },
    {
      createdAt: lastDate,
      _id: { $lt: lastId }
    }
  ]
};
~~~

It matches earlier dates, or the same date with an ID lower in the descending order.

### 35. Why must the continuation filter and sort use the same fields and directions?

**Answer:** The filter must describe records after the cursor in the exact order used to display them. A mismatch can skip or repeat records.

### 36. If a query already has a `$or` condition, why should the cursor condition be grouped with `$and`?

**Answer:** MongoDB filters cannot represent two independent `$or` keys in one ordinary object without one overwriting the other in JavaScript. An `$and` can preserve the base filter and the cursor's `$or` group separately.

### 37. How does fetching `pageSize + 1` records reveal whether there is another page?

**Answer:** If the fetch returns more than `pageSize`, a look-ahead record exists, so `hasNextPage` is true. Return only the first `pageSize` records to the client.

### 38. Which record provides the next cursor after a look-ahead fetch?

**Answer:** Use the last record in the visible page. The extra record is only a signal that more results exist; using it as the cursor would skip that record.

### 39. Does keyset pagination guarantee snapshot consistency across requests?

**Answer:** No. It can avoid large offsets and reduce page shifting from inserts before the cursor, but updates and deletes between requests can still change results. Snapshot semantics require an additional consistency strategy.

### 40. Why should a cursor token's values be type-checked?

**Answer:** MongoDB compares BSON types. A date string is not a BSON Date, and an ID string may not be the same type as the stored unique key. Parse and validate token values before querying.

### 41. What should an API do if a page-size value is too large or invalid?

**Answer:** Reject it or replace it according to an explicit API policy. Do not let an untrusted value trigger an excessive response or invalid skip/limit arguments.

### 42. What should guide index selection for a paginated query?

**Answer:** The real filter and sort pattern, along with measured query behavior. A compound index may be appropriate, but it should be designed for the actual workload.

## Practice tasks

1. Sort articles newest first, using `_id` to break timestamp ties.
2. Calculate the offset for page 3 with 25 items per page.
3. Add a maximum page size of 100 to a page-parameter parser.
4. Fetch one visible page plus a look-ahead record and return `hasNextPage`.
5. Write the cursor condition for ascending order by `createdAt` and `_id`.
6. Explain how an insert near the beginning can shift an offset page.
7. Decide whether a numbered-page interface or cursor-based feed fits a changing activity stream better.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [021 - Query filters and projection](../lessons/021-query-filters-and-projection.md) | [Lesson](../lessons/022-sort-limit-skip-and-pagination.md) | Q&A | [Example](../examples/022-sort-limit-skip-and-pagination.md) | [023 - Update, replace, and upsert documents](../lessons/023-update-replace-and-upsert-documents.md) |
