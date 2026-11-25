# Chapter 032 Q&A: Mongoose schemas, models, and CRUD

Review schema paths and options, model compilation, CRUD operations, query results, safe updates, and targeted deletes.

## Part 1: Multiple-choice questions

### 1. What does a Mongoose schema primarily describe?

- **A.** Expected document paths and their application-side behavior.
- **B.** The database server's operating system.
- **C.** The route handlers for every HTTP endpoint.
- **D.** A list of Git commits.

**Answer: A.** A schema defines the paths and behavior Mongoose uses for documents associated with it.

### 2. What is a Mongoose model?

- **A.** A constructor compiled from a schema that provides document CRUD operations.
- **B.** A MongoDB server process.
- **C.** A plain configuration file with no database behavior.
- **D.** A database index.

**Answer: A.** Models create and query documents in the collection associated with the model.

### 3. What is an instance of a Mongoose model called?

- **A.** A document.
- **B.** A collection.
- **C.** A connection string.
- **D.** A pipeline stage.

**Answer: A.** A model instance represents an individual document.

### 4. What collection does a model named Article target by default?

- **A.** Typically the lowercased plural collection, articles.
- **B.** Always a collection named Article with exact capitalization.
- **C.** A collection named schemas.
- **D.** No collection, because models cannot persist data.

**Answer: A.** Mongoose derives the collection name from the model name by default. Configure it explicitly when needed.

### 5. When should schema paths and hooks be added relative to compiling a model?

- **A.** Before compiling the model.
- **B.** Only after every document is saved.
- **C.** After closing the database connection.
- **D.** Schema paths cannot be added before model compilation.

**Answer: A.** Model compilation copies the schema configuration. Finish the schema definition before compiling the model.

### 6. Does constructing a model instance with new automatically save it to MongoDB?

- **A.** No. Call save or use a create operation to persist it.
- **B.** Yes, every constructor call writes immediately.
- **C.** Only if the document has a title.
- **D.** No model instance can be saved.

**Answer: A.** A new document is initially in memory. Calling save persists it.

### 7. What does Model.find() return when no documents match?

- **A.** An empty array.
- **B.** Null.
- **C.** A validation error in every case.
- **D.** A single empty document.

**Answer: A.** Find returns an array, and no matches are represented by an empty array.

### 8. What should code expect from findById() when the ID is valid but no document has it?

- **A.** Null.
- **B.** An empty array.
- **C.** A new unsaved document.
- **D.** The first document in the collection.

**Answer: A.** A no-match lookup returns null, so handle that case before accessing document fields.

### 9. What is a Mongoose Query?

- **A.** A thenable query object that can be configured and executed.
- **B.** A database server.
- **C.** A document that has already been deleted.
- **D.** A promise that can be re-executed repeatedly for fresh results.

**Answer: A.** Queries can be built with chained methods and executed with await or exec. Treat a query object as a single-use operation rather than re-awaiting it for fresh data.

### 10. Which method is concise for creating and saving one document?

- **A.** Model.create().
- **B.** Schema.find().
- **C.** Connection.deleteMany().
- **D.** Document.aggregate().

**Answer: A.** Model.create() creates and saves a document, rejecting if validation or persistence fails.

### 11. What does updateOne() normally return?

- **A.** A write-result object with counts, not the updated document.
- **B.** The updated document in all cases.
- **C.** An array containing every document in the collection.
- **D.** A Mongoose schema.

**Answer: A.** Check values such as matchedCount to determine whether a document matched. Use findOneAndUpdate when the document itself is needed.

### 12. What does findOneAndUpdate() return by default?

- **A.** The matching document from before the update.
- **B.** The updated document in every configuration.
- **C.** The entire collection.
- **D.** A delete-result object.

**Answer: A.** Set returnDocument to after when the updated document is needed.

### 13. Which option requests update validation for a supported query update?

- **A.** runValidators: true.
- **B.** timestamps: false.
- **C.** collection: "all".
- **D.** returnDocument: "before".

**Answer: A.** Query update validators are off by default. Enabling them still does not make them identical to full document validation.

### 14. Which result field indicates how many documents a deleteOne operation deleted?

- **A.** deletedCount.
- **B.** matchedCount.
- **C.** selectedCount.
- **D.** validatedCount.

**Answer: A.** Check deletedCount when the application expects the deletion to have removed a document.

### 15. Which delete filter is safest for deleting one known record?

- **A.** A narrow filter such as the authorized document ID.
- **B.** An empty filter for every request.
- **C.** A filter built directly from the entire untrusted request body.
- **D.** A filter that matches every document.

**Answer: A.** A narrow, authorized filter limits the operation to the intended record.

## Part 2: Short-answer questions

### 16. How do a schema, model, and document relate to one another?

**Answer:** The schema defines expected paths and behavior. The model is compiled from the schema and provides CRUD methods. A document is an individual model instance representing one record.

### 17. When should a developer set a schema's collection option?

**Answer:** When the application must target an exact collection name, such as when using an existing database whose naming does not match Mongoose's default model-name pluralization.

### 18. Name four useful Mongoose schema path types.

