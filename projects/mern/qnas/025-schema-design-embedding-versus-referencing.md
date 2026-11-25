# Chapter 025 Q&A: Schema design: embedding versus referencing

These questions review how to choose between embedded data and document references based on real application queries, updates, relationship size, and lifecycle.

## Part 1: Multiple-choice questions

### 1. What does embedding mean in a MongoDB schema?

- **A.** Storing related fields or subdocuments inside one document
- **B.** Storing every field in a separate database
- **C.** Creating an index for every field
- **D.** Copying a database to another server

**Answer: A.** An embedded model places related information inside the parent document, often as a nested object or an array of subdocuments.

### 2. What does a reference usually store?

- **A.** A live database join result
- **B.** An identifier that points to a related document
- **C.** A copy of every field in the target document
- **D.** A foreign key that MongoDB automatically enforces

**Answer: B.** A reference is typically an identifier, such as an ObjectId. The application uses it to query related data; it is not an automatically enforced foreign key.

### 3. Which access pattern often favors embedding?

- **A.** Parent and child values are usually read together
- **B.** Child records grow without a limit
- **C.** Child data has an independent lifecycle
- **D.** Child data is queried on its own most of the time

**Answer: A.** If the application usually needs the related values with their parent, embedding can reduce round trips and return them in a single document read.

### 4. Which relationship is generally a safer embedding candidate?

- **A.** An unbounded history of all user events
- **B.** A small, predictable list of order line items
- **C.** All comments ever posted on a popular article
- **D.** Every message in a long-lived chat

**Answer: B.** A small, bounded child set that is normally read with its parent can fit naturally in an embedded array.

### 5. What is MongoDB’s maximum BSON document size?

- **A.** 1 MiB
- **B.** 8 MiB
- **C.** 16 MiB
- **D.** 64 MiB

**Answer: C.** A BSON document must remain below 16 MiB. Unbounded embedded arrays can eventually approach or exceed this size.

### 6. What often favors referencing the child documents?

- **A.** Children are tiny and always read with the parent
- **B.** The child set is large, independently queried, or continually growing
- **C.** The child exists only as part of a parent snapshot
- **D.** The parent and children must always be updated in one document write

**Answer: B.** A separate child collection avoids continually growing the parent and supports independent reads and lifecycle behavior.

### 7. Which aggregation stage can combine documents from a referenced collection?

- **A.** `$lookup`
- **B.** `$rename`
- **C.** `$unset`
- **D.** `$inc`

**Answer: A.** `$lookup` performs a join-like aggregation between collections. It does not change the fact that the records are stored separately.

### 8. Does storing an ObjectId in a field automatically guarantee that the referenced document exists?

- **A.** Yes, MongoDB checks it like a foreign key
- **B.** No, the application must manage that relationship
- **C.** Only when the field is indexed
- **D.** Only when using `$lookup`

**Answer: B.** A stored identifier is an ordinary value. MongoDB does not automatically enforce that it points to a live document.

### 9. What is a key risk of duplicating mutable data in many documents?

- **A.** It cannot be queried
- **B.** The copies can become inconsistent when one value changes
- **C.** It disables atomic writes
- **D.** It prevents indexes from being created

**Answer: B.** Duplicated mutable values need an update and consistency strategy. Otherwise, different copies can drift.

### 10. Why might an order item store the product name and price from the time of purchase?

- **A.** To preserve a historical snapshot for that order
- **B.** To ensure the current product catalog changes retroactively
- **C.** To create an automatic foreign key
- **D.** To avoid assigning the order an identifier

**Answer: A.** Values such as the purchase-time name and price can intentionally represent a snapshot rather than a live copy of the catalog.

### 11. What is an unbounded array?

- **A.** An array with exactly one item
- **B.** An array that can keep growing without a meaningful upper limit
- **C.** An array that only contains numbers
- **D.** An array that has an index

**Answer: B.** Examples include all comments on a popular post or every event for a device. Such arrays can make parent documents too large and expensive to update.

### 12. How is a large one-to-many set of comments commonly modeled?

- **A.** Put all comments in an ever-growing array on the post
- **B.** Store each comment separately with a `postId` field
- **C.** Store every post in each comment
- **D.** Put all comments in the database name

**Answer: B.** A separate comments collection with a parent identifier supports querying comments without growing the post document indefinitely.

### 13. What is a common model for a large many-to-many relationship with relationship-specific fields?

- **A.** A relationship collection such as `enrollments`
- **B.** An unbounded array of full target documents on both sides
- **C.** One database per relationship
- **D.** A single string containing all identifiers

**Answer: A.** A relationship document can store the identifiers and attributes of the relationship, such as enrollment time or status.

### 14. What is a benefit of embedding related values in a single document?

- **A.** Changes to the document can be atomic at the single-document level
- **B.** All related collections become transactional automatically
- **C.** Embedded arrays can grow without limit
- **D.** References get enforced automatically

**Answer: A.** MongoDB writes to an individual document are atomic, including changes to embedded values in that document. This does not make writes to other documents atomic.

### 15. Which statement about embedding and referencing is accurate?

- **A.** A schema must use only one style everywhere
- **B.** A schema can mix embedded values and references
- **C.** References are always faster
- **D.** Embedding is always more consistent

**Answer: B.** Models often embed snapshots or bounded values while referencing independently managed entities.

## Part 2: Short-answer questions

### 16. Why should schema design start with application access patterns?

They show which fields are read together, which entities are queried independently, and which values change together. Those patterns determine whether co-locating data or separating it better serves the workload.

### 17. Name three benefits of embedding.

Embedding can reduce database round trips, retrieve related values in one document read, and allow related changes within one atomic document write. It can also keep parent-owned data self-contained.

