# Example 017 - BSON, ObjectId, and Document Shape

## Question

How can you inspect BSON-friendly values in a MongoDB document, and why does an ObjectId not match a string containing the same hexadecimal characters?

## Goal

Insert one course document into a practice database, inspect its generated ObjectId and BSON Date, and compare queries using the ObjectId and its string representation.

This example demonstrates:

- A generated BSON ObjectId in `_id`.
- The 24-character hexadecimal form of that ObjectId.
- A lookup that matches the ObjectId and one that does not match its string form.
- A BSON Date, a number, a boolean, an explicit `null`, an embedded document, and an array.
- The distinction between a missing optional field and a field set to `null`.

## Prerequisites

You need a MongoDB deployment and the MongoDB Shell (mongosh). Chapter 018 covers setup and connection. Use a development or learning deployment and the practice database shown below. This example writes one document; run the insert once.

## 1. Select a practice database

Connect to your deployment with mongosh, then select a database for this example:

~~~javascript
use mern_bson_demo
~~~

This selects the shell context. MongoDB creates stored database data when a write first occurs.

## 2. Insert a document without specifying _id

The document below intentionally omits `_id` so mongosh can generate an ObjectId. The `var` declarations allow you to rerun the commands in the same mongosh session; each insert creates a new document and identifier.

~~~javascript
var insertResult = db.courses.insertOne({
  title: "MongoDB Basics",
  active: true,
  lessonCount: 8,
  createdAt: new Date("2026-03-01T12:00:00.000Z"),
  archivedAt: null,
  instructor: {
    name: "Asha",
    location: "Delhi"
  },
  tags: ["mongodb", "bson", "mern"]
})

var courseId = insertResult.insertedId
~~~

Because the document did not supply `_id`, the shell provides an ObjectId. The other fields intentionally use several types: a boolean, a number, a BSON Date, null, an embedded document, and an array of strings. The optional `description` field is omitted, which is different from setting it to `null`.

## 3. Inspect the inserted identifier

~~~javascript
courseId
courseId.toHexString()
courseId.getTimestamp()
~~~

## Expected output

The generated ID and timestamp depend on when you run the insert. The values in angle brackets below are placeholders; mongosh will show concrete values in your session.

~~~text
ObjectId("<generated 24-character hexadecimal value>")
"<the same 24 hexadecimal characters>"
ISODate("<approximate generation time in UTC>")
~~~

The ObjectId display and its hexadecimal string represent the same identifier in two different types. The timestamp exposed by an ObjectId is a rough generation-time clue, not a replacement for the explicit `createdAt` Date field.

## 4. Find the document using its ObjectId

Use the ObjectId value returned by the insert:

~~~javascript
db.courses.findOne({ _id: courseId })
~~~

Mongosh returns the document. Its displayed values should have this general shape:

~~~javascript
{
  _id: ObjectId("67c301e00000000000000001"),
  title: "MongoDB Basics",
  active: true,
  lessonCount: 8,
  createdAt: ISODate("2026-03-01T12:00:00.000Z"),
  archivedAt: null,
  instructor: {
    name: "Asha",
    location: "Delhi"
  },
  tags: ["mongodb", "bson", "mern"]
}
~~~

The generated ObjectId varies. The `description` field does not appear because the insert omitted it.

## 5. Compare an ObjectId query with a string query

The first query uses an ObjectId and finds the record:

~~~javascript
db.courses.findOne({ _id: courseId })
~~~

The next query uses the same hexadecimal characters as a string:

~~~javascript
db.courses.findOne({ _id: courseId.toHexString() })
~~~

Expected result:

~~~javascript
null
~~~

The stored `_id` is BSON ObjectId. The second query asks for a BSON string, so it does not match. When an application receives an identifier through an HTTP path, it receives text; validate it and convert it with the MongoDB driver's ObjectId API before querying an ObjectId field.

## 6. Compare a missing field with null

The inserted document has `archivedAt: null` and no `description` field. Inspect each case:

~~~javascript
db.courses.findOne(
  { _id: courseId },
  { _id: 0, description: 1, archivedAt: 1 }
)
~~~

The projection includes `archivedAt` with a null value. The missing `description` field is not present in the returned document. Applications should choose deliberately whether a value is unknown, explicitly empty, or not applicable; these cases are not automatically interchangeable.

## 7. Inspect the BSON Date and document shape

The value assigned to `createdAt` is constructed with JavaScript's `Date` constructor. MongoDB stores it as a BSON Date, which can be compared and sorted as time data. By contrast, a quoted value such as `"2026-03-01T12:00:00.000Z"` is a string.

The document's shape is:

- `_id`: an ObjectId generated for the insert.
- `title`: a string.
- `active`: a boolean.
- `lessonCount`: a number.
- `createdAt`: a BSON Date.
- `archivedAt`: a field explicitly set to null.
- `instructor`: an embedded document.
- `tags`: an array of strings.
- `description`: absent.

A collection can contain documents with optional fields, but the application should define their meaning and validate the types it expects.

## Repeat the exercise safely

The insert is not idempotent: every execution creates another course document with a newly generated ObjectId. For a clean practice run, select a fresh practice database name before inserting. Avoid running practice writes against production data.

## What this example demonstrates

- BSON has types that plain JSON does not represent directly.
- MongoDB can generate an ObjectId when an insert omits `_id`.
- An ObjectId and its hexadecimal string are different BSON types.
- A query must use the identifier type stored in the document.
- The ObjectId timestamp is approximate; store an explicit Date for application event time.
- Missing fields and fields set to null are distinct.
- Consistent field and array types make document handling easier to reason about.

## Key takeaways

- Inspect a value's BSON type when matching or comparing it.
- Convert validated API identifier strings only when the stored identifier is an ObjectId.
- Use explicit Date fields such as `createdAt` when the application needs event time.
- Keep optional fields, null values, and array shapes intentional.
- An ObjectId identifies a document; application authorization still decides who can access it.

## Related chapter files

- [Lesson 017 - BSON, ObjectId, and document shape](../lessons/017-bson-objectid-and-document-shape.md)
- [Q&A 017 - BSON, ObjectId, and document shape](../qnas/017-bson-objectid-and-document-shape.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| :--- | :--- | :--- | :---: |
| [016 - MongoDB concepts: databases, collections, and documents](../lessons/016-mongodb-concepts-databases-collections-and-documents.md) | [Lesson](../lessons/017-bson-objectid-and-document-shape.md) | [Q&A](../qnas/017-bson-objectid-and-document-shape.md) | [018 - Install, run, and connect to MongoDB](../lessons/018-install-run-and-connect-to-mongodb.md) |
