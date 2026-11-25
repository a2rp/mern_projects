# 027 - Schema validation and data integrity: Complete example

This standalone Node.js example creates a fresh practice database for each run. It demonstrates a MongoDB JSON Schema validator, valid inserts, rejected invalid inserts and updates, and a unique index for a rule that a document validator cannot enforce.

This file is documentation. The code is not run by this repository.

## What this example demonstrates

- Requiring fields and validating their BSON types.
- Restricting values and numeric ranges.
- Allowing a nullable optional field.
- Using a collection validator to reject invalid writes.
- Showing that updates are validated too.
- Using a unique index to enforce a value's uniqueness across documents.
- Handling expected MongoDB errors without returning raw server details to API users.

## Prerequisites

1. Use Node.js with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same PowerShell session where you run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\schema-validation-data-integrity.js
~~~

The script creates a uniquely named database beginning with `mern_schema_validation_demo_`. Each run uses a separate practice database, so rerunning the file does not collide with its previous sample records. Remove practice databases when you no longer need them.

## Complete code

Save this as `schema-validation-data-integrity.js`:

~~~js
import { Decimal128, Int32, MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

const productValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["sku", "name", "price", "stock", "status"],
    properties: {
      sku: {
        bsonType: "string",
        minLength: 3,
        maxLength: 32,
        pattern: "^[A-Z0-9-]+$"
      },
      name: {
        bsonType: "string",
        minLength: 1,
        maxLength: 160
      },
      price: {
        bsonType: "decimal",
        minimum: 0
      },
      stock: {
        bsonType: "int",
        minimum: 0
      },
      status: {
        bsonType: "string",
        enum: ["draft", "active", "archived"]
      },
      description: {
        bsonType: ["string", "null"],
        maxLength: 500
      },
      tags: {
        bsonType: "array",
        items: { bsonType: "string" },
        maxItems: 10
      }
    }
  }
};

async function expectMongoError(operation, expectedCode, message) {
  try {
    await operation();
  } catch (error) {
    if (error.code !== expectedCode) {
      throw error;
    }

    console.log(message);
    return;
  }

  throw new Error("The operation unexpectedly succeeded.");
}

async function main() {
  try {
    await client.connect();

    const runId = new ObjectId().toHexString();
    const databaseName = "mern_schema_validation_demo_" + runId;
    const db = client.db(databaseName);

    await db.createCollection("products", {
      validator: productValidator,
      validationLevel: "strict",
      validationAction: "error"
    });

    const products = db.collection("products");

    // Shape validation does not enforce cross-document uniqueness.
    // This index guarantees that no two products share an SKU.
    await products.createIndex({ sku: 1 }, { unique: true });

    await products.insertMany([
      {
        sku: "MUG-100",
        name: "Ceramic mug",
        price: Decimal128.fromString("12.50"),
        stock: new Int32(5),
        status: "active",
        description: null,
        tags: ["drinkware", "ceramic"]
      },
      {
        sku: "MUG-200",
        name: "Travel mug",
        price: Decimal128.fromString("19.95"),
        stock: new Int32(8),
        status: "draft",
        tags: ["drinkware", "travel"]
      }
    ]);

    console.log(
      "Accepted products:",
      await products.countDocuments()
    );

    await expectMongoError(
      () =>
        products.insertOne({
          sku: "MUG-300",
          name: "Damaged stock example",
          price: Decimal128.fromString("9.00"),
          stock: new Int32(-1),
          status: "active"
        }),
      121,
      "Rejected invalid insert (collection validator, code 121)."
    );

    await expectMongoError(
      () =>
        products.updateOne(
          { sku: "MUG-100" },
          { $set: { stock: new Int32(-1) } }
        ),
      121,
      "Rejected invalid update (collection validator, code 121)."
    );

    await expectMongoError(
      () =>
        products.insertOne({
          sku: "MUG-100",
          name: "Duplicate SKU example",
          price: Decimal128.fromString("7.00"),
          stock: new Int32(2),
          status: "active"
        }),
      11000,
      "Rejected duplicate SKU (unique index, code 11000)."
    );

    const savedProduct = await products.findOne(
      { sku: "MUG-100" },
      { projection: { _id: 0, stock: 1 } }
    );

    console.log(
      "Stock after rejected update:",
      savedProduct.stock.valueOf()
    );
  } finally {
    await client.close();
  }
}

await main();
~~~

## Expected output

The output is deterministic for the operations in this script:

~~~text
Accepted products: 2
Rejected invalid insert (collection validator, code 121).
Rejected invalid update (collection validator, code 121).
Rejected duplicate SKU (unique index, code 11000).
Stock after rejected update: 5
~~~

## How it works

1. The collection validator requires the SKU, name, price, stock, and status fields.
2. The price must be a non-negative BSON decimal, and stock must be a non-negative BSON integer. The script uses `Decimal128` and `Int32` explicitly so the stored BSON types match the schema.
3. The description field is optional. When present, it may be a string or `null`. The first valid product demonstrates that explicit null is allowed; the second leaves the field absent.
4. MongoDB accepts both valid products.
5. The invalid insert fails because stock is below zero. The invalid update also fails, so the original stock remains 5.
6. A duplicate SKU has a valid document shape but fails the unique index. This demonstrates why field validation and uniqueness use separate mechanisms.
7. The helper recognizes only the expected server error code and prints a safe summary. In a real API, map known failures to an appropriate response and do not expose raw server messages or document contents.

## Try changing the example

- Remove `status` from a product to see the required-field rule reject it.
- Change `status` to `"pending"` to see the enum rule reject it.
- Set `price` to `Decimal128.fromString("-1.00")` to see the non-negative rule reject it.
- Set `stock` to a string such as `"5"` to see the BSON type rule reject it.
- Set `description` to `null` or omit it; both are allowed by this schema.
- Set `description` to a number; it fails because that type is not allowed.
- Remove the unique index in a separate fresh practice database to observe that a shape validator by itself does not reject duplicate SKUs.

## Important notes

- A validator applies to writes. It does not retroactively repair documents already stored.
- Strict validation checks inserts and updates. Keep every application, script, and import writer compatible with the collection rules.
- The database name is unique per run, and the code does not drop databases or collections automatically.
- Do not add `bypassDocumentValidation` to ordinary request handling. Reserve validation bypass for a controlled administrative or migration task.
- Use application validation as well, so callers receive useful feedback before the database rejects a write.
- This example uses a decimal price and integer stock to make BSON numeric types explicit. Choose representations that match the domain and use them consistently.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [026 - Data modeling and relationship patterns](026-data-modeling-and-relationship-patterns.md) | [Q&A](../qnas/027-schema-validation-and-data-integrity.md) | [028 - Indexes and query performance](028-indexes-and-query-performance.md) |
