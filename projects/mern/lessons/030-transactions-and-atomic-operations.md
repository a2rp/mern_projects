# 030 - Transactions and atomic operations

A database write should not leave related data in a contradictory state. MongoDB makes writes to one document atomic: all of the changes to that document happen together. When a business operation must update several documents as one unit, a multi-document transaction can commit all of those writes or roll them all back.

Prefer a clear single-document update or a data model that keeps tightly related values together when that is sufficient. Use a transaction when the invariant genuinely spans multiple documents and cannot be safely maintained by one atomic operation.

## Learning goals

By the end of this chapter, you should be able to:

- Explain single-document atomicity and its relationship to MongoDB's document model.
- Use conditional filters and atomic update operators to handle concurrent writes.
- Distinguish a multi-document operation from a multi-document transaction.
- Identify when a multi-document transaction is needed.
- Use a session and the Node.js driver's `withTransaction()` API.
- Handle rollback, retries, idempotency, and transaction callback side effects.
- Keep transactions short and understand their operational costs.

## Atomicity at the document level

A single write that changes several fields of one document is atomic. Other operations do not observe that document half-updated.

For example, changing both a balance and a revision field within one document is one atomic document write:

~~~javascript
await accounts.updateOne(
  { _id: accountId },
  {
    $inc: {
      balanceCents: -500,
      revision: 1
    }
  }
);
~~~

The database applies both field updates together on that document. Embedding a small, bounded set of values that are read and changed together can preserve this single-document atomicity and avoid a transaction.

Atomicity does not mean every read-modify-write sequence is safe. A separate read followed later by a write can race with another request. Put expected state into the write filter and use atomic update operators:

~~~javascript
const result = await inventory.updateOne(
  {
    _id: productId,
    available: { $gte: requestedQuantity }
  },
  {
    $inc: { available: -requestedQuantity }
  }
);

if (result.matchedCount !== 1) {
  throw new Error("Product is missing or has insufficient inventory.");
}
~~~

The filter and decrement are part of the same atomic operation. If two buyers compete for the remaining stock, a write only matches when the current available value still satisfies the condition.

### A multi-document write is not automatically atomic as a whole

An operation such as `updateMany()` can update many documents, but each document's modification is atomic individually. The entire multi-document operation is not one all-or-nothing unit. Other operations can interleave, and some documents may be updated even if a later part fails.

If the application needs all selected document changes to commit together or none of them to commit, use a transaction or redesign the operation around one atomic document.

## Multi-document transactions

A transaction groups multiple reads and writes under a session. If the transaction commits, its changes are committed together. If it aborts, its changes are discarded.

Transactions are useful for invariants that span records or collections. A bank transfer is a classic example:

1. Confirm the source account has enough funds and debit it.
2. Credit the destination account.
3. Record the transfer.
4. Commit all three changes together.

If any step fails, none of those transaction writes should remain.

Transactions have more overhead and coordination than single-document writes. Appropriate embedding, bounded arrays, and atomic update patterns can often simplify the data model. Do not add a transaction solely because it is available; first decide which invariant needs all-or-nothing behavior.

## Sessions and the Node.js driver

A transaction runs inside a session. Every read and write intended to participate must receive that session. A write made without the session is outside the transaction and will not roll back with it.

The Node.js driver's convenient API, `session.withTransaction()`, starts the transaction, commits after the callback succeeds, aborts on an error, and handles certain retryable transaction errors. Use operations sequentially inside the callback; the Node.js driver does not support parallel operations within one transaction.

