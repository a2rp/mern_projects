# 060 - Search, filtering, sorting, and pagination APIs

Collection endpoints often begin with a simple list and quickly grow to support search, filters, sorting, and pages. These options are part of the API contract: they define which records a client can request, how results are ordered, and how much work the server may perform.

Treat every query parameter as untrusted input. Parse it into a small, validated set of application options, then build a database query from server-owned fields and operators. Never pass the request query object directly to MongoDB or Mongoose.

## Learning goals

By the end of this chapter, you should be able to:

- Define a predictable query-string contract for a collection endpoint.
- Validate and normalize search, filter, sort, and pagination parameters.
- Use allowlists for fields, operators, sort directions, and page sizes.
- Return stable ordering and consistent pagination metadata.
- Choose offset or cursor pagination based on the product's access pattern.
- Design indexes from real query and sort patterns.
- Protect the database from expensive or malformed client requests.

## Define the collection endpoint contract

A product listing endpoint might accept:

~~~http
GET /api/v1/products?q=key&category=accessories&minPriceCents=500&maxPriceCents=5000&sort=price&order=asc&page=2&limit=20
~~~

Each option needs a clear meaning:

- `q`: a bounded search term. State whether it matches a prefix, a full-text index, or another explicitly defined search mode.
- `category`: an exact match from supported category values.
- `minPriceCents` and `maxPriceCents`: inclusive price bounds in integer minor currency units.
- `sort`: one of a documented set of sort keys.
- `order`: `asc` or `desc`.
- `page`: a one-based page number for offset pagination.
- `limit`: the requested page size, capped by the server.

Document defaults, accepted values, invalid-value behavior, and whether totals are exact. Keep the response shape stable so clients do not need to infer how the query was interpreted.

A response can separate the current page from its metadata:

~~~json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Keyboard",
      "category": "accessories",
      "priceCents": 2499,
      "currency": "USD"
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "totalItems": 41,
    "totalPages": 3,
    "hasPreviousPage": true,
    "hasNextPage": true
  }
}
~~~

For large or frequently changing datasets, a total count may be expensive or become stale immediately. Make the total optional or use a cursor response that only reports whether another page exists.

## Parse query parameters before building a database query

Express exposes query values through `req.query`, but those values are supplied by the client. Depending on the configured query parser, a parameter can arrive as a string, an array, or a nested object. Reject unexpected shapes rather than assuming every value is a harmless string.

Convert a request into a normalized internal object such as:

~~~js
{
    q: "key",
    category: "accessories",
    minPriceCents: 500,
    maxPriceCents: 5000,
    sort: "price",
    order: "asc",
    page: 2,
    limit: 20
}
~~~

Do not give the database layer the original request object. This separation makes validation explicit and prevents clients from choosing database fields, operators, or projections.

### Validate scalar values strictly

- Reject arrays and objects when an option is defined as a single value.
- Trim search input and enforce a reasonable maximum length.
- Parse integers with a strict decimal pattern; reject values such as `2abc`, decimals, negative pages, and unsafe integers.
- Check the relationship between bounds, such as minimum price not exceeding maximum price.
- Decide consistently whether an empty parameter is ignored or rejected.
- Treat repeated query keys consistently; rejecting duplicates is often easier than silently choosing one.

A default is useful when it is part of the documented contract. Invalid input should not silently fall back to a default if that could make a client believe its requested filter was applied.

## Implement search with a defined meaning

“Search” can refer to different behaviors:

- **Prefix matching** finds values that begin with a term. A carefully escaped, case-sensitive prefix may use a suitable index, depending on the query and collation.
- **Substring matching** finds a term anywhere in a value. A regular expression such as `/term/i` can scan many records and should not be treated as free.
- **Full-text search** uses an index with tokenization and language-specific behavior. Its matching and ranking semantics differ from substring matching.
- **Dedicated search systems** can provide typo tolerance, stemming, facets, and relevance ranking for larger or richer search needs.

