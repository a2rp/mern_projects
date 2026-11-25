# Chapter 023 Q&A: Update, replace, and upsert documents

This Q&A reviews targeted updates, full replacements, upserts, result counts, and safe update patterns with the MongoDB Node.js driver.

## Part 1: Multiple-choice questions

### 1. What is the main purpose of `updateOne()`?

- **A.** Replace every document in a collection
- **B.** Modify at most one document matching a filter
- **C.** Insert a document regardless of whether a match exists
- **D.** Delete one matching document

**Answer: B.** `updateOne()` applies an update to at most one matching document. Use a filter that identifies the intended document, preferably with a unique key.

### 2. Which operator changes a field while preserving other fields in the document?

- **A.** `$set`
- **B.** `$replace`
- **C.** `$drop`
- **D.** `$insert`

**Answer: A.** `$set` assigns a value to a field, creating it if necessary. Fields not named in the update remain unchanged.

### 3. What does `$unset` do?

- **A.** Sets a field to an empty string
- **B.** Removes a field from the document
- **C.** Replaces the entire document
- **D.** Disables the field in the collection schema

**Answer: B.** `$unset` removes the specified field. Its operand value is ignored; an empty string is commonly used by convention.

### 4. Which operator is intended to increase or decrease a numeric field?

- **A.** `$push`
- **B.** `$inc`
- **C.** `$rename`
- **D.** `$unset`

**Answer: B.** `$inc` adds a number to the current numeric value. A negative increment decrements it.

### 5. What happens when `updateOne()` finds no match and upsert is not enabled?

- **A.** MongoDB inserts a document based on the filter
- **B.** MongoDB replaces the nearest document
- **C.** No document is changed or inserted
- **D.** MongoDB reports an error every time

**Answer: C.** With the default `upsert: false` behavior, a non-matching update does not insert a document.

### 6. What does `{ upsert: true }` mean for an update?

- **A.** Always insert a new document
- **B.** Update a match, or insert a document if no match exists
- **C.** Update all documents
- **D.** Replace the collection

**Answer: B.** An upsert combines update and insert behavior. A matching document is updated; if none matches, MongoDB creates a document using the filter and update.

### 7. Which operation is designed to replace the fields of one matching document?

- **A.** `updateMany()`
- **B.** `replaceOne()`
- **C.** `findOne()`
- **D.** `insertOne()`

**Answer: B.** `replaceOne()` replaces the matched document’s fields with the replacement document’s fields. The existing `_id` is retained.

### 8. If a replacement document omits an existing `tags` field, what happens?

- **A.** `tags` remains unchanged
- **B.** `tags` is removed from the replaced document
- **C.** The replacement is rejected
- **D.** `tags` becomes an empty array

**Answer: B.** Replacement is whole-document replacement (apart from the existing `_id`). Fields omitted from the replacement disappear.

### 9. What does `matchedCount` report?

- **A.** Number of documents matched by the filter
- **B.** Number of documents inserted by the operation
- **C.** Number of fields changed
- **D.** Number of documents in the collection

**Answer: A.** `matchedCount` counts matching documents. It can be greater than zero even when the update makes no actual change.

### 10. What does `modifiedCount` report?

- **A.** Number of documents whose content was actually modified
- **B.** Number of documents matched whether changed or not
- **C.** Number of fields in the update document
- **D.** Number of upserted documents

**Answer: A.** `modifiedCount` reflects documents whose stored data changed. Setting a field to its existing value can produce a match with no modification.

### 11. In a successful upsert insert, which result field identifies the new document’s id?

- **A.** `matchedCount`
- **B.** `upsertedId`
- **C.** `modifiedCount`
- **D.** `deletedCount`

**Answer: B.** `upsertedId` contains the id of the document created by the upsert. If the update matched an existing document, no new id is reported there.

### 12. What is the best way to prevent duplicate logical records from concurrent upserts?

- **A.** Add a longer timeout
- **B.** Use a unique index for the logical identity fields
- **C.** Run `updateMany()` instead
- **D.** Remove the filter

**Answer: B.** A unique index enforces the identity rule in the database. Application checks alone can race when concurrent requests both see no match.

### 13. What does `$setOnInsert` do in an upsert?

- **A.** Applies only when an existing document matches
- **B.** Applies only when the upsert inserts a new document
- **C.** Replaces fields during every update
- **D.** Prevents the upsert from inserting