~~~javascript
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    await accounts.updateOne(
      { _id: sourceId },
      { $inc: { balanceCents: -amountCents } },
      { session }
    );

    await accounts.updateOne(
      { _id: destinationId },
      { $inc: { balanceCents: amountCents } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
~~~

The short example illustrates the API shape, but a real transfer must also condition the debit on sufficient funds and verify that the expected source and destination records matched. The complete example file implements those checks and records a transfer.

A transaction callback can run more than once when the driver retries certain errors. Keep external side effects such as sending email, publishing a message, or charging a payment provider out of that callback. A retried callback could perform those actions more than once even though an earlier database attempt was rolled back.

Create stable identifiers and request metadata outside the callback when they must remain the same across callback retries. For HTTP request retries, add an application-level idempotency key and a unique constraint or deduplication record so the same client request cannot create duplicate business effects.

## Transaction options and deployment

Transactions require a MongoDB deployment that supports them, such as a replica set or sharded cluster. A standalone server does not provide multi-document transaction support. Configure and test against the deployment type used by the application.

Transaction options can specify read concern, write concern, and read preference. They affect the guarantees and routing of transaction operations. Choose them based on the application's consistency and durability requirements; do not copy settings blindly.

When using the driver, apply transaction-level options to `withTransaction()` or `startTransaction()`. Individual writes inside a transaction should use the session and should not set their own write concern. A transaction may have constraints based on the deployment and the operations it performs, so keep the workflow to supported database operations.

## Error handling and rollback

Treat errors according to their meaning:

- A business rule failure, such as insufficient funds, should abort the transaction and return an appropriate application response.
- A missing source or destination document should not silently produce a partial business operation.
- The driver may retry certain transient transaction failures. Allow the transaction API to perform its retry handling and do not swallow database errors inside the callback.
- A commit can have an uncertain outcome from the application's point of view if the connection fails at the wrong time. Use the driver's transaction API and an idempotent request design rather than blindly issuing a new business operation.

Throwing an error from the `withTransaction()` callback causes the transaction to abort. Do not catch an error inside the callback and then return success unless the operation really can continue while preserving the invariant.

## Keep transactions short

Long transactions hold resources and increase the chance of conflicts or aborts. A practical transaction should:

- Include only the database reads and writes necessary for one invariant.
- Avoid user interaction, long computation, file processing, or network calls.
- Avoid unbounded loops and large batches.
- Use indexes for transaction filters.
- Finish promptly and handle retryable failures.
- Avoid parallel database operations within the same Node.js driver transaction.

A transaction does not include external services. If a workflow must update MongoDB and publish an event, one common approach is the transactional outbox: write the business changes and an outbox record in the same transaction, then let a separate worker publish the event and mark it delivered. The worker should be idempotent because messages may be retried.

## Atomic update versus transaction

| Situation | Useful tool | Why |
| --- | --- | --- |
| Decrement stock only if enough remains | Conditional single-document update with `$inc` | Filter and decrement are atomic for that product document |
| Update several fields in one account record | One document update | A single document write is atomic |
| Decrement one account, credit another, and write a transfer record | Multi-document transaction | The invariant spans separate documents and collections |
| Update many documents where partial completion is acceptable | Multi-document write operation | Each document update is atomic; the entire operation is not |
| Save related bounded details that are normally read together | Consider embedding | A single-document write may satisfy the invariant without a transaction |

## Common mistakes

- Assuming `updateMany()` is atomic across all matched documents.
- Reading a value, making a decision in application code, then writing without an expected-value filter.
- Forgetting to pass `{ session }` to one of the transaction operations.
- Running transaction operations in parallel with `Promise.all()`.
- Sending email or charging an external provider inside a retryable transaction callback.
- Catching an error and returning success, leaving the application to believe a failed transaction committed.
- Leaving the session open after success or failure.
- Starting a transaction for a change that one atomic document update could safely handle.
- Keeping a transaction open while waiting for a user or a slow network service.
- Retrying an entire business request without an idempotency strategy.

## Practical checklist

Before implementing a transaction:

- Identify the exact cross-document invariant.
- Check whether embedding or a conditional atomic update can maintain it more simply.
- Ensure the deployment supports transactions.
- Put every participating database operation in the same session.
- Use sequential operations in the Node.js driver transaction.
- Check matched/modified results where the business rule depends on them.
- Keep the transaction short and avoid external side effects in its callback.
- Handle aborts and retryable errors through the driver API.
- Design request retries to be idempotent.
- End the session in a `finally` block.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [029 - Aggregation pipelines](029-aggregation-pipelines.md) | [Q&A](../qnas/030-transactions-and-atomic-operations.md) | [Example](../examples/030-transactions-and-atomic-operations.md) | [031 - Mongoose ODM: when and how to use it](031-mongoose-odm-when-and-how-to-use-it.md) |
