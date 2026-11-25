# 023 - Update, replace, and upsert documents: Complete example

This standalone Node.js script inserts three practice products, updates one product, updates a bounded group, replaces one product, and demonstrates both branches of an upsert.

The example is documentation; it is not executed by this repository. Use a practice database. Each run creates a new batch marker, so its writes and reads stay isolated from earlier runs. It leaves four practice records in the database.

## What this example demonstrates

- Updating selected fields with `$set` and `$inc`.
- Updating a bounded group with `updateMany()`.
- Replacing a document and observing that omitted fields are removed.
- Upserting with a stable identity and an insertion-only value.
- Reading `matchedCount`, `modifiedCount`, and `upsertedCount`.
- Using a compound unique index to enforce the batch-and-SKU identity.

## Prerequisites

1. Use a Node.js project with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same terminal session where you will run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\update-replace-upsert.js
~~~

Save the script below as `update-replace-upsert.js`. The script writes to the `mern_updates_demo` database. The random batch marker keeps this run’s records separate from previous runs.

## Complete code

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();

    const db = client.db("mern_updates_demo");
    const products = db.collection("products");
    const batchId = new ObjectId();

    // The unique key enforces one product SKU per demonstration batch.
    await products.createIndex(
      { batchId: 1, sku: 1 },
      { unique: true }
    );

    const startingProducts = [
      {
        batchId,
        sku: "keyboard-01",
        name: "Mechanical keyboard",
        price: 45,
        stock: 12,
        status: "active",
        tags: ["computer", "accessory"],
        createdAt: new Date("2026-01-10T09:00:00.000Z")
      },
      {
        batchId,
        sku: "mouse-01",
        name: "Wireless mouse",
        price: 29.99,
        stock: 20,
        status: "active",
        tags: ["computer", "accessory"],
        createdAt: new Date("2026-01-11T09:00:00.000Z")
      },
      {
        batchId,
        sku: "monitor-01",
        name: "27-inch monitor",
        price: 179.99,
        stock: 4,
        status: "active",
        tags: ["display"],
        createdAt: new Date("2026-01-12T09:00:00.000Z")
      }
    ];

    const insertResult = await products.insertMany(startingProducts);
    console.log("Inserted products: " + insertResult.insertedCount);

    // Change selected fields on exactly one product.
    const singleUpdate = await products.updateOne(
      { batchId, sku: "keyboard-01" },
      {
        $set: { price: 49.99 },
        $inc: { stock: -1 }
      }
    );

    console.log(
      "Single update: matched " +
        singleUpdate.matchedCount +
        ", modified " +
        singleUpdate.modifiedCount
    );

    // Add a review timestamp to each active product in this batch.
    const multiUpdate = await products.updateMany(
      { batchId, status: "active" },
      { $set: { lastReviewedAt: new Date() } }
    );

    console.log(
      "Multi update: matched " +
        multiUpdate.matchedCount +
        ", modified " +
        multiUpdate.modifiedCount
    );

    // This is a whole-document replacement. The existing _id is preserved,
    // while fields omitted here, such as tags and lastReviewedAt, are removed.
    const replacement = await products.replaceOne(
      { batchId, sku: "mouse-01" },
      {
        batchId,
        sku: "mouse-01",
        name: "Wireless mouse",
        price: 29.99,
        stock: 20,
        status: "active",
        createdAt: new Date("2026-01-11T09:00:00.000Z")
      }
    );

    console.log(
      "Replacement: matched " +
        replacement.matchedCount +
        ", modified " +
        replacement.modifiedCount
    );

    // No webcam exists for this batch yet, so this upsert inserts one.
    const firstWebcamUpsert = await products.updateOne(
      { batchId, sku: "webcam-01" },
      {
        $set: {
          name: "HD webcam",
          price: 70,
          stock: 4,
          status: "active"
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log(
      "First webcam upsert: matched " +
        firstWebcamUpsert.matchedCount +
        ", modified " +
        firstWebcamUpsert.modifiedCount +
        ", upserted " +
        firstWebcamUpsert.upsertedCount
    );

    // The same filter now matches; the price changes instead of another
    // webcam being inserted.
    const repeatWebcamUpsert = await products.updateOne(
      { batchId, sku: "webcam-01" },
      { $set: { price: 72 } },
      { upsert: true }
    );

    console.log(
      "Repeat webcam upsert: matched " +
        repeatWebcamUpsert.matchedCount +
        ", modified " +
        repeatWebcamUpsert.modifiedCount +
        ", upserted " +
        repeatWebcamUpsert.upsertedCount
    );

    const finalProducts = await products
      .find({ batchId })
      .sort({ sku: 1 })
      .project({
        _id: 0,
        sku: 1,
        price: 1,
        stock: 1
      })
      .toArray();

    console.log("Final products:");

    for (const product of finalProducts) {
      console.log(
        product.sku +
          ": $" +
          product.price +
          ", stock " +
          product.stock
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
~~~

## Expected output

The connection details are not printed, and dates are omitted, so output is stable:

~~~text
Inserted products: 3
Single update: matched 1, modified 1
Multi update: matched 3, modified 3
Replacement: matched 1, modified 1
First webcam upsert: matched 0, modified 0, upserted 1
Repeat webcam upsert: matched 1, modified 1, upserted 0
Final products:
keyboard-01: $49.99, stock 11
monitor-01: $179.99, stock 4
mouse-01: $29.99, stock 20
webcam-01: $72, stock 4
~~~

## How the example works

### 1. Mark this run’s records

A new `ObjectId` is created for `batchId` and stored with each product. Every update and the final read filter by that marker. Re-running the script adds another isolated batch instead of changing an earlier batch.

The compound unique index on `{ batchId, sku }` allows the same SKUs in separate runs while preventing two records with the same SKU in one batch. In a production collection, choose an identity and index that match the application’s actual uniqueness rule.

### 2. Update one product

The first update identifies one product by the batch and SKU. `$set` changes the price, while `$inc` reduces stock by one. Other fields remain, including the product’s tags and creation time.

The result reports one match and one changed document.

### 3. Update several matching products

The next filter selects the three active products in this batch. `updateMany()` adds `lastReviewedAt` to each one. Its counts report the number matched and modified.

A multi-update is not one all-or-nothing transaction across every matching product. If a business action requires coordinated atomic changes across multiple documents, use an appropriate transaction design.

### 4. Replace one product

`replaceOne()` supplies the desired document fields for the mouse. The replacement intentionally leaves out `tags` and `lastReviewedAt`, so those fields disappear. MongoDB retains the matched document’s existing `_id`.

If the goal were only to change one or two fields, an update with `$set` would be less likely to remove data accidentally.

### 5. Exercise both upsert outcomes

The first webcam update has no match. With `upsert: true`, MongoDB inserts a document; `$set` supplies its editable fields, while `$setOnInsert` supplies its creation timestamp. The result has `matchedCount: 0` and `upsertedCount: 1`.

The second call uses the same identity filter. It matches the new document and changes its price. It reports a match and modification, with no new upsert.

A unique index protects logical identity when concurrent requests race. Application-side “check first, then insert” logic alone cannot enforce uniqueness.

### 6. Read only the demonstration batch

The final query filters by `batchId`, sorts by SKU, and projects only the three fields used for display. The output contains four records: the original three plus the webcam created by the upsert.

## Variations to try

1. Set the keyboard price to its current value and compare `matchedCount` with `modifiedCount`.
2. Add a `$unset` for one optional field and inspect the final projection.
3. Change the `updateMany()` filter to include only one SKU and compare its result counts.
4. Remove `upsert: true` from the first webcam operation and observe that no webcam is inserted.
5. Try a replacement that includes `tags`, then compare it with the current replacement.
6. Change the second upsert’s filter to a different SKU and observe that it creates another product.
7. Add a condition such as `stock: { $gt: 0 }` to a stock decrement filter and handle a zero-match result.
8. Inspect the collection in a MongoDB client and verify each record’s `batchId` and the removed replacement fields.

## Common issues

- **A field unexpectedly disappears:** check whether the operation is a replacement or a targeted update.
- **No document appears after an update:** confirm that `upsert: true` is present when insertion is intended.
- **More records than expected:** ensure the filter and batch marker are included in the query.
- **An upsert can duplicate a logical record:** enforce the identity rule with a unique index and handle duplicate-key errors.
- **Matched but not modified:** the requested value may already be stored; inspect both result counts.
- **A broad update affects too many records:** narrow the filter and review its scope before calling `updateMany()`.
- **The script cannot connect:** set `MONGODB_URI` in the same terminal session and confirm it points to the practice deployment.
- **An existing index conflicts:** inspect existing data and index definitions before changing a production collection.

## Key takeaways

- Use update operators for selected field changes and `replaceOne()` for an intentional full replacement.
- A replacement removes omitted fields and preserves the matched document’s `_id`.
- Upsert updates a match or inserts when no match exists.
- `$setOnInsert` applies only when an upsert inserts.
- Check matched, modified, and upserted counts independently.
- Use a unique index for logical identities that must not be duplicated.
- This script creates four records per run and leaves them in the practice database.

## Related chapter files

- [Lesson 023 - Update, replace, and upsert documents](../lessons/023-update-replace-and-upsert-documents.md)
- [Q&A 023 - Update, replace, and upsert documents](../qnas/023-update-replace-and-upsert-documents.md)

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md) | [Lesson](../lessons/023-update-replace-and-upsert-documents.md) | [Q&A](../qnas/023-update-replace-and-upsert-documents.md) | Example | [024 - Delete documents safely](../lessons/024-delete-documents-safely.md) |
