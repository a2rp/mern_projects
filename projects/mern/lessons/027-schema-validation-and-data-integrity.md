# 027 - Schema validation and data integrity

MongoDB stores flexible documents, so documents in one collection do not have to share an identical shape. That flexibility is useful while a product changes, but it can also let malformed or inconsistent data enter the database. Schema validation lets a collection enforce important rules at the database boundary.

This chapter builds on the data-modeling patterns from [Chapter 026](026-data-modeling-and-relationship-patterns.md). It explains what MongoDB validators can protect, how to introduce them safely, and which integrity rules need other tools.

## Learning goals

By the end of this chapter, you should be able to:

- Explain why validation belongs in both the application and the database.
- Define a collection validator with MongoDB's JSON Schema support.
- Validate field types, required fields, allowed values, ranges, arrays, and nested objects.
- Distinguish a missing field from a field whose value is `null`.
- Choose `validationAction` and `validationLevel` deliberately.
- Audit and migrate existing documents before making a validator strict.
- Recognize integrity rules that need unique indexes, transactions, or application logic.

## Why validate at the database boundary?

Application validation gives users fast, friendly feedback. A form can say “Price must be greater than zero” before it sends a request. But an application check is not the only way data reaches a database: another service, a script, an import job, a future endpoint, or a database console may write documents too.

A collection validator gives MongoDB a final rule set for writes. Every client that writes to that collection must satisfy the validator unless a privileged write explicitly bypasses document validation. This protects the stored data even when one application path forgets a check.

Use both layers for different jobs:

| Layer | Main job | Example |
| --- | --- | --- |
| User interface | Explain a problem early | Show that a quantity cannot be negative |
| Application | Validate business rules and return useful errors | Confirm an order can be placed for the current account |
| MongoDB collection validator | Reject documents with an invalid stored shape | Require a product name and numeric price |
| Index | Enforce indexed constraints and support lookups | Require each product SKU to be unique |
| Transaction or atomic operation | Keep related changes consistent | Create an order and decrement inventory together |

A validator does not replace authorization, careful API design, or transactions. It is one part of a data-integrity strategy.

## JSON Schema validator structure

MongoDB supports a useful subset of JSON Schema through the `$jsonSchema` keyword. A validator can be supplied when creating a collection or later using the collection modification command.

Here is a product validator:

~~~javascript
const productValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["sku", "name", "price", "stock", "status"],
    properties: {
      sku: {
        bsonType: "string",
        minLength: 3,
        maxLength: 32,
        description: "A SKU is required and must be a short string."
      },
      name: {
        bsonType: "string",
        minLength: 1,
        maxLength: 160,
        description: "A product name is required."
      },
      price: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        description: "Price must be a non-negative BSON number."
      },
      stock: {
        bsonType: ["int", "long"],
        minimum: 0,
        description: "Stock must be a non-negative whole number."
      },
      status: {
        bsonType: "string",
        enum: ["draft", "active", "archived"]
      },
      tags: {
        bsonType: "array",
        items: { bsonType: "string" },
        maxItems: 20
      },
      details: {
        bsonType: "object",
        required: ["manufacturer"],
        properties: {
          manufacturer: { bsonType: "string" },
          color: { bsonType: "string" }
        }
      }
    }
  }
};
~~~

The outer schema describes a BSON document. Its `properties` object defines rules for named fields. A field can also describe nested objects or arrays.

### Common JSON Schema rules

- `bsonType` constrains a value to a BSON type. MongoDB uses BSON type names such as `objectId`, `date`, `int`, `long`, `double`, and `decimal`.
- `required` lists fields that must exist on the document or nested object.
- `enum` limits a value to one of the listed values.
- `minimum`, `maximum`, `minLength`, and `maxLength` set numeric or string bounds.
- `pattern` checks a string against a regular expression.
- For an array, `items` describes each member, while `minItems` and `maxItems` constrain its size.
- Nested `properties` and `required` rules validate embedded objects.
- `description` documents the intent of a rule. Treat it as useful metadata, not as a substitute for application-facing error messages.

In a JavaScript driver, a JavaScript number is commonly stored as a BSON double unless you explicitly use another numeric representation. Include only the BSON numeric types the application intends to store. For a whole-number field such as stock, prefer integer BSON types and validate the API input before converting it.

### Allowing extra fields

By default, JSON Schema does not reject properties that are not listed. This is useful when documents evolve or services add fields independently.

If you set `additionalProperties: false`, a document may contain only fields listed in `properties`. Remember that MongoDB documents have an `_id` field. If you disallow extra properties, include a suitable `_id` definition in `properties` as well as every allowed application field. Otherwise, a document can fail validation because of its identifier.

Strictly rejecting every unknown field can make rolling deployments and migrations harder. Choose this rule when the schema is intentionally closed and all writers are coordinated. If you need forward compatibility, allow extra fields or use a carefully scoped schema.

## Missing values, null, and required fields

A missing field and a field set to `null` are not the same:

~~~javascript
// The optional field is absent.
{ sku: "MUG-100", name: "Ceramic mug" }

// The optional field exists and its value is null.
{ sku: "MUG-100", name: "Ceramic mug", description: null }
~~~

A field in `required` must be present. That rule alone does not mean the value is non-null. If a field is required and may be null, its `bsonType` must allow both its normal type and `null`:

~~~javascript
description: {
  bsonType: ["string", "null"]
}
~~~

If it is required but must contain actual text, use `bsonType: "string"` and a suitable length rule. If it is optional and cannot be null, leave it out of `required` but still use `bsonType: "string"` when present. Decide these cases from the domain instead of treating missing and null as interchangeable.

## Creating and changing a validator

A new collection can be created with a validator and strict error handling:

