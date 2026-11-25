# 095 - Validation across the full stack

Validation checks whether incoming data satisfies the application's requirements before the application uses it. In a MERN app, input starts in a browser form, crosses an HTTP boundary, reaches Express and business services, and may be persisted through Mongoose into MongoDB. Each layer can help, but only the server can enforce the API contract because callers can bypass React.

This chapter follows one course form through those layers. It covers useful browser feedback, server-side schemas, semantic business rules, safe error responses, allowlisted database updates, and database constraints.

## Learning outcomes

After this chapter, you should be able to:

- Distinguish client feedback from server enforcement.
- Validate syntax, type, bounds, and business meaning.
- Parse request bodies with an explicit schema and reject unexpected fields.
- Return stable field-level validation errors without leaking internals.
- Share schemas carefully without treating the browser as trusted.
- Prevent mass assignment by selecting fields explicitly.
- Use Mongoose validation and MongoDB indexes as persistence safeguards.
- Validate query parameters, identifiers, nested arrays, and partial updates.
- Keep validation separate from authorization, output encoding, and injection defenses.
- Test invalid values at every relevant trust boundary.

## 1. Validate at every trust boundary

An input crosses several boundaries:

1. **Browser form:** provides immediate, understandable feedback.
2. **HTTP request:** contains untrusted bytes and values.
3. **API schema:** checks the request's expected shape and field constraints.
4. **Business service:** checks rules involving other fields, current state, or permissions.
5. **Mongoose model:** enforces document-level constraints before saving.
6. **MongoDB indexes and schema rules:** protect persistence invariants such as uniqueness.

The same field may need checks at more than one layer for different reasons. Browser validation helps the user correct a form. API validation protects the server. Database constraints protect data when writes come from another route, a job, or concurrent requests.

## 2. Validate syntax and meaning separately

**Syntactic validation** asks whether a value has the expected representation:

- Is a title a string?
- Is an identifier the required format?
- Is a page size an integer within a bound?
- Does a date parse using the documented format?

**Semantic validation** asks whether the value makes sense in context:

- Does the end date occur after the start date?
- Is a username still available?
- Is the requested workflow transition allowed now?
- Does the caller own the resource being changed?

A value can be syntactically valid and still be semantically invalid. A valid MongoDB ID does not prove the record exists or that the caller may access it.

## 3. Use browser constraints for fast feedback

HTML provides useful constraints such as <code>required</code>, <code>min</code>, <code>max</code>, and <code>maxLength</code>. Use them to help people submit correct data.

~~~~jsx
<label htmlFor="course-title">Course title</label>
<input
  id="course-title"
  name="title"
  required
  minLength={1}
  maxLength={120}
  value={title}
  onChange={(event) => setTitle(event.target.value)}
  aria-describedby="course-title-error"
/>
<p id="course-title-error" role="alert">{titleError}</p>
~~~~

Browser checks are not security controls. A caller can edit the DOM, disable validation, or call the API directly. The Express API must independently validate every request. Avoid hiding useful server-side validation just because a browser form currently has the same rules.

## 4. Define the API contract with a schema

A schema makes accepted input explicit. The example uses Zod 4 and rejects unknown keys rather than silently accepting fields the route does not support.

~~~~js
// server/src/features/courses/course.schemas.js
import * as z from "zod";

export const createCourseSchema = z.strictObject({
  title: z.string().trim().min(1, "Enter a course title.")
    .max(120, "Course titles must be 120 characters or fewer."),
  description: z.string().trim().max(2000).optional()
});

export const updateCourseSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional()
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update."
  );
~~~~

Use deliberate allowlists for enum values, formats, bounds, and supported properties. Do not accept a whole Mongoose document or arbitrary request object as an update payload.

## 5. Parse requests before calling business logic

Use <code>safeParse</code> to turn unknown request data into validated data or a controlled list of issues. Pass only the parsed value to the service.

~~~~js
// server/src/middleware/validate-body.js
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));

      return res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the submitted fields.",
          fields
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
}
~~~~

~~~~js
// server/src/features/courses/course.routes.js
import { Router } from "express";
import { requireAuth } from "../auth/require-auth.js";
import { validateBody } from "../../middleware/validate-body.js";
import {
  createCourseSchema,
  updateCourseSchema
} from "./course.schemas.js";
import * as controller from "./course.controller.js";

