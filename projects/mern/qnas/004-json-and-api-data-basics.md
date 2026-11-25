# 004 - JSON and API Data Basics: Questions and Answers

Use these questions to review JSON syntax, JSON value types, API request and response bodies, parsing, serialization, validation, and data contracts. Answers include a short explanation.

Related lesson: [004 - JSON and API data basics](../lessons/004-json-and-api-data-basics.md)

## Multiple-choice questions

### 1. What is JSON?

- A. A database
- B. A text format for exchanging structured data
- C. A JavaScript runtime
- D. An HTTP method

**Answer: B.** JSON represents structured data as text that different systems can exchange.

### 2. Which group lists all six JSON value types?

- A. String, number, Boolean, null, object, array
- B. String, integer, date, function, object, array
- C. Number, symbol, undefined, object, class, array
- D. Text, image, audio, video, object, array

**Answer: A.** JSON supports strings, numbers, Booleans, null, objects, and arrays.

### 3. Which is valid JSON?

- A. `{ title: "Book" }`
- B. `{'title': 'Book'}`
- C. `{"title": "Book"}`
- D. `{"title": "Book",}`

**Answer: C.** JSON requires double-quoted property names and string values, and does not allow a trailing comma.

### 4. Which literal is valid JSON for a Boolean?

- A. `True`
- B. `FALSE`
- C. `true`
- D. `"true"`

**Answer: C.** JSON's Boolean literals are lowercase `true` and `false`. A quoted `"true"` is a string.

### 5. Which statement about JSON and JavaScript objects is correct?

- A. They are exactly the same thing.
- B. JSON is text; a JavaScript object is a runtime value.
- C. JavaScript cannot read JSON.
- D. JSON can contain functions.

**Answer: B.** JavaScript can parse and serialize JSON, but the text format and runtime object are different.

### 6. Which HTTP header identifies the format of a JSON request body?

- A. `Accept: application/json`
- B. `Content-Type: application/json`
- C. `Status: 201`
- D. `Allow: JSON`

**Answer: B.** Content-Type describes the media type of the body being sent.

### 7. What does an Accept header usually communicate?

- A. Which response media type the client can handle
- B. The format of the request body
- C. The database collection to use
- D. Whether the user is signed in

**Answer: A.** Accept expresses the response media types the client is prepared to receive.

### 8. What does `JSON.parse(text)` do?

- A. Validates that every application field follows business rules
- B. Converts JSON text into a JavaScript value
- C. Sends an HTTP request
- D. Converts an object into JSON text

**Answer: B.** JSON.parse parses valid JSON text. The application must separately validate its expected fields and rules.

### 9. What does `JSON.stringify(value)` do?

- A. Converts a JavaScript value to JSON text
- B. Converts JSON text to an object
- C. Checks an API status code
- D. Adds an HTTP header

**Answer: A.** JSON.stringify serializes a JavaScript value into a JSON string.

### 10. What happens when `JSON.parse()` receives malformed JSON?

- A. It silently fixes every syntax error.
- B. It returns an HTTP 400 response.
- C. It throws a SyntaxError.
- D. It returns an empty object every time.

**Answer: C.** Catch parsing errors when input may be malformed, then handle the failure appropriately.

### 11. What does successful JSON parsing prove?

- A. The data has the exact fields the application needs.
- B. The user is authorized.
- C. The text follows JSON syntax.
- D. The database accepted the data.

**Answer: C.** Parsing checks syntax only. It does not validate application shape, permissions, or business rules.

### 12. Which statement about `null` is best?

- A. It is identical to every missing field.
- B. It is an explicit JSON value; its meaning should be documented.
- C. It means false.
- D. JSON does not support it.

**Answer: B.** An omitted field and a field set to null can have different meanings under an API contract.

### 13. Which statement about dates in JSON is correct?

- A. JSON has a dedicated date value type.
- B. Dates are commonly represented as strings in a documented format.
- C. Every JSON date must be a number.
- D. Dates cannot be sent through JSON.

**Answer: B.** JSON has no date type, so APIs define a string or numeric representation and document it.

### 14. What does an HTTP status code communicate?

- A. The request or response outcome
- B. The JSON property names
- C. The database schema
- D. The text encoding of every field

**Answer: A.** Status codes communicate the HTTP outcome; the JSON body carries data.

### 15. Why should an API use a consistent error response shape?

- A. So clients can handle failures predictably
- B. So every failure becomes a successful status
- C. So JSON no longer needs parsing
- D. So the server can skip validation

**Answer: A.** Predictable fields such as error code, message, and details make client error handling clearer.

### 16. Which item is not allowed in JSON syntax?

- A. An array
- B. A nested object
- C. A comment
- D. A number

**Answer: C.** JSON has no comment syntax.

### 17. A client sends JSON in a POST body. What should it normally include?

- A. A Content-Type header that identifies JSON
- B. A JavaScript function in the body
- C. A 200 status in the request
- D. A database password in the Accept header

**Answer: A.** The recipient needs to know the request body's media type.

### 18. Is a JSON array allowed as a top-level JSON value?

- A. No, only objects are allowed.
- B. Yes, arrays are JSON values.
- C. Only if it contains strings.
- D. Only in a response.

**Answer: B.** A JSON text can represent an array, though a particular API endpoint may require a different shape.

### 19. Why should a server validate incoming JSON even if a browser form already validates it?

