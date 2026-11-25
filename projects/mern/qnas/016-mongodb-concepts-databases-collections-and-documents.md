# 016 - MongoDB Concepts: Databases, Collections, and Documents: Questions and Answers

Use these questions to review MongoDB's data hierarchy, document structure, BSON, flexible schemas, and the purpose of _id. Each answer includes a short explanation.

Related lesson: [016 - MongoDB concepts: databases, collections, and documents](../lessons/016-mongodb-concepts-databases-collections-and-documents.md)

## Multiple-choice questions

### 1. How does MongoDB primarily organize application records?

- A. As documents grouped into collections and databases
- B. As HTML pages grouped into folders
- C. As JavaScript functions grouped into packages
- D. As spreadsheet cells with no record structure

**Answer: A.** MongoDB stores records as documents, groups documents in collections, and groups collections in databases.

### 2. Which order shows the MongoDB data hierarchy from larger container to smaller part?

- A. Database, collection, document, field
- B. Document, database, field, collection
- C. Collection, field, database, document
- D. Field, document, collection, database

**Answer: A.** A database contains collections, a collection contains documents, and a document contains fields and values.

### 3. What does a MongoDB database contain?

- A. Collections
- B. Only one field
- C. Only JavaScript files
- D. Browser components

**Answer: A.** A database groups one or more collections.

### 4. What does a collection group?

- A. Documents of a general kind
- B. Fields from unrelated databases
- C. npm dependencies
- D. Network requests

**Answer: A.** For example, a learning application might group student documents in a students collection.

### 5. What is a MongoDB document?

- A. One record made of fields and values
- B. A folder that contains source code
- C. A database connection password
- D. A collection of databases

**Answer: A.** A document is the basic record stored in a collection.

### 6. In a document such as {"name": "Asha"}, what is name?

- A. A field name
- B. A database
- C. A collection
- D. A BSON server

**Answer: A.** The field name identifies the value stored in the document.

### 7. What is a useful first analogy for a MongoDB collection?

- A. A relational table
- B. A relational column value
- C. A database server process
- D. A JavaScript import statement

**Answer: A.** Both group records, but MongoDB documents can be nested and can vary in shape, so the analogy is not exact.

### 8. Which value can a MongoDB document field contain?

- A. An array
- B. Only a string
- C. Only a number
- D. Only another database

**Answer: A.** Document values can include arrays, nested documents, strings, numbers, booleans, dates, and other BSON types.

### 9. What is an embedded document?

- A. A document used as a field value inside another document
- B. A collection stored outside its database
- C. A browser page stored in a field
- D. A MongoDB process running in an editor

**Answer: A.** Nested documents can keep related structured information together.

### 10. What is BSON?

- A. MongoDB's binary representation for document data
- B. A JavaScript frontend framework
- C. A Git branch format
- D. A relational database table

**Answer: A.** BSON is a binary document representation based on JSON-like structures and supports additional data types.

### 11. Which statement describes JSON and BSON accurately?

- A. JSON is a text format; MongoDB stores documents as BSON
- B. JSON and BSON are both JavaScript frameworks
- C. MongoDB stores every document as an HTML page
- D. BSON is only another spelling of JSON text

**Answer: A.** JSON-like notation is commonly used to display documents, while BSON is MongoDB's binary representation.

### 12. What does MongoDB's flexible schema mean by default?

- A. Documents in a collection are not required to have exactly the same fields
- B. The application should never define data rules
- C. A collection cannot contain documents
- D. Every document must be an array

**Answer: A.** The model is flexible, though applications should still use deliberate and consistent data shapes.

### 13. What is a good conclusion to draw from flexible schema?

- A. Applications still need rules and may use validation
- B. Field names and types do not matter
- C. Any data shape is always safe
- D. MongoDB prevents all inconsistent records automatically

**Answer: A.** Flexible storage does not remove the need for data-quality rules in the application or database.

### 14. What is the main purpose of the _id field?

- A. Uniquely identify a document within its collection
- B. Store the collection's display name
- C. Select the current database
- D. Automatically validate every other field

**Answer: A.** Each standard document has an _id that acts as its unique identifier within the collection.

### 15. What commonly happens if an insert omits _id?

- A. The MongoDB client usually supplies an ObjectId
- B. MongoDB rejects every such insert
- C. The database deletes the document
- D. The collection changes into a table

**Answer: A.** MongoDB clients generally generate an ObjectId when the document does not provide _id.

### 16. Can an application's _id value be changed after a document is stored?

- A. No, _id is immutable after storage
- B. Yes, whenever the application changes its title
- C. Only from React
- D. Only when the collection is renamed

**Answer: A.** The _id value identifies the document and cannot be updated after it is stored.

