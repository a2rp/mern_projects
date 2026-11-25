# 032 - Mongoose schemas, models, and CRUD — complete example

This standalone Node.js example creates a small Book model and performs a complete create, read, update, and delete flow. It demonstrates both document save and query updates, checks no-match and write-count results, and deletes only the document created by this run. This is learning material; this repository does not run the code.

## What this example demonstrates

- Defining a schema with required fields, an enum, a minimum value, and timestamps.
- Explicitly selecting a collection name.
- Compiling a model once.
- Creating a saved document.
- Reading one document and a filtered list.
- Updating through a hydrated document and save.
- Performing a conditional query update and checking matchedCount.
- Returning the updated document with findOneAndUpdate.
- Deleting one exact document and checking deletedCount.
- Using a uniquely named practice database and closing the connection.

## Prerequisites

1. Use a supported Node.js release and an ES module project. If needed, set "type": "module" in package.json.
2. Install Mongoose:

~~~powershell
npm install mongoose
~~~

3. Have access to a MongoDB deployment and set MONGODB_URI in the same PowerShell session where you run the script. Keep the URI private:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\mongoose-schemas-crud-demo.js
~~~

Each run writes one book into a database named with a unique run identifier. The script does not remove that database. After reviewing the output, remove only this generated practice database if you no longer need it.

## Complete code

Save this as mongoose-schemas-crud-demo.js:

~~~javascript
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const databaseName = "mern_mongoose_crud_demo_" + Date.now();

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 160
    },
    author: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 100
    },
    publishedYear: {
      type: Number,
      min: 1450
    },
    status: {
      type: String,
      enum: ["available", "checked-out"],
      default: "available"
    }
  },
  {
    collection: "books",
    timestamps: true
  }
);

const Book = mongoose.model("Book", bookSchema);

async function main() {
  try {
    await mongoose.connect(uri, { dbName: databaseName });
    console.log("Connected to a uniquely named practice database.");

    // CREATE: create() saves the new document.
    const createdBook = await Book.create({
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      publishedYear: 1999
    });

    console.log(
      "Created: " + createdBook.title + " [" + createdBook.status + "]"
    );

    // READ: findById() returns one document or null.
    const bookById = await Book.findById(createdBook._id)
      .select("title author status publishedYear")
      .lean();

    if (!bookById) {
      throw new Error("The created book could not be read.");
    }

    console.log("Read by ID: " + bookById.title);

    // READ: find() returns an array, including an empty array for no matches.
    const availableBooks = await Book.find({ status: "available" })
      .select("title status")
      .sort({ title: 1 })
      .limit(10)
      .lean();

    console.log("Available books returned: " + availableBooks.length);

    // UPDATE: load a hydrated document, modify it, and save it.
    const bookToCheckOut = await Book.findById(createdBook._id);

    if (!bookToCheckOut) {
      throw new Error("The book could not be loaded for the document update.");
    }

    bookToCheckOut.status = "checked-out";
    await bookToCheckOut.save();

    console.log("Saved status: " + bookToCheckOut.status);

    // UPDATE: a filter with the expected prior state makes this transition conditional.
    const returnResult = await Book.updateOne(
      { _id: createdBook._id, status: "checked-out" },
      { $set: { status: "available" } },
      { runValidators: true }
    );

    if (returnResult.matchedCount !== 1) {
      throw new Error("The book was missing or was not checked out.");
    }

    console.log(
      "Conditional update matched count: " + returnResult.matchedCount
    );

    // UPDATE: return the post-update document from findOneAndUpdate().
    const checkedOutAgain = await Book.findOneAndUpdate(
      { _id: createdBook._id, status: "available" },
      { $set: { status: "checked-out" } },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!checkedOutAgain) {
      throw new Error("The book was missing or was no longer available.");
    }

    console.log(
      "findOneAndUpdate returned status: " + checkedOutAgain.status
    );

    // DELETE: target only the document created by this run.
    const deleteResult = await Book.deleteOne({ _id: createdBook._id });

    if (deleteResult.deletedCount !== 1) {
      throw new Error("The created book was not deleted.");
    }

    console.log(
      "Deleted exactly one book: " + String(deleteResult.deletedCount === 1)
    );

    const afterDelete = await Book.findById(createdBook._id).lean();
    console.log("Found after delete: " + String(afterDelete !== null));
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected cleanly.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
~~~

## Expected output

~~~text
Connected to a uniquely named practice database.
Created: The Pragmatic Programmer [available]
Read by ID: The Pragmatic Programmer
Available books returned: 1
Saved status: checked-out
Conditional update matched count: 1
findOneAndUpdate returned status: checked-out
Deleted exactly one book: true
Found after delete: false
Disconnected cleanly.
~~~

The database name includes a generated identifier and is not printed. Connection failures, schema errors, or a failed write will stop the example with an error rather than produce the full expected output.

## How it works

1. The script reads the connection URI from the environment and fails if it is missing.
2. It connects to a uniquely named practice database. The schema explicitly maps the Book model to the books collection and enables createdAt and updatedAt timestamps.
3. The create call inserts one book. Because status is omitted, Mongoose applies the available default.
4. The findById query selects only the fields needed for the output and uses lean because the read path does not need document methods.
5. The find query returns a list of available books. It sorts the list, limits it, and prints the number of matches.
6. The next query loads a hydrated document. Changing its status and calling save persists the change through the document lifecycle.
7. The updateOne filter requires the book to still have checked-out status. The operation sets it back to available, enables supported update validators, and checks matchedCount.
8. findOneAndUpdate changes the status again and requests the post-update document with returnDocument set to after. It returns null if no document matches.
9. deleteOne uses the exact ID created at the start. The script checks deletedCount and then confirms that a subsequent read returns no document.
10. The finally block closes the Mongoose connection when the workflow succeeds or fails.

## Key takeaways

- A schema defines paths and options; a compiled model performs database operations; a document represents one record.
- Mongoose uses its collection naming convention unless the schema selects a collection explicitly.
- find returns an array, while findById and findOne can return null.
- Document save and query updates have different behavior and result shapes.
- Query updates should use narrow filters, explicit validator options when needed, and checked write results.
- findOneAndUpdate returns the old document by default; request the post-update document deliberately.
- Delete only the record the operation is authorized to remove.
- The example leaves its uniquely named practice database for separate review and cleanup.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [031 - Mongoose ODM: when and how to use it](../lessons/031-mongoose-odm-when-and-how-to-use-it.md) | [Q&A](../qnas/032-mongoose-schemas-models-and-crud.md) | [033 - Mongoose validation, hooks, and virtuals](../lessons/033-mongoose-validation-hooks-and-virtuals.md) |
