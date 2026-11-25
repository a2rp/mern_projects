# Update, replace, and upsert documents

An update changes selected fields in a matching document. A replacement substitutes the document's fields with a new set of fields. An upsert combines update-or-create behavior: if no document matches, MongoDB inserts one. Choosing the right operation—and a precise filter—prevents accidental data loss or duplicate records.

## Learning goals

By the end of this chapter, you should be able to:

- Use `updateOne()` to modify one matching document.
- Use `updateMany()` for a deliberately bounded group of documents.
- Apply common operators such as `$set`, `$unset`, and `$inc`.
- Use `replaceOne()` when the whole document shape should be replaced.
- Explain the difference between a field update and a full replacement.
- Enable upsert with `{ upsert: true }` and inspect its result.
- Use `$setOnInsert` for values that should be assigned only when inserting.
- Choose a stable key and unique index for reliable upserts.
- Handle matched, modified, and upserted counts correctly.

## Update selected fields

An update operation takes a filter, an update document, and optional settings. The update document uses update operators to change specific fields while preserving fields not mentioned.

~~~js
const result = await products.updateOne(
  { sku: "keyboard-01" },
  {
    $set: {
      price: 49.99,
      status: "active"
    }
  }
);
~~~

`updateOne()` updates at most one document that matches the filter. If the filter can match several documents, do not rely on which one is selected. Prefer a unique key or another filter that identifies exactly the intended document.

The operation does not insert a document when nothing matches unless you enable upsert. With the default options, a non-matching filter leaves the collection unchanged.

## Common update operators

Update operators target fields. They are not full replacement documents.

### `$set`

Set a field to a new value, or create it if it does not exist:

~~~js
await products.updateOne(
  { sku: "keyboard-01" },
  {
    $set: {
      price: 49.99,
      "details.color": "black"
    }
  }
);
~~~

Dot notation changes a nested field without replacing its whole parent object.

### `$unset`

Remove a field from a document:

~~~js
await products.updateOne(
  { sku: "keyboard-01" },
  {
    $unset: {
      temporaryNote: ""
    }
  }
);
~~~

The value for `$unset` is ignored; an empty string is a common convention.

### `$inc`

Increment or decrement a numeric field:

~~~js
await products.updateOne(
  { sku: "keyboard-01" },
  {
    $inc: {
      stock: -1
    }
  }
);
~~~

`$inc` is useful for counters and quantities. The target field should have a compatible numeric type. A numeric string is not the same as a number.

Different update operators can appear together when they target compatible fields:

~~~js
const result = await products.updateOne(
  { sku: "keyboard-01" },
  {
    $set: { price: 49.99 },
    $inc: { stock: -1 }
  }
);
~~~

Do not assign conflicting operations to the same path in one update. Update operators such as `$rename`, `$mul`, `$min`, `$max`, and array operators are also available; use the operator whose behavior matches the data change.

## Update multiple documents

Use `updateMany(filter, update)` only when every matched document is intended to change:

~~~js
const result = await products.updateMany(
  {
    category: "accessories",
    discontinued: true
  },
  {
    $set: {
      status: "archived"
    }
  }
);
~~~

Review a filter before applying a broad update. A filter of `{}` can match every document. In an application or maintenance task, it is often useful to inspect the intended matches first and ensure the filter is selective.

Each individual document update is atomic, but `updateMany()` as a whole is not an all-or-nothing transaction. If a later document update fails, earlier successful updates can remain. Use a transaction when the data requirements truly need atomic changes across multiple documents.

## Read update results

Update operations return an acknowledged result with useful counts:

- `matchedCount` is the number of documents matching the filter.
- `modifiedCount` is the number of matched documents whose stored data changed.
- `upsertedCount` is the number of documents inserted by upsert.
- `upsertedId` is the inserted document's ID when an upsert occurs.

A matched document is not always modified. For example, setting a field to its existing value can result in a positive `matchedCount` and a `modifiedCount` of zero.

~~~js
const result = await products.updateOne(
  { sku: "keyboard-01" },
  { $set: { status: "active" } }
);

console.log("Matched:", result.matchedCount);
console.log("Modified:", result.modifiedCount);
~~~

Check the result that matches the operation you intended. A zero match is not necessarily an error: the filter may not describe any existing document. Your application should decide whether to report not found, perform an upsert, or do nothing.

## Replace a whole document

Use `replaceOne(filter, replacement)` when the intended change is to replace the matched document's fields rather than update selected fields:

~~~js
const result = await products.replaceOne(
  { sku: "keyboard-01" },
  {
    sku: "keyboard-01",
    name: "Compact keyboard",
    price: 44.99,
    stock: 20
  }
);
~~~

The replacement removes existing fields not present in the replacement document. In the example, old fields such as `tags`, `details`, or `temporaryNote` are removed if they existed and are omitted from the replacement.

The existing `_id` is preserved. It is immutable: a replacement cannot change it. When replacing a document, provide every application field that should remain. Do not put update operators such as `$set` at the top level of a replacement document.

Choose replacement when the new complete document is authoritative. Choose an operator update when only selected fields should change.

## Upsert: update or insert

Upsert is enabled with `{ upsert: true }`:

~~~js
const result = await products.updateOne(
  { sku: "webcam-01" },
  {
    $set: {
      name: "HD webcam",
      price: 79.99,
      stock: 12
    }
  },
  { upsert: true }
);

