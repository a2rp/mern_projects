# 046 - Validate and sanitize client input

Every value that comes from a request is untrusted, including path parameters, query parameters, JSON bodies, headers, and cookies. A value being valid JSON or coming from your own frontend does not prove that it has the type, shape, range, or meaning your server expects.

Validate data on the server before business logic or database operations. Normalize only where the field's meaning allows it, and pass an explicit allowlist of accepted fields into the application.

## Learning goals

By the end of this chapter, you should be able to:

- Identify the request locations from which input can arrive.
- Validate a value's shape, type, format, range, and business meaning.
- Prefer field-specific allowlists over broad denylist filters.
- Distinguish validation, normalization, sanitization, and output encoding.
- Reject unknown object properties or safely ignore them.
- Use express-validator to validate, normalize, report errors, and extract matched data.
- Avoid mass assignment and unsafe MongoDB query construction.
- Bound request size and avoid expensive input processing.
- Return useful validation errors without echoing secrets or unsafe input.

## Treat every request value as untrusted

Express exposes values in several places:

| Request location | Example |
| --- | --- |
| Route parameters | req.params.productId |
| Query string | req.query.page |
| Parsed request body | req.body.name |
| Headers | req.get("content-type") |
| Cookies | req.cookies.session |

The browser may validate a form to improve user experience, but a caller can bypass the browser and send a request directly. Server-side validation is required even if the frontend has the same checks.

A value from an internal service or queue can also be malformed. Validate data when it crosses a trust boundary, not only when it arrives from a browser.

## Validate before using input

A request pipeline should parse, validate, and then operate on accepted data:

~~~text
request bytes
  -> parser with size limits
  -> field validation and permitted normalization
  -> business rules and authorization
  -> database or other side effect
  -> response with context-appropriate encoding
~~~

Parsing answers whether bytes can be interpreted as JSON or another format. Validation answers whether the parsed value is allowed for this operation. Neither step proves that the user is authorized to access a particular record.

Reject invalid input before querying or mutating the database. Do not partially accept a request when required fields are invalid.

## Define rules for each field

A useful validation contract describes:

- Whether the field is required, optional, nullable, or allowed to be absent.
- The expected type and structure.
- Length limits for strings and arrays.
- Minimum and maximum numeric values.
- Accepted formats and enumerated choices.
- Whether unknown properties are accepted.
- Any relationship between fields, such as a start date preceding an end date.
- Which transformation, if any, should happen before the value is used.

Validate syntax and meaning. An integer from 1 through 100 may be structurally valid, while a quantity of 0 may be invalid for a particular order operation.

A query parameter such as page arrives as text. Convert it only after checking that the complete value is a permitted integer. Avoid permissive conversions that accept only the leading part of a string, such as converting "12items" to 12.

## Prefer allowlists

An allowlist states what the application accepts: a known set of categories, permitted object properties, a numeric range, or a maximum length.

Avoid denylist rules that try to remove every dangerous character. Removing punctuation can corrupt legitimate names and comments, while leaving other injection paths open. Special characters are valid in many fields; safety comes from validating the field's contract and using safe APIs for its later context.

For a fixed choice, check exact membership:

~~~js
const allowedCategories = ["books", "office", "tools"];

if (!allowedCategories.includes(input.category)) {
  // Reject the request with a validation error.
}
~~~

For a free-form comment, a length limit and a clear type contract are usually more appropriate than allowing only letters and digits.

## Validation, normalization, sanitization, and encoding

These terms describe different operations:

| Operation | Purpose | Example |
| --- | --- | --- |
| Validation | Accept or reject a value against its field contract | Ensure quantity is an integer from 1 to 50. |
| Normalization | Convert equivalent representations to a chosen form | Trim accidental outer whitespace from a display name. |
| Sanitization | Apply a purpose-specific transformation to data | Remove disallowed markup with a maintained HTML sanitizer when accepting rich HTML. |
| Output encoding | Make data safe for the context where it is rendered | HTML-escape text when inserting it into an HTML text node. |

