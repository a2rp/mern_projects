# 046 - Validate and sanitize client input: Q&A

These questions review trust boundaries, field contracts, validation and normalization, validated-data extraction, MongoDB safety, and request limits.

## Multiple choice

### 1. Which request data should an Express application consider untrusted?

- A. Only values from a form in the browser.
- B. Only values in JSON bodies.
- C. All client-controlled values, including parameters, query values, bodies, headers, and cookies.
- D. Only values that contain punctuation.

**Answer: C.** A caller can construct requests directly, so every client-controlled location needs an intentional contract.

### 2. Why is server-side validation required when the frontend already validates a form?

- A. Browser checks can be bypassed by clients sending requests directly.
- B. Express requires every field to be validated twice.
- C. Frontend validation changes the HTTP method.
- D. The server cannot receive values from a browser.

**Answer: A.** Client-side checks improve feedback but do not enforce the server's trust boundary.

### 3. What is an allowlist validation rule?

- A. Remove characters that look suspicious.
- B. Define the values, formats, ranges, and properties the operation accepts.
- C. Accept every value unless it contains a quote.
- D. Convert all fields to lowercase.

**Answer: B.** An allowlist states what is permitted for the field's contract.

### 4. What is the main difference between validation and normalization?

- A. Validation checks whether a value is allowed; normalization converts an accepted value into a chosen representation.
- B. Validation is for the browser; normalization is for the server.
- C. Validation always removes characters; normalization always encodes HTML.
- D. They are identical operations.

**Answer: A.** A value can be valid without needing transformation, and a transformation does not prove that the input was valid.

### 5. Does trimming a string make it safe to insert into HTML?

- A. Yes, trimming always prevents XSS.
- B. Yes, if the string passed an email check.
- C. No; output encoding must match the output context.
- D. No; all text must be removed.

**Answer: C.** Normalization is not context-aware output encoding.

### 6. What type does a query parameter such as page usually arrive as?

- A. A trusted integer.
- B. A string or parsed query value that still requires validation.
- C. A MongoDB ObjectId.
- D. An authenticated user.

**Answer: B.** Parse and validate the complete value before using it as a number.

### 7. Why can parseInt("12items", 10) be a poor input check?

- A. It always returns NaN.
- B. It may accept the numeric prefix and ignore trailing invalid characters.
- C. It converts the value to an array.
- D. It validates business rules automatically.

**Answer: B.** Validate the whole input against the intended integer rule before converting it.

### 8. What does bail() do in an express-validator chain?

- A. It stops later validators in that chain after an earlier validation fails.
- B. It sends an HTTP response immediately.
- C. It removes all request fields.
- D. It runs the route handler twice.

**Answer: A.** It can avoid running later or expensive checks after a value has already failed an earlier rule.

### 9. What is matchedData(req) useful for?

- A. Copying every submitted property into a database document.
- B. Extracting data covered by validation and sanitization chains.
- C. Encoding all values for HTML.
- D. Checking authorization.

**Answer: B.** Use the extracted allowlisted data after validation succeeds.

### 10. What does checkExact() help detect?

- A. Whether a database record exists.
- B. Whether a request contains fields without validation chains in the checked locations.
- C. Whether the caller is authenticated.
- D. Whether an HTML string is safe to render.

**Answer: B.** It can reject unexpected fields when placed after the request's validation chains.

### 11. If tags is optional but must be an array of at most five strings, what should the rules do?

- A. Ignore its type and trust the browser.
- B. Check the array shape and size, then validate each item.
- C. Convert any object into a string.
- D. Remove all items after the route writes to MongoDB.

**Answer: B.** Validate both the container and each element before using the data.

### 12. Why should a route avoid passing req.body directly into a Mongoose update?

- A. Mongoose accepts only strings.
- B. The client may include fields this operation was never meant to update.
- C. req.body is always empty.
- D. Mongoose disables schema validation for updates.

**Answer: B.** Build the update from an explicit allowlist of validated, permitted fields.

### 13. Does a valid product ID prove that a caller may access that product?

- A. Yes, valid syntax implies ownership.
- B. Yes, MongoDB IDs include authorization.
- C. No; existence and authorization are separate checks.
- D. No; IDs should never be validated.

**Answer: C.** Validate the identifier, check whether the resource exists, and independently enforce authorization.

### 14. What should an application use if it accepts user-authored rich HTML?

- A. A regular expression that removes angle brackets.
- B. A maintained HTML sanitizer configured with an explicit tag and attribute policy.
- C. A database schema only.
- D. String trimming.

**Answer: B.** Rich HTML needs a purpose-built sanitizer; ordinary validation and regexes are not a substitute.

### 15. Why should a password generally not be trimmed or lowercased automatically?

- A. It may change the secret and make the authentication policy inconsistent.
- B. Passwords cannot contain spaces.
- C. Express rejects lowercase passwords.
- D. It would disable JSON parsing.

**Answer: A.** Secret transformations must be deliberate and consistent with the authentication design.

### 16. Why configure a request-body size limit?

- A. To prevent any JSON object from being parsed.
- B. To bound parser memory and processing before field validation runs.
- C. To replace validation rules.
- D. To ensure every request returns 413.

**Answer: B.** Schema checks happen after parsing, so they cannot constrain an oversized body already being read.

### 17. What is the difference between parsing and validating JSON?

- A. Parsing interprets the representation; validation checks whether the parsed values meet the operation's rules.
- B. Parsing confirms authorization; validation encrypts the body.
- C. Parsing and validation are the same.
- D. Validation is only for HTML forms.

**Answer: A.** Valid JSON can still have missing, extra, incorrectly typed, or out-of-range fields.