export const courseRouter = Router();

courseRouter.post(
  "/",
  requireAuth,
  validateBody(createCourseSchema),
  controller.create
);

courseRouter.patch(
  "/:courseId",
  requireAuth,
  validateBody(updateCourseSchema),
  controller.update
);
~~~~

A body parser limit should run before validation so oversized JSON is rejected before schema work. A schema cannot protect a parser from an unbounded request body by itself.

## 6. Keep the API error shape stable

A client needs a predictable way to show field feedback. Keep the status, error code, general message, and field issues consistent across routes.

~~~~json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the submitted fields.",
    "fields": [
      {
        "path": "title",
        "message": "Enter a course title."
      }
    ]
  }
}
~~~~

Use a client error status for invalid user input, such as 400 or 422 according to the API's established convention. Do not send raw stack traces, database messages, schema internals, or secret configuration. For unexpected failures, return a generic 500 response and log safe diagnostics on the server.

## 7. Validate business rules in the service

Schema validation handles the shape and simple constraints of one request. Rules that depend on database state belong in the service, where the application can check ownership, uniqueness races, workflow state, and related values.

~~~~js
// server/src/features/courses/course.service.js
import { Course } from "./course.model.js";

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function createCourse({ ownerId, input }) {
  const course = await Course.create({
    ownerId,
    title: input.title,
    description: input.description ?? ""
  });

  return {
    id: String(course._id),
    title: course.title,
    description: course.description
  };
}

export async function updateCourse({ ownerId, courseId, input }) {
  const course = await Course.findOne({ _id: courseId, ownerId });

  if (!course) {
    throw httpError(404, "NOT_FOUND", "Course not found.");
  }

  if (input.title !== undefined) {
    course.title = input.title;
  }

  if (input.description !== undefined) {
    course.description = input.description;
  }

  await course.save();

  return {
    id: String(course._id),
    title: course.title,
    description: course.description
  };
}
~~~~

The authenticated owner ID is passed from server middleware, not from the body. The service selects only the supported fields and checks that the record is owned by the caller. Validation does not grant permission.

## 8. Avoid mass assignment

Never write <code>Model.create(req.body)</code> or <code>Object.assign(document, req.body)</code> for an authenticated resource. The request might include fields such as <code>ownerId</code>, <code>role</code>, <code>isAdmin</code>, or internal status flags.

Instead:

1. Validate an allowlisted request shape.
2. Derive ownership and identity from the authenticated server context.
3. Copy only the fields this operation is allowed to change.
4. Check authorization against current state.
5. Persist and return a safe response object.

Rejecting unknown fields can expose client bugs early and keep the contract honest. If forward compatibility requires ignoring extras, do so as a deliberate API policy and still explicitly select writable fields.

## 9. Validate query parameters and identifiers too

Query strings are also client input. For example, cap pagination to a bounded range and reject malformed values.

~~~~js
import * as z from "zod";

const listCoursesQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional()
});
~~~~

Be aware that coercion converts values according to JavaScript rules; for example, an empty string may become zero. If an empty query value should be treated as missing or invalid, normalize it deliberately before coercion.

MongoDB ObjectIds should be checked for the API's required format before querying. A syntactically valid ID can still identify no record or another user's record. Bound string length and array size to limit unnecessary work.

## 10. Enforce durable constraints in Mongoose and MongoDB

Mongoose schema validators catch many invalid document values before save.

~~~~js
// server/src/features/courses/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
~~~~

Mongoose validation is not a replacement for API validation: it may produce errors less suitable for a user-facing response, and updates have their own behavior. For query updates, enable validators where appropriate:

~~~~js
await Course.updateOne(
  { _id: courseId, ownerId },
  { $set: { title: validatedTitle } },
  { runValidators: true }
);
~~~~

A unique index is the authority for uniqueness under concurrent writes. A preflight query such as “does this email exist?” improves feedback but cannot eliminate a race where two requests pass the check at the same time. Catch the duplicate-key error and map it to the intended conflict response.

## 11. Validate cross-field and workflow invariants

For a date range, check both syntax and relation:

