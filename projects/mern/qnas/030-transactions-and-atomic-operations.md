# Chapter 030 Q&A: Transactions and atomic operations

Review MongoDB single-document atomicity, conditional updates, transaction sessions, retries, rollback, and tradeoffs.

## Part 1: Multiple-choice questions

### 1. What does MongoDB guarantee for a write to one document?

- **A.** The write is atomic for that document
- **B.** Every document in the collection is changed with it
- **C.** The write is automatically a multi-document transaction
- **D.** The write cannot conflict with another operation

**Answer: A.** A single-document write applies all its changes to that document together. Other documents are not automatically included.

### 2. Is `updateMany()` atomic across all documents it matches?

- **A.** No. Each document modification is atomic, but the overall operation is not all-or-nothing
- **B.** Yes, all matched documents always commit together
- **C.** Yes, if the filter has an index
- **D.** It can update only one document

**Answer: A.** Other operations may interleave with a multi-document write. Use a transaction when all changes must commit or abort together.

### 3. What is a good way to prevent inventory from becoming negative?

- **A.** Filter on sufficient stock and decrement with `$inc` in one update
- **B.** Read the value, then overwrite it later without checking state
- **C.** Add a negative quantity to an array
- **D.** Update every product at once

**Answer: A.** The condition and decrement are evaluated as one atomic write on the inventory document.

### 4. When is a multi-document transaction appropriate?

- **A.** When an invariant spanning multiple documents must commit or abort together
- **B.** For every simple read
- **C.** For every MongoDB request
- **D.** To ensure every query uses an index

**Answer: A.** Transactions are for cross-document all-or-nothing work that one atomic document operation or a suitable model cannot provide.

### 5. What happens when a transaction aborts?

- **A.** Its transaction writes are discarded
- **B.** Its first write remains committed
- **C.** Its writes turn into an aggregation
- **D.** It sends queued emails

**Answer: A.** An aborted transaction does not commit its database changes.

### 6. What object does a transaction use in the Node.js driver?

- **A.** A session
- **B.** An index
- **C.** An aggregation cursor
- **D.** A schema validator

**Answer: A.** A transaction is associated with a session, and participating operations must use it.

### 7. What does the convenient `withTransaction()` API provide?

- **A.** A transaction callback with commit/abort handling and retries for certain transaction errors
- **B.** Index creation on every collection
- **C.** A transaction without a session
- **D.** Rollback for external service calls

**Answer: A.** The driver manages the transaction lifecycle and handles certain retryable transaction errors.

### 8. What must a Node.js driver operation do to participate in the transaction?

- **A.** Include the transaction's `{ session }` option
- **B.** Use a separate MongoClient
- **C.** Run through `Promise.all()`
- **D.** Omit the collection name

**Answer: A.** An operation without the session is outside the transaction and will not roll back with it.

### 9. How should operations inside a Node.js driver transaction be run?

- **A.** Sequentially; the driver does not support parallel operations within one transaction
- **B.** Always with `Promise.all()`
- **C.** On different sessions in parallel
- **D.** Only through aggregation

**Answer: A.** Run transaction operations in sequence with the same session.

### 10. Why should a retryable transaction callback not send an email?

- **A.** The callback may run more than once, duplicating an external side effect
- **B.** Transactions delete email messages automatically
- **C.** The email server joins the database transaction
- **D.** Sending email commits the transaction

**Answer: A.** MongoDB cannot roll back an email or other external action if the database callback is retried.

### 11. Which deployment supports multi-document transactions?

- **A.** A replica set or a suitable sharded cluster
- **B.** Any standalone MongoDB server
- **C.** A local JSON file
- **D.** Any client with a session object

**Answer: A.** A standalone server does not provide multi-document transaction support.

### 12. Which modeling approach can reduce the need for transactions?

- **A.** Embed bounded related data that is read and changed together
- **B.** Store each field in a different collection
- **C.** Remove all indexes
- **D.** Use a transaction for every operation

**Answer: A.** Keeping bounded related values in one document can let one atomic document write maintain the invariant.

### 13. A conditional debit matches no source account. What should the application do?

- **A.** Abort and return an appropriate business error
- **B.** Credit the destination anyway
- **C.** Record a successful transfer
- **D.** Retry forever

**Answer: A.** No match means the expected state was not found, such as insufficient funds or a missing account.

### 14. Which pattern coordinates a MongoDB commit with eventual message publication?

- **A.** A transactional outbox with an idempotent worker
- **B.** A schema validator
- **C.** An index hint
- **D.** A `$lookup`

**Answer: A.** Save the business change and an outbox event in the same transaction, then publish it with a separate retry-safe worker.

### 15. Why should transactions usually be short?

- **A.** Long transactions hold resources and can increase conflicts and aborts
- **B.** Short transactions disable validation
- **C.** Long transactions cannot write
- **D.** MongoDB allows one operation per transaction only

**Answer: A.** Keep a transaction focused so it uses fewer resources and is less likely to conflict or hit operational limits.

## Part 2: Short-answer questions

### 16. What does single-document atomicity mean?

**Answer:** All changes made by one write to one document are applied together. A reader does not see only some of the fields changed by that write.