### 17. What does the mongosh command use learning_portal do?

- A. Selects that database as the current shell context
- B. Necessarily creates permanent data immediately
- C. Installs MongoDB on the computer
- D. Deletes all collections with that name

**Answer: A.** Selecting a database name does not necessarily create stored database data before a write occurs.

### 18. When can MongoDB create a new database and collection automatically?

- A. When a document is first stored in them
- B. When a developer opens a text editor
- C. When an npm package is installed
- D. When a database name is mentioned in a comment

**Answer: A.** A first write can create the database and collection if they do not already exist.

### 19. What is an important difference between an embedded document and a separate referenced document?

- A. An embedded document is stored inside another document; a referenced document is stored separately
- B. An embedded document must be HTML
- C. A referenced document cannot have fields
- D. They are identical storage structures

**Answer: A.** The choice affects how related data is organized and is covered in later modeling lessons.

### 20. What should not be included in a database or collection name?

- A. Passwords, API tokens, or other sensitive information
- B. A clear description of the data
- C. A consistent project naming convention
- D. A short environment label

**Answer: A.** Names may be visible in tools and logs, so keep credentials and sensitive information out of them.

## Short-answer questions

### 1. What is the difference between a database and a collection?

**Answer:** A database groups collections. A collection groups documents of a general kind.

### 2. What is the difference between a collection and a document?

**Answer:** A collection is a group of records. A document is one record in that group.

### 3. What are fields and values?

**Answer:** A field is a named part of a document, and its value is the data stored under that name.

### 4. What is the basic MongoDB hierarchy?

**Answer:** A deployment contains databases; a database contains collections; a collection contains documents; a document contains fields and values.

### 5. How can a document represent nested information?

**Answer:** A field can contain an embedded document, an array, or an array of embedded documents.

### 6. Why is a SQL table only an analogy for a MongoDB collection?

**Answer:** Both group records, but MongoDB documents can include nested structures and can have different fields. Their schemas and operations are not identical.

### 7. What is BSON?

**Answer:** BSON is the binary representation MongoDB uses for documents. It supports JSON-like structures and additional types such as ObjectId and Date.

### 8. Does MongoDB store ordinary JSON text as its document format?

**Answer:** No. Documents are stored as BSON. JSON-like notation is a common way to represent or display document structure.

### 9. Does a flexible schema mean the application needs no data rules?

**Answer:** No. The application should define expected fields, types, required values, and relationship rules. Validation can enforce some of those rules.

### 10. What is the purpose of _id?

**Answer:** It uniquely identifies a document within its collection and cannot be changed after that document is stored.

### 11. What usually supplies _id when an insert does not include one?

**Answer:** A MongoDB client or driver generally supplies an ObjectId. The next lesson explains the identifier in more detail.

### 12. Does selecting a new database name in mongosh always create a stored database?

**Answer:** No. It selects the shell's current database context. The database and collection may not appear as stored data until a document is written.

### 13. How can a collection be created without creating it explicitly first?

**Answer:** Store the first document in it. MongoDB can create the collection automatically as part of the write.

### 14. Why should field naming be consistent?

**Answer:** Inconsistent spelling or capitalization can cause the application to read a different field than the one that was stored and makes queries harder to reason about.

### 15. What is one reason to use an embedded document?

**Answer:** It can keep a related group of values together inside one parent document. Whether to embed or reference depends on how the application uses the data.

### 16. What should guide database and collection names?

**Answer:** Use clear, consistent names that describe the data, and keep passwords, tokens, and other sensitive information out of names.

### 17. Why might two documents in one collection have different fields?

**Answer:** MongoDB's flexible document model does not require an identical field set by default. The application should still maintain a deliberate shape.

### 18. What should you remember when you see a JSON-like document in a database tool?

**Answer:** It is a convenient representation of the document. MongoDB stores the data as BSON, which supports additional types.

## Review checklist

You are ready to move on when you can:

- Explain the database, collection, document, field, and value hierarchy.
- Recognize embedded documents and arrays in a sample.
- Explain BSON and how it relates to JSON.
- State why a collection is similar to, but not identical to, a relational table.
- Describe flexible schema without treating it as absence of rules.
- Explain why _id exists and how a client can supply it.
- Describe when MongoDB can create a database and collection automatically.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [015 - Environment variables, configuration, and secrets](../lessons/015-environment-variables-configuration-and-secrets.md) | [Lesson](../lessons/016-mongodb-concepts-databases-collections-and-documents.md) | Q&A | [Example](../examples/016-mongodb-concepts-databases-collections-and-documents.md) | [017 - BSON, ObjectId, and document shape](../lessons/017-bson-objectid-and-document-shape.md) |
