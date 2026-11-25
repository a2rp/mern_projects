# Chapter 031 Q&A: Mongoose ODM: when and how to use it

Review the role of Mongoose, when the MongoDB Node.js driver may be a better fit, and the boundaries of schemas, validation, middleware, lean queries, populate, and aggregation.

## Part 1: Multiple-choice questions

### 1. What does ODM mean in this context?

- **A.** Object Document Mapper
- **B.** Operational Data Monitor
- **C.** Object Deployment Manager
- **D.** Online Database Module

**Answer: A.** An ODM maps application objects and conventions to document database operations. Mongoose is an ODM for Node.js and MongoDB.

### 2. Which statement best describes Mongoose's relationship to MongoDB?

- **A.** Mongoose replaces MongoDB and stores data in Node.js memory.
- **B.** Mongoose uses the MongoDB Node.js driver to communicate with MongoDB.
- **C.** Mongoose turns every MongoDB collection into a relational table.
- **D.** Mongoose is required for every Node.js MongoDB application.

**Answer: B.** Mongoose provides an application layer over the driver. It does not replace the database, and using the driver directly is also a valid design.

### 3. What is the main role of a Mongoose schema?

- **A.** Describe expected document paths and related application behavior.
- **B.** Create the MongoDB server process.
- **C.** Guarantee that every program writing to the database follows the schema.
- **D.** Replace database indexes.

**Answer: A.** A schema defines the shape and behavior expected by Mongoose for operations that use that schema.

### 4. What does a Mongoose model provide?

- **A.** An interface for working with documents in a collection.
- **B.** A replacement for a MongoDB database.
- **C.** A browser-side HTML template.
- **D.** A guarantee that referenced documents always exist.

**Answer: A.** A model is compiled from a schema and is used for operations such as creating, finding, updating, and deleting documents.

### 5. What is a hydrated Mongoose document?

- **A.** A model instance with Mongoose document behavior such as change tracking.
- **B.** A MongoDB server backup.
- **C.** A plain object that can never be modified.
- **D.** An aggregation pipeline stage.

**Answer: A.** Hydrated documents have Mongoose behavior, including document methods and the ability to save tracked changes.

### 6. What does casting do?

- **A.** It attempts to convert a value to the schema path's configured type.
- **B.** It checks whether a database user is authorized.
- **C.** It guarantees that an input follows every business rule.
- **D.** It creates a unique database index.

**Answer: A.** Casting concerns representation as a configured type. A value can cast successfully but still fail validation.

### 7. A numeric path accepts the value -2 as a number, but the business rule requires a non-negative value. Which feature should express that rule?

- **A.** A numeric minimum validator or a suitable database constraint.
- **B.** Casting alone.
- **C.** A populate call.
- **D.** A model name.

**Answer: A.** Casting only establishes that the value is numeric. A minimum rule expresses the permitted range.

### 8. When does Mongoose run schema validation by default for a normal document save?

- **A.** Before saving the document.
- **B.** Only after the document has been permanently stored.
- **C.** Only when the query uses populate.
- **D.** Only when a browser sends the request.

**Answer: A.** Mongoose validates before a document save by default. Validation errors reject the save operation.

### 9. Are validators enabled by default for query update methods such as updateOne?

- **A.** No. Enable them explicitly with the runValidators option when needed.
- **B.** Yes, and they always validate every path in the document.
- **C.** Yes, but only if the collection is empty.
- **D.** Query updates cannot use validation.

**Answer: A.** Update validators are off by default. They can be enabled for supported update operations, but they have limitations.

### 10. Do query update validators always validate the entire resulting document?

- **A.** No. They generally run on updated paths and only for supported operations and operators.
- **B.** Yes, exactly like a full document save in every case.
- **C.** Yes, including every database rule from every client.
- **D.** No, because Mongoose never supports update validation.

**Answer: A.** Do not assume update validation has the same behavior as loading a document and saving it. Understand the operators and paths involved.

### 11. Does a save middleware hook automatically run for a findOneAndUpdate query?

- **A.** No. Save hooks and query update hooks apply to different operations.
- **B.** Yes, every Mongoose operation always runs every hook.
- **C.** Yes, but only for lean queries.
- **D.** No, because middleware only runs in the browser.

