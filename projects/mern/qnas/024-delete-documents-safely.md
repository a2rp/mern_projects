# Chapter 024 Q&A: Delete documents safely

Use these questions to review safe delete filters, delete result handling, returned documents, and lifecycle choices.

## Part 1: Multiple-choice questions

### 1. What does `deleteOne(filter)` do?

- **A.** Deletes every matching document
- **B.** Deletes at most one matching document
- **C.** Deletes the collection
- **D.** Deletes only the first field in a document

**Answer: B.** `deleteOne()` removes at most one document matching the filter. When multiple documents can match, the selected one is not an application-level selection rule; use a unique filter or an explicit sort-based operation.

### 2. What does `deleteMany(filter)` do?

- **A.** Deletes every document matching the filter
- **B.** Deletes at most one match
- **C.** Deletes documents from every collection
- **D.** Deletes a document and returns its contents

**Answer: A.** `deleteMany()` removes all documents matching its filter in the target collection. Keep the filter deliberately scoped.

### 3. What does `deleteMany({})` match?

- **A.** No documents
- **B.** Only documents with a missing `_id`
- **C.** Every document in the collection
- **D.** Only the oldest document

**Answer: C.** An empty filter matches every document. Therefore, `deleteMany({})` can remove all documents from the collection. Reject empty or incomplete filters when building application delete operations.

### 4. Which result field tells how many documents a delete operation removed?

- **A.** `matchedCount`
- **B.** `deletedCount`
- **C.** `modifiedCount`
- **D.** `upsertedCount`

**Answer: B.** `deletedCount` reports the number of deleted documents in an acknowledged delete result.

### 5. Which operation returns the deleted document or `null` if no document matched?

- **A.** `deleteMany()`
- **B.** `deleteOne()`
- **C.** `findOneAndDelete()`
- **D.** `countDocuments()`

**Answer: C.** `findOneAndDelete()` removes one matching document and returns it. Use it when later application logic needs the deleted record.

### 6. How can you choose which matching document `findOneAndDelete()` removes?

- **A.** Pass a `sort` option
- **B.** Pass a `limit: 0` option
- **C.** Sort after the delete
- **D.** Use `deleteMany()`

**Answer: A.** The sort option makes the choice among matching documents explicit, such as highest priority and then oldest creation time.

### 7. Why might a delete filter include both `_id` and `tenantId`?

- **A.** To avoid returning a cursor
- **B.** To scope the delete to the caller’s tenant as well as the record identity
- **C.** To enable upsert behavior
- **D.** To make every filter unique automatically

**Answer: B.** An ID identifies a record, but tenant scope can be part of authorization and isolation. Construct the filter to enforce the data model’s ownership boundary.

### 8. What does a preview count before a later delete guarantee?

- **A.** The exact number that the later delete will remove
- **B.** That no records can change before deletion
- **C.** Only the number matching at the time of the count
- **D.** That the delete is transactional

**Answer: C.** A count and a later delete are separate operations. Documents can be inserted, updated, or removed between them, so the preview is not a lock or reservation.

### 9. What is MongoDB’s default atomicity guarantee for a single-document delete?

- **A.** A single-document write is atomic
- **B.** Every deleteMany operation is globally atomic
- **C.** Deletes are never atomic
- **D.** Atomicity requires an index

**Answer: A.** A write operation on one document is atomic. A multi-document operation does not become one all-or-nothing unit just because it is one command.

### 10. What is soft deletion?

- **A.** Permanently dropping a database
- **B.** Marking a record as deleted while leaving it stored
- **C.** Encrypting a collection
- **D.** Deleting only the document’s fields

**Answer: B.** A soft delete records a deletion state, often with a timestamp. Normal queries must account for the marker, and the data remains in storage.

### 11. Should a TTL index be treated as an exact-time access-control mechanism?

- **A.** Yes, it deletes the record at the exact millisecond
- **B.** No, background expiration cleanup is not an exact user-visible timer
- **C.** Yes, if the TTL field is indexed
- **D.** It cannot delete documents

