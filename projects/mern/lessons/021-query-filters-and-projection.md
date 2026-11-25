# Query filters and projection

A query filter tells MongoDB which documents to match. A projection tells MongoDB which fields from those matching documents to return. Use both deliberately: precise filters keep result sets focused, while projections avoid fetching fields an operation does not need.

## Learning goals

By the end of this chapter, you should be able to:

- Write equality filters with field/value pairs.
- Compare values with operators such as `$gt`, `$gte`, `$lt`, `$lte`, `$in`, and `$ne`.
- Combine conditions with implicit AND, `$or`, `$and`, and `$nor`.
- Query nested fields with dot notation.
- Match array values and use `$elemMatch` for arrays of documents.
- Distinguish a missing field from a field whose value is `null`.
- Include or exclude returned fields with projections.
- Validate and allowlist filter input rather than trusting a client-supplied MongoDB query.

## A filter is a query document

The first argument to `find()` and `findOne()` is a JavaScript object describing the match criteria. A direct field/value pair matches that field's value:

~~~js
const filter = { role: "frontend" };

const cursor = users.find(filter);
~~~

This is an exact value match for the field, subject to MongoDB's BSON type and array matching rules. The string `"3"` is not the number `3`, and an `ObjectId` is not the same value as its hexadecimal string.

An empty filter, `{}`, has no conditions and can match every document. A filter controls which records match; it does not, by itself, order or cap the result set. Sorting and pagination are covered in the next chapter.

## Equality and comparison operators

MongoDB's comparison operators are written as fields whose values are operator documents. Common operators include:

| Operator | Meaning |
| --- | --- |
| `$eq` | Equal to |
| `$ne` | Not equal to |
| `$gt` | Greater than |
| `$gte` | Greater than or equal to |
| `$lt` | Less than |
| `$lte` | Less than or equal to |
| `$in` | Equal to at least one value in a supplied list |
| `$nin` | Not equal to any value in a supplied list |

A literal equality filter is often the simplest form:

~~~js
const activeUsers = users.find({ active: true });

// Equivalent explicit equality:
const activeUsersWithEq = users.find({
  active: { $eq: true }
});
~~~

Use comparison operators to define ranges or thresholds:

~~~js
const experiencedUsers = users.find({
  yearsOfExperience: { $gte: 3, $lt: 8 }
});
~~~

Both conditions on the same field must match. This is an implicit AND between the lower and upper bounds.

Use `$in` to match one of several accepted values:

~~~js
const selectedRoles = users.find({
  role: { $in: ["frontend", "full-stack"] }
});
~~~

`$in` is useful for a bounded set of allowed values. If the array is very large, rethink the query and its data model rather than building an enormous filter from untrusted input.

Be careful with negative operators. `$ne` and `$nin` can also match documents where the queried field is missing. If field presence matters, combine the condition with `$exists`.

## Combine conditions

Conditions on different fields are combined with an implicit AND:

~~~js
const filter = {
  role: "backend",
  active: true,
  yearsOfExperience: { $gte: 3 }
};
~~~

All three criteria must match. You can write `$and` explicitly when it makes the intended grouping clearer:

~~~js
const filter = {
  $and: [
    { active: true },
    { yearsOfExperience: { $gte: 3 } }
  ]
};
~~~

Use `$or` when any listed condition may match:

~~~js
const filter = {
  $or: [
    { role: "frontend" },
    { role: "full-stack" }
  ]
};
~~~

You can combine logical operators with field conditions:

~~~js
const filter = {
  active: true,
  $or: [
    { role: "frontend" },
    { yearsOfExperience: { $gte: 6 } }
  ]
};
~~~

This means the user must be active and must either be a frontend user or have at least six years of experience.

`$nor` matches documents that fail all of the listed conditions:

~~~js
const filter = {
  $nor: [
    { role: "intern" },
    { active: false }
  ]
};
~~~

Use logical operators to express the intended rule, not as a substitute for understanding how conditions group. Multiple independent fields in a filter already mean AND. `$not` is generally applied to a field operator expression and has details around missing fields; prefer clear positive conditions when possible.

## Query nested fields with dot notation

For an embedded document, use a dotted field path:

~~~js
const delhiUsers = users.find({
  "address.city": "Delhi"
});
~~~

This matches documents whose embedded `address` object has a `city` field with that value. Do not confuse a dotted path query with comparing the entire embedded object. Exact object equality can depend on the complete object shape and field order; dot notation usually expresses the intended field-level condition more clearly.

## Match array contents

A scalar equality condition on an array field can match a document when the array contains that scalar:

~~~js
const reactUsers = users.find({
  skills: "React"
});
~~~

Use `$all` when a document's array must contain every listed value:

~~~js
const usersWithBothSkills = users.find({
  skills: { $all: ["React", "Node.js"] }
});
~~~

Use `$elemMatch` when an array contains embedded documents and multiple conditions must apply to the same array element:

~~~js
const usersWithRecentActiveProject = users.find({
  projects: {
    $elemMatch: {
      status: "active",
      year: { $gte: 2025 }
    }
  }
});
~~~

Without `$elemMatch`, separate conditions on an array of embedded documents can be satisfied by different elements. That can accidentally match a document whose active project is old and whose newer project is complete. `$elemMatch` ties the conditions to one element.

## Missing fields and null values

A filter with `{ managerId: null }` matches documents where `managerId` is explicitly null and documents where the field is missing. These are different data states even though that simple query matches both.

To match an explicit null and require the field to exist, combine `$exists` and `$eq`:

