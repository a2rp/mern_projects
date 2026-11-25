# Chapter 027 Q&A: Schema validation and data integrity

Use these questions to review MongoDB collection validators, JSON Schema rules, migration behavior, and the limits of document validation.

## Part 1: Multiple-choice questions

### 1. What is the main purpose of a MongoDB collection validator?

- **A.** Enforce selected document rules for writes to the collection
- **B.** Replace database authentication
- **C.** Automatically repair every old document
- **D.** Guarantee that every query uses an index

**Answer: A.** A validator checks writes against rules configured for the collection. It does not replace access control, repair old data, or control query plans.

### 2. Which keyword is used to describe a JSON Schema validator in MongoDB?

- **A.** `$jsonSchema`
- **B.** `$validateCollection`
- **C.** `$documentType`
- **D.** `$schemaCheck`

**Answer: A.** MongoDB supports a subset of JSON Schema through `$jsonSchema`.

### 3. Which schema property makes a field have to be present?

- **A.** `required`
- **B.** `enum`
- **C.** `minimum`
- **D.** `items`

**Answer: A.** Put the field name in the object's `required` array to require its presence.

### 4. A field appears in `required`. Which statement is correct?

- **A.** It must be present, but it may still be null if the type rule allows null
- **B.** It must always be a non-empty string
- **C.** It is automatically unique
- **D.** It can never be updated

**Answer: A.** Presence and value type are separate concerns. A schema that permits null must explicitly include `"null"` in the field's allowed `bsonType` values.

### 5. Which type declaration permits a field to contain either a string or null?

- **A.** `bsonType: ["string", "null"]`
- **B.** `bsonType: "optional"`
- **C.** `required: false`
- **D.** `enum: ["string", null]`

**Answer: A.** A `bsonType` array can allow multiple BSON types, including `"null"`.

### 6. What does `enum` do in a schema rule?

- **A.** Restricts a value to a listed set of allowed values
- **B.** Makes an array contain only unique items
- **C.** Creates a unique database index
- **D.** Converts strings to numbers

**Answer: A.** Use `enum` for a finite set such as `"draft"`, `"active"`, and `"archived"`.

### 7. For an array field, what does the `items` rule describe?

- **A.** The allowed shape or type of each array member
- **B.** The collection's indexes
- **C.** The array's field name
- **D.** The document's identifier

**Answer: A.** `items` defines validation for array members. Use `minItems` or `maxItems` to constrain the number of members.

### 8. What happens if `additionalProperties: false` is used without allowing `_id`?

- **A.** Documents can fail because their `_id` field is not listed as allowed
- **B.** MongoDB removes `_id` automatically
- **C.** The validator becomes a unique index
- **D.** MongoDB converts `_id` to a string

**Answer: A.** If additional properties are prohibited, include an appropriate `_id` schema rule and every other allowed field.

### 9. What is the default effect of `validationAction: "error"`?

- **A.** Reject writes that fail validation
- **B.** Accept the write and repair it
- **C.** Accept the write and only log a warning
- **D.** Disable all validation

**Answer: A.** `"error"` is the default validation action and rejects invalid writes.

### 10. What does `validationAction: "warn"` do for an invalid write?

- **A.** Allows the write and logs a validation warning
- **B.** Rejects the write and repairs the document
- **C.** Removes the validator
- **D.** Blocks all writes to the collection

**Answer: A.** The write is allowed, so warning mode is useful for observing violations but does not yet enforce valid stored data.

### 11. What is the default behavior of `validationLevel: "strict"`?

- **A.** Validate all inserts and updates
- **B.** Validate inserts only
- **C.** Validate reads only
- **D.** Validate only documents created before the validator

**Answer: A.** Strict is the default level and applies validation to all inserts and updates.

### 12. How does `validationLevel: "moderate"` help during a gradual cleanup?

- **A.** It validates inserts and updates to documents that already satisfy the validator
- **B.** It validates only reads from the collection
- **C.** It silently repairs every invalid document
- **D.** It prevents new documents from being inserted

**Answer: A.** Moderate allows an already-invalid legacy document to be updated without first meeting the new rules, while validating inserts and updates to documents that are already valid.

