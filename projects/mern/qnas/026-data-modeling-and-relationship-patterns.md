# Chapter 026 Q&A: Data modeling and relationship patterns

Review common ways to store and query one-to-one, one-to-many, many-to-many, and hierarchical relationships in MongoDB.

## Part 1: Multiple-choice questions

### 1. What is a reasonable starting model for a small one-to-one preference object usually read with its user?

- **A.** Embed it in the user document
- **B.** Store every preference in its own database
- **C.** Store all users in one string
- **D.** Put a copy on every unrelated document

**Answer: A.** A small value that is read and updated with its parent can be embedded. If it later has an independent lifecycle or access pattern, reconsider the choice.

### 2. Where can a large, growing one-to-many child set store the parent identifier?

- **A.** In each child document
- **B.** Only in the parent’s unbounded ID array
- **C.** In a database name
- **D.** In an index without storing the relationship

**Answer: A.** A parent ID on each child avoids an ever-growing array on the parent. Index the parent ID for child lookups.

### 3. Which one-to-many relationship is the strongest embedding candidate?

- **A.** All device events over the device’s lifetime
- **B.** Every comment on a high-traffic post
- **C.** A small, bounded set of addresses shown with a customer
- **D.** Every chat message ever sent

**Answer: C.** A small, predictable child set commonly read with the parent can fit as an embedded array.

### 4. What is a relationship collection useful for in a many-to-many model?

- **A.** Storing association data such as status and enrollment date
- **B.** Avoiding all identifiers
- **C.** Making every delete cascade automatically
- **D.** Creating a transaction by default

**Answer: A.** A relationship document represents the association itself and can store its own fields.

### 5. What can go wrong when every relationship is stored in arrays on both sides?

- **A.** Both copies may become inconsistent when one side is not updated
- **B.** MongoDB automatically removes both copies
- **C.** The references become transactions
- **D.** The model cannot be queried

**Answer: A.** Bidirectional arrays duplicate the same relationship. Every change must keep both copies in sync, including under errors and concurrent writes.

### 6. What does the parent-reference tree pattern store on each node?

- **A.** The parent node’s identifier
- **B.** Every document in the database
- **C.** Only a display label
- **D.** A copy of all descendant documents

**Answer: A.** Each node stores its parent ID. An index on that field supports queries for direct children.

### 7. What does the child-reference tree pattern store on each parent?

- **A.** An array of its immediate child IDs
- **B.** A copy of every ancestor’s full document
- **C.** A unique index for every child field
- **D.** A separate database for each branch

**Answer: A.** Child references make immediate child IDs accessible from the parent, but a growing child array needs careful bounds and update handling.

### 8. What is one tradeoff of storing an ancestor array on every tree node?

- **A.** Moving a subtree may require changing descendant paths
- **B.** Parent IDs cannot be stored
- **C.** It prevents querying descendants
- **D.** Every tree read requires a transaction

**Answer: A.** Ancestor arrays can simplify hierarchy queries, but moving a node may require rewriting ancestor data for the node and its descendants.

### 9. What is a common use for a nested-set tree representation?

- **A.** Fast subtree range reads when the hierarchy changes infrequently
- **B.** An unbounded array of comments
- **C.** A replacement for all indexes
- **D.** An automatic parent-delete cascade

**Answer: A.** Nested sets can make subtree discovery efficient, but inserts and moves may require changing many boundary values.

### 10. Which index is a reasonable starting point for querying direct children by parent, newest first?

- **A.** `{ parentId: 1, createdAt: -1, _id: -1 }`
- **B.** `{ unrelatedField: 1 }`
- **C.** `{ createdAt: 1 }` only
- **D.** No index can support this query

**Answer: A.** The compound index follows the equality filter on parent ID and then the sort fields. Confirm the index with the actual query and data.

### 11. Which factor should drive the choice of a relationship pattern?

- **A.** The application’s read/write patterns and expected cardinality
- **B.** The number of collection names in the app
- **C.** Whether an identifier looks like an ObjectId
- **D.** A rule that all relationships must be embedded

**Answer: A.** Query direction, size, update frequency, ownership, and lifecycle all matter.

### 12. Does a MongoDB reference automatically enforce that its target document exists?

- **A.** Yes, as a foreign key
- **B.** No, the application must manage target existence and cleanup
- **C.** Only when the target is indexed
- **D.** Only when stored as an ObjectId

**Answer: B.** A reference is an identifier value. It does not automatically enforce a foreign-key constraint.

### 13. What can a unique compound index on `{ studentId, courseId }` enforce?

- **A.** At most one document for each student-course pair
- **B.** That every student takes every course
- **C.** That all enrollments have the same status
- **D.** That deleting a student removes the courses

**Answer: A.** It enforces uniqueness of the pair. If the domain needs multiple historical enrollment records, the key must include the lifecycle identity or use another design.

### 14. What does `$graphLookup` help with?

- **A.** Recursive traversal of related documents in an aggregation
- **B.** Creating an index on every field
- **C.** Automatically fixing dangling references
- **D.** Storing all tree data in one document

**Answer: A.** `$graphLookup` can traverse graph-like relationships through repeated matching. It does not add referential integrity.

### 15. Is storing a recent preview of children alongside a canonical relationship collection always wrong?

- **A.** Yes, any duplicate is forbidden
- **B.** No, it can be a deliberate derived subset if bounded and kept consistent
- **C.** Yes, MongoDB rejects duplicated data
- **D.** No, it automatically stays synchronized

**Answer: B.** A bounded preview can serve a frequent read, but the application must define its source of truth and refresh strategy.

## Part 2: Short-answer questions

### 16. What information should you gather before choosing a relationship pattern?

