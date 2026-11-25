# 032 - Mongoose schemas, models, and CRUD

A Mongoose schema describes the document shape an application expects. A model is compiled from that schema and provides methods for creating, reading, updating, and deleting documents in a MongoDB collection. A document is an individual model instance.

This chapter builds those pieces into a practical CRUD workflow. It focuses on choosing schema paths and options, compiling a model, interpreting query results, and making targeted changes. The next chapter covers validation, hooks, and virtuals in more detail.

## Learning goals

By the end of this chapter, you should be able to:

- Define a Mongoose schema using common schema types and options.
- Distinguish a schema, a model, and a document.
- Choose an explicit collection name when the default naming convention is unsuitable.
- Create documents with a model constructor, save, and create.
- Read one or many documents and handle missing results.
- Update a document with save or an atomic query update.
- Choose a return-document option for findOneAndUpdate.
- Delete only the intended document and inspect the operation result.
- Keep client input separate from database filters and update operators.

## The schema-model-document relationship

A schema is a blueprint for application-side document paths and behavior. A model is a constructor compiled from a schema. An instance of that model is a document representing one record in the collection.

~~~text
Schema definition
       |
       v
Compiled model
       |
       +---- create or query ----> MongoDB collection
       |
       v
Document instance
       |
       +---- change fields and save
~~~

A schema does not itself create a MongoDB collection just because the JavaScript object was declared. Model operations use a connection, and MongoDB creates collections as needed for writes. A model is associated with a Mongoose connection. With the default mongoose connection, connect before running database operations.

~~~javascript
import mongoose from "mongoose";

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  published: { type: Boolean, default: false }
});

const Article = mongoose.model("Article", articleSchema);
~~~

Mongoose derives a collection name from the model name by default, typically lowercasing and pluralizing it. For example, a model named Article normally targets the articles collection. If you are connecting to an existing collection or require a stable exact name, specify the collection in schema options.

~~~javascript
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }
  },
  {
    collection: "articles"
  }
);
~~~

Add schema paths and schema behavior before compiling the model. Compiling a model copies the schema configuration; changing the original schema later may not change the already compiled model as you expect.

## Choosing schema paths

A schema path declares a property and its type. Common path types include:

| Schema type | Typical value |
| --- | --- |
| String | Names, labels, and text |
| Number | Counts and numeric measurements |
| Boolean | True-or-false state |
| Date | A point in time |
| ObjectId | A MongoDB document identifier or reference |
| Array | A list of values or subdocuments |
| Map | A set of values addressed by string keys |
| Mixed | A value with a flexible shape |

Use the narrowest useful type for the data. An array of strings is easier to understand and query than an unstructured value when every item is meant to be text. A Mixed path allows flexible values but gives up some of the schema structure and path-specific validation that can help maintain an application.

A path can be declared with a shorthand type when no options are needed:

~~~javascript
const profileSchema = new mongoose.Schema({
  displayName: String,
  age: Number,
  active: Boolean
});
~~~

Use an options object when a path needs a default, required status, trimming, allowed values, or other rules:

~~~javascript
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 160
  },
  status: {
    type: String,
    enum: ["available", "checked-out"],
    default: "available"
  },
  tags: {
    type: [String],
    default: []
  }
});
~~~

A default is applied when a path is undefined. Defaults do not mean every user-supplied value is acceptable. A path with an enum still rejects a value outside that allowed set when the relevant validation runs.

Mongoose creates an ObjectId _id path by default if you do not provide one. Treat IDs as opaque identifiers; do not assume every ID from an external request is valid. Validate or cast route parameters at the API boundary and handle a cast error or a missing record deliberately.

## Schema options

Schema options configure behavior shared by documents in the schema. Common examples include:

- collection: choose a specific MongoDB collection name.
- timestamps: maintain createdAt and updatedAt on writes Mongoose handles.
- strict: control how values that are not in the schema are handled.
- versionKey: configure the document version field when the application has a reason to do so.

Use timestamps when the application needs creation and update times. Do not treat createdAt as a replacement for a dedicated business date such as publishedAt, completedAt, or paidAt. These dates describe different events.

