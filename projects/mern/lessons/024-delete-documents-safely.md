# 024 - Delete documents safely

Deleting a document is a permanent write unless the application has a recovery mechanism. Safe deletion starts with a precise filter, a clear choice between deleting one or many records, and a deliberate plan for the data that is removed.

## Learning goals

By the end of this chapter, you should be able to:

- Choose between `deleteOne()`, `deleteMany()`, and `findOneAndDelete()`.
- Build filters that limit a delete to the intended owner, tenant, and state.
- Recognize why an empty filter can delete far more than intended.
- Interpret `deletedCount` and an unacknowledged result correctly.
- Preview a delete while understanding the limits of a separate count query.
- Decide when soft deletion, archiving, or permanent deletion fits.
- Handle related documents and multi-document consistency.
- Use indexes and operational safeguards for large delete jobs.

## Delete one matching document

`deleteOne()` removes at most one document matching its filter:

~~~js
const result = await tasks.deleteOne({
  _id: taskId,
  ownerId,
  status: "completed"
});

if (result.deletedCount === 1) {
  console.log("Task deleted.");
} else {
  console.log("No task matched the delete conditions.");
}
~~~

Use a filter that represents both identity and authorization. A task ID by itself may not prove that the current user owns the task. Include the owner or tenant condition when the data model requires it.

If several documents match, `deleteOne()` removes one of them; do not depend on which match it chooses. Prefer a unique identity filter. If the requirement is “delete the oldest matching record,” use an operation with an explicit sort.

## Delete all matching documents

`deleteMany()` removes every document that matches its filter:

~~~js
const result = await sessions.deleteMany({
  tenantId,
  status: "expired",
  expiresAt: { $lt: cutoff }
});

console.log("Deleted sessions: " + result.deletedCount);
~~~

This can be appropriate for a carefully bounded cleanup. Review the complete filter before running it. A missing tenant, status, or date condition can greatly expand the set of documents that matches.

### Treat empty filters as dangerous

An empty filter `{}` matches every document in the collection. Therefore:

~~~js
await collection.deleteOne({});
~~~

removes one matching document, while:

~~~js
await collection.deleteMany({});
~~~

removes every document in the collection. Do not pass an empty filter as a fallback when a required identifier is missing. Validate inputs and fail closed.

A simple application guard can reject broad deletes:

~~~js
function requireScopedFilter(filter) {
  if (!filter || Object.keys(filter).length === 0) {
    throw new Error("A non-empty, scoped delete filter is required.");
  }

  if (!filter.tenantId) {
    throw new Error("The tenant identifier is required.");
  }

  return filter;
}

const safeFilter = requireScopedFilter({
  tenantId,
  status: "expired"
});

await sessions.deleteMany(safeFilter);
~~~

This guard is only a basic example. Validate values and authorization according to the application’s data model; checking that a filter is non-empty is not enough to establish that it is safe.

## Understand delete results

The driver returns a delete result. For an acknowledged operation, the important fields include:

- `acknowledged`: whether the write was acknowledged according to the configured write concern.
- `deletedCount`: how many documents were deleted.

A delete result does not return the deleted document. A `deletedCount` of zero means the filter matched no document that was removed. It does not tell you whether the ID never existed, the owner did not match, or the state condition was false.

Do not infer that a write succeeded just because the driver call did not throw. Check the acknowledgement and operation result in the context of the configured write concern.

## Return the deleted document

Use `findOneAndDelete()` when the application needs the document that was removed, such as to create an audit record or return a response:

~~~js
const deletedTask = await tasks.findOneAndDelete(
  {
    _id: taskId,
    ownerId,
    status: "completed"
  },
  {
    projection: {
      _id: 1,
      title: 1,
      status: 1
    }
  }
);

if (deletedTask === null) {
  console.log("No task matched the delete conditions.");
} else {
  console.log("Deleted task: " + deletedTask.title);
}
~~~

It deletes one matching document and returns that document, or `null` when none matched. A projection limits what the operation returns.

### Choose which matching document to delete

