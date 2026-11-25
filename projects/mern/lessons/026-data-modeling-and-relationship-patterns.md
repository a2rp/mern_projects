# 026 - Data modeling and relationship patterns

MongoDB relationships can be represented with embedded documents, references, or a combination of both. This chapter focuses on common patterns for one-to-one, one-to-many, many-to-many, and hierarchical data, and on how to query and maintain each pattern.

## Learning goals

By the end of this chapter, you should be able to:

- Map one-to-one, one-to-many, and many-to-many relationships to MongoDB documents.
- Choose which side should store a reference in a one-to-many relationship.
- Model associations as their own documents when the relationship has attributes.
- Select a tree pattern based on the hierarchy queries the application needs.
- Add indexes that support relationship lookups.
- Avoid unbounded relationship arrays and fragile bidirectional links.
- Define lifecycle, consistency, and deletion behavior for related data.

## Begin with the relationship and its queries

Describe the relationship in plain language before selecting a storage pattern:

- How many related records can exist now and in the future?
- Does the child exist without its parent?
- Are the records read together or queried independently?
- Which side changes more often?
- Does the relationship have its own fields, such as status or creation time?
- Which direction must the application query: parent to child, child to parent, or both?
- What should happen when either side is deleted or moved?

A pattern that makes one query easy can make updates or other queries harder. Model the operations the application actually performs.

## One-to-one relationships

### Embed when the value belongs with the parent

A user’s small preferences object can live in the user document when it is usually read and updated with the user:

~~~js
{
  _id: "user-42",
  email: "alex@example.test",
  preferences: {
    theme: "dark",
    locale: "en"
  }
}
~~~

This keeps a bounded, parent-owned value in one document. A single-document write can update the user and preferences together.

### Reference when the related entity is independent

A separate profile document may be preferable if it has separate permissions, a different lifecycle, or frequent independent access:

~~~js
// users
{
  _id: "user-42",
  email: "alex@example.test",
  profileId: "profile-42"
}

// profiles
{
  _id: "profile-42",
  userId: "user-42",
  displayName: "Alex"
}
~~~

A one-to-one relationship does not decide the pattern by itself. Decide based on access and ownership.

## One-to-many relationships

### Embed a bounded child set

A small, predictable set of contact addresses can be embedded when the profile screen normally shows them together:

~~~js
{
  _id: "customer-19",
  name: "Sam Lee",
  addresses: [
    {
      label: "home",
      city: "Pune",
      postalCode: "411001"
    },
    {
      label: "work",
      city: "Mumbai",
      postalCode: "400001"
    }
  ]
}
~~~

This parent-owned list is bounded by the application. It is convenient to read in one query and does not need a separate query per address.

### Store a parent reference on each child

For a large or growing child set, store each child separately with the parent’s ID:

~~~js
// comments
{
  _id: "comment-9001",
  postId: "post-15",
  authorId: "user-42",
  text: "Helpful explanation",
  createdAt: new Date()
}
~~~

Create an index for the parent filter and the usual sort:

~~~js
await comments.createIndex({
  postId: 1,
  createdAt: -1,
  _id: -1
});
~~~

Then query a bounded page of children:

~~~js
const page = await comments
  .find({ postId })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20)
  .toArray();
~~~

Putting the reference on the child avoids a continually growing array of child IDs on the parent. It also makes “find children by parent” a direct indexed query.

### Store child references on the parent only when bounded

A parent can store a short array of child IDs when the list has a reliable maximum and the application commonly needs those IDs from the parent:

~~~js
{
  _id: "team-8",
  name: "Platform",
  memberIds: ["user-42", "user-53", "user-71"]
}
~~~

If the list can grow without a bound, it creates a growing array and makes the parent harder to update. In that case, store the parent ID on each child and query the child collection.

## Many-to-many relationships

### Use a relationship collection when the association has data

Students and courses are many-to-many: one student can take many courses, and one course can have many students. If the enrollment itself has a status and timestamp, model it as a document:

~~~js
{
  _id: "enrollment-1",
  studentId: "student-42",
  courseId: "course-7",
  status: "active",
  enrolledAt: new Date()
}
~~~

