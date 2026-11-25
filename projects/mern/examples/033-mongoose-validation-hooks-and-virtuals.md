# 033 - Mongoose validation, hooks, and virtuals — complete example

This standalone Node.js example uses an Article model to demonstrate document validation, middleware ordering, a query hook, a computed virtual, and JSON serialization. It also attempts an invalid save to show that validation stops the save before the save hooks run. This is learning material; this repository does not run the code.

## What this example demonstrates

- A pre-validate hook deriving a slug before schema validation.
- Built-in required and minimum-length validators.
- Pre-save and post-save document middleware.
- A pre-findOneAndUpdate query hook with query context.
- A virtual reading-time value that is not stored as a MongoDB field.
- Including virtuals in document JSON output.
- Handling a Mongoose ValidationError without exposing internal details.
- Isolating data in a uniquely named practice database.

## Prerequisites

1. Use a supported Node.js release and an ES module project. If needed, set "type": "module" in package.json.
2. Install Mongoose:

~~~powershell
npm install mongoose
~~~

3. Have access to a MongoDB deployment and set MONGODB_URI in the same PowerShell session where you run the script. Keep the URI private:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\mongoose-validation-hooks-virtuals-demo.js
~~~

Each run uses a database with a unique run identifier and saves one valid article. The script does not delete that database. After reviewing the output, remove only this generated practice database if you no longer need it.

## Complete code

Save this as mongoose-validation-hooks-virtuals-demo.js:

~~~javascript
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const databaseName =
  "mern_mongoose_validation_hooks_demo_" + Date.now();

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 120
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    body: {
      type: String,
      required: true,
      minLength: 20
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  {
    collection: "articles",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Derive the stored slug before Mongoose runs path validation.
articleSchema.pre("validate", function () {
  if (this.title) {
    this.slug = this.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

// This hook runs for document save operations, after validation.
articleSchema.pre("save", function () {
  console.log("Pre-save hook: " + this.slug);
});

articleSchema.post("save", function (document) {
  console.log("Post-save hook: " + document.slug);
});

// Query middleware is separate from document save middleware.
articleSchema.pre("findOneAndUpdate", function () {
  console.log("Query hook: findOneAndUpdate");
});

articleSchema.virtual("readingTimeMinutes").get(function () {
  const words = this.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
});

const Article = mongoose.model("Article", articleSchema);

async function main() {
  try {
    await mongoose.connect(uri, { dbName: databaseName });

    const article = new Article({
      title: "Mongoose hook lifecycle",
      body:
        "Middleware can prepare a derived slug before validation. " +
        "A virtual can calculate a reading-time estimate without " +
        "storing it as a MongoDB field."
    });

    await article.save();

    console.log("Saved article: " + article.title);
    console.log(
      "Reading-time virtual: " + article.readingTimeMinutes + " minute"
    );

    const jsonArticle = article.toJSON();

    console.log(
      "Virtual included in JSON: " +
        String("readingTimeMinutes" in jsonArticle)
    );

    const invalidArticle = new Article({
      title: "Hi",
      body: "Too short"
    });

    try {
      await invalidArticle.save();
      throw new Error("The invalid article unexpectedly passed validation.");
    } catch (error) {
      if (!(error instanceof mongoose.Error.ValidationError)) {
        throw error;
      }

      console.log("Invalid article rejected before save.");
    }

    const publishedArticle = await Article.findOneAndUpdate(
      { _id: article._id, status: "draft" },
      { $set: { status: "published" } },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!publishedArticle) {
      throw new Error("The article was missing or was no longer a draft.");
    }

    console.log(
      "Query update returned status: " + publishedArticle.status
    );
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected cleanly.");
  }
}

main().catch((error) => {
  console.error("Example failed: " + error.message);
  process.exitCode = 1;
});
~~~

## Expected output

~~~text
Pre-save hook: mongoose-hook-lifecycle
Post-save hook: mongoose-hook-lifecycle
Saved article: Mongoose hook lifecycle
Reading-time virtual: 1 minute
Virtual included in JSON: true
Invalid article rejected before save.
Query hook: findOneAndUpdate
Query update returned status: published
Disconnected cleanly.
~~~

The database name contains a generated identifier and is not printed. If the connection fails or the database rejects an operation, the script reports an error rather than producing the complete expected output.

## How it works

1. The script reads the MongoDB URI from the environment and uses a uniquely named practice database for this run.
2. The schema explicitly targets the articles collection and enables timestamps and virtuals in JSON and plain-object conversion.
3. The pre-validate hook creates a lowercase slug from the title before Mongoose validates the document. The generated slug is a stored schema path.
4. The first article has a valid title and body, so validation succeeds. The pre-save hook runs, the database write completes, and then the post-save hook runs.
5. The readingTimeMinutes virtual calculates a value from the body when accessed. It is not persisted as a MongoDB field.
6. The schema's toJSON option includes the virtual when the document is converted to JSON.
7. The invalid article violates the title and body length rules. Its save rejects with a ValidationError before pre-save and post-save hooks run.
8. The findOneAndUpdate operation has its own query middleware. The save hooks do not run for this query update.
9. The query filter requires the article to still be a draft. The operation enables update validators, requests the post-update document, and checks for a no-match result.
10. The finally block disconnects Mongoose after success or failure.

## Important notes

- The pre-validate hook derives the slug before validation. A transformation performed in pre-save would happen after the default validation pass.
- Save middleware applies to document save operations. It is not a universal hook for query updates or direct driver writes.
- The query hook's this value is the query object, not the document being updated.
- The virtual is available on a hydrated document, but it is not a stored or queryable MongoDB field.
- The example uses console output to make hook order visible. Production hooks should avoid hidden business logic and non-idempotent external side effects.
- The unique practice database is left in place for review; remove that generated database separately when finished.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [032 - Mongoose schemas, models, and CRUD](../lessons/032-mongoose-schemas-models-and-crud.md) | [Q&A](../qnas/033-mongoose-validation-hooks-and-virtuals.md) | [034 - Seed data, migrations, and database lifecycle](../lessons/034-seed-data-migrations-and-database-lifecycle.md) |