**Answer: B.** TTL indexes are useful for time-based cleanup, but deletion is performed in the background and should not be used as the only enforcement of an exact access-expiration rule.

### 12. Does deleting a parent document automatically delete related documents in another collection?

- **A.** Yes, all references cascade by default
- **B.** No, the application must define and perform the relationship cleanup
- **C.** Yes, if both collections have indexes
- **D.** Only when using `deleteMany()`

**Answer: B.** MongoDB does not infer application-level foreign-key cascades from references. Design whether related records are retained, removed, archived, or processed asynchronously.

### 13. Why index fields used by a frequent cleanup filter?

- **A.** To make the delete return deleted documents
- **B.** To help the server find eligible documents without examining an unnecessarily large set
- **C.** To make `deleteMany()` atomic
- **D.** To prevent all concurrent writes

**Answer: B.** A suitable index can make candidate selection more efficient. Indexes do not make a multi-document delete atomic or replace a precise filter.

### 14. What does `deletedCount: 0` tell you?

- **A.** The collection does not exist
- **B.** No document was removed by that operation
- **C.** The delete always failed
- **D.** The filter matched exactly one document

**Answer: B.** No document was deleted. The record may not exist, or other filter conditions such as owner or status may not match. The count alone does not reveal which condition failed.

### 15. What is the purpose of the `acknowledged` field in a delete result?

- **A.** It indicates whether the write was acknowledged according to the configured write concern
- **B.** It identifies the deleted document
- **C.** It counts matching documents
- **D.** It means the filter was non-empty

**Answer: A.** Acknowledgement status describes the write response under the configured write concern. It does not by itself mean that a document matched; inspect `deletedCount` too.

## Part 2: Short-answer questions

### 16. Explain the difference between `deleteOne()` and `deleteMany()`.

`deleteOne()` removes at most one document matching the filter. `deleteMany()` removes every matching document. Use the latter only when the full match set is intended and the filter has been carefully scoped.

### 17. Why should you avoid relying on which document `deleteOne()` selects when several documents match?

The filter does not express which record the application wants among several matches. Use a unique identity filter, or use `findOneAndDelete()` with a sort when the requirement selects by priority, age, or another order.

### 18. When should an application use `findOneAndDelete()` instead of `deleteOne()`?

Use it when the application needs the removed document after deletion, for example to return its title or create an audit event. It can also use a sort and projection. Otherwise, `deleteOne()` returns a smaller delete result with counts.

### 19. What is an idempotent delete, and what happens on a repeated request?

A delete by a stable identity and appropriate scope can be safely repeated in the sense that a later request removes nothing after the first deletion. The later result usually has `deletedCount: 0`; the API should define whether that means “already absent” or “not found.”

### 20. Why include an owner or tenant condition in a delete filter?

It helps enforce the application’s data isolation and authorization rules at the database operation itself. A caller-supplied ID alone should not allow deleting another user’s or tenant’s record.

### 21. What makes a `deleteMany()` filter safer than a broad status-only filter?

It includes every boundary needed to define the intended scope, such as tenant, lifecycle state, and expiration cutoff. Validate the values and authorization on the server instead of trusting client-supplied filters.

### 22. How should a preview-and-confirm delete workflow reuse its filter?

Build the filter once from validated parameters and use that same filter for both the preview count and delete. This avoids accidental scope drift, but the count still does not freeze the data or guarantee the later delete count.

### 23. When is a transaction relevant to deletion?

Use a transaction when a business operation must coordinate multiple document or collection writes atomically. A normal multi-document delete does not make the whole set an all-or-nothing operation. Transactions have operational costs and should solve a real consistency requirement.

### 24. What should the application account for when using soft deletion?

Normal reads must hide or handle soft-deleted records; restore behavior, uniqueness rules, retention, and eventual permanent cleanup need definitions. The original data remains stored, so soft deletion is not erasure.

### 25. What is the difference between TTL cleanup and checking expiration during a read?

TTL removes expired documents asynchronously as background cleanup. A read or authorization check can reject an expired record immediately according to application logic. Use that check when exact access timing matters.

### 26. What kind of data is a TTL index intended to clean up?