### 18. Name three costs of embedding.

A parent can grow too large, a frequently updated child can create write contention on the parent, and duplicated mutable values can become inconsistent. Queries can also over-fetch a large embedded structure.

### 19. Name three benefits of referencing.

Referencing supports independent reads and updates, keeps a growing child set out of the parent, and avoids unnecessary duplication of a canonical mutable entity. It can also give the child its own lifecycle and permissions.

### 20. Name two costs of referencing.

The application may need additional reads or an aggregation to assemble related data. It must also manage existence, cleanup, indexes, and consistency because references do not provide automatic foreign-key behavior.

### 21. How should you decide how to model a one-to-one relationship?

Embed when the related fields are small, normally read with the parent, and share its lifecycle. Reference when the related entity has its own access rules, lifecycle, or independent query workload. The one-to-one cardinality alone does not decide the model.

### 22. How should you decide how to model a one-to-many relationship?

Embed a small, predictable child set that is usually read with the parent. Put large or continually growing children in a separate collection, typically with a parent identifier on each child and an index supporting the query.

### 23. Why can a relationship collection work well for many-to-many data?

It represents each association as its own record and can store relationship attributes such as status or creation date. Indexes can enforce uniqueness and support queries from either side.

### 24. Why is document growth part of the schema decision?

A growing embedded structure increases the size of the document and the amount of data a query may need to read or transfer. It can also approach MongoDB’s 16 MiB BSON document limit and increase write work.

### 25. When is duplicated data a historical snapshot rather than an inconsistency?

When the value is intended to preserve what was true at a specific time, such as the product title and price on a completed order. Document the snapshot meaning so later catalog edits do not overwrite history accidentally.

### 26. Why is a reference not a foreign key?

It is just an identifier value stored by the application. MongoDB does not automatically verify that a target document exists or cascade deletes when a target is removed.

### 27. Why should a relationship field such as `postId` often be indexed?

The application commonly filters child documents by that field. An appropriate index can support those queries and their sort order. Choose the index from the actual query pattern and account for index storage and write maintenance.

### 28. What is a dangling reference, and how can an application handle it?

It is a reference whose target record no longer exists. Applications can prevent some cases by validating relationships, define delete cleanup or archival policies, and make asynchronous repair workflows observable and retryable.

### 29. When might a transaction be needed with referenced documents?

When an operation changes multiple documents and the business invariant requires every write to commit or abort together. A transaction is not automatically needed for every reference; first evaluate whether the schema can keep the invariant in one document.

### 30. Why might a mixed model be appropriate?

Different related values have different access and lifecycle patterns. For example, an order can embed line-item snapshots while referencing the canonical customer or catalog product.

## Part 3: Practical scenarios

### 31. An order must show the exact product title and price that were charged, even after the catalog changes. What should it store?

Embed a purchase-time snapshot of the relevant product fields in the order item. The product ID can also be retained as a reference for navigation to the canonical catalog record.

### 32. A popular post may receive millions of comments. Should all comments be embedded in the post?

No. The comment list is unbounded and would continually enlarge the post document. Store comments in a separate collection with a `postId` field and index it for the application’s filtering and sorting pattern.

### 33. A user profile has one small display name and timezone that are almost always read with the user. What model is a reasonable starting point?

Embed a small `profile` subdocument in the user record. If the profile later gains independent access, permissions, or a lifecycle, reevaluate whether a separate collection fits better.

### 34. Students and courses form a many-to-many relationship, and each enrollment has a status and date. How could it be modeled?

Create an `enrollments` collection with `studentId`, `courseId`, status, and enrollment date. Add indexes for the important lookup directions and a unique compound index if duplicate enrollment pairs are not allowed.

### 35. Many articles display the current author name, and authors can change their name. What should the design consider?

If the current name must always be canonical, reference the author and fetch the current value as needed. If articles should preserve the author name at publication time, store a snapshot. If reads need a denormalized display value, define how updates propagate and whether temporary staleness is acceptable.

### 36. A device can produce a continuous stream of measurements, but the dashboard usually needs only recent measurements. What is a good model direction?

Store measurements separately with a device identifier and timestamp, and index the fields used for device/time queries. A bounded recent summary may be stored on the device only if it has a clear size limit and update policy.

### 37. A parent record has a bounded array of three contact methods that is returned in every profile read. Should those methods be embedded?

Embedding is a reasonable fit because the list is small, bounded, and accessed with the parent. If individual methods later need independent ownership, permission, or lifecycle, revisit the model.

### 38. A file attachment has its own access control, retention policy, and download queries. Should its metadata always be embedded in the parent?

Not necessarily. An independently managed attachment entity may fit better in its own collection with a reference to the parent. A small display snapshot can still be embedded if the parent view needs it.

### 39. A team uses `$lookup` to join a collection. Does that remove the need to define integrity and delete behavior?

No. `$lookup` combines matching records for a query. It does not guarantee that referenced IDs exist or define what happens when either side is deleted. The application still needs a relationship and cleanup policy.

### 40. What evidence should support a choice between embedding and referencing before release?

The choice should match real endpoint reads and writes, expected relationship cardinality, data lifecycle, document-size growth, duplication rules, and index strategy. Test important query paths with realistic data volumes and revisit assumptions as the workload changes.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [024 - Delete documents safely](../lessons/024-delete-documents-safely.md) | [Lesson](../lessons/025-schema-design-embedding-versus-referencing.md) | Q&A | [Example](../examples/025-schema-design-embedding-versus-referencing.md) | [026 - Data modeling and relationship patterns](../lessons/026-data-modeling-and-relationship-patterns.md) |
