# Create and read MongoDB documents

MongoDB stores records as BSON documents inside collections. With the Node.js driver, create operations write documents; read operations return a single document or a cursor over matching documents. This chapter uses the driver directly so you can see what is stored and what each operation returns.

## Learning goals

By the end of this chapter, you should be able to:

- Insert one document with `insertOne()` and a bounded group with `insertMany()`.
- Explain how MongoDB assigns `_id` and where the inserted identifier appears in the result.
- Read one matching document with `findOne()`.
- Read multiple documents with `find()` and consume its cursor safely.
- Use a small projection to request only the fields an operation needs.
- Handle not-found results, duplicate keys, and driver errors.
- Avoid unbounded reads and unsafe insertion of arbitrary request bodies.

## Before you begin

This chapter assumes you have:

- A working Node.js project with the `mongodb` package installed.
- A MongoDB deployment and a connection URI available through an environment variable.
- A connected `MongoClient` and a database handle, as introduced in the previous chapter.
- Basic JavaScript objects, arrays, promises, and `async` / `await`.

A collection can be selected from a database handle even if it has not been created yet. MongoDB creates the collection on the first write unless you explicitly create it or need collection options.

~~~js
const db = client.db("learning_app");
const courses = db.collection("courses");
~~~

The `courses` value is a collection handle. It is not a JavaScript array and it does not contain the collection's documents locally.

## A document is a BSON record

A MongoDB document is made of field-and-value pairs. In Node.js, you usually describe a document with a JavaScript object:

~~~js
const course = {
  title: "MongoDB fundamentals",
  level: "beginner",
  published: true,
  tags: ["database", "backend"],
  createdAt: new Date()
};
~~~

The driver converts supported JavaScript values into BSON when sending the operation. Common values include strings, booleans, finite numbers, arrays, nested objects, dates, and MongoDB types such as `ObjectId`. A field's type matters: the string `"42"` and the number `42` are different values.

Choose a consistent shape and types for documents in a collection. Validate data at the application boundary, and use MongoDB schema validation when the collection needs database-enforced rules. Avoid treating arbitrary client-submitted objects as trusted documents. Build a document from the fields the application actually accepts.

## Insert one document

Use `insertOne(document)` to add one record:

~~~js
const result = await courses.insertOne({
  title: "MongoDB fundamentals",
  level: "beginner",
  published: true,
  createdAt: new Date()
});

console.log(result.acknowledged);
console.log(result.insertedId);
~~~

The operation is asynchronous, so wait for it with `await`. A successful result includes an `insertedId`. If the document did not supply `_id`, the driver generates an `ObjectId` for the inserted document. The generated identifier is also available as `result.insertedId`.

You can provide an identifier yourself when the application has a reliable reason to do so:

~~~js
const result = await courses.insertOne({
  _id: "course-mongodb-basics",
  title: "MongoDB fundamentals",
  level: "beginner"
});
~~~

Every document in a collection must have a unique `_id`. If a document with that identifier already exists, the insert fails with a duplicate-key write error. Do not assume that an insert is an update: inserting an existing `_id` does not replace the old document. Update and upsert operations are covered in later CRUD chapters.

Use the inserted identifier when a subsequent operation must refer to exactly the document just created:

~~~js
const created = await courses.findOne({ _id: result.insertedId });
~~~

When you use an application-defined string ID, query it as a string. When MongoDB generated an `ObjectId`, query it with that same `ObjectId` value, not its printed hexadecimal string. Convert a valid string with `new ObjectId(idString)` when an API receives the ID as text, and handle invalid input before querying.

## Insert a bounded group

Use `insertMany(documents)` when you already have a finite batch to insert:

~~~js
const result = await courses.insertMany([
  { title: "MongoDB fundamentals", level: "beginner" },
  { title: "Express request handling", level: "intermediate" },
  { title: "React data fetching", level: "intermediate" }
]);

console.log(result.insertedCount);
console.log(result.insertedIds);
~~~

`insertedCount` reports how many documents the operation inserted, and `insertedIds` maps positions in the input array to their inserted identifiers. Documents without `_id` receive generated identifiers.

Keep batches reasonably bounded. Do not gather an unlimited stream of user input into one in-memory array just to pass it to `insertMany()`. For imports larger than a sensible batch, process bounded chunks and decide how the application should resume or report failures.

By default, bulk insertion is ordered. If an insert in an ordered batch fails, later items are not attempted; documents inserted before the failure may already be stored. An unordered batch can continue attempting other documents after a write error, but it can still report errors. Choose the behavior deliberately and inspect the result or error rather than assuming all input records succeeded.

## Read one document

Use `findOne(filter)` when you expect at most one result:

~~~js
const course = await courses.findOne({ title: "MongoDB fundamentals" });

if (course === null) {
  console.log("No matching course was found.");
} else {
  console.log(course.title);
  console.log(course._id);
}
~~~

`findOne()` resolves to a document when one matches, or `null` when none matches. Always account for `null` before reading properties. If several documents match, it returns one matching document; do not use it to imply that a field is unique. Add a unique index when the data model requires uniqueness.

Use a stable key in the filter. Titles, display names, and other editable text are often not unique. A lookup by `_id` is a common way to identify a particular document:

~~~js
const course = await courses.findOne({ _id: courseId });
~~~

The filter value's BSON type must match the stored value's type. For example, an `ObjectId` field does not match the equivalent hexadecimal string.

## Read matching documents

Use `find(filter)` to retrieve zero or more matching documents:

~~~js
const cursor = courses.find({ published: true });

