# 033 - Mongoose validation, hooks, and virtuals

Schemas can do more than describe field types. Mongoose validation checks values before persistence, middleware hooks run around selected operations, and virtuals provide computed document properties that are not stored as ordinary MongoDB fields.

These features help keep repeated application behavior consistent, but each applies to specific Mongoose operations. A save hook does not automatically cover query updates, a virtual is not a database field, and a Mongoose validator does not protect writes that bypass Mongoose. This chapter explains where each feature fits and how to use it carefully.

## Learning goals

By the end of this chapter, you should be able to:

- Use common built-in validators and define a custom validator.
- Distinguish casting errors from validation errors.
- Run document validation explicitly and interpret a validation error.
- Explain how validation fits into the save lifecycle.
- Choose document, query, model, or aggregate middleware for an operation.
- Register middleware before compiling a model.
- Explain why save hooks do not cover query updates.
- Define virtual getters and setters and control their JSON serialization.
- Keep critical integrity rules out of middleware paths that can be bypassed.

## Validation protects a specific write path

Mongoose validation checks whether values satisfy rules declared for schema paths. It is part of Mongoose's document lifecycle: Mongoose registers validation before save by default. When validation fails, a save operation rejects with a ValidationError that contains details for the paths that failed.

Validation is not the same as casting. Casting attempts to convert an input to a schema path's type. Validation checks whether the resulting value is allowed. For example, the text "12" might cast to the number 12, but 12 can still fail a validator that requires a value no greater than 10.

A failed cast is represented as a CastError, often included as a path error inside the ValidationError produced during validation. At an API boundary, translate expected input errors into a safe client response and avoid returning internal stack traces.

## Built-in validators

Common built-in validators include:

| Path type | Common validators |
| --- | --- |
| All schema types | required |
| Number | min and max |
| String | enum, match, minLength, and maxLength |
| Array | Validate each array element or define a custom array rule |

A required validator checks for an acceptable value according to the schema type. Other validators can limit a value or require it to be in an allowed set. Validators generally do not run on undefined values; required is the exception.

~~~javascript
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required."],
    trim: true,
    minLength: [2, "Product name must have at least two characters."],
    maxLength: 100
  },
  priceCents: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative."]
  },
  status: {
    type: String,
    enum: ["draft", "active", "archived"],
    default: "draft"
  }
});
~~~

A custom validator is useful for a rule that cannot be expressed with a built-in validator. Keep custom validation deterministic and focused on the current value or document. Do not treat an application-side uniqueness check as a substitute for a unique database index; concurrent requests can pass the check at the same time.

~~~javascript
const accountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator(value) {
        return value.includes("@");
      },
      message: "Email must contain an at sign."
    }
  }
});
~~~

This illustrative validator is intentionally simple; production email validation should match the application's actual requirements. Validation does not prove that an address exists or that a person owns it. Verify ownership through an appropriate confirmation flow when needed.

## Document validation and update validation differ

A document save runs document validation before saving by default:

~~~javascript
const product = new Product({
  name: "Desk lamp",
  priceCents: 0,
  status: "active"
});

await product.save();
~~~

A document can also be validated manually before saving:

~~~javascript
const error = await product.validate();

if (error) {
  console.log(error);
}
~~~

The awaited validate call rejects with a ValidationError if validation fails. For synchronous validators only, validateSync returns an error object directly or undefined when validation passes. It does not run asynchronous validators.

Query update validators are off by default. To request validation for supported update paths, enable runValidators:

~~~javascript
await Product.updateOne(
  { _id: productId },
  { $set: { status: "active" } },
  { runValidators: true }
);
~~~

Update validators have important limits:

- They generally validate only paths included in the update.
- Required validators generally fail for an update when the required path is explicitly unset, not simply because the update omits that path.
- Only supported update operators run validators. Operators such as $inc are ignored by update validators.
- In update validation, this refers to the query rather than the hydrated document.

For an invariant involving several fields, consider loading a document and calling save, using a conditional atomic update, or enforcing the invariant at the database level. Pick the write path to match the rule instead of assuming all Mongoose writes validate identically.

The Mongoose unique option is not a validator. It declares a unique index. Handle duplicate-key errors from MongoDB and create the index as part of the database plan.

## The save lifecycle

For a normal document save, the relevant sequence is:

~~~text
pre("validate")
        |
        v
validation
        |
        v
post("validate")
        |
        v
pre("save")
        |
        v
MongoDB write
        |
        v
post("save")
~~~

Mongoose's built-in validation is a pre-save hook and runs before user-defined pre-save hooks. Therefore, if a pre-save hook changes a value that should be validated, that change does not automatically trigger another validation pass. A pre-validate hook is a better place to derive values that should be included in validation.