When the filter can match several records and the rule selects one by order, use the sort option:

~~~js
const nextJob = await jobs.findOneAndDelete(
  {
    tenantId,
    status: "queued"
  },
  {
    sort: {
      priority: -1,
      createdAt: 1,
      _id: 1
    },
    projection: {
      _id: 1,
      jobName: 1,
      priority: 1
    }
  }
);
~~~

The sort makes the selection rule explicit: highest priority first, then earliest creation time, with `_id` as a tie-breaker. The filter and sort should use fields with suitable indexes when this operation is on a busy path.

## Make a delete conditional

A delete filter can include the state that must still be true at deletion time:

~~~js
const result = await orders.deleteOne({
  _id: orderId,
  tenantId,
  status: "cancelled"
});
~~~

This removes the order only if it still belongs to the tenant and is cancelled. If another operation changes its status before the delete is applied, the filter no longer matches.

For a single-document operation, the filter and delete form one atomic write against that document. Use conditions in the filter instead of relying only on a value read earlier and then acting as if it could not change.

## Preview a multi-delete

A preview count can help an operator understand a cleanup before it runs:

~~~js
const filter = {
  tenantId,
  status: "expired",
  expiresAt: { $lt: cutoff }
};

const previewCount = await sessions.countDocuments(filter);
console.log("Sessions matching cleanup: " + previewCount);

// Run only after the application or operator has approved the same scope.
const deleteResult = await sessions.deleteMany(filter);
console.log("Sessions deleted: " + deleteResult.deletedCount);
~~~

The count and delete are separate operations. Other writes can occur between them, so the count is not a lock, a reservation, or a guarantee that the delete will remove exactly that number. Keep the filter identical, and use an appropriate transaction or maintenance design if the workflow requires a stronger all-or-nothing guarantee.

Do not add an unbounded delete to an application request simply because a preview count is small. Validate the scope and operational impact separately.

## Delete in bounded batches

For a very large cleanup, one enormous delete can create avoidable load and make it harder to monitor progress. A controlled job can repeatedly select a bounded set of IDs, delete those records with the same ownership and eligibility conditions, record progress, and pause between batches.

For example, select a stable group of eligible IDs:

~~~js
const candidates = await events
  .find({
    tenantId,
    archived: true,
    archivedAt: { $lt: cutoff }
  })
  .sort({ archivedAt: 1, _id: 1 })
  .limit(500)
  .project({ _id: 1 })
  .toArray();

const ids = candidates.map((event) => event._id);

if (ids.length > 0) {
  const result = await events.deleteMany({
    tenantId,
    archived: true,
    archivedAt: { $lt: cutoff },
    _id: { $in: ids }
  });

  console.log("Deleted in this batch: " + result.deletedCount);
}
~~~

The repeated eligibility conditions are intentional: a record that is no longer eligible should not be deleted just because its ID appeared in an earlier read. A production job also needs a loop, progress tracking, retry policy, and a stopping condition.

Do not assume that a limit on the selection query limits a subsequent `deleteMany()` call. The limit selects candidate IDs; the `_id` filter bounds the delete set.

## Hard delete, soft delete, and archive

### Hard delete

A hard delete removes the document from the collection. Choose it when the data should no longer be available in normal reads and the system’s retention and recovery requirements permit permanent removal.

### Soft delete

A soft delete changes the document’s state instead of removing it:

~~~js
const result = await tasks.updateOne(
  {
    _id: taskId,
    ownerId,
    deletedAt: { $exists: false }
  },
  {
    $set: {
      deletedAt: new Date(),
      status: "deleted"
    }
  }
);
~~~

Normal queries must exclude soft-deleted records. Define how restore works, how uniqueness behaves while records are deleted, and when permanent cleanup occurs. Soft deletion is not the same as erasing the data; the document remains stored.

### Archive

An archive workflow copies or moves records to a designed archive store before deleting them from the active collection. Plan for duplicate handling, verification, retries, and whether the archive write and active delete need coordinated transactional behavior.

The choice depends on the application’s recovery and retention needs. Do not call a soft delete a permanent erasure.

