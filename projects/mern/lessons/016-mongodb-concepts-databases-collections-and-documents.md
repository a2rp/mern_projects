# 016 - MongoDB Concepts: Databases, Collections, and Documents

## Learning goals

By the end of this lesson, you should be able to:

- Describe how MongoDB organizes stored data.
- Distinguish a database, collection, document, field, and value.
- Read a simple document with nested data and arrays.
- Explain how MongoDB documents relate to BSON and JSON.
- Compare MongoDB collections with relational tables without treating them as identical.
- Explain flexible schema and why an application still needs consistent data rules.
- Describe the purpose of the _id field and when MongoDB supplies one.

## What is MongoDB?

MongoDB is a document database. It stores records as documents made from field-and-value pairs. A database groups collections, and each collection groups documents.

The basic hierarchy is:

~~~text
MongoDB deployment
â””â”€â”€ Database
    â””â”€â”€ Collection
        â””â”€â”€ Document
            â””â”€â”€ Fields and values
~~~

A MERN application commonly stores data in MongoDB and accesses it through a server-side Node.js application. React should communicate with the server API; it should not connect to the database using private credentials from browser code.

## Database, collection, and document

### Database

A database is a named container for collections. An application may use a database for a particular product or environment. For example, a learning application might use a database named learning_portal.

A deployment can host multiple databases. Development and production should use deliberately separated data and credentials.

### Collection

A collection is a group of documents within a database. A learning application might have collections named students, courses, and enrollments.

Collections are similar to tables in a relational database as a first analogy: both group records of a general kind. The structures and rules differ. A MongoDB collection does not require every document to have exactly the same fields by default.

A collection may be created explicitly or created automatically when the application first stores a document in it.

### Document

A document is one record stored in a collection. It is made up of fields and their values:

~~~json
{
  "_id": "student-001",
  "name": "Asha",
  "email": "asha@example.invalid",
  "active": true
}
~~~

This example is shown as JSON for readability. MongoDB stores documents using BSON, a binary representation of JSON-like data with additional data types.

### Field and value

A field is a named part of a document, such as name or active. A value is the data stored for that field. A value can be text, a number, a boolean, null, a date, an array, or an embedded document, among other BSON types.

Field names should be clear and consistently spelled. Names are case-sensitive for typical application use, so email and Email should not be treated as interchangeable.

## Documents can contain nested data

A document can hold another document as a field value. This is called an embedded document. It can also hold an array of values or an array of embedded documents.

~~~json
{
  "_id": "course-101",
  "title": "JavaScript Foundations",
  "published": true,
  "instructor": {
    "name": "Asha",
    "profile": {
      "city": "Delhi"
    }
  },
  "topics": ["variables", "functions", "modules"],
  "lessons": [
    {
      "number": 1,
      "title": "Values and variables"
    },
    {
      "number": 2,
      "title": "Functions"
    }
  ]
}
~~~

Here, instructor is an embedded document, profile is nested inside instructor, topics is an array of strings, and lessons is an array of embedded documents. The complete structure belongs to one course document.

Nested structures can represent information that is naturally grouped together. Choosing between embedding data and storing a reference to another document is a data-modeling decision covered later in the course.

## MongoDB and relational database terms

The following table is a starting analogy, not an exact conversion rule:

| Relational database | MongoDB | General role |
| --- | --- | --- |
| Database | Database | Groups related data structures |
| Table | Collection | Groups records of a general kind |
| Row | Document | Stores one record |
| Column | Field | Names a value in a record |
| Cell | Field value | Holds one value |

A relational table typically defines columns and their types as part of its schema. MongoDB documents in one collection can have different fields, although applications commonly choose a consistent document shape.

Do not assume every relational table should become exactly one MongoDB collection or every relationship should use the same pattern. Design according to how the application creates, reads, and updates its data. The course will explore those choices in later data-modeling lessons.

## Flexible schema still needs rules

MongoDB has a flexible document model. By default, documents in a collection are not all required to have identical fields. This makes it possible to evolve a data shape as an application changes.

Flexible does not mean that an application should store unpredictable data. The application should decide which fields it expects, what types they should have, which values are required, and how related data is represented.

For example, two student documents can differ because one has an optional phone field:

~~~json
{
  "_id": "student-001",
  "name": "Asha",
  "email": "asha@example.invalid"
}
~~~

~~~json
{
  "_id": "student-002",
  "name": "Ravi",
  "email": "ravi@example.invalid",
  "phone": "555-0102"
}
~~~

