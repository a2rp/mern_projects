# 004 - JSON and API data basics

## Learning goals

By the end of this lesson, you should be able to explain JSON, distinguish JSON text from a JavaScript object, recognize the six JSON value types, and describe how JSON is used in API requests and responses.

## What JSON is

JSON means **JavaScript Object Notation**. It is a text format for representing structured data so programs can exchange it. JSON is language-independent: a browser, Node.js server, database tool, or program written in another language can work with it.

A JSON document is text. A JavaScript object is a value in a running JavaScript program. The formats resemble each other, but they are not interchangeable.

~~~text
JSON text --parse--> JavaScript value
JSON text <--serialize-- JavaScript value
~~~

## The six JSON value types

JSON supports four primitive types and two structured types:

| Type | Example | Notes |
| --- | --- | --- |
| String | `"Ada Lovelace`" | Text enclosed in double quotes. |
| Number | `42` or `19.95` | A base-10 number; JSON has no separate integer type. |
| Boolean | `true` or `false` | Lowercase literal values. |
| Null | `null` | An explicit empty value, as defined by the API contract. |
| Object | `{"name":"Ada"}` | String-keyed name/value pairs. |
| Array | `["HTML","CSS"]` | An ordered list of JSON values. |

Objects and arrays can be nested. A JSON document itself may be any one JSON value, though APIs commonly send objects or arrays.

## Valid JSON syntax

~~~json
{
  "id": "task-104",
  "title": "Read the API lesson",
  "completed": false,
  "priority": 2,
  "labels": ["learning", "mern"],
  "owner": {
    "name": "Sam",
    "email": null
  }
}
~~~

Keep these rules in mind:

- Object property names and string values use double quotes.
- Put a colon between a property name and its value.
- Separate properties and array items with commas; do not add a trailing comma.
- The literal values are lowercase: `true`, `false`, and `null`.
- JSON has no comments, variables, functions, or expressions.
- JSON numbers do not include JavaScript-only values such as `NaN` or `Infinity`.

The following is valid JavaScript, but not JSON because it has an unquoted key, single quotes, and a trailing comma:

~~~js
{ title: 'Read the API lesson', }
~~~

Write it as JSON like this:

~~~json
{
  "title": "Read the API lesson"
}
~~~

## JSON text versus a JavaScript object

JavaScript can create an object directly:

~~~js
const task = {
  title: "Read the API lesson",
  completed: false,
};
~~~

The trailing comma is valid in this JavaScript object literal. JSON text needs quoted keys and no trailing comma:

~~~json
{
  "title": "Read the API lesson",
  "completed": false
}
~~~

JSON has no `undefined` value or date type. APIs commonly represent dates as strings in a documented format. The API contract should say whether each field is required, optional, nullable, or omitted. “Missing” and “present with `null`” can have different meanings.

## How JSON fits into an HTTP API

An HTTP request has a method, URL, headers, and sometimes a body. A client sending JSON commonly identifies the body format with `Content-Type: application/json`. It can use `Accept: application/json` to express a preference for JSON responses.

~~~http
POST /api/tasks
Content-Type: application/json
Accept: application/json

{
  "title": "Read the API lesson"
}
~~~

A successful response could look like this:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "task-104",
  "title": "Read the API lesson",
  "completed": false
}
~~~

Headers describe the representation, while the status code communicates the HTTP outcome. JSON alone does not say whether a request succeeded. Some successful responses have no body, so follow each endpoint's documented response contract rather than assuming every response contains JSON.

## Parsing and serializing in JavaScript

Use `JSON.parse()` to turn JSON text into a JavaScript value:

~~~js
const responseText = '{"id":"task-104","title":"Read the API lesson","completed":false}';
const task = JSON.parse(responseText);

console.log(task.title);
~~~

Output:

~~~text
Read the API lesson
~~~

Malformed JSON makes `JSON.parse()` throw a `SyntaxError`. Handle parsing failures when the input may be invalid:

~~~js
try {
  const data = JSON.parse(responseText);
  console.log(data);
} catch (error) {
  console.error("The response was not valid JSON.");
}
~~~

Use `JSON.stringify()` to serialize a JavaScript value into JSON text:

~~~js
const task = {
  id: "task-104",
  title: "Read the API lesson",
  completed: false,
};

const jsonText = JSON.stringify(task);
console.log(jsonText);
~~~

Output:

~~~text
{"id":"task-104","title":"Read the API lesson","completed":false}
~~~

For readable output while inspecting data, provide a spacing value:

~~~js
console.log(JSON.stringify(task, null, 2));
~~~

Parsing verifies JSON syntax; it does not prove the result contains fields or values your application expects. Validate the shape and business rules after parsing:

~~~js
function isTask(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.completed === "boolean"
  );
}
~~~

Both client and server validate data for their own responsibilities. Client checks help users, but the server must validate incoming requests because clients can be changed or bypassed.

## Agree on an API data contract

For each endpoint, document:

- The HTTP method and path.
- Required headers and whether a body is expected.
- Accepted fields, their types, and which are required or optional.
- Success status codes and response fields.
- Error status codes and a consistent error shape.
- Whether fields can be null, omitted, or empty.
- Pagination, sorting, and filtering formats when relevant.

For example, an API might use this consistent error response:

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required.",
    "details": [
      {
        "field": "title",
        "message": "Provide a non-empty title."
      }
    ]
  }
}
~~~

The exact format is a design choice. Consistency lets client code handle errors predictably.

## Common mistakes

- Sending a JavaScript object literal as if it were JSON text.
- Using single quotes or unquoted object keys in JSON.
- Adding comments or a trailing comma.
- Assuming `JSON.parse()` checks application-specific rules.
- Treating a missing field, an empty string, and `null` as identical.
- Assuming every HTTP response contains a JSON body.
- Trusting client-side validation as the only protection.
- Returning inconsistent field names or error formats.
- Putting passwords, private tokens, or other secrets in request examples.

## Practice

1. Write a JSON object for a book with a string `title`, numeric `pageCount`, Boolean `available`, and string array `authors`.
2. Add a nested `publisher` object. In plain language, state which fields are required.
3. Find the syntax errors in `{ title: 'Book', pageCount: 240, }`.
4. Parse a JSON string, check that it is an object with expected field types, and display its title.
5. Sketch an HTTP request and response for creating a book. Include the method, path, headers, status, and response body.
6. Decide how your API should represent an unknown publisher: omit the field, use `null`, or choose another documented value. Explain the choice.

## Key takeaways

- JSON is text for exchanging structured data between systems.
- Its six value types are strings, numbers, Booleans, null, objects, and arrays.
- JSON syntax is stricter than JavaScript object-literal syntax.
- HTTP headers describe the body format; HTTP status codes communicate the request outcome.
- Parsing checks syntax. Application code must also validate the data's shape and meaning.
- A written API contract makes requests, responses, and errors predictable.

---

### Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :---: |
| [003 - HTTP requests, responses, methods, and status codes](003-http-requests-responses-methods-and-status-codes.md) | [Q&A](../qnas/004-json-and-api-data-basics.md) | [Example](../examples/004-json-and-api-data-basics.md) | [005 - Terminal, files, Git, and GitHub workflow](005-terminal-files-git-and-github-workflow.md) |