~~~javascript
await db.createCollection("products", {
  validator: productValidator,
  validationLevel: "strict",
  validationAction: "error"
});
~~~

For an existing collection, use `collMod` to change its validator:

~~~javascript
await db.command({
  collMod: "products",
  validator: productValidator,
  validationLevel: "strict",
  validationAction: "error"
});
~~~

The command changes collection rules; it does not automatically repair or rewrite old documents. Existing documents may still violate the newly configured rules until they are updated. A strict level will apply the rules to future inserts and updates, including updates to old documents.

Before tightening a production collection, use a migration plan:

1. Inventory documents and writers. Identify each field's real stored types and known exceptions.
2. Draft rules from the intended data contract, not just from the shape of a few sample records.
3. Find and repair invalid existing documents. Decide whether each record should be fixed, archived, or removed.
4. Deploy application changes so every writer produces compliant documents.
5. Add the validator with an appropriate action and level. Monitor rejected writes and application logs.
6. Tighten rules only after legacy exceptions and old writers have been addressed.

This sequence avoids a validator unexpectedly breaking an older service or a data import.

### Auditing documents against a proposed schema

You can query for documents that do not match a schema expression by using the validator under `$nor`:

~~~javascript
const invalidProducts = await db.collection("products")
  .find({ $nor: [productValidator] })
  .limit(100)
  .toArray();
~~~

This is useful for an audit, but it can require scanning many documents. Run large audits thoughtfully, especially on a busy production database. Use projections or aggregation to inspect only the fields needed, and plan any repair as a controlled migration.

## Validation action and level

MongoDB has separate settings for what happens when a write violates the validator and which writes are checked.

### `validationAction`

- `"error"` is the default. MongoDB rejects a write that fails validation.
- `"warn"` allows the write but records a validation warning in the server log. This can help measure violations before enforcement, but it does not protect the stored data yet.
- Do not treat a warning phase as a permanent integrity guarantee. Review the warnings, fix writers and data, then switch to rejection when ready.

### `validationLevel`

- `"strict"` is the default. MongoDB applies validation to all inserts and updates.
- `"moderate"` applies validation to inserts and to updates of documents that already satisfy the validator. An existing invalid document can be updated without satisfying the new rule, which can be useful during a gradual cleanup.
- `"off"` disables validation for the collection.

A moderate level can help an incremental migration, but it intentionally permits some invalid legacy documents to remain. It is not the final state for a collection that must guarantee every document conforms. A strict level does not retroactively scan, rewrite, or repair stored documents; it governs writes going forward.

## Handling validation errors

A Node.js driver write that violates a collection validator rejects with a MongoDB server error. Validation failures commonly use server error code `121`. Keep database details in logs and return a safe, helpful response to the caller. Do not expose raw database messages, document contents, or connection details in a public API response.

~~~javascript
try {
  await db.collection("products").insertOne({
    sku: "MUG-100",
    name: "Ceramic mug",
    price: 12.5,
    stock: -1,
    status: "active"
  });
} catch (error) {
  if (error.code === 121) {
    console.error("Product document failed collection validation.");
    // Map this to an appropriate client error in the application.
  } else {
    throw error;
  }
}
~~~

The database validator is a final safeguard. Application validation should usually catch common user mistakes first and turn them into clear field-level messages.

## What collection validation does not guarantee

Use the right database mechanism for each invariant:

- **Unique values:** A schema validator can check a field's shape, but it does not prevent two documents from having the same SKU. Create a unique index for that requirement.
- **Relationships:** A validator checks one document. It does not provide relational foreign-key enforcement across collections. Maintain references deliberately in application logic and use transactions where a multi-document change must be atomic.
- **Authorization:** A valid document can still be written by an unauthorized client. Enforce identity and access rules in the application and database roles.
- **Cross-field or cross-document business rules:** Some rules need application logic or a transaction because they depend on other documents or on current business state.
- **Data repair:** Adding a validator does not clean up records already stored.

A schema check may combine multiple expressions, but complex business workflows should not be hidden in a large validator. Keep the document contract understandable and put multi-record behavior where it can be managed safely.

## Bypassing validation

MongoDB exposes a `bypassDocumentValidation` option for certain writes. It should be reserved for carefully controlled administrative or migration tasks with explicit authorization and a recovery plan. Ordinary request handlers should not bypass validation to make an invalid write succeed. A bypass option is not a way to disable authentication or access control.

## Common mistakes

- Assuming flexible schema means no schema rules are needed.
- Treating `required` as if it also rejects `null`.
- Validating application numeric input but forgetting BSON may store it as a different numeric type.
- Setting `additionalProperties: false` without allowing `_id`.
- Enabling strict rejection before checking legacy documents and every writer.
- Assuming `warn` rejects invalid writes.
- Assuming a new validator repairs documents that already exist.
- Using a validator where a unique index or transaction is required.
- Returning raw MongoDB errors to end users.
- Leaving validation bypass enabled in normal application code.

## Practical checklist

Before shipping a validator, confirm:

- The rules reflect the domain and actual BSON types used by all writers.
- Required, optional, and nullable fields are defined separately.
- Nested objects and array members have the intended constraints.
- Extra fields and `_id` behavior are understood.
- Existing data and background writers have been audited.
- The rollout action and level match the migration stage.
- Rejection errors are logged safely and mapped to useful API responses.
- Unique, relationship, authorization, and multi-document requirements use the correct mechanisms.
- Any validation bypass is limited to a controlled, reviewed operation.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [026 - Data modeling and relationship patterns](026-data-modeling-and-relationship-patterns.md) | [Q&A](../qnas/027-schema-validation-and-data-integrity.md) | [Example](../examples/027-schema-validation-and-data-integrity.md) | [028 - Indexes and query performance](028-indexes-and-query-performance.md) |
