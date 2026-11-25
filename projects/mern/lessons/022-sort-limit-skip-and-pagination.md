# Sort, limit, skip, and pagination

A filter chooses which documents match; cursor methods control the order and number of those documents returned. Sorting makes result order intentional, a limit caps each response, and skip can select an offset-based page. For deeper or frequently changing result sets, cursor-based pagination can be more efficient and stable.

## Learning goals

By the end of this chapter, you should be able to:

- Sort results by one or more fields in ascending or descending order.
- Add a unique tie-breaker so the sort order is deterministic.
- Cap results with `limit()`.
- Calculate and validate an offset for `skip()` pagination.
- Explain why large skip offsets can become slow and unstable when data changes.
- Implement a next-page cursor using the last record's sort values.
- Return a bounded page plus one extra record to determine whether another page exists.
- Design page parameters and cursor tokens defensively.

## Sort query results

Without a sort, MongoDB does not guarantee the order of documents returned by a query. Do not rely on insertion order, ObjectId generation time, or an order observed in one run.

Use `sort()` on a cursor. A value of `1` sorts ascending; `-1` sorts descending:

~~~js
const cursor = articles
  .find({ published: true })
  .sort({ title: 1 });
~~~

Sort by multiple fields when the primary value can repeat. MongoDB applies sort keys in the order listed: first by `createdAt` descending, then by `_id` descending to break timestamp ties.

~~~js
const cursor = articles
  .find({ published: true })
  .sort({ createdAt: -1, _id: -1 });
~~~

The final key should be unique for the matched documents. The unique `_id` is a common tie-breaker. This makes the ordering deterministic for a particular data state, including records whose creation timestamps are equal.

For example, sorting only by a non-unique title or date does not define the order within ties. Add a unique key if later pages must continue from a specific position.

## Limit the number of results

Use `limit(count)` to cap the number of documents returned:

~~~js
const firstTen = await articles
  .find({ published: true })
  .sort({ createdAt: -1, _id: -1 })
  .limit(10)
  .toArray();
~~~

The query may return fewer than the limit if fewer documents match. A limit is useful for bounded lists and pages, but it does not make a query selective by itself. Combine it with an appropriate filter and sort.

The code above calls `toArray()` after a limit of ten, so the array is bounded. For larger result processing, iterate the cursor instead of collecting all results.

## Skip a known offset

`skip(count)` omits that many matching documents before returning results. For a one-based page number `page` and page size `pageSize`, the offset is:

~~~js
const offset = (page - 1) * pageSize;
~~~

A basic offset page can be written as:

~~~js
const page = 2;
const pageSize = 10;
const offset = (page - 1) * pageSize;

const results = await articles
  .find({ published: true })
  .sort({ createdAt: -1, _id: -1 })
  .skip(offset)
  .limit(pageSize)
  .toArray();
~~~

Sort before paginating so that each offset refers to a defined order. Without a sort, skip can omit arbitrary documents.

Validate page values from a request before using them:

~~~js
function parsePage(value) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("page must be a positive integer");
  }

  return page;
}

function parsePageSize(value) {
  const pageSize = Number(value);

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("pageSize must be an integer from 1 to 100");
  }

  return pageSize;
}
~~~

Set a maximum page size so a client cannot request an unexpectedly large response. Also consider a maximum offset or route callers to cursor pagination for deep pages.

## Offset pagination trade-offs

Offset pagination is easy to understand and lets a user jump to a numbered page. However, MongoDB must advance past skipped results. As the offset grows, the server does more work, so deep pages can become slower.

Offset pages can also shift when documents are inserted or removed between requests. A new record near the front of the sort order can move records from one page to another. A user navigating between pages may then see a duplicate or miss a record. A deterministic sort handles ties but does not freeze a changing collection.

Use offset pagination for modest, bounded page numbers where numbered-page navigation is useful. For large collections or feeds, consider range-based cursor pagination.

## Cursor-based (range) pagination

Cursor-based pagination continues after the last record from the previous page. Store the values used by the sort in a cursor token, then build a filter for records after those values.

For descending order by `createdAt` and `_id`, a page after the last record uses:

~~~js
const afterFilter = {
  $or: [
    { createdAt: { $lt: lastCreatedAt } },
    {
      createdAt: lastCreatedAt,
      _id: { $lt: lastId }
    }
  ]
};