The strict option is useful for thinking about the boundary between a schema and input. Do not use a permissive schema setting as a reason to pass arbitrary client objects into database operations. Construct explicit input objects from fields the API accepts.

## Compile and register a model

Compile a schema with mongoose.model when using the default Mongoose connection:

~~~javascript
const Book = mongoose.model("Book", bookSchema);
~~~

The first argument is the model name. It is not automatically the exact collection name unless configured that way. Mongoose applies its collection naming convention unless the schema sets collection explicitly.

Compile each model once in a module and export it for application services to use. In development environments that reload modules, registering the same model repeatedly on one connection can cause an overwrite-model error. Keep model registration in a dedicated module and follow the framework's established reload pattern where necessary.

When using a custom connection, compile the model through that connection's model method. Do not accidentally compile it on the default connection and then expect it to use a different connection.

## Create documents

There are two common ways to create one document.

Construct a document, set fields, and save it when code needs to prepare or inspect the document before persisting:

~~~javascript
const book = new Book({
  title: "A Practical Guide",
  status: "available"
});

await book.save();
~~~

Use the model create method for a concise create-and-save operation:

~~~javascript
const book = await Book.create({
  title: "A Practical Guide"
});
~~~

Create operations can cast values and run document validation before saving. If validation or persistence fails, the promise rejects. Handle errors at the service or route boundary and avoid returning database internals to a client.

For batches, insertMany may be more suitable than calling create in a loop, but its validation and middleware behavior differs from a sequence of document saves. Choose it deliberately and consult the next chapter before relying on hooks or validation behavior.

## Read documents

Use find when the result may contain zero or more documents. It returns an array, including an empty array when nothing matches:

~~~javascript
const availableBooks = await Book.find({ status: "available" })
  .select("title status")
  .sort({ title: 1 })
  .limit(20);
~~~

Use findOne when you want one matching document, or null when no document matches. Use findById for an identifier lookup; it also returns null when no matching document exists:

~~~javascript
const book = await Book.findById(bookId);

if (!book) {
  console.log("Book not found.");
} else {
  console.log(book.title);
}
~~~

A query can be built with chained methods before it executes. Awaiting a query executes it. Treat a Mongoose Query as a single-use operation: do not await the same query object twice expecting a fresh database read. Build a new query when you need to run the operation again.

Select only fields the current operation needs. This reduces unnecessary data transfer and helps avoid exposing private fields. Projection is not authorization; the API must still verify that the current user may access the record.

## Update documents

### Load, modify, and save

When a document has been loaded and the application needs document behavior, modify it and call save:

~~~javascript
const book = await Book.findById(bookId);

if (!book) {
  throw new Error("Book not found.");
}

book.status = "checked-out";
await book.save();
~~~

This approach works with a hydrated document and runs document validation and save middleware. It separates the read from the write, so another request may change the record between them. For concurrency-sensitive rules, include expected state in an atomic query filter or use an appropriate transaction.

### Update with a query

Use updateOne when you need to change matching data but do not need the updated document returned. Inspect matchedCount or modifiedCount according to the rule the application needs to enforce:

~~~javascript
const result = await Book.updateOne(
  { _id: bookId, status: "available" },
  { $set: { status: "checked-out" } },
  { runValidators: true }
);

if (result.matchedCount !== 1) {
  throw new Error("Book was not found or was no longer available.");
}
~~~

The filter expresses the expected prior state. The database checks that state and applies the update as one operation to the matched document. Query update validators are off by default, so enable them when the update should use supported schema validators. Their limits still apply; they are not identical to validating a full document with save.

Use findOneAndUpdate when you need one matching record and want the resulting document. By default, it returns the document from before the update. Set returnDocument to after to receive the post-update document:

~~~javascript
const updatedBook = await Book.findOneAndUpdate(
  { _id: bookId, status: "available" },
  { $set: { status: "checked-out" } },
  {
    returnDocument: "after",
    runValidators: true
  }
);

if (!updatedBook) {
  throw new Error("Book was not found or was no longer available.");
}
~~~

The method returns null when the filter matches no document. Do not assume that calling an update method means a record was found. Check the returned document or write result.