**Answer: B.** `$setOnInsert` assigns specified values only on the insert branch of an upsert. It does nothing when an existing document is updated.

### 14. Is `updateMany()` one all-or-nothing atomic operation across every matching document?

- **A.** Yes, every match is one indivisible operation
- **B.** No, each individual document update is atomic, but the batch as a whole is not
- **C.** Yes, if the collection has an index
- **D.** It depends only on whether the filter uses `_id`

**Answer: B.** MongoDB guarantees atomicity for a single-document write. An `updateMany()` operation can update some documents before an error or interruption; the whole batch is not an all-or-nothing transaction.

### 15. Which filter is the clearest way to decrement stock only when enough stock remains?

- **A.** `{ sku: "item-1" }` with `$inc: { stock: -1 }`
- **B.** `{ sku: "item-1", stock: { $gt: 0 } }` with `$inc: { stock: -1 }`
- **C.** `{ stock: 0 }` with `$set: { stock: -1 }`
- **D.** An empty filter with `$inc`

**Answer: B.** Put the required condition in the same write filter. MongoDB checks the filter as part of the atomic single-document write, so the decrement occurs only while stock is positive.

## Part 2: Short-answer questions

### 16. Explain the difference between an update and a replacement.

An update uses operators such as `$set` or `$inc` to change selected paths and preserve untouched fields. A replacement supplies a new document shape; fields not included in the replacement are removed. The existing document’s `_id` remains unchanged.

### 17. When should you use `updateOne()` instead of `updateMany()`?

Use `updateOne()` when the intended change applies to one record, ideally found by a unique identity. Use `updateMany()` only when the same change should apply to every document matching a deliberately bounded filter. Verify the filter before issuing a broad multi-update.

### 18. Why should an update filter identify the intended record precisely?

A broad filter can update the wrong record or many records. With `updateOne()`, a filter matching several documents also does not express which record is the application identity. Use a primary or unique key, and include state conditions when they are part of the rule.

### 19. How can dot notation update a nested field without replacing the whole nested object?

Use a dotted path in an update operator, for example `$set: { "profile.city": "Pune" }`. This changes only `city` under `profile` and preserves sibling fields such as `profile.name`.

### 20. Why can `matchedCount` be 1 while `modifiedCount` is 0?

The filter found a document, but the requested update did not change its stored value. For example, setting `status` to `"active"` when it is already `"active"` can match without modifying the document.

### 21. What does an acknowledged write result tell you?

`acknowledged` indicates whether the write was acknowledged according to the configured write concern. Check it along with operation counts; an acknowledged response does not mean that a filter matched a document.

### 22. What information can `UpdateResult` provide after an update?

It includes acknowledgement state and counts such as `matchedCount`, `modifiedCount`, and `upsertedCount`, plus `upsertedId` when an upsert inserts. Use the fields that correspond to the operation’s expected outcome.

### 23. How is the new document formed when an upsert has no match?

MongoDB uses equality conditions from the filter as a base and applies the update document. With operator updates, operators such as `$set` provide the fields to write; `$setOnInsert` adds insertion-only defaults. Avoid filters containing conditions that would create an unintended document shape.

### 24. Give a good use for `$setOnInsert`.

Use it for a creation timestamp or default value that should be established once when an upsert creates the record, such as `$setOnInsert: { createdAt: new Date() }`. Use `$set` for values that should also change when an existing record matches.

### 25. Why should upsert identity fields have a unique index?

Without a database-enforced uniqueness rule, simultaneous upserts can both observe that no record exists and each insert a logical duplicate. A unique index makes the intended identity constraint authoritative; handle a duplicate-key result if concurrent requests race.

### 26. What happens to `_id` during `replaceOne()`?

If a replacement matches an existing document, MongoDB preserves that document’s `_id`. A replacement cannot change the existing document’s immutable `_id`. Do not include a conflicting identifier in a replacement.

### 27. What is the difference between `$unset` and setting a field to `null`?

`$unset` removes the field entirely. Setting a field to `null` leaves the field present with a null value. Queries, schema validation, and application logic may treat missing and null fields differently.

### 28. How should an application handle a matched update that changes nothing?

Interpret the counts according to the user action. A positive `matchedCount` means a record satisfied the filter; `modifiedCount: 0` means its data did not change. Do not report a modification solely because a record matched.

### 29. Why is a client-submitted update document unsafe to pass through directly?