### 17. Why can a read followed later by a write create a race?

**Answer:** Another request can change the document between those operations. Put the expected state in the write filter and use an atomic update operator.

### 18. What does a conditional update filter provide?

**Answer:** It lets the database apply the write only if the document still satisfies a condition, such as enough stock or an expected version. The application checks the matched result.

### 19. Why is `$inc` often safer than a client-side read-modify-write?

**Answer:** `$inc` performs arithmetic against the current stored value atomically. A client-side calculation may overwrite another concurrent change unless it checks expected state.

### 20. Does one `updateMany()` call make all its document updates one atomic unit?

**Answer:** No. Each document modification is atomic individually, but the entire set of updates is not one all-or-nothing transaction.

### 21. What role does a session play in a driver transaction?

**Answer:** The session carries the transaction context. Every participating read and write must be issued with that same session.

### 22. What should happen if the `withTransaction()` callback throws?

**Answer:** The transaction aborts and the error reaches the caller, subject to driver retry handling for certain errors. The application must not report the operation as successful.

### 23. Why should operations in a Node.js driver transaction not use `Promise.all()`?

**Answer:** The driver does not support parallel operations within one transaction. Run them sequentially with the same session.

### 24. How can callback retries affect application code?

**Answer:** A callback can execute again for certain transient failures. Database work can be retried, but external side effects can repeat. Keep side effects out of the callback and keep stable IDs outside it when needed.

### 25. What should a transfer do when the conditional debit matches zero documents?

**Answer:** Abort and return an appropriate error, such as insufficient funds or account not found. Do not credit the destination or create a successful transfer record.

### 26. Why must each participating operation include `{ session }`?

**Answer:** An operation without the session runs outside the transaction. It can commit even if the other transaction operations abort.

### 27. What is an idempotency key for?

**Answer:** It lets an application recognize a retry as the same client request instead of creating a duplicate business effect. Store and enforce the key with suitable deduplication logic.

### 28. Why does a database transaction not include an email or payment-provider call?

**Answer:** Those services are outside MongoDB. MongoDB cannot roll back their actions, so coordinate them with an outbox or another retry-safe design.

### 29. What is the transactional outbox pattern?

**Answer:** Write business data and an event record in the same transaction. A separate worker publishes outbox records and tracks delivery, handling retries idempotently.

### 30. Why prefer a conditional single-document write when it can preserve the invariant?

**Answer:** It is simpler and generally has less coordination overhead than a multi-document transaction, while retaining atomicity for the document that owns the state.

## Part 3: Practical scenarios

### 31. Two customers try to buy the last unit at once. What update pattern prevents negative stock?

**Answer:** Filter by the product ID and `available: { $gte: requestedQuantity }`, then decrement with `$inc` in that same update. Check `matchedCount`; only a request that still sees enough stock can succeed.

### 32. A transfer debits one account, credits another, and writes a ledger record. What belongs in the transaction?

**Answer:** Put the conditional debit, destination credit, and ledger insert in one transaction and session. Abort if any required step fails so balances and the record do not partially commit.

### 33. The debit uses a session, but the destination credit omits it. What can go wrong?

**Answer:** The credit is outside the transaction and could commit even if the debit aborts. Pass the same session to both updates and the ledger insert.

### 34. A callback sends a text after debiting, then gets a transient error. What can happen on retry?

**Answer:** The text may be sent again because the external action cannot roll back. Save an outbox event inside the transaction and send it with a retry-safe worker after commit.

### 35. An account update matches zero records, but the API returns “transfer complete.” What needs fixing?

**Answer:** Check the update result within the transaction. Abort and return an appropriate error if the source or destination did not match the required state.

### 36. A team parallelizes transaction operations with `Promise.all()`. What should it do?

**Answer:** Run operations sequentially on the transaction session. The Node.js driver does not support parallel operations inside one transaction.

### 37. A developer starts a transaction against a standalone local server and receives an error. What is needed?

**Answer:** Use a deployment that supports multi-document transactions, such as a replica set or a suitable sharded cluster. Configure local development to match the required capability.

### 38. Small, bounded order line items are always read and updated with the order. What model might avoid a transaction?

**Answer:** Consider embedding those items in the order document if their growth is bounded and access patterns fit. A write to that one document is atomic.

### 39. A transaction waits on a slow third-party API before returning. Why is that risky?

**Answer:** The transaction stays open while waiting, holding resources and increasing conflict or timeout risk. Keep external calls outside; coordinate them through an outbox or another retry-safe process.

### 40. A client times out and retries a transfer request. How can the system avoid duplicate transfers?

**Answer:** Require a stable idempotency key, deduplicate it with stored state and a unique constraint, and return the previous outcome for a repeated request. A transaction alone does not identify duplicate client requests.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [029 - Aggregation pipelines](../lessons/029-aggregation-pipelines.md) | [Lesson](../lessons/030-transactions-and-atomic-operations.md) | [Example](../examples/030-transactions-and-atomic-operations.md) | [031 - Mongoose ODM: when and how to use it](../lessons/031-mongoose-odm-when-and-how-to-use-it.md) |