A unique compound index can prevent duplicate active enrollment records, depending on the domain’s rules:

~~~js
await enrollments.createIndex(
  { studentId: 1, courseId: 1 },
  { unique: true }
);
~~~

Indexes in both lookup directions may be useful:

~~~js
await enrollments.createIndex({ courseId: 1, status: 1, studentId: 1 });
~~~

Choose index fields and order from the actual query filters and sorts. Do not add indexes without a workload reason; indexes take storage and add write maintenance.

### Embed a small subset for a frequent read

A course page might keep a bounded preview of a few featured students while the canonical enrollments remain in their own collection. Treat the preview as derived data, define how it is refreshed, and do not let it become the only authoritative relationship record.

### Avoid unplanned bidirectional arrays

Storing every course ID on each student and every student ID on each course duplicates the relationship. Every enrollment change must update both sides, and partial failures or concurrent changes can make them disagree.

Store the relationship once when possible. If both directions need fast reads, use an indexed relationship collection or maintain a deliberate derived copy with a consistency strategy.

## Hierarchical and tree relationships

Categories, folders, reporting lines, and nested comments can form trees. The pattern depends on whether the application most often reads a parent, its direct children, or an entire subtree.

### Parent references

Each node stores its parent’s ID:

~~~js
{
  _id: "databases",
  name: "Databases",
  parentId: "programming"
}
~~~

This makes the parent of a node easy to find. An index on `parentId` supports queries for direct children:

~~~js
await categories.createIndex({ parentId: 1 });
const children = await categories.find({ parentId: "programming" }).toArray();
~~~

Parent references are a simple starting point for frequently changing trees. To traverse multiple levels, query repeatedly or use a recursive aggregation when appropriate.

### Child references

Each parent stores IDs for its immediate children:

~~~js
{
  _id: "programming",
  name: "Programming",
  childIds: ["databases", "languages"]
}
~~~

This makes the immediate child IDs available from the parent. Keep the array bounded, and consider how it is updated when nodes are moved or deleted. A child list can become unwieldy if it grows without a limit.

### Ancestor arrays

A node can store its direct parent and an array of its ancestors:

~~~js
{
  _id: "mongodb",
  name: "MongoDB",
  parentId: "databases",
  ancestorIds: ["books", "programming", "databases"]
}
~~~

This can make ancestor or descendant filtering easier for a stable hierarchy. Moving a node may require updating the ancestor paths of that node and its descendants.

### Materialized paths

A node can store a path representing its position in the tree, such as `/books/programming/databases/mongodb/`. Prefix-like path queries can help retrieve branches, but moving a subtree may require rewriting paths.

Use a path format that safely distinguishes identifiers; do not rely on ambiguous substrings in names.

### Nested sets

Nested-set models assign boundary values that represent subtree ranges. They can make subtree reads efficient, but inserting or moving nodes can require changing many boundary values. Consider them only when the read pattern justifies their update complexity.

No tree pattern is universally best. Select the pattern based on the hierarchy’s read paths, write frequency, depth, and expected movement.

## Relationship documents and referential integrity

A reference value does not automatically prove that its target exists. It also does not automatically cascade a delete or update.

For each relationship, define:

- Whether the child can exist without the parent.
- How a child is created when its parent is deleted concurrently.
- Whether parent deletion removes, archives, retains, or anonymizes children.
- How missing targets are handled during reads.
- Whether the operation must be atomic across documents.
- How retries avoid creating duplicates or applying side effects twice.

Use a transaction when multiple writes must commit or abort together. For asynchronous cleanup, use an explicit, observable workflow that can retry safely. Do not rely on an undocumented cascade assumption.

## Query and index patterns

Indexes should support the filter and sort used by the relationship query. For example:

- Child documents by parent and newest first: `{ parentId: 1, createdAt: -1, _id: -1 }`.
- Enrollments by student and status: `{ studentId: 1, status: 1, courseId: 1 }`.
- Unique relationship pair: `{ studentId: 1, courseId: 1 }` with a unique constraint if duplicates are not valid.
- Direct children in a tree: `{ parentId: 1 }`.

Use explain plans and realistic data to confirm that an index helps the actual query. An index cannot replace a precise filter or a lifecycle policy.