**Answer:** String, Number, Boolean, Date, ObjectId, Array, Map, and Mixed are examples. Choose types that reflect how the application uses and validates the data.

### 19. What is a trade-off of using a Mixed path?

**Answer:** It allows flexible values, but gives up some of the explicit structure and path-specific rules available with a more specific schema type. Use it only when that flexibility is intentional.

### 20. What does the timestamps schema option add?

**Answer:** It maintains createdAt and updatedAt values for writes Mongoose handles. These are record lifecycle timestamps and do not replace business dates such as paidAt or publishedAt.

### 21. What is the difference between new Model(data) and Model.create(data)?

**Answer:** The constructor creates an in-memory document that must be saved. Model.create() creates and saves as one operation, returning the saved document.

### 22. Why should a query projection select only the fields an endpoint needs?

**Answer:** It reduces unnecessary data retrieval and helps avoid returning fields the endpoint does not need. Projection does not replace authorization checks.

### 23. How do find and findOne differ when there are no matches?

**Answer:** Find returns an empty array. FindOne returns null. Code should handle each result shape appropriately.

### 24. What does a Mongoose Query do before it executes?

**Answer:** It represents a database operation that can be configured with filters, sorting, projection, limits, and other options. Awaiting it or calling exec executes it.

### 25. Why should the same query object not be awaited twice to get fresh data?

**Answer:** Mongoose queries are thenable single-use operations, not reusable promises. Build a new query for a new database read.

### 26. When might loading a document and calling save be preferable to a query update?

**Answer:** When code needs hydrated document behavior, document validation, or save middleware. For concurrent state changes, a conditional atomic query may be safer than a separate read and write.

### 27. What does matchedCount tell you after updateOne?

**Answer:** It tells how many documents matched the filter. If the operation is expected to change one document and matchedCount is zero, the record may be missing or its state may no longer satisfy the filter.

### 28. How can an update filter help with a state transition?

**Answer:** Include the expected current state in the filter, such as matching a book whose status is available before setting it to checked-out. The database applies the change only if the state still matches at write time.

### 29. Why set returnDocument to after for some findOneAndUpdate calls?

**Answer:** The method returns the pre-update document by default. Setting returnDocument to after requests the document with the update applied.

### 30. Why should an API avoid passing an entire request body directly as a Mongoose update?

**Answer:** It may let callers modify fields the route does not intend to expose. Construct a limited update object from validated and authorized fields.

## Part 3: Practical scenarios

### 31. A developer creates a document with new Book(data), logs it, and expects to find it from another database client. What is missing?

**Answer:** The in-memory document must be persisted by calling save, or the developer can use Model.create(). A constructor alone does not write the document.

### 32. An endpoint calls findById and immediately reads book.title. What case can cause an error?

**Answer:** The query can return null if no document matches. Check the result and produce a not-found response before accessing title.

### 33. A list endpoint treats find() results as a single book. What should it do?

**Answer:** Find returns an array. The endpoint should iterate or serialize the list and handle an empty array as a valid no-match result.

### 34. A developer calls updateOne and tries to read result.title. Why is that wrong?

**Answer:** UpdateOne returns a write-result object rather than the updated document. Use a document save flow or findOneAndUpdate with returnDocument set to after when the document is needed.

### 35. A check-out route reads a book as available, waits, then updates it without including status in the update filter. Another request checks it out first. What improvement helps?

**Answer:** Include both the book ID and expected available status in one atomic update filter, then inspect whether it matched. This prevents the second request from silently treating an already changed record as available.

### 36. A client sends title, status, ownerId, and isAdmin to an update endpoint. The endpoint passes the whole object to a model. What should change?

**Answer:** Validate and authorize the request, then construct an explicit update containing only fields the endpoint permits. Sensitive or ownership fields should not be client-controlled unless a specific authorized operation allows them.

### 37. A delete route calls deleteMany with an empty filter to remove one user-selected item. What is the risk?

**Answer:** An empty or overly broad filter can remove many records. Use a narrow identifier filter, check authorization, and inspect deletedCount.

### 38. A route needs the updated record after changing its status. Which Mongoose approach fits?

**Answer:** Use findOneAndUpdate with a narrow filter and set returnDocument to after. Enable update validators if schema validation is required, and handle a null result when nothing matched.

### 39. A model is registered once on the default connection but database operations use a custom connection. Why might queries go to the wrong place?

**Answer:** A model belongs to the connection on which it was compiled. Compile the model with the custom connection's model method when that connection should own it.

### 40. A create operation fails with a duplicate-key error, but the code only catches Mongoose ValidationError. What should improve?

**Answer:** Handle database errors such as duplicate-key violations separately from schema validation errors. Translate expected conflicts into an appropriate application response and avoid exposing raw database internals.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [031 - Mongoose ODM: when and how to use it](../lessons/031-mongoose-odm-when-and-how-to-use-it.md) | [Lesson](../lessons/032-mongoose-schemas-models-and-crud.md) | [Example](../examples/032-mongoose-schemas-models-and-crud.md) | [033 - Mongoose validation, hooks, and virtuals](../lessons/033-mongoose-validation-hooks-and-virtuals.md) |