### 18. How should an API respond to a malformed JSON body from its parser?

- A. Treat it as a successful empty object.
- B. Return a safe client error such as 400 without echoing the raw body.
- C. Return a stack trace with status 500.
- D. Skip parsing and continue to the database.

**Answer: B.** Parser failures are invalid requests; do not expose the submitted body or parser internals.

### 19. Why should validation error responses avoid returning the rejected value?

- A. The value might contain a password, token, or other private input.
- B. JSON cannot represent input values.
- C. Clients cannot display values.
- D. It prevents the validator from working.

**Answer: A.** Return a field identifier and safe message where appropriate, not the submitted secret.

### 20. A user-supplied URL passes a URL syntax validator. Is it automatically safe to redirect to?

- A. Yes, syntactically valid URLs are always trusted.
- B. No; the application must also restrict destinations it is willing to redirect to.
- C. Yes, if it uses HTTPS.
- D. No; URLs can never be accepted.

**Answer: B.** Syntax validation does not prevent an open redirect to an attacker-controlled destination.

## Short-answer questions

### 21. Name four common locations where Express exposes client-controlled input.

**Answer:** Route parameters, query parameters, parsed request bodies, headers, and cookies are common locations. Each should be validated where the application uses it.

### 22. What should a field contract specify?

**Answer:** Whether the field is required or optional, its type and shape, allowed format or values, range and size limits, permitted normalization, and whether unknown fields are accepted.

### 23. Why is validation not the same as authorization?

**Answer:** Validation checks whether input meets the operation's format and range rules. Authorization checks whether this caller may perform the operation on the requested resource.

### 24. Why should applications prefer allowlists to denylist filtering?

**Answer:** Allowlists define permitted input. Denylists try to anticipate every harmful representation, can reject legitimate punctuation, and do not replace safe APIs or output encoding.

### 25. Explain why matchedData(req) is useful before persistence.

**Answer:** It extracts fields that validation chains covered, helping the route build a document from accepted fields instead of trusting every property in req.body.

### 26. What is mass assignment?

**Answer:** It occurs when an application copies client-controlled object properties directly into a model or update, allowing fields the endpoint did not intend to expose to be changed.

### 27. Why should an application validate nested arrays and impose limits on them?

**Answer:** Each element needs the expected type and rules, while an item-count limit bounds memory and processing work.

### 28. Give an example of normalization that may be appropriate and one that is risky.

**Answer:** Trimming accidental outer whitespace from a display name may be appropriate. Trimming or lowercasing a password is risky because it changes the secret's meaning.

### 29. Why should an application avoid logging a rejected request body?

**Answer:** It may contain secrets or private information, and untrusted text can also interfere with log processing. Log the failure type and minimal relevant metadata instead.

### 30. What does a small express.json size limit protect against, and what does it not replace?

**Answer:** It bounds parser resource use for request bodies. It does not replace field validation, business rules, authorization, or database safeguards.

## Application questions

### 31. A POST request includes a valid name and quantity, plus an unexpected isAdmin field. What should a strict endpoint do?

**Answer:** Reject the unknown body field, for example with checkExact() after the declared body validation chains. It must never copy isAdmin into the created document.

### 32. A PATCH body contains a negative quantity and a valid name. Should the route update the name and ignore the invalid quantity?

**Answer:** Not unless the API explicitly defines partial acceptance. Normally reject the request before performing a write, so the client knows the complete submitted operation did not proceed.

### 33. A client sends quantity as the string "12items". How should a route handle it?

**Answer:** Reject it because the complete value is not an integer in the accepted range. Do not accept a numeric prefix by permissive parsing.

### 34. A request sends tags as a string instead of an array. Which checks should fail?

**Answer:** The array-shape rule should reject tags before the route uses it. The route should not coerce arbitrary input into an array implicitly.

### 35. The body contains a Mongo-style object where a product ID string is expected. What is the safe approach?

**Answer:** Validate that the field is a primitive identifier in the expected syntax, reject the object, then build the database filter in server code using the validated identifier.

### 36. A user enters a free-form comment containing apostrophes and punctuation. Should validation remove those characters?

**Answer:** No. Define a suitable type and length contract, preserve legitimate text, use safe database APIs, and encode it for the context where it is later displayed.

### 37. An endpoint trims a password before hashing it. What can go wrong?

**Answer:** The stored credential no longer corresponds to the exact secret the user supplied. Authentication behavior can become surprising or inconsistent; do not transform passwords unless the policy explicitly requires it.

### 38. A valid email string is submitted but belongs to an account the caller cannot edit. Which control decides whether the edit may proceed?

**Answer:** Authorization decides whether the caller may edit that account. Email syntax validation alone does not grant access.

### 39. A JSON parser rejects a malformed body. Should the API include the raw body and parser stack in its 400 response?

**Answer:** No. Return a safe 400 response with a generic parse-error code/message. Avoid echoing raw input or internal parser diagnostics.

### 40. Outline a safe create-product request flow.

**Answer:** Apply a body-size limit and parse JSON; validate the name, quantity, category, tags, and exact allowed body fields; return a safe 400 if invalid; extract only matched data; apply business and authorization checks; build the database document from explicit fields; perform the write; and encode response data appropriately.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [045 - Centralized API errors and not-found handling](../lessons/045-centralized-api-errors-and-not-found-handling.md) | [Lesson](../lessons/046-validate-and-sanitize-client-input.md) | [Example](../examples/046-validate-and-sanitize-client-input.md) | [047 - REST status codes and consistent response shapes](../lessons/047-rest-status-codes-and-consistent-response-shapes.md) |