for await (const course of cursor) {
  console.log(course.title);
}
~~~

`find()` returns a cursor, not a promise that resolves to an array. A cursor fetches results as they are consumed. The `for await...of` loop is a clear default for iterating through results and avoids requiring the entire result set to be kept in one array.

An empty filter matches every document in the collection:

~~~js
const cursor = courses.find({});
~~~

That can be useful for a deliberate administrative task, but it can be expensive in an application endpoint. Use a selective filter and a limit when the user only needs a page or a bounded sample.

For a small, known-bounded result set, you can materialize a cursor with `toArray()`:

~~~js
const recentCourses = await courses
  .find({ published: true })
  .sort({ createdAt: -1 })
  .limit(20)
  .toArray();
~~~

`toArray()` loads all remaining cursor results into memory. Combine it with a meaningful limit when the result size is not already guaranteed to be small. For large result sets, iterate the cursor instead of collecting every document at once.

Always await cursor iteration or `toArray()` inside an asynchronous function. If the application stops consuming a cursor early, close it when appropriate; cursors are resources managed by the driver.

## Return only needed fields

A projection controls which fields a read returns. It can reduce unnecessary data transfer and helps keep database results aligned with what a particular operation needs:

~~~js
const course = await courses.findOne(
  { _id: courseId },
  {
    projection: {
      title: 1,
      level: 1,
      _id: 0
    }
  }
);
~~~

An inclusion projection lists fields to include. By default, MongoDB includes `_id` even when other fields are included, so use `_id: 0` if that identifier is not needed. An exclusion projection lists fields to leave out. Do not mix inclusion and exclusion fields in one projection, except for explicitly excluding `_id` from an inclusion projection.

The same option can be supplied to `find()`:

~~~js
const cursor = courses.find(
  { published: true },
  {
    projection: {
      title: 1,
      level: 1
    }
  }
);
~~~

Use the projection form supported by the driver version in your project. The next chapter explores query filters and projections in more detail, including how to shape returned data for application use.

## Handle errors at the operation boundary

Database operations can reject with an error because of a duplicate key, a validation rule, a network problem, authorization, or another server-side failure. Catch errors where the application can make a useful decision, and do not turn a database failure into a fake success response.

~~~js
try {
  const result = await courses.insertOne({
    title: "Accessible forms",
    level: "beginner"
  });

  console.log("Created course:", result.insertedId);
} catch (error) {
  console.error("Could not create the course:", error.message);
}
~~~

A web application should map expected input or duplicate-key cases to an appropriate response and log unexpected failures with enough context to diagnose them. Never log the full connection URI or secrets. Avoid returning raw internal error details to an untrusted client.

For a multi-document insert, inspect the driver error and its write-error details if partial completion matters to the application. Do not retry an insert blindly after an ambiguous network failure: the server may have performed the write even if the client did not receive the acknowledgement. Design retry behavior around idempotency and the application's data model.

## A small end-to-end operation

This function inserts one document, then reads back exactly that document by its generated ID:

~~~js
async function createAndReadCourse(courses, input) {
  const document = {
    title: input.title,
    level: input.level,
    published: false,
    createdAt: new Date()
  };

  const insertResult = await courses.insertOne(document);
  const createdCourse = await courses.findOne({
    _id: insertResult.insertedId
  });

  return createdCourse;
}
~~~

This example assumes validation has already ensured that `input` contains an acceptable title and level. In a real application, validate types, lengths, allowed values, and authorization before writing. The function deliberately selects accepted fields instead of copying the entire request body.

## Common mistakes

- **Forgetting `await`:** the value is a pending promise, not the insert result or document.
- **Treating `find()` as an array:** consume its cursor with iteration, or call `toArray()` only for bounded results.
- **Ignoring `null` from `findOne()`:** check for a match before reading document fields.
- **Querying an `ObjectId` with a string:** convert and validate the string before building the filter.
- **Reading the entire collection accidentally:** an empty filter can match all documents; choose a filter and a bound intentionally.
- **Assuming every item in `insertMany()` succeeded:** failures can occur, and ordered or unordered batches have different continuation behavior.
- **Copying request bodies directly into the database:** explicitly validate and select fields to prevent unwanted properties from being stored.
- **Assuming repeated insert is safe:** a retry can create a second document unless the data model has an idempotency strategy.

## Key points

- `insertOne()` writes one document; `insertMany()` writes a finite batch.
- MongoDB creates a unique `_id` when one is omitted; the insert result exposes the ID.
- `findOne()` returns one document or `null`.
- `find()` returns a cursor. Iterate it for potentially large result sets.
- `toArray()` is appropriate only when the remaining result set is bounded.
- Filters must use the stored BSON types, and projections can limit returned fields.
- Validate input, handle failures, and do not expose database credentials.

## Review checklist

You are ready to move on when you can:

- Insert a document and use the returned `insertedId`.
- Explain the difference between `findOne()` and `find()`.
- Check the `null` result from `findOne()`.
- Iterate a cursor and explain why `toArray()` can use substantial memory.
- Use a projection and describe the default treatment of `_id`.
- Explain why a string containing an ObjectId is not itself an ObjectId.
- Handle insert errors without claiming a write succeeded.
- Validate input and avoid unbounded collection reads.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [019 - MongoDB Node.js driver and connection lifecycle](019-mongodb-node-js-driver-and-connection-lifecycle.md) | Lesson | [Q&A](../qnas/020-create-and-read-mongodb-documents.md) | [Example](../examples/020-create-and-read-mongodb-documents.md) | [021 - Query filters and projection](021-query-filters-and-projection.md) |