Choose and document one behavior. Do not accept a raw regular expression from the client. If a term is used to construct a regular expression, escape metacharacters, bound its length, and understand its index and runtime costs. Prefer an indexed or dedicated search strategy when the dataset or relevance requirements grow.

## Build filters with allowlisted fields

Create a fresh filter object from recognized parameters:

~~~js
const filter = {};

if (options.category !== undefined) {
    filter.category = options.category;
}

if (options.minPriceCents !== undefined ||
    options.maxPriceCents !== undefined) {
    filter.priceCents = {};

    if (options.minPriceCents !== undefined) {
        filter.priceCents.$gte = options.minPriceCents;
    }

    if (options.maxPriceCents !== undefined) {
        filter.priceCents.$lte = options.maxPriceCents;
    }
}
~~~

The client supplies values; server code supplies field names and operators. Never use patterns such as `Model.find(req.query)`, `Model.find(JSON.parse(req.query.filter))`, or `Model.find({ [req.query.field]: req.query.value })` without strict field and value validation.

Validate filters in more than one place where appropriate:

- Request validation protects the HTTP boundary.
- Service or domain validation protects rules shared by routes, jobs, and other callers.
- Database schema constraints protect persisted data from invalid writes.

A list filter must not accidentally become an authorization rule. Apply tenant, ownership, and visibility constraints from the authenticated server-side identity independently of client-provided search filters.

## Allowlist sort fields and use a tie-breaker

Never pass an arbitrary client field or object directly to `sort()`. Map accepted names to server-owned schema fields:

~~~js
const SORT_FIELDS = {
    newest: "createdAt",
    price: "priceCents",
    name: "name"
};
~~~

Validate `sort` against the allowlist and `order` against `asc` and `desc`. Add a unique tie-breaker such as `_id` in the same direction:

~~~js
const direction = options.order === "asc" ? 1 : -1;
const sort = {
    [SORT_FIELDS[options.sort]]: direction,
    _id: direction
};
~~~

Without a deterministic tie-breaker, records with equal sort values can move between pages even when the collection has not changed. The tie-breaker establishes a total order for a given query snapshot.

Do not promise that clients can sort every database field. Each allowed sort can affect performance, privacy, and the indexes the application needs.

## Offset pagination

Offset pagination uses a page number and page size:

~~~js
const skip = (page - 1) * limit;
~~~

For page 2 with a limit of 20, the query skips 20 matching documents and returns the next 20. Always validate the page and limit and impose a maximum page size.

A common response includes page, limit, and optionally a count. Fetching a page and a count can require separate database operations. Under concurrent writes they may observe slightly different states unless the application uses stronger consistency guarantees. A total count also costs work, so include it only when the user interface needs it.

Large offsets can become slow because the database must walk past earlier matches. Cap deep offsets or switch to cursor pagination for large collections and feeds. Do not treat a page number as a stable bookmark while records are being inserted or removed.

## Cursor pagination

Cursor or keyset pagination uses the last item from the previous page as the next query boundary. For descending `createdAt` order with a unique `_id` tie-breaker, the next page can use both values:

~~~js
const filter = cursor
    ? {
        $or: [
            { createdAt: { $lt: cursor.createdAt } },
            {
                createdAt: cursor.createdAt,
                _id: { $lt: cursor.id }
            }
        ]
    }
    : {};

const items = await Product.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean()
    .exec();

const hasNextPage = items.length > limit;
const pageItems = hasNextPage ? items.slice(0, limit) : items;
~~~

Fetching one extra item tells the server whether another page exists without counting the entire result set. Return a cursor based on the last item actually included in the response, not the extra item.

A production cursor should be opaque to clients and validated when decoded. Sign it if clients must not modify its contents. Bind it to the sort and relevant filter state so a cursor from one query cannot be reused for a different query. Encoding is not encryption; do not put secrets or private data in a cursor. Cursor pagination is not a universal replacement for numbered pages: it is less suited to jumping directly to an arbitrary page.

## Match indexes to query patterns

An index should support an actual, frequent filter-and-sort pattern. Consider:

- Fields used in equality filters.
- Range filters and sort order.
- The tie-breaker included in the sort.
- The number of documents and selectivity of the filter.
- The write and storage cost of maintaining another index.

A compound index can support a particular combination and order; it does not automatically optimize every possible combination of optional filters. Use database query plans and measurements with realistic data to guide index changes. An index can speed reads while adding storage and write work.

For MongoDB-backed services, test important filter and sort combinations with representative data. Keep the API's allowed sort set small enough to reason about and support.

## Keep database work bounded

A robust list endpoint should have explicit resource limits:

- Maximum `limit` and search-term length.
- Allowlisted filter and sort options.
- A bounded offset or cursor strategy for deep results.
- Database execution time limits where appropriate.
- Projection of only fields needed in the public response.
- Rate limits and authorization for sensitive or expensive searches.
- Monitoring for slow query patterns and error rates.

Avoid unbounded regular expressions, client-controlled database operators, arbitrary field projections, and queries whose cost grows without a product reason.

## Return a stable, safe response

Convert database records into the public API shape. Do not return raw Mongoose documents merely because they serialize. Explicitly select and map public fields, exclude internal fields, and keep response property names consistent.

For invalid parameters, return the API's documented client-error response, such as `400 Bad Request`, with a stable error code and a clear message. For database failures, return a safe server error and log details through the application's protected logging path. Do not expose MongoDB messages, query objects, or stack traces.

## Test the query contract

Use route and service tests to cover:

- Defaults when optional parameters are omitted.
- Each allowed filter and the combined filter behavior.
- Invalid types, repeated values, malformed integers, and unsupported sort fields.
- Minimum and maximum page size boundaries.
- Stable ordering when multiple records share a sort value.
- Empty results and the final page.
- Cursor tampering or reuse with a mismatched filter, if cursors are supported.
- Public response fields and pagination metadata.
- Authorization scoping independent of client filters.

Use a real isolated database integration test for query and index behavior that fakes cannot prove. Avoid making every unit test start MongoDB.

## Common mistakes

- Passing `req.query` directly into a Mongoose filter.
- Allowing arbitrary field names, sort objects, operators, or regular expressions.
- Returning inconsistent parameter defaults across endpoints.
- Sorting on a non-unique field without a stable tie-breaker.
- Accepting an unbounded page size or expensive deep offset.
- Running a full count when the client only needs a next-page indicator.
- Assuming page results and a separate count are a transactional snapshot.
- Returning raw database documents and internal fields.
- Creating indexes for every imaginable filter combination without measuring.
- Using a cursor that is neither validated nor tied to its filter and ordering.

## Review checklist

- [ ] Query parameters and duplicate-value behavior are documented.
- [ ] Scalar values, ranges, defaults, and maximums are validated.
- [ ] Search behavior is explicit and protected from unbounded patterns.
- [ ] Filter fields, sort fields, directions, and projections are allowlisted.
- [ ] Authorization and tenant constraints come from server-side identity.
- [ ] Sort order has a unique tie-breaker.
- [ ] Offset depth is bounded or cursor pagination is used where appropriate.
- [ ] Count and pagination metadata reflect the documented contract.
- [ ] Indexes support measured query patterns.
- [ ] Responses expose only public fields and safe errors.
- [ ] Tests cover valid, invalid, empty, boundary, and ordering behavior.

## Summary

A collection API should turn untrusted query parameters into a validated, bounded query plan. Define search semantics, build filters from allowlisted fields, use stable sorting, and select offset or cursor pagination based on how clients navigate the data. Match indexes to measured query patterns, keep authorization separate from client filters, and return a stable public response with only the metadata clients need.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [059 - Test Express routes and services](059-test-express-routes-and-services.md) | [Q&A](../qnas/060-search-filtering-sorting-and-pagination-apis.md) | [Example](../examples/060-search-filtering-sorting-and-pagination-apis.md) | [061 - React mental model and declarative UI](061-react-mental-model-and-declarative-ui.md) |