This flexibility can help during gradual changes, but careless inconsistency can make queries and application code harder to understand. Keep a deliberate shape in your application and add database-level validation when appropriate.

## The _id field

Every standard MongoDB document has an _id field that uniquely identifies it within its collection. The _id value cannot be changed after the document is stored.

If an inserted document does not include _id, MongoDB drivers generally generate an ObjectId for it. An application may use another unique value when that choice fits its design. ObjectId structure and identifier choices are explained in the next lesson.

Do not use a person's email address or other changeable personal detail as an identifier without considering the consequences. An identifier should be stable and unique for the record.

## BSON and JSON

JSON is a text format commonly used for APIs and configuration. BSON is the binary document format MongoDB uses to store and communicate document data.

BSON supports familiar values such as strings, arrays, nested objects, booleans, and numbers. It also supports types that plain JSON does not represent directly, including dates and ObjectIds.

When reading a document in a tool or application, values may be displayed using JSON-like syntax. That display does not mean the stored database representation is plain JSON text. The next lesson looks more closely at BSON, ObjectId, and document shape.

## When databases and collections are created

MongoDB can create a database and collection when a document is first stored in them. Merely selecting a database name in a shell does not necessarily create persistent data.

A conceptual shell sequence looks like this:

~~~javascript
use learning_portal
db.students.insertOne({
  name: "Asha",
  email: "asha@example.invalid"
})
~~~

The first write to a new collection creates the database and collection if needed. The MongoDB client supplies an _id when an insert omits it, usually as an ObjectId. This lesson introduces the hierarchy; connecting to a MongoDB server and using write operations will be covered later.

## A practical naming and organization approach

For a beginner application, choose names that communicate what each group contains:

- Use a database name for the application or environment, such as learning_portal_dev.
- Use collection names for record types, such as students or courses.
- Use field names that describe one value, such as displayName or createdAt.
- Keep spelling and capitalization consistent across the application.
- Do not put passwords, API tokens, or other secrets in database, collection, or field names.

Naming conventions can vary between teams. Consistency within a project matters more than a single universal casing style.

## Common misunderstandings

### A collection is exactly the same as a SQL table

A collection and a table both group records, so the comparison is useful at first. MongoDB's documents can contain nested objects and arrays, and documents in a collection can vary in shape. The analogy has limits.

### MongoDB is schema-less

MongoDB's flexible model does not require a fixed identical set of fields by default. Applications still need rules for required values, types, and relationships. Validation can be enforced in application code and, when appropriate, by MongoDB.

### A database exists as soon as its name is selected

Selecting a database in a shell chooses the current context. A new database and collection may not appear as stored data until the first document is written.

### A MongoDB document is just JSON text

MongoDB stores BSON documents. JSON-like notation is commonly used to display and edit data, but BSON includes additional types and is a binary representation.

### Every relationship should be nested

Embedding can be convenient for related data that is read and updated together, but it is not right for every relationship. Later lessons compare embedding with references.

### _id is always an email or a number

MongoDB requires a unique _id value for each standard document, but the value can use different supported types. Drivers normally generate ObjectIds when an insert omits _id.

## Key takeaways

- A database contains collections; a collection contains documents.
- A document contains named fields and values, including nested documents and arrays.
- MongoDB stores BSON documents; JSON-like notation is a convenient representation.
- Collections are comparable to relational tables, but their document rules differ.
- Flexible schema still requires consistent application rules and useful validation.
- Each document has a unique _id; a driver can generate an ObjectId when one is omitted.
- A new database and collection can be created by the first write.

## Review checklist

You are ready to move on when you can:

- Draw the database â†’ collection â†’ document â†’ field hierarchy.
- Identify fields, values, embedded documents, and arrays in a sample.
- Explain the limits of comparing a collection to a relational table.
- Explain why flexible schema does not mean no data rules.
- Describe the purpose of _id and how it can be supplied.
- Explain the difference between JSON notation and BSON storage.
- Describe why a database may not appear until the first document is written.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [015 - Environment variables, configuration, and secrets](015-environment-variables-configuration-and-secrets.md) | Lesson | [Q&A](../qnas/016-mongodb-concepts-databases-collections-and-documents.md) | [Example](../examples/016-mongodb-concepts-databases-collections-and-documents.md) | [017 - BSON, ObjectId, and document shape](017-bson-objectid-and-document-shape.md) |