**Answer: A.** A save hook is not a universal hook for every write path. Query middleware is associated with query operations.

### 12. What kind of value does a query with lean return?

- **A.** Plain JavaScript objects rather than hydrated Mongoose documents.
- **B.** Only database connection objects.
- **C.** A Mongoose document with extra save behavior.
- **D.** A MongoDB transaction session.

**Answer: A.** Lean skips hydration and returns plain objects.

### 13. Which behavior should you not expect from a lean result?

- **A.** A document save method with Mongoose change tracking.
- **B.** Access to selected data fields.
- **C.** A value that can be serialized as JSON.
- **D.** A plain JavaScript object.

**Answer: A.** Lean objects do not have hydrated document methods such as save, nor normal document change tracking.

### 14. What does populate guarantee about a referenced record?

- **A.** It retrieves referenced data when available, but does not enforce a foreign-key constraint.
- **B.** It prevents that record from ever being deleted.
- **C.** It creates a transaction automatically.
- **D.** It guarantees that all writes from all clients use Mongoose.

**Answer: A.** Populate is a retrieval convenience. It does not ensure referential integrity.

### 15. What kind of values do Mongoose aggregation pipelines return?

- **A.** Plain JavaScript objects, not hydrated model documents.
- **B.** Always hydrated documents with save methods.
- **C.** HTML elements.
- **D.** Only strings, regardless of the pipeline.

**Answer: A.** Aggregation results are plain objects. Also provide correct BSON types in pipeline stages because Mongoose does not cast aggregation stages like ordinary model queries.

## Part 2: Short-answer questions

### 16. Give two reasons a team might choose the MongoDB Node.js driver instead of Mongoose.

**Answer:** The team may want direct control over collection and BSON operations, prefer fewer ODM conventions or dependencies, use a flexible schema, or already have a deliberate data-access layer. The right choice depends on the application, not a universal rule.

### 17. Give two reasons a Node.js team might choose Mongoose.

**Answer:** Mongoose can centralize schema definitions and application-level validation, provide casting and model methods, and offer hydrated documents with change tracking. These conventions can help when several parts of an application share the same data model.

### 18. What is the difference between a schema and a model?

**Answer:** A schema describes expected document paths and associated behavior. A model is compiled from a schema and provides the interface used to work with documents in a collection.

### 19. What is the difference between casting and validation?

**Answer:** Casting attempts to represent an input as the configured type. Validation checks whether the value satisfies specified rules. A value can cast successfully and still violate a rule such as a minimum, maximum, or allowed enum value.

### 20. Why are Mongoose validation rules not enough when several applications write to the same collection?

**Answer:** Writes that bypass Mongoose do not run its schema validators. If the database must enforce a document rule for every client, use MongoDB collection validation or another database-level constraint as appropriate.

### 21. Why is the Mongoose unique option not a validator?

**Answer:** It declares or helps define a unique database index. The index enforces uniqueness at the database level; it is not a Mongoose validation check that runs like required or minLength.

### 22. Why should a query update that relies on schema validation set runValidators explicitly?

**Answer:** Update validators are off by default. Setting the option requests update validation for supported paths and operators, though it does not make query updates identical to whole-document validation.

### 23. Name one important limitation of update validators.

**Answer:** They generally validate only updated paths and supported update operators. They do not validate every resulting field as if the whole document were saved, and some operators such as the increment operator are not validated the same way as document changes.

### 24. Why might a save hook fail to enforce behavior for every write path?

**Answer:** Query updates such as updateOne and findOneAndUpdate do not automatically run document save middleware. If behavior must apply to multiple write types, implement and test the correct middleware or enforce the invariant at a more reliable boundary.

### 25. When is a lean query useful?

**Answer:** It is useful for read-only code that needs returned data but not document methods or change tracking. Skipping hydration can reduce application work and memory use, but the code must not rely on getters, setters, virtuals, or save behavior that the lean result lacks.

### 26. Why can populate create a data-integrity problem if the application treats it like a foreign key?

**Answer:** Populate retrieves referenced data when it can; it does not prevent dangling references, guarantee the target exists, or prevent its deletion. The application needs an explicit lifecycle or integrity strategy.

### 27. When might aggregation be a better choice than populate or a basic model query?