Do not use a generic "sanitize everything" function. A transformation may change a password, a person's name, or the meaning of a comment. Trimming a password or removing punctuation from it can make authentication behave incorrectly.

HTML escaping is not database validation. Sanitizing HTML is not a replacement for safe database queries. Output encoding must match the destination context, such as HTML text, an HTML attribute, JavaScript, or a URL.

If your application accepts user-authored rich HTML, use a maintained HTML sanitizer configured for the allowed tags and attributes. Regular expressions and input validation do not safely replace an HTML sanitizer.

## Validate request structure with express-validator

The express-validator package provides request-location selectors, validators, sanitizers, validation results, and matched data. Install it with Express 5:

~~~powershell
npm install express@5 express-validator@7
~~~

For a product create route, define the accepted fields explicitly:

~~~js
const {
  body,
  checkExact,
  matchedData,
  validationResult
} = require("express-validator");

const productRules = [
  body("name")
    .isString().withMessage("Name must be text.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must contain 2 to 80 characters."),

  body("quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be a whole number from 1 to 50.")
    .bail()
    .toInt(),

  body("category")
    .isIn(["books", "office", "tools"])
    .withMessage("Choose a supported category."),

  body("tags")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Tags must be an array with at most 5 items."),

  body("tags.*")
    .isString()
    .withMessage("Each tag must be text.")
    .bail()
    .trim()
    .isLength({ min: 1, max: 24 })
    .withMessage("Each tag must contain 1 to 24 characters."),

  checkExact([], {
    locations: ["body"],
    message: "The request contains fields this operation does not accept."
  })
];
~~~

Important details:

- The name must be a string before the chain trims it.
- The quantity is checked as a complete integer in its allowed range before conversion to a JavaScript number.
- The category must match an explicit allowed choice.
- Tags are optional, but if present they must have the right structure, item types, and length.
- checkExact() rejects additional body, query, or parameter fields by default unless its locations are narrowed. In this example it checks only the body.
- checkExact() must follow the validation chains so it knows which fields are allowed.

## Return validation errors safely

After the validation middleware, inspect validationResult(req). If it contains errors, return a 400 response and stop before performing database work.

~~~js
const result = validationResult(req);

if (!result.isEmpty()) {
  const fields = result.array({ onlyFirstError: true }).flatMap((error) => {
    if (error.type === "field") {
      return [{
        field: error.path,
        message: error.msg
      }];
    }

    if (error.type === "unknown_fields") {
      return [{
        message: "The request contains fields this operation does not accept."
      }];
    }

    return [{
      message: "The request contains invalid fields."
    }];
  });

  return res.status(400).json({
    error: {
      code: "VALIDATION_FAILED",
      message: "Check the request fields and try again.",
      fields
    }
  });
}
~~~

Do not include the submitted value in the error response. A rejected value might be a password, token, or other private data. Keep client messages short and actionable; log only the metadata needed for diagnosis.

## Use only validated fields

After validation succeeds, use matchedData(req) to extract the fields covered by validation and sanitization:

~~~js
const input = matchedData(req, { locations: ["body"] });

const product = {
  name: input.name,
  quantity: input.quantity,
  category: input.category,
  tags: input.tags ?? []
};
~~~

Do not pass req.body wholesale into a database create or update operation. An attacker could include fields such as role, ownerId, price, or moderation status that this endpoint was never intended to accept. Build the persistence object from the fields this operation deliberately supports.

This is also important with MongoDB. Do not spread client objects directly into a filter or update document. Construct filters and updates from validated primitive values, and use Mongoose schemas and validation as an additional persistence boundary. Request validation and database validation complement each other; neither replaces authorization.

## Optional, nullable, and partial updates

Decide what absent values mean for every operation:

- Create routes commonly require all fields needed to create the resource.
- Patch routes usually validate only fields that were supplied.
- An absent field is not automatically the same as null, false, 0, or an empty string.
- A field supplied as null should be accepted only if the API explicitly permits null.
- Never replace missing values with defaults that silently change the user's intent.

For partial updates, whitelist updateable fields and apply only those present in the validated data. Reject an empty update if the operation requires at least one change.

## Validate parameters and query values

Request body validation is only one part of the contract. Validate route parameters and query values before using them:

~~~js
const { param, query } = require("express-validator");

const productIdRule = param("productId")
  .isMongoId()
  .withMessage("Product ID is not valid.");

const pageRule = query("page")
  .optional()
  .isInt({ min: 1, max: 1000 })
  .withMessage("Page must be a whole number from 1 to 1000.")
  .bail()
  .toInt();
~~~

A syntactically valid MongoDB identifier is not proof that the record exists or that the caller may read it. Perform existence checks and authorization as separate steps.

## Bound parsing and validation work

Validation happens after the request parser has read and parsed its input. Therefore, field rules alone cannot prevent oversized payloads from consuming parser memory or time. Configure a deliberate body-size limit and, for nested encodings, reasonable depth or parameter limits.

~~~js
app.use(express.json({
  limit: "16kb",
  inflate: false
}));
~~~

This example rejects compressed request bodies because the API does not need them. If an API accepts compressed bodies, keep its body parser dependency patched and make that choice deliberately. Apply limits before performing expensive regular-expression, database, or remote-service checks.

Also limit array lengths and nested structures. Bound input before regex checks; avoid patterns with excessive backtracking. Keep expensive uniqueness checks after cheap type and format checks, and stop a validation chain early when an earlier rule has already failed.

## Special input cases

### Passwords and secrets

Validate password length and policy, but do not trim, lowercase, HTML-escape, or otherwise normalize a password unless the authentication design explicitly defines that behavior. Never include passwords or tokens in validation errors or logs.

### Email addresses

Use a maintained email validator for syntax, then apply the application's account rules. Email normalization can be provider-specific; do not change local-part characters or provider aliases without a deliberate identity policy.

### URLs and redirects

A syntactically valid URL can still point to an unsafe destination. If a route redirects to a client-supplied URL, allow only destinations explicitly supported by the application. Do not treat URL syntax validation as destination authorization.

### Rich text

If accepting HTML content, use a maintained sanitizer with an explicit tag and attribute policy. Store and render according to the product's chosen policy, and encode content for the output context.

### MongoDB filters and updates

Validate the expected primitive type and build the query yourself. Never allow a client to submit Mongo operators or an arbitrary filter object directly as the query. Use validated values as values in a server-authored query.

## Validation does not replace other controls

Validation answers: "Does this value meet this operation's input contract?" It does not answer:

- Is this caller authenticated?
- Is this caller allowed to access this user's record?
- Is this operation rate-limited?
- Is this value safe to render in a particular output context?
- Is this database query constructed safely?

Keep authentication, authorization, rate limiting, safe query construction, and output encoding as separate controls.

## Practical checklist

For every request field, ask:

- Which request location contains it?
- Is it required, optional, or nullable?
- What exact type, shape, format, range, and maximum length are accepted?
- Are unknown object properties rejected or ignored safely?
- Is normalization appropriate for this field's meaning?
- Do I use only validated fields after the checks pass?
- Could this value become a Mongo filter, update, redirect, shell command, or HTML output?
- Are request size, array size, nesting, and regex work bounded?
- Do error responses avoid echoing private input?
- Are existence checks and authorization performed separately?

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [045 - Centralized API errors and not-found handling](045-centralized-api-errors-and-not-found-handling.md) | [Q&A](../qnas/046-validate-and-sanitize-client-input.md) | [Example](../examples/046-validate-and-sanitize-client-input.md) | [047 - REST status codes and consistent response shapes](047-rest-status-codes-and-consistent-response-shapes.md) |