~~~javascript
articleSchema.pre("validate", function () {
  if (this.title) {
    this.slug = this.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});
~~~

Hook functions that need document context should use a regular function so this refers to the document. Arrow functions capture this lexically and are usually unsuitable when a hook depends on Mongoose's this value.

## Middleware types and operation scope

Mongoose middleware is also called hooks. Middleware runs around selected Mongoose methods. There are four broad types:

| Middleware type | Example operations | What this refers to |
| --- | --- | --- |
| Document | validate, save, document methods | The document |
| Query | find, updateOne, findOneAndUpdate | The query |
| Model | insertMany, bulkWrite | The model |
| Aggregate | aggregate | The aggregation object |

The exact operation matters. A pre-save or post-save hook runs for document save operations and create calls that trigger save hooks. It does not automatically run for updateOne or findOneAndUpdate. Those operations have query middleware.

~~~javascript
articleSchema.pre("save", function () {
  // this is the document for save middleware
  console.log("Saving article: " + this.slug);
});

articleSchema.post("save", function (document) {
  console.log("Saved article: " + document.slug);
});

articleSchema.pre("findOneAndUpdate", function () {
  // this is the query, not the document being updated
  console.log("A findOneAndUpdate query is running.");
});
~~~

Query middleware does not necessarily load the target document. Its this value is the query, so a hook cannot assume it has direct access to the document's current fields. If the hook needs the current document, it must perform a deliberate query or use a different operation, while accounting for race conditions and extra database work.

There are also operation-specific details. For example, updateOne middleware is query middleware by default, and deleteOne has query/document distinctions. Read the behavior of the specific operation before relying on a hook.

## Register hooks before compiling the model

Add middleware and plugins to the schema before calling mongoose.model or connection.model. Compiling a model copies the schema configuration, and adding a hook afterward will generally not attach it to the already compiled model.

~~~javascript
const articleSchema = new mongoose.Schema({
  title: String
});

articleSchema.pre("save", function () {
  console.log("This hook is registered in time.");
});

const Article = mongoose.model("Article", articleSchema);
~~~

Keep model registration in a module that defines the schema, registers its hooks, and compiles the model once on the intended connection. This avoids missing hooks and reduces model re-registration problems in environments that reload modules.

## Hook errors and side effects

A pre hook can throw an error or return a rejected promise to stop the operation. Middleware can be asynchronous. Use one clear completion style; do not both return a promise and separately call a callback to finish the same hook.

A post hook runs after the hooked operation completes. A successful post-save hook means the database save has already occurred. If the post hook then fails, the document may already be persisted even though the overall promise reports an error.

Do not make an email, payment-provider call, or message-broker publish the only record of a database change inside a hook. The external system and MongoDB do not share an automatic transaction. Use a deliberate durable pattern, such as an outbox, and make external processing idempotent when delivery matters.

Hooks can hide important behavior from callers. Keep them short, name the operation they cover, and make sure every relevant write path uses that operation or has its own explicit behavior.

## Virtual properties

A virtual is a document property that can be read or set without being stored as an ordinary field in MongoDB. A getter can combine existing fields for convenient presentation:

~~~javascript
personSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.lastName;
});
~~~

A virtual setter can split one convenient input into stored paths:

~~~javascript
personSchema.virtual("fullName").set(function (value) {
  const parts = value.trim().split(/\s+/);
  this.firstName = parts.shift() || "";
  this.lastName = parts.join(" ");
});
~~~

Virtuals are not stored fields. They cannot be used in ordinary MongoDB filters or field projections as though they existed in the collection. Use the stored paths in queries.

Mongoose does not include virtuals in toJSON or toObject output by default. Include them explicitly when the API's representation needs them:

~~~javascript
const personSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
~~~

A virtual is useful for computed presentation values such as a full name or display label. Do not store a value as a virtual if it must be indexed, queried efficiently, or preserved as a historical snapshot. A virtual getter may run whenever the property is accessed, so avoid expensive queries or side effects inside it.

Lean queries return plain objects and skip normal document hydration; virtuals are therefore not available by default on lean results. If a read path needs a virtual, use a hydrated document or deliberately configure a suitable lean-virtual approach and understand its behavior.

## Choosing the right feature

| Requirement | A suitable starting point |
| --- | --- |
| Reject an invalid field value before a Mongoose document save | A schema validator |
| Enforce a rule for every writer to a collection | A database constraint or a shared required service boundary |
| Derive a value that should be validated before saving | A pre-validate hook or a virtual setter that updates stored paths |
| Run behavior specifically around document save | Save middleware |
| Run behavior for a query update | Middleware for that query operation or explicit service logic |
| Present a computed field without storing it | A virtual |
| Search, sort, or index a value | A stored schema path and database index, not a virtual |

No single hook or validator covers every operation. Choose behavior based on the operation callers actually use.

## Common mistakes

- Confusing a cast error with a failed business-rule validator.
- Assuming validators run for every direct database write.
- Assuming update validators run by default or validate the entire document.
- Assuming validateSync runs asynchronous validators.
- Treating unique as a Mongoose validator instead of a database index.
- Changing values in pre-save and assuming they will be validated again.
- Registering middleware after model compilation.
- Using an arrow function when a hook needs document or query this.
- Assuming a save hook runs for query updates.
- Assuming query middleware has the target document loaded.
- Performing non-idempotent external side effects in a retryable or post-save hook.
- Expecting a virtual to be stored, queryable, or included in JSON by default.
- Depending on virtuals in lean results without explicitly handling lean behavior.

## Practical checklist

Before adding a validator, hook, or virtual:

- State the invariant or behavior it is meant to implement.
- Decide which write operations must apply it.
- Use database-level enforcement for invariants that all writers must obey.
- Register hooks before compiling the model.
- Match hook context to the operation: document, query, model, or aggregate.
- Keep hooks short and avoid hiding authorization or critical business rules.
- Include virtuals in serialization only when the API needs them.
- Avoid virtuals for values that must be stored, indexed, or queried.
- Handle validation, cast, and database errors safely at the application boundary.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [032 - Mongoose schemas, models, and CRUD](032-mongoose-schemas-models-and-crud.md) | [Q&A](../qnas/033-mongoose-validation-hooks-and-virtuals.md) | [Example](../examples/033-mongoose-validation-hooks-and-virtuals.md) | [034 - Seed data, migrations, and database lifecycle](034-seed-data-migrations-and-database-lifecycle.md) |