Estimate relationship cardinality, list the reads and writes that use it, determine whether children have independent lifecycles, identify which direction is queried, and decide what must happen on updates or deletes.

### 17. Why can a bounded embedded child array be useful?

It can return the parent and children in one read, keep parent-owned data together, and allow changes within that document to be atomic. Its usefulness depends on a realistic bound and the endpoint’s access pattern.

### 18. Why put a parent reference on each child for a large relationship?

The child set can grow without making the parent document’s ID array grow. The application can query children by the parent ID using an index.

### 19. When might a parent store child IDs?

When the child list has a reliable small upper bound and parent-to-child ID lookup is an important access pattern. For an unbounded set, store the parent ID on each child instead.

### 20. What is the main advantage of a many-to-many relationship collection?

It stores each association once and can include association-specific attributes such as status, role, or created time. It also supports indexes in either lookup direction.

### 21. What problem can two-sided relationship arrays create?

They duplicate the same logical relationship in multiple documents. A failed or concurrent update can make the arrays disagree, so consistency and repair rules are needed.

### 22. When does a parent-reference tree pattern fit?

It is a simple pattern when each node has one parent and the application often reads a node’s parent or its direct children. Index the parent field to support child queries.

### 23. When are child references on a tree node useful?

When the application frequently needs a bounded list of immediate children from the parent. They are less suitable when each parent can accumulate a very large number of children or the list changes frequently.

### 24. What does an ancestor array provide, and what is its cost?

It stores the IDs of ancestors on each node, which can simplify ancestor and descendant queries. Moving a subtree can require updating ancestor arrays for many descendants.

### 25. What is the tradeoff of a materialized path?

A path value can make branch queries straightforward, but moving a subtree can require rewriting the path on many nodes. The path format must also distinguish identifiers unambiguously.

### 26. Why are nested sets not the best default for every tree?

They can make subtree reads efficient, but inserting or moving nodes may require updating many boundary values. Their read advantage must justify that write complexity.

### 27. What role does `$graphLookup` play in a hierarchy?

It can recursively follow a relationship field during an aggregation to retrieve related levels. Use it when the query requires traversal; it does not replace indexes, bounded data design, or relationship integrity rules.

### 28. Why index child relationship fields?

The index can support common queries that filter children by their parent or sort them by time or another field. Choose the index based on real filters and sorts, and account for storage and write costs.

### 29. What should a relationship’s deletion policy specify?

Whether children are removed, retained, archived, or anonymized; what happens if a target is missing; and whether those writes need a transaction or a retryable cleanup workflow.

### 30. Why might a relationship have both canonical data and a small embedded preview?

The canonical data can support independent queries and unbounded growth, while a bounded preview can serve a common parent read. The preview is derived and needs a defined refresh and consistency policy.

## Part 3: Practical scenarios

### 31. A profile has two or three addresses and displays them whenever the customer loads. What pattern is a reasonable starting point?

Embed the bounded address subdocuments in the customer. Reevaluate if addresses need independent access control, query patterns, or a separate lifecycle.

### 32. A popular article may receive millions of comments. How should comments be represented?

Store each comment in a separate collection with a `postId` reference. Add an index that supports the post filter and requested sort, then return a bounded page.

### 33. A course has many students, and enrollment has a status and date. What collection design fits?

Use an enrollment relationship collection with `studentId`, `courseId`, status, and enrollment time. Add indexes for the queries and a unique compound constraint if duplicate pairs are not valid.

### 34. A team has at most six fixed roles, and the team settings page always reads them. What pattern could fit?

An embedded role configuration can fit because the set is deliberately bounded and read with the team. If roles become independently managed or unbounded, revisit the choice.

### 35. A book has many authors, and the app usually displays a book with a small author-name list. What could the book store?

It can embed a bounded list of author IDs and display-name snapshots to serve the book page. If the canonical author record changes independently, reference it as well or choose a query that fetches current data. Define whether displayed names are snapshots or live values.

### 36. A category has one parent and the main operation lists its direct children. Which tree pattern fits?

Use parent references: each category stores `parentId`, and an index on `parentId` supports the direct-child query. Use a different tree pattern if subtree traversal dominates the workload.

### 37. A category tree is stable, and queries frequently ask for all descendants of a node. What should the designer compare?

Compare ancestor arrays or materialized paths, which can simplify subtree queries, with parent references plus recursive traversal. Include the cost of moving nodes, rewriting descendant data, path correctness, and indexes.

### 38. A product and a category are many-to-many, and each association has an ordering value. How should the association be represented?

A relationship collection can store `productId`, `categoryId`, and the ordering value. Add uniqueness and lookup indexes that match whether queries start from products, categories, or both.

### 39. A course has an embedded preview of the three newest enrollments and a separate enrollment collection. What rules should the team define?

Define the enrollment collection as the source of truth, specify when and how the preview is refreshed, handle failed or repeated refreshes, and keep the preview bounded. Decide whether temporary staleness is acceptable.

### 40. A team proposes storing all child IDs on a parent and all parent IDs on every child. What should be reviewed before approving it?

Check whether both directions truly need materialized arrays, how each write updates both sides, how concurrency and partial failure are repaired, how arrays are bounded, and whether an indexed relationship collection can serve the queries with less duplicated state.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [025 - Schema design: embedding versus referencing](../lessons/025-schema-design-embedding-versus-referencing.md) | [Lesson](../lessons/026-data-modeling-and-relationship-patterns.md) | Q&A | [Example](../examples/026-data-modeling-and-relationship-patterns.md) | [027 - Schema validation and data integrity](../lessons/027-schema-validation-and-data-integrity.md) |