const nextPage = await articles
  .find({
    published: true,
    ...afterFilter
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(pageSize)
  .toArray();
~~~

The first condition selects records with an earlier creation time. The second selects records with the same time but a smaller unique identifier. Together they continue the exact descending sort order.

In a real filter, merge cursor conditions with existing filters carefully. If a base filter already contains a `$or`, use `$and` to preserve the intended grouping:

~~~js
const filter = {
  $and: [
    { published: true },
    {
      $or: [
        { createdAt: { $lt: lastCreatedAt } },
        { createdAt: lastCreatedAt, _id: { $lt: lastId } }
      ]
    }
  ]
};
~~~

A cursor token should contain the last returned document's sort values, be validated when received, and be encoded or signed if clients must not alter it. Do not accept a raw MongoDB filter from the client.

Use fields that are consistently present and have stable types. If the primary sort value can repeat, include a unique tie-breaker in both the sort and continuation filter. For compound sorts with other directions, carefully adapt the comparison operators to match the complete lexicographic order.

Cursor pagination avoids scanning a large numeric offset, but it does not create a snapshot across separate HTTP requests. If records are updated or removed between pages, results can still change. Choose a consistency strategy that matches the application.

## Detect whether another page exists

To return up to `pageSize` documents and determine whether another page exists, request one extra result:

~~~js
const pageSize = 10;

const fetched = await articles
  .find({ published: true })
  .sort({ createdAt: -1, _id: -1 })
  .limit(pageSize + 1)
  .toArray();

const hasNextPage = fetched.length > pageSize;
const items = fetched.slice(0, pageSize);
~~~

Return `items` to the caller. When `hasNextPage` is true, build the next cursor from the last item actually returned, not from the extra look-ahead record. That extra record only indicates that more results exist.

The same technique works with an offset page or a cursor-based page. When using cursor pagination, apply the continuation filter before fetching the extra record.

## Sorting, skipping, and limiting together

A common offset query is:

~~~js
const results = await articles
  .find(filter)
  .sort({ createdAt: -1, _id: -1 })
  .skip(offset)
  .limit(pageSize)
  .toArray();
~~~

The driver sends the cursor settings before results are consumed. A sort and limit call order can be rearranged by the driver, but keep the chain in the natural reading order—sort, skip, limit—so its purpose is clear.

For frequently used pagination patterns, choose indexes that support the filter and sort. An index should reflect actual query patterns; adding fields to a sort without considering indexes can make the query expensive. Query plans and index design are covered later.

## Common mistakes

- **Assuming results have a default order:** always specify a sort when order matters.
- **Sorting on a non-unique field only:** ties can appear in different order; add a unique tie-breaker.
- **Using `skip()` without sorting:** the omitted documents can be arbitrary.
- **Allowing unbounded page sizes:** validate parameters and enforce a maximum.
- **Using deep offsets for a large collection:** skip work grows with the offset; consider range pagination.
- **Treating deterministic order as a snapshot:** writes between page requests can still alter results.
- **Building the cursor from the look-ahead record:** use the last item returned to the client.
- **Accepting a cursor filter directly from the client:** validate the cursor values and build the database filter on the server.
- **Ignoring BSON types in cursor values:** use the same stored type for dates, numbers, and identifiers.

## Key points

- Without `sort()`, query result order is not guaranteed.
- Use `1` for ascending and `-1` for descending sort directions.
- Add a unique tie-breaker such as `_id` to make page order deterministic.
- `limit()` caps a response; `skip()` selects an offset.
- Offset pagination is convenient for shallow pages but gets expensive at depth and can shift as data changes.
- Range pagination continues from the last returned sort values and can avoid large skips.
- A `pageSize + 1` fetch can report whether another page exists.
- Validate page sizes and cursor tokens, and use indexes suited to real query patterns.

## Review checklist

You are ready to move on when you can:

- Sort by multiple fields and explain which field breaks ties.
- Calculate an offset for a one-based page number.
- Validate a page number and cap a page size.
- Explain why `skip()` becomes slower for deep pages.
- Explain how inserts between offset pages can create duplicate or missing items.
- Build a descending range filter from a timestamp and a unique tie-breaker.
- Use one look-ahead result to determine whether a next page exists.
- Explain why cursor pagination is not a cross-request snapshot.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [021 - Query filters and projection](021-query-filters-and-projection.md) | Lesson | [Q&A](../qnas/022-sort-limit-skip-and-pagination.md) | [Example](../examples/022-sort-limit-skip-and-pagination.md) | [023 - Update, replace, and upsert documents](023-update-replace-and-upsert-documents.md) |