**Answer:** Aggregation is appropriate when MongoDB should filter, group, reshape, or compute data as a pipeline. Choose based on the access pattern and return shape, and provide correctly typed BSON values in the stages.

### 28. What is the significance of Mongoose's default model-to-collection naming convention?

**Answer:** Mongoose derives a collection name from the model name, usually by lowercasing and pluralizing it. If an existing database collection has a specific name, configure the collection explicitly so the application does not target a different collection accidentally.

### 29. Why should production index creation be managed deliberately?

**Answer:** Indexes consume storage and affect writes as well as reads. Automatic index creation can help in development, but production changes should be planned, reviewed, and monitored as database operations.

### 30. Why should API code avoid passing an arbitrary client-supplied filter directly to a model?

**Answer:** Untrusted filters can expose fields or query operators the API did not intend to support and can create security, correctness, or performance problems. Validate and construct filters from an explicit allowlist of accepted inputs.

## Part 3: Practical scenarios

### 31. A small script reads and writes one collection and needs full control over BSON types. Should it automatically add Mongoose?

**Answer:** No. The MongoDB Node.js driver may be a simpler fit. Add Mongoose only if its schema and document conventions provide a useful benefit for that script.

### 32. Two API requests save the same model. One sets a required title to an empty string. What should the application expect?

**Answer:** If the schema has a required or other relevant validator, a normal Mongoose document save should reject before persisting that invalid document. The API should translate the validation error into an appropriate client response without exposing internal details.

### 33. An endpoint uses updateOne to set a task's status to a value outside the schema enum. The developer assumes the enum will reject it. What must be checked?

**Answer:** Query update validators are off by default. The operation must enable runValidators, and the developer must confirm the updated path and operator are covered by update validation. Critical rules may also need database enforcement.

### 34. A developer puts password hashing only in a save hook, but one route updates passwords with findOneAndUpdate. What is the issue?

**Answer:** A document save hook does not automatically run for query update operations. The route may bypass the hashing behavior. Use a deliberate password-update service or operation-specific middleware and test every path that can change a password.

### 35. A read endpoint only returns task titles and statuses, but it retrieves many records. Would lean be reasonable?

**Answer:** It may be reasonable because the endpoint does not need document methods or change tracking. Select only the required fields and confirm the serializer does not depend on document getters, virtuals, or other hydration behavior.

### 36. An aggregation matches documents by an ObjectId, but the pipeline value is a string copied from a URL. Why can the match fail?

**Answer:** Mongoose does not cast aggregation stages like ordinary model queries. Convert the validated string to a BSON ObjectId before building the pipeline and handle invalid IDs at the request boundary.

### 37. An order document contains a customer ID. The team assumes populate prevents an order from referencing a deleted customer. Is that assumption correct?

**Answer:** No. Populate retrieves the referenced customer data when available; it is not a foreign-key constraint. The application must decide whether to retain historical references, restrict deletion, clean up dependent records, or use another data lifecycle rule.

### 38. A uniqueness check first queries whether an email exists and then inserts the user. Two requests can run at the same time. What enforces uniqueness reliably?

**Answer:** Create a unique database index on the email field and handle duplicate-key errors. The read-before-insert check can improve the user experience but cannot prevent a race by itself.

### 39. A reporting query returns grouped totals. The code tries to call save on each result. What should change?

**Answer:** Aggregation returns plain objects rather than hydrated documents, so save is unavailable. Treat results as read data. If a report result must cause writes, issue explicit model or collection operations with a deliberate write design.

### 40. A production service uses Mongoose, but a separate import job uses the MongoDB driver directly. Where should a rule live if both writers must obey it?

**Answer:** Put the invariant at a layer both writers cannot bypass, such as MongoDB collection validation, a database index, or a shared service boundary that all writers are required to use. Mongoose validation alone only covers writes that go through the relevant Mongoose paths.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [030 - Transactions and atomic operations](../lessons/030-transactions-and-atomic-operations.md) | [Lesson](../lessons/031-mongoose-odm-when-and-how-to-use-it.md) | [Example](../examples/031-mongoose-odm-when-and-how-to-use-it.md) | [032 - Mongoose schemas, models, and CRUD](../lessons/032-mongoose-schemas-models-and-crud.md) |