## Related documents and consistency

MongoDB’s single-document write atomicity does not automatically remove related documents in another collection. Before deleting a parent record, decide whether dependent documents should be deleted, retained, anonymized, or archived.

For a multi-document workflow, possibilities include:

- Model related data together when it is naturally read and changed together.
- Use a transaction when all participating writes must commit or abort together.
- Use an explicit cleanup workflow when work may be retried or completed asynchronously.

A transaction is not a substitute for a clear data model. If cleanup is asynchronous, make the process observable and idempotent, and define how partially completed work is repaired.

## Indexes and operational safety

Delete filters should be selective and supported by indexes appropriate to the query. Without useful indexes, the server may need to examine many documents to find candidates. Validate query plans in a safe environment for important cleanup jobs.

Operational safeguards can include:

- Require an explicit tenant or scope identifier.
- Require an expected status or age condition.
- Reject empty filters in application helpers.
- Use a review step for large administrative deletes.
- Log the filter scope and the final `deletedCount` without logging sensitive document contents.
- Set an operational batch size and monitor progress.
- Use least-privilege database credentials for services and maintenance jobs.

A “preview then confirm” interface is useful, but the server must still validate authorization and scope when the final delete is submitted.

## TTL cleanup

MongoDB TTL indexes can remove documents after a configured expiration time. This is useful for data whose lifecycle is truly time-based, such as short-lived sessions.

TTL deletion is automatic cleanup, not a precise timer for an exact user-visible deadline. If the application needs a record to become inaccessible at a precise time, enforce the expiration in reads or authorization checks; do not rely only on background TTL cleanup.

Use TTL only when deleting the whole document after expiration matches the data lifecycle. It is not a substitute for carefully deleting one related field or performing a multi-step archive workflow.

## Common mistakes

- **Using `deleteMany({})` accidentally:** an empty filter matches all documents in the collection.
- **Using `deleteOne()` as if it chooses a specific match:** use a unique filter or explicit sort when several records can match.
- **Deleting by ID without ownership scope:** include tenant or owner criteria where the data model requires them.
- **Treating a preview count as a lock:** count and delete are separate operations and data can change between them.
- **Assuming delete results contain removed data:** use `findOneAndDelete()` when the document itself is needed.
- **Assuming a parent delete cleans related collections:** define and implement the relationship cleanup.
- **Treating soft delete as erasure:** soft-deleted documents remain stored.
- **Treating TTL as exact-time deletion:** enforce access rules independently when timing matters.
- **Running a huge cleanup without progress controls:** bound work, measure results, and make retries safe.
- **Ignoring `deletedCount`:** use the operation result to distinguish a deletion from a no-match outcome.

## Key points

- `deleteOne()` removes at most one match; `deleteMany()` removes all matches.
- An empty filter can match the entire collection. Validate and scope destructive filters.
- `deletedCount` reports the number removed; delete methods do not return those documents.
- `findOneAndDelete()` returns the removed document or `null` and can use a sort.
- Single-document writes are atomic; a multi-document operation is not all-or-nothing by default.
- A count-before-delete is a preview only, not a guarantee.
- Choose hard delete, soft delete, archive, or TTL based on the data lifecycle.
- Plan for authorization, related data, indexes, and operational monitoring.

## Review checklist

Before shipping a delete path or job, confirm that you can:

- State exactly which records the filter may match.
- Explain why an empty filter is dangerous.
- Scope the operation to the right owner or tenant.
- Choose between deleting one, deleting many, and returning the removed document.
- Interpret `deletedCount` and handle no-match outcomes.
- Explain the race between a preview count and a later delete.
- Describe how related documents and recovery are handled.
- Explain why a TTL index does not enforce precise access expiration.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [023 - Update, replace, and upsert documents](023-update-replace-and-upsert-documents.md) | Lesson | [Q&A](../qnas/024-delete-documents-safely.md) | [Example](../examples/024-delete-documents-safely.md) | [025 - Schema design: embedding versus referencing](025-schema-design-embedding-versus-referencing.md) |