- Parse the dates using the documented timezone and format.
- Reject invalid calendar dates.
- Require the end to occur after the start.
- Enforce allowed booking windows and current workflow state in the service.
- Store timestamps in a consistent representation, commonly UTC instants.

For a state transition, do not trust a client-supplied status alone. Load the current record, check that the transition is permitted, then save the new state. A valid enum value can still be an invalid transition.

## 12. Keep validation distinct from other defenses

Validation does not make every value safe for every use:

- **Authorization** decides whether this caller may perform this operation.
- **Output encoding** prevents data from being interpreted as HTML or script in a particular output context.
- **Query safety** uses Mongoose operators and controlled query construction instead of turning arbitrary objects into filters.
- **CSRF protection** proves that a cookie-authenticated state-changing request was intentionally made by the application.
- **Rate limiting and size limits** restrict work and resource use.
- **File validation** inspects actual content and follows upload-specific storage controls.

Do not “sanitize” input by stripping every suspicious character. That can change legitimate text and still fail to prevent injection. Preserve valid data, validate its shape, use safe APIs, and encode it for the context where it is displayed.

## 13. Return field errors accessibly in React

Map API field issues to the corresponding inputs. Associate messages with controls, set <code>aria-invalid</code> when a field fails, and provide a form-level summary when useful.

~~~~jsx
<label htmlFor="course-title">Course title</label>
<input
  id="course-title"
  name="title"
  value={title}
  onChange={handleChange}
  aria-invalid={Boolean(errors.title)}
  aria-describedby={errors.title ? "course-title-error" : undefined}
/>
{errors.title && (
  <p id="course-title-error" role="alert">
    {errors.title}
  </p>
)}
~~~~

Keep the value the user entered after a server error so they can correct it. Clear or update field errors when they edit the corresponding control, and announce submission-level failures without relying on color alone.

## 14. Test validation as a contract

For each field, test representative values:

- Missing, wrong type, empty, and whitespace-only values.
- Values just below, at, and above length or range limits.
- Unknown object keys and nested array limits.
- Invalid and valid identifier formats.
- Cross-field rules and workflow states.
- Duplicate concurrent writes and database constraint mapping.
- Unauthorized access separately from syntactic validity.
- Browser feedback and server rejection independently.

A browser test should not be the only test for a server schema. An API test should send invalid payloads directly to the route.

## Common mistakes

- Relying on browser validation as the API's security boundary.
- Treating syntactic validity as business validity.
- Treating a valid identifier as authorization.
- Passing the entire request body into Mongoose.
- Allowing unbounded strings, arrays, nested objects, or request bodies.
- Coercing values without understanding JavaScript conversion behavior.
- Treating Mongoose validators as the only validation layer.
- Forgetting update validators for Mongoose update operations.
- Assuming a pre-query uniqueness check prevents concurrent duplicates.
- Returning raw schema or database errors to the browser.
- Calling character stripping “sanitization” and assuming it prevents XSS.
- Forgetting accessible field-error association in React.
- Testing only valid input and skipping boundary or failure values.

## Manually inspect the validation flow

1. Submit a blank title from the browser and confirm it shows a useful message.
2. Send the same invalid request directly to Express and confirm the server rejects it.
3. Send an unexpected property such as <code>ownerId</code> and confirm the API does not accept it.
4. Try title values at the minimum and maximum boundaries.
5. Send malformed query numbers and oversized page limits.
6. Attempt to update a record owned by another user and confirm authorization denies it.
7. Cause a duplicate unique-index value and confirm the API maps the conflict safely.
8. Use a query update with a value outside the Mongoose model limits and confirm validators are enabled.
9. Confirm browser errors are associated with their input and remain usable with a screen reader.
10. Confirm raw request bodies, credentials, and stack traces are absent from production logs and responses.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [094 - Unit, integration, and end-to-end testing](094-unit-integration-and-end-to-end-testing.md) | [Lesson](095-validation-across-the-full-stack.md) | [Q&A](../qnas/095-validation-across-the-full-stack.md) | [Example](../examples/095-validation-across-the-full-stack.md) | [096 - Profile MongoDB queries and improve indexes](096-profile-mongodb-queries-and-improve-indexes.md) |