- A. A client can be modified or bypassed.
- B. Browsers cannot send JSON.
- C. JSON automatically removes invalid fields.
- D. Server validation changes the HTTP method.

**Answer: A.** Server-side validation protects the server's own data and rules regardless of client behavior.

### 20. What does `Accept: application/json` express?

- A. The request body is definitely JSON.
- B. The client prefers or can handle a JSON response.
- C. The request succeeded.
- D. The user accepts the privacy policy.

**Answer: B.** Content-Type describes the body being sent; Accept describes response media types the client can accept.

### 21. Which field is most clearly a JSON string?

- A. `"count": "3"`
- B. `"count": 3`
- C. `"enabled": false`
- D. `"value": null`

**Answer: A.** The number 3 in quotes is text. In B it is a JSON number; C is Boolean; D is null.

### 22. An endpoint documents that `email` may be omitted or set to `null`. What should a client do?

- A. Guess that both cases always mean the same thing.
- B. Follow the endpoint's documented meaning for each case.
- C. Replace either case with an empty object.
- D. Assume JSON parsing will decide the meaning.

**Answer: B.** JSON syntax does not define the application's meaning for omitted or nullable fields; the contract does.

### 23. Should a client parse the body of every successful HTTP response as JSON?

- A. Yes, every success response has a JSON body.
- B. No. Some successful responses have no body.
- C. Only when the status is 204.
- D. No, JSON is only used for errors.

**Answer: B.** The client should follow the endpoint contract and status. A no-content response has no JSON body to parse.

## Short-answer questions

### 24. What is the difference between JSON text and a JavaScript object?

**Answer:** JSON is a serialized text format. A JavaScript object is a value in a running JavaScript program. `JSON.parse()` can turn valid JSON text into a JavaScript value; `JSON.stringify()` can serialize a JavaScript value into JSON text.

### 25. Name all six JSON value types.

**Answer:** String, number, Boolean, null, object, and array.

### 26. Why is `{ title: 'Book' }` invalid JSON?

**Answer:** The property name is unquoted and the string uses single quotes. JSON requires double-quoted property names and string values: `{"title":"Book"}`.

### 27. Why do APIs send a Content-Type header with JSON request bodies?

**Answer:** It identifies the media type of the request body so the receiver can interpret it as JSON.

### 28. What is the difference between Content-Type and Accept?

**Answer:** Content-Type describes the media type of the body being sent. Accept communicates which response media types the client can handle.

### 29. What is the difference between parsing and validating?

**Answer:** Parsing checks whether text follows JSON syntax and converts it into a JavaScript value. Validation checks whether that value has allowed fields, types, and application-specific values.

### 30. Why should JSON parsing be inside error handling when the input may be malformed?

**Answer:** `JSON.parse()` throws a SyntaxError for malformed JSON. Handling that error lets the program respond deliberately instead of stopping unexpectedly.

### 31. What is the difference between an omitted field and a field set to `null`?

**Answer:** An omitted field is not present in the object. A field with `null` is present with an explicit null value. The endpoint contract determines what each means.

### 32. Does JSON have a date type?

**Answer:** No. APIs commonly use strings in a specified date-time format and document how clients should interpret them.

### 33. Does a valid JSON body prove that the request is safe or authorized?

**Answer:** No. Valid syntax says nothing about authorization, permissions, or whether the requested action is allowed. The server must apply its security and business rules.

### 34. What should an API contract say about an endpoint?

**Answer:** It should describe the method and path, expected headers and body, field names and types, required and optional fields, success and error statuses, response shapes, and any special rules such as pagination.

### 35. Why should API errors use a predictable shape?

**Answer:** A client can consistently display a message, react to a stable error code, and optionally show field-level details without writing separate guessing logic for every endpoint.

### 36. What should an API client do before parsing a response body?

**Answer:** Follow the endpoint contract. Check the response status and whether a body is expected. Handle no-content responses without attempting to parse an empty body as JSON.

### 37. Does `JSON.stringify()` validate that an object follows an API's business rules?

**Answer:** No. It serializes supported JavaScript data into JSON text. The application must validate the data against the endpoint's requirements separately.

### 38. Give one example of a JSON array containing objects.

**Answer:**

~~~json
[
  { "id": "task-1", "title": "Read", "completed": true },
  { "id": "task-2", "title": "Practice", "completed": false }
]
~~~

The array is ordered, and each item here is a JSON object.

## Review checklist

You are ready to move on when you can:

- Name and recognize all six JSON value types.
- Tell valid JSON apart from a JavaScript object literal.
- Explain why JSON keys and strings use double quotes and why comments or trailing commas are invalid.
- Explain the roles of Content-Type, Accept, and HTTP status codes.
- Use `JSON.parse()` and `JSON.stringify()` for their respective conversions.
- Explain why parsing is not the same as validation.
- Describe the difference between a missing field and a field set to `null`.
- Explain why an API contract documents field types, status codes, and error shapes.
- Explain why a server must validate input even when the client does.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [003 - HTTP requests, responses, methods, and status codes](../lessons/003-http-requests-responses-methods-and-status-codes.md) | [Q&A](004-json-and-api-data-basics.md) | [Example](../examples/004-json-and-api-data-basics.md) | [005 - Terminal, files, Git, and GitHub workflow](../lessons/005-terminal-files-git-and-github-workflow.md) |