Use update operators such as $set and $inc for intentional partial changes. Avoid accepting an arbitrary update object from a client. Build updates from explicitly allowed fields so a caller cannot modify fields such as ownership, role, price, or status unless the API authorizes that change.

## Delete documents

Choose a narrow filter and inspect the deletion result. For example, delete by the ID of the one record the current operation is authorized to remove:

~~~javascript
const result = await Book.deleteOne({ _id: bookId });

if (result.deletedCount !== 1) {
  throw new Error("Book was not found.");
}
~~~

For a single ID, findByIdAndDelete returns the deleted document or null:

~~~javascript
const deletedBook = await Book.findByIdAndDelete(bookId);

if (!deletedBook) {
  console.log("Book was not found.");
}
~~~

deleteMany removes every document matching its filter. Avoid running it with an empty or overly broad filter in ordinary request handling. For user-facing deletion, check authorization, consider whether the operation should be soft deletion, and record any audit information the product requires.

## CRUD result and error guide

| Operation | Typical result | Application should check |
| --- | --- | --- |
| create or save | Saved document | Validation, casting, and database errors |
| find | Array of documents | Empty array is a valid no-match result |
| findOne or findById | Document or null | Handle not found explicitly |
| updateOne | A write-result object | Check matchedCount and, when relevant, modifiedCount |
| findOneAndUpdate | Updated or prior document, depending on option, or null | Set returnDocument intentionally and handle no match |
| deleteOne | A write-result object | Check deletedCount when deletion is required |
| findByIdAndDelete | Deleted document or null | Handle not found explicitly |

Common errors include cast errors for values that cannot be represented as the schema type, validation errors for schema rules, and database errors such as a duplicate-key violation. Error handling should distinguish expected input or state failures from operational failures. Avoid returning stack traces, credentials, raw filters, or database server messages to public clients.

## A small service-layer pattern

Keep database operations in a service or repository layer when that makes application code easier to test and maintain. The service should accept validated, authorized data rather than an arbitrary request body:

~~~javascript
async function checkOutBook({ bookId, memberId }) {
  const book = await Book.findOneAndUpdate(
    {
      _id: bookId,
      status: "available"
    },
    {
      $set: {
        status: "checked-out",
        checkedOutBy: memberId
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );

  if (!book) {
    return null;
  }

  return book;
}
~~~

This is an example pattern, not a complete authorization system. The caller must validate the identifier and verify that the member is allowed to check out the book. A real model would also define the checkedOutBy path and decide how returns, due dates, and concurrent requests work.

## Common mistakes

- Treating a schema as if it were a database collection.
- Assuming the model name is always the exact collection name.
- Compiling a model before finishing the schema definition.
- Forgetting that a document constructor creates an in-memory document until save is called.
- Treating find results as a single document or forgetting that findById can return null.
- Awaiting the same query object more than once.
- Assuming updateOne returns the updated document.
- Forgetting returnDocument: after when the new value is required from findOneAndUpdate.
- Ignoring matchedCount, deletedCount, or a null result.
- Passing an entire request body as an update object.
- Using a broad delete filter in request handling.
- Assuming update validators behave exactly like document save validation.
- Returning database error details directly to users.

## Practical checklist

For every Mongoose model:

- Define the paths and options the application actually needs.
- Choose the collection name deliberately when convention is not enough.
- Compile the model once on the intended connection.
- Connect before issuing database operations.
- Validate and authorize input before building a filter or update.
- Choose between a document save and a query update based on behavior and concurrency needs.
- Enable update validators intentionally and understand their scope.
- Check for no-match results and inspect write counts.
- Restrict deletes to the intended record or set of records.
- Translate expected errors at the API boundary without exposing internals.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [031 - Mongoose ODM: when and how to use it](031-mongoose-odm-when-and-how-to-use-it.md) | [Q&A](../qnas/032-mongoose-schemas-models-and-crud.md) | [Example](../examples/032-mongoose-schemas-models-and-crud.md) | [033 - Mongoose validation, hooks, and virtuals](033-mongoose-validation-hooks-and-virtuals.md) |
