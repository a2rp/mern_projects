# 021 - Query filters and projection: Questions and Answers

Use these questions to review MongoDB query documents, comparison and logical operators, nested fields, arrays, null/missing values, and projections. The explanations describe why each answer is correct.

Related lesson: [021 - Query filters and projection](../lessons/021-query-filters-and-projection.md)

## Multiple-choice questions

### 1. What does the filter argument to `find(filter)` describe?

- A. Which documents should match the query
- B. Which fields should be deleted
- C. The connection URI
- D. The order in which documents were inserted

**Answer: A.** The filter contains matching criteria. Returned fields are controlled separately with a projection.

### 2. What does `find({ role: "backend" })` match?

- A. Documents whose `role` value matches the string `"backend"`
- B. Every document in the collection
- C. Documents with a `role` field of any type
- D. Documents whose role is not backend

**Answer: A.** A field/value pair is a literal equality match. BSON type and array matching rules still apply.

### 3. A document stores `years` as the number `3`. Which query matches that number?

- A. `{ years: "3" }`
- B. `{ years: 3 }`
- C. `{ years: true }`
- D. `{ years: null }`

**Answer: B.** A numeric value and a string containing digits are different BSON values.

### 4. Which filter finds users with at least three years of experience?

- A. `{ years: { $gte: 3 } }`
- B. `{ years: { $lt: 3 } }`
- C. `{ years: false }`
- D. `{ $gte: 3 }`

**Answer: A.** `$gte` means greater than or equal to the comparison value.

### 5. How does MongoDB interpret these two conditions in one filter?

~~~js
{ active: true, years: { $gte: 3 } }
~~~

- A. Both conditions must match.
- B. Either condition may match.
- C. The second condition overwrites the first.
- D. The filter matches nothing.

**Answer: A.** Ordinary conditions on separate fields are implicitly combined with AND.

### 6. Which operator matches one of several listed role values?

- A. `$in`
- B. `$all`
- C. `$exists`
- D. `$nor`

**Answer: A.** `$in` matches a field equal to at least one value from the supplied list.

### 7. Which operator expresses that at least one condition in a list should match?

- A. `$and`
- B. `$or`
- C. `$exists`
- D. `$eq`

**Answer: B.** `$or` matches a document when one or more listed conditions are true.

### 8. What does `{ $nor: [A, B] }` request?

- A. Documents that match A or B
- B. Documents that fail all listed conditions
- C. Documents where both A and B must match
- D. Documents with no fields

**Answer: B.** `$nor` matches documents that fail every condition in its array.

### 9. What is a relevant behavior of `$ne` and `$nin`?

- A. They can match documents where the field is missing.
- B. They always match only null values.
- C. They change the field value.
- D. They return only one document.

**Answer: A.** Negative comparison operators can include documents without the queried field. Add an existence condition when presence is required.

### 10. How do you query an embedded city field in `address`?

- A. `{ "address.city": "Delhi" }`
- B. `{ address: "city" }`
- C. `{ city.address: "Delhi" }`
- D. `{ address.city: true }`

**Answer: A.** Dot notation addresses a nested field path.

### 11. What can `{ skills: "React" }` match when `skills` is an array?

- A. A document whose skills array contains the string `"React"`
- B. Only a document whose entire array equals the string `"React"`
- C. A document with no skills field
- D. Only arrays with exactly two items

**Answer: A.** A scalar equality condition can match an array element with that value.

### 12. Which operator requires an array to contain all supplied values?

- A. `$all`
- B. `$in`
- C. `$nor`
- D. `$exists`

**Answer: A.** `$all` checks for every listed value in the array. `$in` needs only one listed value to match.

### 13. When should `$elemMatch` be used on an array of embedded documents?

- A. When multiple predicates must apply to the same array element
- B. When all documents should be deleted
- C. When an array should be converted to a string
- D. When the filter should ignore every array item

**Answer: A.** `$elemMatch` binds the conditions to one element rather than allowing different elements to satisfy different conditions.

### 14. What can `{ managerId: null }` match?

- A. Only documents where managerId exists and is explicitly null
- B. Documents where managerId is null or the field is missing
- C. Only documents with a string managerId
- D. No documents

**Answer: B.** A null equality query also matches documents where the field is absent. Use `$exists` to distinguish the cases.

### 15. Which filter requires `managerId` to exist and be explicitly null?

- A. `{ managerId: { $exists: true, $eq: null } }`
- B. `{ managerId: { $exists: false, $eq: null } }`
- C. `{ managerId: { $ne: null } }`
- D. `{ $exists: true }`

**Answer: A.** `$exists: true` checks presence and `$eq: null` checks its value.

### 16. What does an inclusion projection such as `{ name: 1, role: 1 }` return by default?

- A. Only name, role, and also `_id` unless excluded
- B. Every field except name and role
- C. No fields
- D. Only `_id`

**Answer: A.** An inclusion projection includes the selected fields and includes `_id` by default.

### 17. Which projection returns name but excludes `_id`?

- A. `{ name: 1, _id: 0 }`
- B. `{ name: 1, role: 0 }`
- C. `{ name: 0, _id: 1 }`
- D. `{ name: 0, role: 0 }`

**Answer: A.** Projections normally use inclusion or exclusion, but `_id` can be excluded in an inclusion projection.

### 18. Which statement about projection is correct?

- A. It determines which documents match.
- B. It controls which fields appear in returned documents.
- C. It updates fields in the database.
- D. It sorts matching records.

**Answer: B.** Filters select matching documents. Projections shape the fields returned for those matches.

### 19. Why should an API not use `req.query` directly as a MongoDB filter?

