# Chapter 033 Q&A: Mongoose validation, hooks, and virtuals

Review schema validation, save and update behavior, middleware types and ordering, virtual properties, serialization, and the limits of application-side rules.

## Part 1: Multiple-choice questions

### 1. What does a Mongoose validator check?

- **A.** Whether a value satisfies a rule defined for a schema path.
- **B.** Whether a database server is powered on.
- **C.** Whether a collection has been backed up.
- **D.** Whether an HTTP route exists.

**Answer: A.** Validators enforce schema-level rules for the Mongoose operations that run them.

### 2. When does Mongoose run document validation by default during a save?

- **A.** Before the save operation.
- **B.** Only after the write has completed.
- **C.** Only when a query uses lean.
- **D.** Only when MongoDB returns a duplicate-key error.

**Answer: A.** Mongoose runs validation before a normal document save. A validation failure rejects the save.

### 3. Which validator normally checks an undefined value?

- **A.** The required validator.
- **B.** Every custom validator in all cases.
- **C.** The enum validator only.
- **D.** None, including required.

**Answer: A.** Validators generally do not run on undefined values; required is the exception.

### 4. What does a CastError indicate?

- **A.** Mongoose could not represent a value as the schema path's configured type.
- **B.** A virtual was stored in MongoDB.
- **C.** A post hook successfully ran.
- **D.** A query matched no documents.

**Answer: A.** Casting errors concern converting a value to the configured type; validation errors concern whether values satisfy rules.

### 5. What does validateSync() do with asynchronous validators?

- **A.** It does not run them.
- **B.** It waits for all of them.
- **C.** It converts them into database indexes.
- **D.** It disables them permanently.

**Answer: A.** validateSync is for synchronous validation. Use the asynchronous validate method when asynchronous validators are involved.

### 6. Are query update validators enabled by default?

- **A.** No. Enable them with runValidators when needed.
- **B.** Yes, and they always validate every document path.
- **C.** Yes, but only on delete operations.
- **D.** Query updates cannot use validation.

**Answer: A.** Update validators are off by default and have behavior differences from document validation.

### 7. Which update operator is ignored by Mongoose update validators?

- **A.** $inc.
- **B.** $set.
- **C.** $unset.
- **D.** $push.

**Answer: A.** Update validators do not run for $inc. Other supported operators have their own scope and caveats.

### 8. If an update with runValidators omits a required path entirely, what generally happens?

- **A.** The required validator generally does not fail just because the update omitted that path.
- **B.** Mongoose always removes the path.
- **C.** The query becomes a document save.
- **D.** The database ignores the entire update.

**Answer: A.** Update validators generally validate updated paths. A required path typically fails when the update explicitly unsets it.

### 9. In query middleware for updateOne, what does this refer to by default?

- **A.** The query.
- **B.** The document currently stored in MongoDB.
- **C.** The Express response.
- **D.** The Mongoose schema.

**Answer: A.** Query middleware has the query as its context; it does not necessarily have the target document loaded.

### 10. When should schema middleware generally be registered?

- **A.** Before compiling the model.
- **B.** After the first document is deleted.
- **C.** Only after the connection is closed.
- **D.** Middleware is registered on the MongoDB collection, not the schema.

**Answer: A.** Model compilation copies the schema configuration. Add middleware before compiling the model.

### 11. Which is not one of Mongoose's broad middleware categories?

- **A.** Browser middleware.
- **B.** Document middleware.
- **C.** Query middleware.
- **D.** Aggregate middleware.

**Answer: A.** Mongoose includes document, query, model, and aggregate middleware.

### 12. Does a pre-save hook automatically run for findOneAndUpdate?

- **A.** No. Query updates have their own middleware.
- **B.** Yes, every hook always runs for every method.
- **C.** Yes, but only when the query uses a virtual.
- **D.** No, because Mongoose does not provide query middleware.

**Answer: A.** Save middleware and query middleware cover different operation types.

### 13. What is a virtual property?

- **A.** A computed document property that is not stored as an ordinary MongoDB path.
- **B.** A second MongoDB collection.
- **C.** A database index with no key.
- **D.** A Mongoose connection.

**Answer: A.** Virtual getters and setters can format, combine, or decompose document values without adding a stored field.

### 14. Are ordinary virtual properties queryable in MongoDB filters?

- **A.** No. They are not stored fields.
- **B.** Yes, MongoDB automatically calculates every virtual.
- **C.** Only if the model has timestamps.
- **D.** Only in deleteMany operations.

**Answer: A.** A virtual is not persisted as a collection field, so ordinary database filters and projections cannot query it as a stored path.

### 15. Are virtuals included in toJSON output by default?

- **A.** No. Configure serialization to include them when needed.
- **B.** Yes, for every schema and every query result.
- **C.** Only when the document was deleted.
- **D.** Only when update validators are enabled.

**Answer: A.** Configure toJSON or toObject with virtuals enabled, or include them explicitly during conversion.

## Part 2: Short-answer questions

### 16. Explain the difference between casting and validation.

**Answer:** Casting attempts to convert a value to the configured schema type. Validation checks whether a cast value satisfies an application rule. A value can cast successfully and still fail validation.

### 17. What information does a Mongoose ValidationError contain?

**Answer:** It represents one or more validation failures and includes path-specific errors, such as validator or cast details, in its errors property. The application can use these details to produce a safe client response.

