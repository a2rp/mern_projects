# 025 - Schema design: embedding versus referencing

A MongoDB schema should reflect how an application reads, writes, and relates its data. Related values can live together inside one document, or separate documents can be connected by identifiers. Neither choice is always best: the right model depends on relationship size, access patterns, update behavior, and consistency needs.

## Learning goals

By the end of this chapter, you should be able to:

- Explain embedding and referencing in MongoDB.
- Choose a model based on how related data is queried and updated.
- Model one-to-one, one-to-many, and many-to-many relationships.
- Recognize unbounded arrays and document-growth risks.
- Balance read locality against duplication and write complexity.
- Use references while understanding that MongoDB does not enforce foreign keys.
- Review a proposed schema with a practical decision checklist.

## Start with application access patterns

Before designing collections, list the application’s important operations:

- Which screens or API responses read which fields together?
- Which entities are read independently?
- Which values change together, and how often?
- How large can each relationship become?
- Does child data need its own permissions, lifecycle, or retention?
- Must several changes succeed or fail together?

Data commonly accessed together is often a good candidate for one document. Data with a separate lifecycle, large or growing cardinality, or independent query patterns often belongs in separate documents.

Do not begin with “one collection per noun” or “put every related record in an array.” Begin with the workload and relationship boundaries.

## Embedding

Embedding stores related data as a nested document or array inside its parent document:

~~~js
{
  _id: "order-1001",
  customerId: "customer-42",
  status: "placed",
  shippingAddress: {
    city: "Pune",
    postalCode: "411001"
  },
  items: [
    {
      productId: "product-8",
      nameAtPurchase: "Mechanical keyboard",
      quantity: 1,
      unitPriceAtPurchase: 49.99
    }
  ]
}
~~~

This order keeps its address and line items directly with the order. Reading the order can retrieve that data in one document read.

### Benefits of embedding

- **Read locality:** related fields can be returned together without reading multiple collections.
- **Single-document atomicity:** changes to the embedded data and parent can be made in one atomic document write.
- **Simpler reads:** application code often needs fewer database round trips.
- **Self-contained records:** the parent can preserve a historical snapshot of values, such as the product name and price at purchase time.
- **Natural ownership:** data that exists only as part of the parent can be stored with it.

### Costs and limits of embedding

- **Document growth:** arrays may grow until reads and writes become inefficient or the document reaches MongoDB’s 16 MiB BSON document size limit.
- **Write contention:** frequently changing subdocuments in one popular parent can concentrate writes on that parent.
- **Duplication:** copying a mutable value into many parents requires a strategy to keep copies consistent.
- **Over-fetching:** a query may retrieve a large embedded structure even when the caller needs only a small part.
- **Independent lifecycle:** a child that needs separate permissions, retention, and queries may be awkward to manage inside its parent.

Embedding is not a reason to place an unlimited event history or all user activity in one document.

## Referencing

Referencing stores related entities as separate documents and connects them using identifier values:

~~~js
// orders collection
{
  _id: "order-1001",
  customerId: "customer-42",
  status: "placed"
}

// orderItems collection
{
  _id: "item-line-1",
  orderId: "order-1001",
  productId: "product-8",
  quantity: 1,
  unitPriceAtPurchase: 49.99
}
~~~

The application can query line items with the parent identifier:

~~~js
const items = await orderItems
  .find({ orderId: "order-1001" })
  .toArray();
~~~

A reference is an ordinary value, often an ObjectId. The Node.js driver does not automatically join referenced documents or enforce that a referenced record exists. The application may issue another query or use an aggregation with `$lookup` when a combined result is needed.

### Benefits of referencing

- **Independent access:** child records can be queried and updated on their own.
- **Bounded parent size:** growing data does not enlarge a single parent document indefinitely.
- **Less duplication:** a mutable entity can have one canonical record.
- **Independent lifecycle and access rules:** child documents can have their own retention, ownership, or permissions.
- **Flexible relationships:** separate collections can represent large one-to-many and many-to-many relationships.

### Costs and limits of referencing

- **More reads or aggregation:** applications may need an additional query or `$lookup` to assemble related data.
- **Consistency work:** references do not automatically cascade on delete or update.
- **Dangling references:** if a target document is deleted, other documents can still contain its ID.
- **Cross-document atomicity:** writes across separate documents need a transaction or application workflow when they must be atomic together.
- **Index requirements:** referenced relationship fields often need indexes to support efficient lookups.