### 13. What happens to old documents when a validator is added?

- **A.** They are not automatically rewritten or repaired
- **B.** MongoDB deletes all documents that fail
- **C.** MongoDB fills every missing required field
- **D.** Every old document is converted to the new types

**Answer: A.** A validator governs writes. Existing records must be audited and migrated separately.

### 14. Which MongoDB mechanism should enforce that product SKUs are unique?

- **A.** A unique index
- **B.** `required` alone
- **C.** `validationAction: "warn"`
- **D.** `additionalProperties: false`

**Answer: A.** A unique index enforces uniqueness across documents. A schema validator can check a SKU's type or format but not its uniqueness across the collection.

### 15. What is a sensible first step before enforcing a strict validator on a mature collection?

- **A.** Inventory writers and audit existing documents for violations
- **B.** Enable bypass for every application write
- **C.** Delete the collection
- **D.** Assume all current documents already match the intended shape

**Answer: A.** Learn the real data shape and identify legacy exceptions before enforcing new rules.

## Part 2: Short-answer questions

### 16. Why use both application validation and a collection validator?

**Answer:** Application validation can give users prompt, field-specific feedback and can check business rules. A collection validator is a final safeguard for writes from every client, including scripts and other services. The two layers address different needs.

### 17. What does `bsonType` validate?

**Answer:** It constrains a field or document to one or more BSON types, such as `string`, `object`, `array`, `objectId`, `date`, `int`, `long`, `double`, or `decimal`. Pick types that match how the application actually stores values.

### 18. Explain the difference between a missing field and a field whose value is null.

**Answer:** A missing field is absent from the document. A null field exists but has the value `null`. A required rule checks presence; allowing null requires the field's type rule to include `"null"`.

### 19. How do you require a field to be a non-empty string?

**Answer:** Include the field in `required`, set its `bsonType` to `"string"`, and set `minLength` to at least 1. Add a maximum length if the domain needs a bound.

### 20. How do you constrain allowed values for a status field?

**Answer:** Use `bsonType: "string"` and an `enum` listing the allowed values. This validates the shape and set of values, while application code can provide a friendly message explaining an invalid status.

### 21. How do you validate an array of strings and limit its size?

**Answer:** Set the field's `bsonType` to `"array"`, use `items: { bsonType: "string" }`, and set `minItems` or `maxItems` if the domain has bounds.

### 22. When is `additionalProperties: false` useful, and what must you remember?

**Answer:** It is useful when the document contract should reject unlisted fields. List every permitted property, including `_id`, or valid documents can fail. Consider deployment compatibility before closing the schema because a newly deployed writer may add a field that an older validator rejects.

### 23. What does the `collMod` command do in this context?

**Answer:** It modifies settings on an existing collection, including its validator, `validationLevel`, and `validationAction`. It changes the rules for writes but does not rewrite or repair the documents already stored.

### 24. What is the practical difference between `validationAction: "error"` and `"warn"`?

**Answer:** Error rejects invalid writes. Warn accepts them and records warnings in server logs. Warn is an observation stage, not an enforcement guarantee.

### 25. What is the practical difference between strict and moderate validation levels?

**Answer:** Strict applies validation to every insert and update. Moderate applies it to inserts and to updates of documents that already pass validation, allowing legacy-invalid documents to be handled gradually. Moderate can leave invalid records in place, so it is not equivalent to full enforcement.

### 26. Does strict validation retroactively inspect and repair all stored documents?

**Answer:** No. The validator controls writes going forward. Existing documents are not automatically rewritten or repaired; audit and migrate them explicitly.

### 27. How can an application find documents that fail a proposed JSON Schema rule?

**Answer:** Query using `$nor` around the schema expression, for example `find({ $nor: [{ $jsonSchema: schema }] })`. This may scan many documents, so plan the audit carefully and limit or project results when appropriate.

### 28. What does a MongoDB validation error with code 121 commonly indicate?

**Answer:** It commonly indicates that a document failed collection validation. An application can recognize it, log appropriate details safely, and return a useful client response without exposing raw database internals.