### 18. What is the difference between validate and validateSync?

**Answer:** Validate is asynchronous and can run asynchronous validators. ValidateSync performs synchronous validation only and returns a validation error object or no error.

### 19. Why is pre-validate often a better hook than pre-save for deriving a value that must pass validation?

**Answer:** Mongoose's built-in validation runs before user pre-save hooks. A change made in pre-save is not automatically validated again. A pre-validate hook derives the value before the validation pass.

### 20. What are the four broad types of Mongoose middleware?

**Answer:** Document, query, model, and aggregate middleware. Each is associated with different operations and context.

### 21. What does this usually refer to in document middleware?

**Answer:** The document being processed. Use a regular function when relying on Mongoose's document context.

### 22. What does this usually refer to in query middleware?

**Answer:** The Mongoose query object. The target document is not necessarily loaded or available in the hook.

### 23. Why must hooks be registered before compiling a model?

**Answer:** Model compilation copies schema configuration. Middleware added after compilation generally will not be attached to the already compiled model.

### 24. Why does save middleware not cover every write path?

**Answer:** Methods such as updateOne and findOneAndUpdate are query operations and use their own middleware. A save hook does not automatically run for those operations.

### 25. What are the risks of putting an external email or payment call in a post-save hook?

**Answer:** MongoDB and the external provider do not share an automatic transaction. The database save may already be committed when the hook fails, and retries can repeat the side effect. Use a durable, idempotent integration pattern.

### 26. What is a virtual getter useful for?

**Answer:** It can calculate a convenient display value from stored document paths, such as a full name from firstName and lastName, without storing another field.

### 27. What is a virtual setter useful for?

**Answer:** It can accept one convenient value and distribute it into real stored paths, such as splitting a full name into firstName and lastName.

### 28. Why can a virtual not be used like a stored field in a database query?

**Answer:** MongoDB stores ordinary document paths, not the computed virtual property. Query the underlying stored paths or deliberately store and index a derived value.

### 29. How can a schema include virtuals in JSON serialization?

**Answer:** Configure toJSON with virtuals enabled, or convert a document with a method such as toJSON or toObject and request virtuals explicitly.

### 30. Why should virtual getters avoid expensive queries and side effects?

**Answer:** A getter can run whenever the property is accessed, potentially more than once. Expensive work or side effects would make access unpredictable and difficult to reason about.

## Part 3: Practical scenarios

### 31. A pre-save hook turns a title into a slug, but the slug's required validator does not run on the generated value. What lifecycle change should be considered?

**Answer:** Derive the slug in a pre-validate hook so the value exists before validation. Alternatively, validate the final value explicitly, but keep the lifecycle behavior clear.

### 32. An updateOne operation sets a negative quantity and runValidators is true, but the minimum validator does not reject it. The update uses $inc. Why?

**Answer:** Mongoose update validators ignore $inc. Enforce the invariant with a conditional update filter, a document validation path, or a database-level rule appropriate for the operation.

### 33. A hook is registered after mongoose.model has already compiled the schema. The hook does not run. What is the fix?

**Answer:** Register the hook before model compilation and compile the model after all schema middleware and plugins have been added.

### 34. A developer expects a save hook to hash a password changed through findOneAndUpdate. What is wrong with the design?

**Answer:** Save middleware does not automatically run for query updates. Route password changes through explicit service logic or operation-specific middleware, and ensure every password write path applies the required handling.

### 35. A query middleware hook tries to inspect this.email as though this were a user document. What should the developer understand?

**Answer:** In query middleware, this is the query object and the document may not be loaded. Use the query's filter or update data deliberately, or choose a document operation if the current document is required.

### 36. A post-save hook sends a welcome email, then the email service times out. The save call reports an error, so a caller retries. What can happen?

**Answer:** The database document may already be saved, and the retry may send the email again or repeat other effects. Use idempotency and durable event handling rather than treating an external call as atomic with the save.

### 37. An API serializes a document but does not include its fullName virtual. What should be checked?

**Answer:** Virtuals are omitted from toJSON and toObject output by default. Enable virtual serialization in the schema or explicitly request virtuals during conversion.

### 38. A search endpoint filters MongoDB documents by a virtual fullName property. Why will the query not work as expected?

**Answer:** The virtual is not stored in MongoDB and cannot be used as a normal filter path. Query firstName and lastName, use an appropriate aggregation, or store a deliberately maintained and indexed derived field.

### 39. A team performs a uniqueness lookup in a validator before saving a username. Is this sufficient to prevent duplicates under concurrent requests?

**Answer:** No. Two concurrent requests may both pass the lookup. Use a unique database index as the enforcement mechanism and handle duplicate-key errors.

### 40. The same data can be written through Mongoose and a separate import script using the native driver. Where should a critical invariant live?

**Answer:** Put the invariant at a layer every writer must obey, such as a database constraint or a shared service boundary that all writers are required to use. A Mongoose validator alone cannot protect writes that bypass Mongoose.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [032 - Mongoose schemas, models, and CRUD](../lessons/032-mongoose-schemas-models-and-crud.md) | [Lesson](../lessons/033-mongoose-validation-hooks-and-virtuals.md) | [Example](../examples/033-mongoose-validation-hooks-and-virtuals.md) | [034 - Seed data, migrations, and database lifecycle](../lessons/034-seed-data-migrations-and-database-lifecycle.md) |
