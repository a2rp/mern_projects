# 031 - Mongoose ODM: when and how to use it — complete example

This standalone Node.js example shows where Mongoose adds behavior to a MongoDB application: schema casting and validation, hydrated documents, query update validators, lean reads, and aggregation results. The example is documentation for learners; this repository does not run the code.

## What this example demonstrates

- Connecting Mongoose to MongoDB with a uniquely named practice database.
- Declaring a schema and explicitly choosing its collection name.
- Creating a document with a default value and a trimmed string.
- Handling a Mongoose validation error before an invalid document is inserted.
- Enabling validators for a query update.
- Updating and saving a hydrated document.
- Returning a plain object with a lean query.
- Reading a plain-object aggregation result.
- Closing the Mongoose connection.

## Prerequisites

1. Use a supported Node.js release and an ES module project. If needed, set "type": "module" in package.json.
2. Install Mongoose:

~~~powershell
npm install mongoose
~~~

3. Have access to a MongoDB deployment and set MONGODB_URI in the same PowerShell session where you run the script. Keep the URI private:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\mongoose-odm-task-demo.js
~~~

Each run selects a practice database named with a unique run identifier and writes one valid task document to it. The script does not delete the database. After reviewing the output, remove only this generated practice database if you no longer need it.

## Complete code

Save this as mongoose-odm-task-demo.js:

~~~javascript
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const runId = Date.now();
const databaseName = "mern_mongoose_odm_demo_" + runId;

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 80
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo"
    },
    dueAt: {
      type: Date,
      required: true
    }
  },
  {
    collection: "tasks",
    timestamps: true
  }
);

const Task = mongoose.model("Task", taskSchema);

async function main() {
  try {
    await mongoose.connect(uri, { dbName: databaseName });
    console.log("Connected to a uniquely named practice database.");

    const createdTask = await Task.create({
      title: "  Prepare API review  ",
      dueAt: "2026-12-01"
    });

    console.log(
      "Created task: " + createdTask.title + " [" + createdTask.status + "]"
    );

    const invalidTask = new Task({
      title: "  ",
      status: "blocked",
      dueAt: "not-a-date"
    });

    try {
      await invalidTask.save();
      throw new Error("The invalid task unexpectedly passed validation.");
    } catch (error) {
      if (!(error instanceof mongoose.Error.ValidationError)) {
        throw error;
      }

      console.log("Invalid document rejected before insert.");
    }

    try {
      await Task.updateOne(
        { _id: createdTask._id },
        { $set: { status: "blocked" } },
        { runValidators: true }
      );

      throw new Error("The invalid status unexpectedly passed validation.");
    } catch (error) {
      if (!(error instanceof mongoose.Error.ValidationError)) {
        throw error;
      }

      console.log("Invalid status rejected by update validators.");
    }

    const hydratedTask = await Task.findById(createdTask._id);

    if (!hydratedTask) {
      throw new Error("The task could not be found after creation.");
    }

    hydratedTask.status = "in-progress";
    await hydratedTask.save();

    console.log(
      "Saved status with a hydrated document: " + hydratedTask.status
    );

    const leanTask = await Task.findById(createdTask._id).lean();

    if (!leanTask) {
      throw new Error("The task could not be found by the lean query.");
    }

    console.log(
      "Lean query returns plain object: " +
        String(!(leanTask instanceof mongoose.Document))
    );

    const statusSummary = await Task.aggregate([
      { $match: { status: "in-progress" } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const inProgressGroup = statusSummary.find(
      (group) => group._id === "in-progress"
    );

    console.log(
      "Aggregation count for in-progress tasks: " +
        String(inProgressGroup?.count ?? 0)
    );
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
Created task: Prepare API review [todo]
Invalid document rejected before insert.
Invalid status rejected by update validators.
Saved status with a hydrated document: in-progress
Lean query returns plain object: true
Aggregation count for in-progress tasks: 1
Disconnected cleanly.
~~~

The database name contains a generated run identifier, so the exact name is not printed. A MongoDB connection failure or a different validation failure will stop the script with an error instead of producing the complete expected output.

## How it works

1. The script reads the MongoDB URI from the environment and fails early if it is missing. Credentials are not written in the source file.
2. The connection uses an explicit, uniquely named practice database for this run. The schema also explicitly names its collection as tasks, so the model's collection target is clear.
3. The schema declares a required title, trims it, sets length limits, restricts status to an enum, supplies a default status, and requires a date.
4. The first document omits status, so Mongoose applies the todo default. The title is trimmed before it is saved.
5. The invalid document has a blank trimmed title, an unsupported status, and a date that cannot be cast. Mongoose reports a validation error, and the document is not inserted.
6. The update operation sets an unsupported status and explicitly enables runValidators. The enum validator rejects that update. Query update validators are off by default, which is why the option is included.
7. The next query returns a hydrated document. Changing its status and calling save persists the change using document behavior.
8. The lean query returns a plain object. It has the document data but not the Mongoose document methods or change tracking.
9. The aggregation groups matching tasks and returns plain objects. It is used here for a simple count; aggregation stages need correctly typed BSON values when matching fields such as ObjectId.
10. The finally block disconnects Mongoose after either success or failure.

## Key takeaways

- Mongoose is optional and uses the MongoDB Node.js driver underneath.
- Schema validation applies only to writes that use the relevant Mongoose operation.
- Query updates need explicit update-validator configuration when that behavior is required.
- A hydrated document and a lean object have different capabilities.
- Aggregation results are plain objects, not model documents.
- A unique practice database keeps the example isolated; review and remove that generated database separately when finished.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [030 - Transactions and atomic operations](../lessons/030-transactions-and-atomic-operations.md) | [Q&A](../qnas/031-mongoose-odm-when-and-how-to-use-it.md) | [032 - Mongoose schemas, models, and CRUD](../lessons/032-mongoose-schemas-models-and-crud.md) |