## Embedding and referencing at a glance

| Decision factor | Often favors embedding | Often favors referencing |
| :--- | :--- | :--- |
| Read pattern | Parent and child are usually read together | Child is frequently queried on its own |
| Relationship size | Small and bounded | Large, high-cardinality, or unbounded |
| Update pattern | Values change together | Child changes independently or frequently |
| Data duplication | A snapshot or limited duplicate is useful | A mutable value should have one canonical copy |
| Lifecycle | Child exists only with its parent | Child has separate retention or permissions |
| Atomicity | One document write should update related values together | Separate entities are managed independently |
| Document size | Combined shape stays comfortably bounded | Combined shape may grow too large |

These are guidelines, not automatic rules. A schema can use a mixture of embedded data and references.

## Model common relationship shapes

### One-to-one

If the related data is small and usually accessed with the parent, embed it:

~~~js
{
  _id: "user-42",
  email: "alex@example.test",
  profile: {
    displayName: "Alex",
    timezone: "Asia/Kolkata"
  }
}
~~~

Reference a one-to-one entity when it has independent access, permissions, or lifecycle, or when separating it keeps the parent focused:

~~~js
{
  _id: "user-42",
  email: "alex@example.test",
  profileId: "profile-42"
}
~~~

“One-to-one” alone does not decide the model. Access patterns and lifecycle do.

### One-to-many: bounded children owned by a parent

A small, bounded list of child values that is normally read with the parent can be embedded:

~~~js
{
  _id: "post-15",
  title: "MongoDB basics",
  tags: ["mongodb", "database", "mern"]
}
~~~

An order with a modest number of line items is also a natural embedding candidate. Order lines belong to that order, and the purchase price can be stored as a historical snapshot.

### One-to-many: large or growing child sets

For many comments, events, messages, or measurements, store each child separately and put the parent identifier on the child:

~~~js
// comments collection
{
  _id: "comment-9001",
  postId: "post-15",
  authorId: "user-42",
  text: "Helpful explanation",
  createdAt: new Date()
}
~~~

Add an index that supports the actual query, for example:

~~~js
await comments.createIndex({ postId: 1, createdAt: -1, _id: -1 });
~~~

This avoids appending an unbounded list to the parent document. The parent-to-children relationship can be found by querying the child collection using `postId`.

### Many-to-many

For a modest relationship where each side needs a small snapshot and is commonly read together, embedding a limited subset may work. For a large or independently managed many-to-many relationship, use a relationship collection:

~~~js
// enrollments collection
{
  _id: "enrollment-1",
  studentId: "student-42",
  courseId: "course-7",
  enrolledAt: new Date(),
  status: "active"
}
~~~

Create indexes that reflect the access and uniqueness rules. For example, if a student may enroll in a course only once:

~~~js
await enrollments.createIndex(
  { studentId: 1, courseId: 1 },
  { unique: true }
);
~~~

The relationship document can also hold attributes of the relationship, such as enrollment date or status. This is often clearer than maintaining large arrays of IDs on both entities.

## Avoid unbounded arrays

An array is unbounded when its number of entries can grow without a meaningful upper limit. Examples include all comments on a popular post, all events for a device, or every message in a long-lived conversation.

Unbounded arrays can cause:

- Increasing document size and memory use.
- More data transferred for queries that need only recent entries.
- More index entries and update work.
- Reaching the 16 MiB document-size limit.
- Contention when many requests update the same parent.

If a relationship can grow continually, store children in their own collection and query by parent ID. If the parent only needs a recent preview, keep a deliberately bounded subset or summary and treat it as derived data.

## Handle duplication deliberately

Sometimes it is useful to copy a small piece of related data, such as the product title and price into an order item. That copy records what was true at purchase time; it is not meant to track later catalog changes.

For mutable profile or catalog data, duplicated values can become inconsistent if one copy changes and others do not. If duplication is chosen for read performance, decide:

- Which collection or field is authoritative?
- Which writes update the duplicate?
- Can a temporary mismatch be accepted?
- Is a background reconciliation needed?
- Is a historical snapshot intended, or should the copied value always be current?

Do not duplicate mutable values without an update and consistency plan.

## References do not provide foreign-key enforcement

MongoDB does not automatically validate that a referenced ID points to a live document. It also does not automatically cascade deletes.

An application can handle relationships by:

- Checking target existence when creating a relationship, where appropriate.
- Scoping reads and writes to the current owner or tenant.
- Defining whether a delete removes, retains, anonymizes, or archives child documents.
- Running cleanup workflows that are observable, retryable, and safe to repeat.
- Using a transaction when several changes must commit or abort together.

The right approach depends on the consistency requirement. Do not assume a reference enforces referential integrity by itself.

## Querying referenced data

The Node.js driver can query each collection separately:

~~~js
const order = await orders.findOne({ _id: orderId });

if (order === null) {
  return null;
}

const items = await orderItems
  .find({ orderId: order._id })
  .toArray();

return { ...order, items };
~~~

For server-side joins, an aggregation can use `$lookup`:

~~~js
const results = await orders
  .aggregate([
    { $match: { _id: orderId } },
    {
      $lookup: {
        from: "orderItems",
        localField: "_id",
        foreignField: "orderId",
        as: "items"
      }
    }
  ])
  .toArray();
~~~

Choose the query shape based on the workload. An aggregation is not automatically better than embedding or separate reads; consider indexes, result size, and how much related data each request needs.

## A practical decision process

For each relationship, answer these questions:

1. **Are the related values normally read together?** If yes, embedding may reduce query work.
2. **Is the child set predictably bounded?** If no, avoid a growing embedded array.
3. **Does the child need independent reads, updates, permissions, or retention?** If yes, referencing may fit better.
4. **Do both sides change together?** If yes, embedding can simplify single-document writes; if not, references may reduce write coupling.
5. **Would copying a value represent a historical snapshot or create stale duplication?** Be explicit about which one.
6. **Must multiple changes be atomic?** If yes, consider whether one document can model the invariant, or whether a transaction is needed.
7. **What indexes support the important queries?** Add indexes to relationship fields used for lookup and filtering.
8. **How large can a document and query result become?** Keep both within practical bounds.
9. **What happens when a parent or child is deleted?** Define the cleanup policy.
10. **Can the model serve actual endpoints without excessive round trips or over-fetching?** Review the important read and write paths.

Prototype the highest-volume or most important query paths with realistic data sizes before committing to a schema.

## Common mistakes

- **Embedding every related record:** a relationship that grows without a bound can create oversized documents.
- **Referencing every small value:** separate reads and joins add complexity when values are always used with the parent.
- **Keeping large arrays of child IDs on the parent:** the array can grow without bounds and become difficult to update.
- **Duplicating mutable data without a plan:** copies can drift from the authoritative value.
- **Assuming references enforce existence:** the driver stores an ID; the application must manage the relationship.
- **Assuming deletes cascade:** define child cleanup, retention, or archival explicitly.
- **Using a transaction to compensate for a poor model:** first consider whether the invariant can be modeled inside one document.
- **Ignoring realistic cardinality:** a design that works for ten children may fail for millions.
- **Adding indexes without a query need:** every index consumes storage and adds write maintenance; index actual lookup patterns.
- **Treating embedding and referencing as mutually exclusive:** a model can embed a snapshot and reference the canonical entity.

## Key points

- Model for application access patterns, update patterns, relationship cardinality, and lifecycle.
- Embedding keeps related values together and supports single-document atomic writes.
- Referencing separates independently queried or growing entities and reduces duplication.
- Small bounded child sets often fit inside a parent; large or unbounded sets usually need their own collection.
- Many-to-many relationships often use a relationship collection with indexes for lookup and uniqueness.
- References are identifiers, not automatic joins or foreign keys.
- If data is duplicated, define which copy is authoritative and how changes propagate.
- Consider document size, read volume, write contention, and cleanup behavior before choosing.

## Review checklist

You are ready to move on when you can:

- Explain the read and write tradeoffs of embedding and referencing.
- Choose a model for a bounded one-to-many relationship and an unbounded one.
- Design a many-to-many relationship collection.
- Identify when a copied value is a historical snapshot.
- Explain why an ObjectId reference does not enforce the target’s existence.
- Describe how child documents are handled when a parent is deleted.
- Identify indexes needed for the relationship queries in your application.
- Justify a schema choice using realistic access patterns and cardinality.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [024 - Delete documents safely](024-delete-documents-safely.md) | Lesson | [Q&A](../qnas/025-schema-design-embedding-versus-referencing.md) | [Example](../examples/025-schema-design-embedding-versus-referencing.md) | [026 - Data modeling and relationship patterns](026-data-modeling-and-relationship-patterns.md) |