It is suited to documents whose whole lifecycle ends after a time, such as short-lived sessions or temporary records. It is not a generic mechanism for selectively removing fields or coordinating related records.

### 27. What should an archive-before-delete workflow define?

It should define how records are copied or moved, how duplicates and retries are handled, how successful archival is verified, what happens after partial failure, and whether archive and deletion writes need transactional coordination.

### 28. Why is server-side authorization still required if the delete filter includes an owner ID?

The owner condition is part of enforcing scope, but the server must still verify who is making the request and whether they are allowed to perform that action. Do not trust a client to choose an arbitrary owner or tenant value.

### 29. What safeguards help with a large cleanup job?

Use a selective indexed filter, an explicit batch size, progress tracking, retries, monitoring, and a clear stop condition. If candidate IDs are selected first, include them and the eligibility conditions in the delete filter.

### 30. How do indexes affect delete safety?

Indexes can improve candidate lookup efficiency, but they do not make a bad filter safe. Correct scope, authorization, and result checks remain necessary even when the filter is indexed.

## Part 3: Practical scenarios

### 31. A handler receives a missing tenant ID and falls back to `deleteMany({})`. What should it do instead?

Reject the request before issuing a database write. A missing scope must not broaden a destructive operation. Require and validate the tenant identity, then construct an authorized filter on the server.

### 32. A queue needs to remove the highest-priority queued job, oldest first on ties. Which operation shape fits?

Use `findOneAndDelete()` with a filter for the queue scope and status, plus a sort such as `{ priority: -1, createdAt: 1, _id: 1 }`. That makes the selection rule explicit and returns the removed job if needed.

### 33. A delete by task ID returns `deletedCount: 0` after adding a tenant condition. Does that prove the task ID is invalid?

No. The ID may not exist, the tenant may not own it, or the task may fail another filter condition. Avoid revealing another tenant’s record by distinguishing these cases unless the authorization design permits it.

### 34. A service needs the task title to write an audit event after deletion. Which method can provide the title?

Use `findOneAndDelete()` with the identity and authorization filter and a projection including the title. If it returns `null`, no record matched; otherwise, use the returned document to construct the audit event.

### 35. A preview shows 20 matching records, but the later delete removes 23. Is that necessarily a bug?

Not necessarily. The two commands were separate, so three additional records may have become eligible between them. If an exact all-or-nothing result is required, redesign the workflow with the appropriate consistency controls.

### 36. Deleting a project should also remove rows in a related collection. What must the application add?

Define the relationship policy and explicitly perform the related cleanup. If all related writes must succeed or fail together, use an appropriate transaction. If cleanup is asynchronous, make it observable, retryable, and safe to repeat.

### 37. A maintenance job selects 500 expired IDs and then runs `deleteMany({ _id: { $in: ids } })`. What condition should it also keep?

Retain the tenant/scope and current eligibility conditions, such as archived state and expiration cutoff. A selected ID might have changed state since the read; the delete should re-check the rule.

### 38. An API lets the caller submit a MongoDB filter directly to a delete endpoint. What should change?

Do not pass arbitrary client filters through to MongoDB. Accept a small set of validated parameters, authenticate and authorize the requester, then build a server-controlled filter containing required identity and tenant scope.

### 39. A session must become unusable exactly at its expiration time, but old records may be cleaned up later. What is the right approach?

Check the expiration time in the request’s authentication or authorization path and reject an expired session. A TTL index may remove the record later as storage cleanup, but it should not be the only access control.

### 40. A user may delete an order only while it is cancelled. How can the operation avoid deleting an order that changed state after it was read?

Include `status: "cancelled"` and the order’s identity and tenant in the same delete filter. If the order changes state before the write, it no longer matches and will not be removed.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [023 - Update, replace, and upsert documents](../lessons/023-update-replace-and-upsert-documents.md) | [Lesson](../lessons/024-delete-documents-safely.md) | Q&A | [Example](../examples/024-delete-documents-safely.md) | [025 - Schema design: embedding versus referencing](../lessons/025-schema-design-embedding-versus-referencing.md) |
