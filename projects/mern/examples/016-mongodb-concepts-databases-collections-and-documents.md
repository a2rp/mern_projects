# Example 016 - MongoDB Concepts: Databases, Collections, and Documents

## Question

How does one course record fit into MongoDB's database, collection, and document hierarchy?

## Goal

Store one course document in a practice database and inspect how its fields, nested objects, and arrays are organized.

This example demonstrates:

- A database named `mern_concepts_demo`.
- A collection named `courses`.
- One document with a stable string _id.
- Fields, nested documents, and arrays.
- The automatic creation of a database and collection on the first write.

## Prerequisites

You need a MongoDB deployment and the MongoDB Shell (mongosh). Setup and connection instructions appear in chapter 018. The command below writes one document to a practice database; run it only against a development or learning deployment.

## 1. Connect with mongosh

Connect to the MongoDB deployment using the connection steps for your environment. Once connected, select the practice database:

~~~javascript
use mern_concepts_demo
~~~

Selecting this name chooses the current shell context. It does not necessarily create stored database data yet.

## 2. Insert one course document

Run this command once in the selected practice database:

~~~javascript
db.courses.insertOne({
  _id: "course-016-001",
  title: "HTML Foundations",
  published: false,
  instructor: {
    name: "Asha",
    profile: {
      city: "Delhi"
    }
  },
  topics: ["elements", "links", "images"],
  lessons: [
    {
      number: 1,
      title: "Document structure"
    },
    {
      number: 2,
      title: "Text and links"
    }
  ]
})
~~~

The database name is mern_concepts_demo. The collection name is courses. The object passed to insertOne is one document.

MongoDB creates the database and collection if needed when this first write occurs. The _id value is supplied explicitly here as a string so the sample identifier stays easy to recognize. MongoDB documents can use other supported identifier types; ObjectId is covered in the next lesson.

## 3. Read the document

Ask mongosh to display the document by its _id:

~~~javascript
db.courses.findOne({ _id: "course-016-001" })
~~~

## Expected output

The shell prints a document with this structure:

~~~javascript
{
  _id: 'course-016-001',
  title: 'HTML Foundations',
  published: false,
  instructor: {
    name: 'Asha',
    profile: {
      city: 'Delhi'
    }
  },
  topics: [ 'elements', 'links', 'images' ],
  lessons: [
    { number: 1, title: 'Document structure' },
    { number: 2, title: 'Text and links' }
  ]
}
~~~

The exact spacing in mongosh may vary. The stored values and nesting should match.

## Read the hierarchy

- Database: mern_concepts_demo
- Collection: courses
- Document: the one course record identified by course-016-001
- Fields: _id, title, published, instructor, topics, and lessons
- Embedded documents: instructor and each lesson entry
- Arrays: topics and lessons

One collection can hold many course documents. Documents do not have to contain identical fields by default, but an application should still use a deliberate shape. For example, it might require title on every course while allowing an optional level field.

## Inspect the collection in a visual tool

If using MongoDB Compass, connect to the same deployment and open the mern_concepts_demo database. The courses collection contains the inserted document. Expand instructor and lessons to see the embedded structures.

The hierarchy is the same in mongosh and Compass:

~~~text
mern_concepts_demo
└── courses
    └── course-016-001
        ├── instructor
        │   └── profile
        ├── topics
        └── lessons
~~~

The visual tool changes how the data is displayed, not how MongoDB organizes it.

## Avoid duplicate inserts while practicing

The example uses a fixed _id so the output is easy to follow. If you run insertOne again with the same _id in the same collection, MongoDB rejects the duplicate identifier.

Run the insert once in the new practice database. If you want to repeat the exercise, use a different practice database name or choose a new _id. Deleting or updating data is covered in later CRUD chapters.

## What this example demonstrates

- A database is a container for collections.
- A collection groups documents of a general kind.
- A document holds fields and values.
- A field value can be a scalar, an embedded document, or an array.
- The first write can create a database and collection that do not yet exist.
- A JSON-like document display represents BSON data; MongoDB's stored format is BSON.

## Key takeaways

- A MongoDB record is a document inside a collection inside a database.
- Nested objects and arrays can express grouped information.
- The _id value identifies the document within the collection.
- Flexible document shapes still need consistent application rules.
- Use a practice database when learning write commands.

## Related chapter files

- [Lesson 016 - MongoDB concepts: databases, collections, and documents](../lessons/016-mongodb-concepts-databases-collections-and-documents.md)
- [Q&A 016 - MongoDB concepts: databases, collections, and documents](../qnas/016-mongodb-concepts-databases-collections-and-documents.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [015 - Environment variables, configuration, and secrets](../lessons/015-environment-variables-configuration-and-secrets.md) | [Lesson](../lessons/016-mongodb-concepts-databases-collections-and-documents.md) | [Q&A](../qnas/016-mongodb-concepts-databases-collections-and-documents.md) | [017 - BSON, ObjectId, and document shape](../lessons/017-bson-objectid-and-document-shape.md) |
