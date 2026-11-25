# 095 - Validation across the full stack: Q&A

### 1. Why validate at several layers?

**Answer:** Each layer protects a different boundary. The browser helps a person correct input, the API enforces requests from every client, services check rules involving current application state, Mongoose validates documents, and database indexes preserve invariants under concurrent writes.

### 2. Is client-side validation a security control?

**Answer:** No. It is useful feedback, but callers can modify the page or send HTTP directly. The server must independently validate every request before using it.

### 3. What is syntactic validation?

**Answer:** It checks a value's representation, such as a string's type, an identifier's format, an integer range, or whether a date can be parsed in the documented format.

### 4. What is semantic validation?

**Answer:** It checks whether a syntactically valid value makes sense in context. Examples include ensuring an end date follows a start date or verifying that a workflow transition is allowed from the current state.

### 5. Does a valid MongoDB ObjectId prove that a record exists?

**Answer:** No. It only has a valid shape. The database may not contain it, and even if it exists, the current user may not have permission to see or change it.

### 6. Are HTML required and maxLength attributes still useful?

**Answer:** Yes. They provide immediate browser feedback and can prevent common accidental submissions. The same constraints must be checked on the server because the browser can be bypassed.

### 7. What is an API schema for?

**Answer:** It describes the accepted shape and constraints of a request body, query, or parameter. Parsing against it converts unknown input into validated data or a structured list of issues.

### 8. What is the difference between parse and safeParse in Zod?

**Answer:** <code>parse</code> returns validated data or throws a validation error. <code>safeParse</code> returns a result object that indicates success or failure, so route middleware can format validation issues without using exceptions for ordinary invalid input.

### 9. Why reject unknown object keys?

**Answer:** Rejecting unexpected keys makes the request contract explicit and can catch client mistakes or attempted privilege fields early. If an API intentionally ignores unknown keys for compatibility, it must still explicitly select writable fields and never mass-assign the original object.

### 10. Should an API accept the entire request body as a Mongoose document?

**Answer:** No. The body may contain fields such as owner ID, role, status, or internal flags that the caller must not control. Validate an allowlist and copy only fields that the current operation permits.

### 11. What is mass assignment?

**Answer:** It is an unsafe pattern where application code copies arbitrary request properties into a model or database update. An attacker may set fields the UI never exposes, such as an admin role or another user's owner ID.

### 12. Where should the owner ID for a resource come from?

**Answer:** Derive it from the authenticated server context, such as the session's verified user. Do not trust an owner ID sent in a form or JSON body.

### 13. Should schema validation perform authorization?

**Answer:** No. A schema can validate that an ID is formatted correctly, but only authorization checks whether the caller may access that record or perform that action.

### 14. How should validation middleware pass data to a controller?

**Answer:** It should store the parsed and validated value on a separate property such as <code>req.validatedBody</code>. The controller should pass that value to a service instead of using the original untrusted <code>req.body</code>.

### 15. Should an API return raw Zod errors?

**Answer:** Usually not. Map issues to the stable public fields the client needs, such as path and a safe message. Avoid returning internal schema details, raw request data, stack traces, or implementation-specific error objects.

### 16. Should invalid input return 400 or 422?

**Answer:** Either can be used as part of a consistent API contract. Document the choice and use it consistently: 400 commonly describes a malformed or invalid request, while 422 is also used for syntactically valid content that fails semantic validation.

### 17. Why should request body size be limited before schema validation?

**Answer:** The parser must receive and parse bytes before the schema can inspect fields. A body size limit prevents excessively large requests from consuming unnecessary memory and CPU before validation begins.

### 18. What is the risk of coercing a query value to a number?

**Answer:** JavaScript conversions can surprise you. For example, an empty string may coerce to zero. Normalize or reject empty values deliberately, then enforce integer and range constraints.

### 19. How should pagination values be validated?

**Answer:** Require integer page and limit values, enforce a minimum, and set a sensible maximum. This prevents malformed queries and limits how much work or data a caller can request at once.

### 20. Should arbitrary nested objects and arrays be accepted?

**Answer:** No. Define their expected shape and limit their size and nesting. Unbounded arrays and deeply nested values can use excessive CPU, memory, database work, or storage.

### 21. Where should cross-field validation live?

**Answer:** Shape-level relationships can live in a request schema, such as requiring at least one update field. Rules that depend on existing records or current workflow state belong in a service where the application can inspect that state.

### 22. Why does a valid enum value not guarantee a valid workflow operation?

**Answer:** The requested value may be one of the allowed states but still be an invalid transition from the record's current state. Load the current record, check the permitted transition, and only then save.

### 23. What does Mongoose validation protect?