For multi-collection reads, the application can issue separate queries or use an aggregation with `$lookup`. Choose based on result size and the endpoint’s needs; a join does not enforce relationship integrity.

## Example: create and query course enrollments

A relationship collection gives each enrollment its own fields and supports lookups from either side:

~~~js
const enrollments = db.collection("enrollments");

await enrollments.createIndex(
  { studentId: 1, courseId: 1 },
  { unique: true }
);

await enrollments.createIndex({
  courseId: 1,
  status: 1,
  studentId: 1
});

await enrollments.insertOne({
  studentId,
  courseId,
  status: "active",
  enrolledAt: new Date()
});

const studentCourses = await enrollments
  .find({ studentId, status: "active" })
  .toArray();

const courseStudents = await enrollments
  .find({ courseId, status: "active" })
  .toArray();
~~~

The unique index encodes the rule that each student-course pair can appear once. If the application needs a history of dropped and renewed enrollments, the schema and unique rule must represent that lifecycle instead of silently rejecting valid history.

## Choose a pattern by workload

| Relationship and workload | Starting pattern | Important check |
| :--- | :--- | :--- |
| Small one-to-one value read with parent | Embed | Keep size and ownership bounded |
| Independent one-to-one entity | Store separately and reference | Define how missing targets are handled |
| Small bounded one-to-many set | Embed an array of subdocuments | Confirm the upper bound is realistic |
| Large or growing one-to-many set | Parent ID on each child | Index the parent field and sort fields |
| Many-to-many with relationship fields | Relationship collection | Add query indexes and a uniqueness rule |
| Frequently changing tree | Parent reference | Index parent ID and query children |
| Stable tree with frequent ancestor queries | Ancestor array or materialized path | Plan for subtree moves |
| Small fixed parent-to-child list | Child IDs on parent | Prevent the array from growing without limit |

These are starting points. Validate them against actual endpoints, cardinality, update volume, and retention rules.

## Common mistakes

- **Putting every child ID on the parent:** an unbounded array can grow indefinitely.
- **Duplicating a many-to-many relationship in both directions:** both copies need coordinated updates.
- **Using a relationship array when the association has fields:** a relationship document can store status, dates, or permissions clearly.
- **Choosing a tree model without knowing query needs:** parent reads, direct children, and subtree reads favor different patterns.
- **Treating an ID as an enforced foreign key:** the application must validate and maintain references.
- **Assuming parent deletion cascades:** define and implement child cleanup explicitly.
- **Creating indexes without checking the query:** index design should follow filters and sorts.
- **Using a unique relationship index without modeling history:** decide whether repeated relationships represent duplicates or separate lifecycle events.
- **Over-embedding a growing collection:** separate children when growth or independent access demands it.
- **Using a transaction for every relationship operation:** keep related values in one document when that naturally satisfies the invariant.

## Key points

- Relationship cardinality and access patterns determine where data should live.
- Embed a bounded set when it is commonly read with its parent.
- Put a parent reference on each child when the child set is large or growing.
- Model many-to-many associations as documents when the association has its own fields.
- Tree patterns include parent references, child references, ancestor arrays, materialized paths, and nested sets.
- References do not automatically validate targets or cascade changes.
- Index relationship fields according to actual filters and sorts.
- Write down lifecycle, deletion, and consistency rules for every important relationship.

## Review checklist

You are ready to move on when you can:

- Choose a pattern for bounded and unbounded one-to-many relationships.
- Explain where to store a reference when children grow without a limit.
- Model an association with its own attributes.
- Select a tree representation based on query and update patterns.
- Propose indexes for parent-to-child queries.
- Explain how bidirectional relationship copies can drift.
- Define missing-target and parent-deletion behavior.
- Justify the design using realistic cardinality and workload expectations.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [025 - Schema design: embedding versus referencing](025-schema-design-embedding-versus-referencing.md) | Lesson | [Q&A](../qnas/026-data-modeling-and-relationship-patterns.md) | [Example](../examples/026-data-modeling-and-relationship-patterns.md) | [027 - Schema validation and data integrity](027-schema-validation-and-data-integrity.md) |