It can let a caller modify protected fields, set unexpected paths, or submit operators the application did not intend to support. Validate input, allowlist editable fields, authorize the requested action, and construct the database update on the server.

### 30. When is a transaction needed instead of `updateMany()`?

Use a transaction when a business operation must atomically coordinate multiple documents or collections and partial completion would violate the required invariant. A normal `updateMany()` does not make its entire set of document updates one all-or-nothing unit.

## Part 3: Practical scenarios

### 31. A profile update should change only a user’s display name. Which operation shape fits?

Use `updateOne()` with the user’s unique key and a `$set` for the display name:

~~~js
await users.updateOne(
  { _id: userId },
  { $set: { displayName: validatedName } }
);
~~~

This preserves other profile fields. Validate the name and authorize the user before constructing the update.

### 32. A product update should remove an obsolete `legacyCode` field. What should you use?

Use `$unset` in a targeted update:

~~~js
await products.updateOne(
  { sku: "item-1" },
  { $unset: { legacyCode: "" } }
);
~~~

This removes only `legacyCode` and preserves the rest of the document.

### 33. An inventory request must not let stock fall below zero. How can the write enforce that condition?

Include the minimum-stock condition in the filter and decrement with `$inc`:

~~~js
const result = await products.updateOne(
  { sku: "item-1", stock: { $gt: 0 } },
  { $inc: { stock: -1 } }
);
~~~

If `matchedCount` is zero, either the product does not exist or the stock condition was not met. Handle that outcome explicitly.

### 34. A user changes one address in a document containing several addresses. How can you avoid overwriting unrelated data?

Target the specific nested path with `$set`, or use an array filter when updating a matching array element. Do not replace the entire parent object unless every omitted child field should be removed. Ensure the filter identifies the correct user and address.

### 35. A daily maintenance job should mark all expired subscriptions. What should you check before using `updateMany()`?

Build a precise filter, such as an expiration-time condition plus the current active state. Confirm the intended scope and inspect the result’s `matchedCount` and `modifiedCount`. Remember that the operation is not atomic across the whole matched set.

### 36. An import should create a product if its SKU is new and update its price otherwise. What design is appropriate?

Use `updateOne()` with the stable identity filter, set the price with `$set`, set creation-only values with `$setOnInsert`, enable `upsert: true`, and enforce SKU uniqueness with an index. Handle duplicate-key errors from concurrent upserts.

### 37. A replacement accidentally removed `tags` and `createdAt`. Why?

The operation likely used `replaceOne()` with a replacement document that omitted those fields. Replacement removes omitted fields. If only selected values should change, use an update operator such as `$set` instead.

### 38. A repeated update reports one match and zero modifications. Is this necessarily a failure?

No. It may mean the requested values already existed. The filter matched a document, but the update produced no data difference. Report the outcome based on both counts and the application’s desired semantics.

### 39. Two requests try to create the same account with an upsert. How should the system avoid duplicates?

Create a unique index on the account’s logical identity, such as normalized email. Use that identity in the upsert filter and handle a duplicate-key error by re-reading or reporting a conflict as appropriate. A pre-check alone does not prevent a race.

### 40. An API accepts arbitrary fields and sends them inside `$set`. What should be improved?

Define an allowlist of fields the caller may change, validate each value and its type, reject protected fields such as roles or ownership identifiers, and check authorization. Build the `$set` object from validated values rather than forwarding raw request input.

### 41. A command should update a document only if its version is still 4. What filter pattern can prevent a stale write?

Include the expected version in the filter and increment it in the same single-document update:

~~~js
const result = await orders.updateOne(
  { _id: orderId, version: 4 },
  {
    $set: { status: "confirmed" },
    $inc: { version: 1 }
  }
);
~~~

If `matchedCount` is zero, the document may have changed since it was read or may no longer satisfy the expected state. The caller can reload and resolve the conflict.

### 42. A script upserts a record with `$setOnInsert: { createdAt: new Date() }`. Will repeated matching runs reset `createdAt`?

No. `$setOnInsert` applies only on the insert branch. Once the document exists and matches, subsequent runs do not change `createdAt` through that operator.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md) | [Lesson](../lessons/023-update-replace-and-upsert-documents.md) | Q&A | [Example](../examples/023-update-replace-and-upsert-documents.md) | [024 - Delete documents safely](../lessons/024-delete-documents-safely.md) |