### 29. Which requirements are not guaranteed by a JSON Schema collection validator?

**Answer:** It does not enforce uniqueness across documents, foreign-key behavior across collections, user authorization, or arbitrary multi-document business invariants. Use unique indexes, deliberate relationship logic, database roles, and transactions or atomic operations as appropriate.

### 30. Why should document validation bypass be restricted?

**Answer:** A bypass permits a write to skip the collection's document validation. If ordinary request code uses it, invalid data can enter despite the validator. Reserve it for controlled administrative or migration work with authorization and a recovery plan.

## Part 3: Practical scenarios

### 31. An API requires a customer email field, but old records use null to mean “not supplied.” What should the team decide before writing the rule?

**Answer:** Decide whether the new contract permits null, absence, or neither. If null is valid and the field must be present, include it in `required` and allow `["string", "null"]`. If it should be optional but non-null when present, leave it out of `required` and set `bsonType` to `"string"`. Migrate old records if their representation is changing.

### 32. A validator rejects inserts because a product's numeric price is stored as a BSON double while the schema only permits integers. How should the team fix it?

**Answer:** First decide whether fractional prices are valid. If they are, allow the numeric BSON types the application intentionally stores, such as `"double"` and `"decimal"`, and validate/convert input consistently in the application. Do not broaden the schema blindly if a whole-number price is a real domain requirement.

### 33. The team adds `additionalProperties: false` and starts rejecting otherwise valid writes. The rejected documents contain a generated `_id`. What should change?

**Answer:** Add an `_id` rule to the schema's `properties`, alongside every other allowed field, or relax the closed-schema rule if it is not needed. MongoDB documents include an identifier, so it must be permitted when extra fields are disallowed.

### 34. A production collection has legacy documents missing a newly required field. What rollout avoids an abrupt outage?

**Answer:** Inventory all writers and existing records, deploy application changes that populate the field, audit and backfill or otherwise handle legacy documents, then enable enforcement deliberately. A warning or moderate phase can help observe or stage the rollout, but monitor it and move to strict error enforcement when the data and writers are ready.

### 35. A team sets `validationAction: "warn"` and assumes invalid inserts will fail. Is that correct?

**Answer:** No. Warn allows the write and logs a warning. If invalid writes must be rejected, use error action after preparing the data and writers.

### 36. An old invalid record needs a harmless field update during a migration. What can moderate validation mean for this case?

**Answer:** Moderate validation permits an update to a document that already fails the validator without requiring the updated document to satisfy the new rule. Inserts and updates of already-valid documents are still checked. Use it as a temporary migration aid and track invalid records until they are repaired.

### 37. A product schema validator checks that `sku` is a string, but duplicate SKUs still appear. Why, and what is the remedy?

**Answer:** The validator checks each document's shape independently and cannot guarantee uniqueness across documents. Create a unique index on `sku` after handling existing duplicates.

### 38. Creating an order requires both an order document and an inventory decrement. Can a document validator guarantee that both changes happen together?

**Answer:** No. A validator applies to an individual write and does not make separate writes atomic. Use an appropriate transaction or redesign the operation around an atomic update, and handle concurrency and insufficient inventory.

### 39. A validation failure reaches an HTTP response and exposes the raw server message and document values. What should the API do instead?

**Answer:** Log only the diagnostic detail needed by trusted operators, protect sensitive values, recognize the validation failure (commonly error code 121), and return a safe, actionable client error. Application-side checks should catch expected input issues earlier and provide field-specific feedback.

### 40. A one-time import needs to bypass validation for a documented legacy conversion. What safeguards should surround it?

**Answer:** Restrict it to an authorized administrative or migration process, review and scope exactly which writes bypass validation, record what was changed, provide a way to verify or repair the resulting documents, and ensure ordinary request paths never inherit the bypass option.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [026 - Data modeling and relationship patterns](../lessons/026-data-modeling-and-relationship-patterns.md) | [Lesson](../lessons/027-schema-validation-and-data-integrity.md) | [Example](../examples/027-schema-validation-and-data-integrity.md) | [028 - Indexes and query performance](../lessons/028-indexes-and-query-performance.md) |