**Answer:** It checks document values according to the schema before save and provides a persistence-layer safeguard for types and configured constraints. It does not replace API validation or authorization, and its behavior differs for some update operations.

### 24. Are Mongoose update validators enabled automatically?

**Answer:** They are not enabled by default for common query update methods. Set <code>runValidators: true</code> when using an update operation and account for the documented caveats. Saving a loaded document runs validation differently.

### 25. What does a unique Mongoose field option guarantee?

**Answer:** It requests a MongoDB unique index; it is not itself a normal validator that eliminates concurrent duplicates. The database index is authoritative, and the service should catch duplicate-key errors and map them to a safe conflict response.

### 26. Why is checking for an existing email before insert insufficient?

**Answer:** Two requests can both pass the existence check before either inserts. The unique index resolves the race. Use a pre-check for helpful feedback if useful, but always handle the database's duplicate-key result.

### 27. How should a validation error be shown in React?

**Answer:** Associate the field message with its control, set <code>aria-invalid</code> when it has an error, and reference the message with <code>aria-describedby</code>. Keep a form-level status or summary for general failures.

### 28. Should the form clear all values after a server validation error?

**Answer:** Usually no. Preserve what the person entered so they can correct the invalid field. Clear or update the relevant field message when the input changes.

### 29. Is trimming always safe?

**Answer:** No. It is appropriate for some fields such as a title's surrounding whitespace, but other values may have meaningful spaces. Choose normalization according to the field's meaning and apply it consistently before validation and persistence.

### 30. Does stripping suspicious characters prevent XSS?

**Answer:** No. Removing characters can corrupt valid data and is not reliable XSS protection. Store valid content according to the product's rules, use safe query APIs, and encode output for the HTML, attribute, URL, or script context where it is displayed.

### 31. What is Unicode normalization and when might it matter?

**Answer:** Visually identical text can have different Unicode code-point sequences. If a feature compares identifiers or enforces uniqueness, define a normalization and case policy and apply it consistently. Do not normalize arbitrary content without understanding its meaning.

### 32. Should email validation use an extremely restrictive custom regex?

**Answer:** Usually not. Email address syntax is more complex than many simplistic patterns. Define the product's normalization and confirmation policy, use a well-maintained validator if needed, and verify control of the address through the intended workflow.

### 33. What should happen to an unexpected update field such as role?

**Answer:** The route should reject it or ignore it according to an explicit API policy, and it must never write it unless the caller has a separate authorized operation to change roles. The normal profile or course update should allowlist writable fields.

### 34. How should invalid identifiers be handled?

**Answer:** Validate the expected identifier format before querying and return the documented client error or not-found response. Do not expose a raw Mongoose cast exception. A valid-shaped ID still requires existence and authorization checks.

### 35. Should a stored document be trusted because it came from MongoDB?

**Answer:** Not automatically. Data may have been written by older code, a migration, a background job, or another service. Validate relevant invariants at the point a component consumes data, especially when it crosses a trust boundary.

### 36. Does validation replace parameterized query construction?

**Answer:** No. Validation checks input requirements; query safety controls how values are interpreted by the database. Do not turn arbitrary user objects into MongoDB filters or operators. Construct the query from validated values and known operators.

### 37. What should be logged for invalid requests?

**Answer:** Log a safe category, request ID, route, and perhaps the failing field paths. Avoid recording secrets, full request bodies, credentials, or unsanitized attacker-controlled strings that could inject log lines.

### 38. How should file uploads be validated?

**Answer:** Apply upload-specific controls: enforce size and count limits, inspect file bytes rather than trusting a supplied extension or MIME type, generate private storage keys, and authorize access. A general JSON schema is not enough to validate file contents.

### 39. Which boundary cases are useful in validation tests?

**Answer:** Test missing values, wrong types, empty and whitespace-only strings, limits just below and above the boundary, unexpected fields, malformed identifiers, oversized arrays, invalid combinations, authorization failures, and database constraint conflicts.

### 40. What is a complete validation flow?

**Answer:** The browser gives quick feedback; the API parses and validates untrusted input; the service checks business rules, current state, and permission; the model enforces document constraints; MongoDB indexes protect durable invariants. Errors are mapped to a stable, safe API contract and accessible UI feedback.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [094 - Unit, integration, and end-to-end testing](../lessons/094-unit-integration-and-end-to-end-testing.md) | [Lesson](../lessons/095-validation-across-the-full-stack.md) | [Q&A](095-validation-across-the-full-stack.md) | [Example](../examples/095-validation-across-the-full-stack.md) | [096 - Profile MongoDB queries and improve indexes](../lessons/096-profile-mongodb-queries-and-improve-indexes.md) |