- A. It may contain unvalidated fields, values, and operators from an untrusted client.
- B. Express converts every query into an ObjectId.
- C. MongoDB cannot accept JavaScript objects.
- D. It would automatically create indexes.

**Answer: A.** Validate input and build a filter from explicitly accepted fields and types.

### 20. What can `find({})` do?

- A. Match every document in the collection
- B. Match only documents with an empty object field
- C. Return a projection
- D. Update all documents

**Answer: A.** An empty filter has no matching conditions. Use it only when a broad read is intentional and appropriately bounded.

## Short-answer questions

### 21. Explain the difference between a filter and a projection.

**Answer:** A filter determines which documents match. A projection determines which fields from those matching documents are returned.

### 22. Write both a literal equality filter and its explicit `$eq` form for an active user.

**Answer:**

~~~js
const literal = { active: true };
const explicit = { active: { $eq: true } };
~~~

The literal form is shorter; both express equality.

### 23. Write a filter for users with at least three and fewer than eight years of experience.

**Answer:**

~~~js
const filter = {
  yearsOfExperience: { $gte: 3, $lt: 8 }
};
~~~

Both operators apply to the same field, so both must be true.

### 24. How would you match a role that is either frontend or full-stack?

**Answer:**

~~~js
const filter = {
  role: { $in: ["frontend", "full-stack"] }
};
~~~

This matches either listed value. A `$or` expression can express the same choice.

### 25. What is the default relationship between independent fields in one filter?

**Answer:** They are implicitly ANDed. A document must satisfy all ordinary field conditions.

### 26. Create a filter for active users who are either frontend users or have at least six years of experience.

**Answer:**

~~~js
const filter = {
  active: true,
  $or: [
    { role: "frontend" },
    { yearsOfExperience: { $gte: 6 } }
  ]
};
~~~

The active condition applies to both alternatives.

### 27. How do you query the city field inside an embedded address document?

**Answer:** Use dot notation, for example `{ "address.city": "Delhi" }`.

### 28. What does `{ skills: "React" }` do when `skills` is an array?

**Answer:** It can match a document whose array contains the scalar value `"React"`.

### 29. Distinguish `$in` and `$all` for an array field.

**Answer:** `$in` matches when at least one supplied candidate matches. `$all` requires the array to contain every supplied value.

### 30. Why is `$elemMatch` useful for an array of project objects?

**Answer:** It requires multiple conditions to be satisfied by the same project object. Without it, different elements could satisfy separate predicates and create an unintended match.

### 31. How can you find documents where a field is missing?

**Answer:**

~~~js
const filter = {
  managerId: { $exists: false }
};
~~~

The `$exists: false` condition selects documents without that field.

### 32. How can you find a field that exists and is explicitly null?

**Answer:**

~~~js
const filter = {
  managerId: {
    $exists: true,
    $eq: null
  }
};
~~~

The existence test separates an explicit null value from a missing field.

### 33. Why can `{ score: { $ne: 5 } }` match a document with no `score` field?

**Answer:** Negative comparison operators such as `$ne` may also match documents where the field is missing. Add `$exists: true` if the field must be present.

### 34. Write an inclusion projection that returns name and role.

**Answer:**

~~~js
const projection = {
  name: 1,
  role: 1
};
~~~

The projection also returns `_id` by default.

### 35. Write a projection that returns name but omits `_id`.

**Answer:**

~~~js
const projection = {
  name: 1,
  _id: 0
};
~~~

`_id` is the special exception that can be excluded in an inclusion projection.

### 36. What is the general rule for mixing inclusion and exclusion in a projection?

**Answer:** Do not mix included fields and excluded fields in the same projection. The exception is explicitly excluding `_id` while including other fields.

### 37. Show a `findOne()` call that filters by a user ID and returns only name and role.

**Answer:**

~~~js
const user = await users.findOne(
  { _id: userId },
  {
    projection: {
      name: 1,
      role: 1
    }
  }
);
~~~

The filter selects the document; the projection shapes the result.

### 38. Does a projection change which documents match?

**Answer:** No. The filter controls matching; the projection only controls which fields are returned.

### 39. Why should filters use the same BSON type as stored data?

**Answer:** MongoDB distinguishes types. A number does not equal a numeric-looking string, and an ObjectId is not the same as its hexadecimal string.

### 40. What is the risk of an empty filter in a web endpoint?

**Answer:** It can match every document in the collection. If a request omits required criteria, reject it or apply a deliberate bounded search policy rather than accidentally reading everything.

### 41. How should an endpoint handle a role query parameter?

**Answer:** Check that it is a string and one of the application's allowed role values, then construct a filter using that validated value. Reject unsupported values according to the API's error policy.

### 42. Why are client-controlled query operators risky?

**Answer:** An untrusted object can introduce operators or nested conditions the application did not intend. Parse inputs and build a filter from an allowlist instead of passing the raw object to MongoDB.

## Practice tasks

1. Write a filter for users whose age is greater than 18 and at most 30.
2. Write a filter for users in either Delhi or Pune using dot notation.
3. Use `$all` to require both `"React"` and `"Node.js"` in a skills array.
4. Use `$elemMatch` to require one project with status `"active"` and year at least 2025.
5. Distinguish a null manager ID from an absent manager ID.
6. Return only a user's name and role while excluding `_id`.
7. Review a hypothetical endpoint and list which filter fields, types, and operators it should accept.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [020 - Create and read MongoDB documents](../lessons/020-create-and-read-mongodb-documents.md) | [Lesson](../lessons/021-query-filters-and-projection.md) | Q&A | [Example](../examples/021-query-filters-and-projection.md) | [022 - Sort, limit, skip, and pagination](../lessons/022-sort-limit-skip-and-pagination.md) |