~~~js
const explicitlyUnassigned = users.find({
  managerId: {
    $exists: true,
    $eq: null
  }
});
~~~

To match documents where a field is present, regardless of its value:

~~~js
const usersWithManagerField = users.find({
  managerId: { $exists: true }
});
~~~

To match documents where a field is absent:

~~~js
const usersWithoutManagerField = users.find({
  managerId: { $exists: false }
});
~~~

Choose a consistent representation for optional data when designing a collection. Do not treat missing and null as interchangeable in application logic unless that is the intended rule.

## Project returned fields

A projection specifies which fields a read returns. With the Node.js driver, pass it through the read options or chain `project()` on a cursor:

~~~js
const cursor = users
  .find({ active: true })
  .project({
    name: 1,
    role: 1,
    yearsOfExperience: 1
  });
~~~

This includes the selected fields and, by default, `_id`. To exclude `_id` while including other fields:

~~~js
const cursor = users
  .find({ active: true })
  .project({
    _id: 0,
    name: 1,
    role: 1
  });
~~~

Projections generally use either inclusion or exclusion:

~~~js
// Inclusion: return these fields (and _id unless excluded).
const includeFields = { name: 1, role: 1 };

// Exclusion: return all other fields.
const excludeFields = { passwordHash: 0, internalNotes: 0 };
~~~

Do not mix included and excluded fields in one projection, except that `_id` may be explicitly excluded from an inclusion projection. An inclusion projection is often easier to review because it states which fields the operation needs.

A projection controls database results for that operation; it does not replace authorization or data-access rules. Never return sensitive fields to a client merely because a client asked for them.

The Node.js driver also accepts projection in `findOne()` options:

~~~js
const user = await users.findOne(
  { _id: userId },
  {
    projection: {
      name: 1,
      role: 1
    }
  }
);
~~~

## Build filters safely in an application

Do not pass `req.query` or `req.body` directly as a MongoDB filter. Client-controlled objects may contain unexpected operators, fields, types, or deeply nested structures. Parse and validate each accepted input, then construct the filter from an allowlist:

~~~js
const allowedRoles = new Set(["frontend", "backend", "full-stack"]);

function buildUserFilter(query) {
  const filter = {};

  if (Object.hasOwn(query, "active")) {
    if (query.active === "true") {
      filter.active = true;
    } else if (query.active === "false") {
      filter.active = false;
    } else {
      throw new Error("active must be true or false");
    }
  }

  if (Object.hasOwn(query, "role")) {
    if (typeof query.role !== "string" || !allowedRoles.has(query.role)) {
      throw new Error("Unsupported role");
    }

    filter.role = query.role;
  }

  return filter;
}
~~~

This function accepts only specific, validated values. In a real endpoint, decide whether an absent filter should be rejected or whether a broad search is allowed. Never let malformed input silently turn into an unbounded query.

Use appropriate indexes for fields that are queried frequently and measure real query patterns. A syntactically correct filter can still be expensive on a large collection. Index planning is covered in a later chapter.

## A complete read with a filter and projection

~~~js
const filter = {
  active: true,
  yearsOfExperience: { $gte: 2 },
  "address.city": "Delhi"
};

const cursor = users.find(filter).project({
  _id: 0,
  name: 1,
  role: 1,
  yearsOfExperience: 1
});

for await (const user of cursor) {
  console.log(user);
}
~~~

The filter narrows documents by status, experience, and city. The projection returns only the fields needed by this operation. The cursor is consumed asynchronously. Add ordering and result bounds as appropriate; the next chapter focuses on sorting and pagination.

## Common mistakes

- **Using a string for a number or ObjectId:** query values must use the stored BSON type.
- **Assuming multiple fields mean OR:** conditions in one filter are ANDed by default.
- **Using a broad filter accidentally:** an empty filter can match the entire collection.
- **Expecting `$ne` to exclude missing fields:** negative operators can match documents without that field.
- **Confusing null and missing:** `{ field: null }` matches both states; add `$exists` to distinguish them.
- **Combining projection inclusion and exclusion:** use one mode, with `_id` as the exception.
- **Expecting projection to control matching:** projection changes returned fields, not which documents match.
- **Passing raw client objects into a filter:** validate and allowlist fields, types, and operators.
- **Using conditions on different array elements by accident:** use `$elemMatch` when predicates must match the same embedded element.

## Key points

- A query filter specifies which documents match; a projection specifies which fields are returned.
- Equality, comparison, and logical operators compose filters.
- Multiple ordinary field conditions imply AND; use `$or` when any alternative may match.
- Dot notation addresses nested fields; array operators express membership and element conditions.
- Null and missing fields are distinct, and `$exists` checks for field presence.
- Inclusion and exclusion projections cannot be mixed, except for excluding `_id`.
- Validate client inputs and build database filters from an explicit allowlist.

## Review checklist

You are ready to move on when you can:

- Write equality and comparison filters with the correct BSON value types.
- Explain implicit AND and construct an `$or` condition.
- Query a nested field with dot notation.
- Match an array member and explain when `$elemMatch` is needed.
- Distinguish explicit null from a missing field with `$exists`.
- Create inclusion and exclusion projections and explain `_id` behavior.
- Explain why client-provided objects must not be used as raw database filters.
- Combine a selective filter with a projection and consume the cursor.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [020 - Create and read MongoDB documents](020-create-and-read-mongodb-documents.md) | Lesson | [Q&A](../qnas/021-query-filters-and-projection.md) | [Example](../examples/021-query-filters-and-projection.md) | [022 - Sort, limit, skip, and pagination](022-sort-limit-skip-and-pagination.md) |