console.log("Upserted:", result.upsertedCount);
console.log("Upserted ID:", result.upsertedId);
~~~

If the filter matches, MongoDB updates the matched document. If it does not match, MongoDB inserts a document based on the filter's equality criteria and the update modifications. A generated `_id` is added if the inserted document has none.

Use a stable identity in an upsert filter, such as a natural key or external record ID. Do not use a broad filter or a range condition as the identity for an update-or-create operation. If the identity must be unique, enforce that with a unique index. Without a unique constraint, concurrent upserts can insert duplicate logical records.

Upsert does not mean “replace if present.” It uses the update document's operators on a match, and inserts a document if there is no match.

## Set insertion-only defaults with `$setOnInsert`

`$setOnInsert` applies fields only when an upsert creates a new document. It does nothing when the filter matches an existing document:

~~~js
const result = await products.updateOne(
  { sku: "webcam-01" },
  {
    $set: {
      price: 79.99
    },
    $setOnInsert: {
      createdAt: new Date(),
      source: "catalog-import"
    }
  },
  { upsert: true }
);
~~~

This pattern can update a current value on every call while setting creation metadata only on the first insert. Use `$set` for values that should refresh on a match and `$setOnInsert` for insert-only defaults.

## Protect against lost updates

A filter can include the expected current value, not just an ID. This is a compare-and-set pattern:

~~~js
const result = await products.updateOne(
  {
    sku: "keyboard-01",
    stock: 5
  },
  {
    $set: {
      stock: 4
    }
  }
);

if (result.matchedCount === 0) {
  console.log("The product was missing or its stock changed.");
}
~~~

The update only succeeds if the expected stock value still matches. This can prevent one request from overwriting another request's change. For a simple decrement, `$inc` may be appropriate; if stock must never become negative, include an appropriate condition in the filter and check the result.

Single-document writes are atomic for that document. Multi-document workflows need additional design, and transactions are available when all-or-nothing behavior across multiple documents is required.

## Validate update input

Do not pass a client-supplied update object directly to MongoDB. A request body might include fields the caller should not change or update operators the endpoint did not intend to accept. Validate types and allowed fields, then build the update document on the server:

~~~js
const allowedStatuses = new Set(["active", "archived"]);

function buildProductUpdate(input) {
  const update = {};

  if (typeof input.name === "string" && input.name.trim() !== "") {
    update.name = input.name.trim();
  }

  if (allowedStatuses.has(input.status)) {
    update.status = input.status;
  }

  if (Object.keys(update).length === 0) {
    throw new Error("No valid product fields were provided.");
  }

  return { $set: update };
}
~~~

Also enforce authorization: a syntactically valid change may still be unauthorized. Never allow a client to change protected fields such as owner IDs, role flags, payment values, or internal timestamps unless the endpoint explicitly permits it.

## Common mistakes

- **Sending a replacement where a partial update was intended:** omitted fields will be removed.
- **Sending update operators to `replaceOne()`:** replacement documents contain fields and values, not operator expressions.
- **Using `updateOne()` with a non-unique filter:** only one match changes, and which one is not a reliable application identity.
- **Using `updateMany()` with a broad filter:** it can change every matched document; inspect the filter first.
- **Assuming a match means data changed:** `matchedCount` can be positive while `modifiedCount` is zero.
- **Assuming no match creates a document:** upsert is false unless explicitly enabled.
- **Using a non-unique upsert key:** concurrent calls can create duplicate logical records; use a unique index.
- **Treating upsert as a replacement:** upsert uses update operators on matches.
- **Expecting `$setOnInsert` to run on every update:** it applies only when an upsert inserts.
- **Allowing the client to submit raw update operators:** validate and allowlist fields on the server.
- **Expecting `updateMany()` to be one atomic transaction:** each document update is atomic, but the whole operation is not.

## Key points

- `updateOne()` modifies selected fields on at most one match; `updateMany()` applies an update to all matches.
- Update operators such as `$set`, `$unset`, and `$inc` preserve fields they do not target.
- `replaceOne()` removes fields omitted from its replacement document; it preserves the existing `_id`.
- `upsert: true` updates when matched and inserts when unmatched.
- Use unique indexes for identities that must be unique, especially with upserts.
- `$setOnInsert` assigns insertion-only values.
- Inspect matched, modified, and upserted results; validate and authorize every requested change.

## Review checklist

You are ready to move on when you can:

- Use `$set`, `$unset`, and `$inc` for targeted field changes.
- Explain what `updateOne()` and `updateMany()` do.
- Explain why `updateMany()` is not an all-or-nothing operation.
- Read `matchedCount`, `modifiedCount`, and `upsertedId` correctly.
- Explain which fields disappear during `replaceOne()`.
- Configure an upsert using a stable unique key.
- Use `$setOnInsert` for creation-only defaults.
- Validate and authorize update input instead of passing raw request data.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [022 - Sort, limit, skip, and pagination](022-sort-limit-skip-and-pagination.md) | Lesson | [Q&A](../qnas/023-update-replace-and-upsert-documents.md) | [Example](../examples/023-update-replace-and-upsert-documents.md) | [024 - Delete documents safely](024-delete-documents-safely.md) |
