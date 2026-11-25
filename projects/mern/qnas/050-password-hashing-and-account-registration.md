# 050 - Password hashing and account registration: Q&A

This chapter review contains 40 questions: 20 multiple-choice questions, 10 short-answer questions, and 10 application questions. Answers and explanations are included so the file can be used for self-study.

## Multiple-choice questions

### 1. Why should an application hash passwords before storing them?

- A. Hashing lets the application recover a password if the user forgets it.
- B. Hashing stores a verifiable derived value without keeping the original password.
- C. Hashing makes the password public to all application services.
- D. Hashing removes the need to authenticate users.

**Answer: B.** A password hash is used to verify a submitted password without storing a recoverable original. Password recovery should use a reset flow.

### 2. Why is a fast general-purpose hash such as SHA-256 alone unsuitable for password storage?

- A. It cannot represent text.
- B. It is too slow to use in a web application.
- C. It lets an attacker test guesses very quickly after stealing the database.
- D. It automatically reveals the original password.

**Answer: C.** Password storage needs a deliberately expensive password-hashing function so each offline guess costs meaningful time and resources.

### 3. What is the purpose of a per-password salt?

- A. To encrypt the password with a key that the user knows.
- B. To make identical passwords produce distinct stored hashes and frustrate precomputed tables.
- C. To let the database sort passwords alphabetically.
- D. To replace the password-hashing algorithm.

**Answer: B.** A password-hashing library generates a unique random salt and includes it in the encoded hash representation.

### 4. Which algorithm is a suitable first choice for new password storage when supported by a maintained library?

- A. MD5
- B. SHA-1
- C. Argon2id
- D. Base64

**Answer: C.** Argon2id is a password-hashing function designed to impose memory and computation costs. Base64 is encoding, and MD5 and SHA-1 are fast general-purpose hashes.

### 5. Which set is the commonly cited Argon2id minimum starting configuration described in the lesson?

- A. 19 MiB memory, time cost 2, parallelism 1
- B. 1 KiB memory, time cost 1, parallelism 1
- C. 19 bytes memory, time cost 2, parallelism 10
- D. 1 GiB memory, time cost 100, parallelism 100

**Answer: A.** These values are a starting point. Benchmark on deployment hardware and assess the server's expected concurrent load.

### 6. What should an application store after hashing a password?

- A. Only the original password.
- B. The complete encoded hash string containing algorithm, salt, and parameters.
- C. The salt alone.
- D. A single shared hash for every account.

**Answer: B.** The encoded value lets the library verify the password and interpret the salt and work parameters.

### 7. Which statement about a pepper is correct?

- A. A pepper is the public per-password salt stored in the hash string.
- B. A pepper is a separate secret that may add defense in depth and must be managed outside the password database.
- C. A pepper means passwords can be stored in plaintext.
- D. A pepper replaces unique salts and a password KDF.

**Answer: B.** A pepper is an optional secret key. It does not replace unique salts, password hashing, or database security.

### 8. Which password policy best supports passphrases?

- A. Require exactly eight characters and reject spaces.
- B. Require one uppercase letter, one digit, and one punctuation character.
- C. Accept spaces and broad character choices, allow long passwords, and reject known-compromised values.
- D. Convert every password to lowercase before storing it.

**Answer: C.** Useful policies permit passphrases, avoid arbitrary composition rules, and check against an appropriate blocklist.

### 9. What is the lesson's cited minimum-length guidance when a password is the only authentication factor?

- A. 6 characters
- B. 8 characters
- C. 12 characters
- D. 15 characters

**Answer: D.** A common guidance is at least 15 characters when the password is the only factor. A different minimum may apply when the password is used as part of MFA.

### 10. What should an application do when a submitted password exceeds its documented maximum?

- A. Silently truncate it.
- B. Trim it until it fits.
- C. Reject it clearly before expensive hashing.
- D. Save the first 72 bytes and discard the rest.

**Answer: C.** Silent changes can cause surprising sign-in failures and weaken the password. Set a reasonable documented bound and reject out-of-range input.

### 11. Why does a bcrypt implementation's 72-byte input limit matter?

- A. Some long passwords may exceed the limit, so the application must not silently truncate them.
- B. It means bcrypt generates a 72-character salt.
- C. It means bcrypt can store only 72 user accounts.
- D. It means bcrypt is an encryption algorithm.

**Answer: A.** The limit is in bytes, not necessarily characters. Long or multibyte Unicode passwords may exceed it; choose a suitable policy and never truncate silently.

### 12. When should registration input be checked for type and length?

- A. Only after the password is hashed.
- B. Before expensive hashing work.
- C. After returning a success response.
- D. Only during account recovery.

**Answer: B.** Reject malformed, oversized, or disallowed inputs before running a resource-intensive password KDF.

### 13. Why is a pre-insert query such as “does this username exist?” insufficient to enforce uniqueness?

- A. It cannot connect to MongoDB.
- B. Two concurrent requests can both pass the query before either inserts.
- C. It automatically deletes duplicate accounts.
- D. It is slower than hashing.

**Answer: B.** The database unique index is the final authority. The application must safely handle a duplicate-key error from a concurrent write.

### 14. In Mongoose, what does the schema option **unique: true** provide?

- A. A normal validation rule with a guaranteed friendly validation error.
- B. A request to create a database unique index; duplicate writes can produce a duplicate-key error.
- C. A way to hash a field automatically.
- D. A guarantee that indexes exist before the first request without deployment planning.

**Answer: B.** Mongoose documents **unique** as an index helper, not a validator. Ensure the index is built and handle duplicate-key errors.

### 15. What is the safest default way to build a client-facing account response?

- A. Serialize the entire database document and trust field selection.
- B. Return an explicit allowlisted object containing only public fields.
- C. Return the password hash so the client can verify it.
- D. Return all internal fields and hide them with CSS.

**Answer: B.** A public DTO or allowlisted object helps prevent password hashes, role fields, internal flags, and other sensitive data from leaking.

### 16. Does Mongoose **select: false** alone guarantee a password hash can never be exposed?

- A. Yes, it is a complete security boundary.
- B. No; it reduces accidental reads, but explicit response allowlisting is still needed.
- C. Yes, but only when using JSON.
- D. No, because it disables every query.

**Answer: B.** A field may be explicitly selected or included through other code paths. Build the response from known-safe fields.

### 17. Which behavior can reveal whether an account identifier exists?

- A. Different messages or status codes for known and unknown identifiers.
- B. A generic response shared for both cases.
- C. Rate limiting.
- D. Omitting private account data from responses.

**Answer: A.** Message, status, response-size, and timing differences can enable account enumeration. Design responses with the threat model in mind.

### 18. Why should registration attempts be rate-limited?

- A. To prevent all legitimate users from creating accounts.
- B. To reduce automated abuse and constrain expensive hash work.
- C. To make password hashes reversible.
- D. To replace database uniqueness.

**Answer: B.** Hashing consumes resources, so limit abusive request rates and concurrent expensive work. Rate limiting complements other protections.

### 19. What should the application log for a failed registration?

- A. The raw password and password hash.
- B. The complete request body for debugging.
- C. Safe security metadata that excludes passwords, hashes, tokens, and reset links.
- D. The database connection string.

**Answer: C.** Logs should support monitoring without capturing credentials or secrets.

### 20. If email is used as an account identifier, which approach is most appropriate?

- A. Remove dots and plus suffixes from every address.
- B. Lowercase every character and assume all mail providers compare addresses identically.
- C. Define a deliberate comparison policy, preserve the original address where useful, and verify ownership.
- D. Skip verification because a syntactically valid address proves ownership.

**Answer: C.** Email canonicalization has edge cases. Avoid provider-specific transformations, document the comparison policy, and verify control of the address.

## Short-answer questions

### 21. Explain the difference between password hashing and password encryption.

**Answer:** Hashing is a one-way derivation used to verify a candidate without recovering the original. Encryption is designed to be reversed with a key. Applications should hash passwords rather than encrypting them for later decryption.

### 22. What information is normally carried in a password hash's encoded representation?

**Answer:** It typically identifies the algorithm and its parameters and includes the unique salt and derived hash. Store the complete encoded string so the library can verify it later.

### 23. Why should password hashing parameters be benchmarked on production-like hardware?

**Answer:** Hashing costs consume CPU and memory. Parameters must make guessing expensive while still allowing the server to handle legitimate sign-ups and sign-ins under expected concurrency.

### 24. What is the difference between a salt and a pepper?

**Answer:** A salt is a unique random value for a password hash and is stored with the encoded hash. A pepper is an optional secret kept separately from the password database and managed as a production secret.

### 25. Why should password length be bounded even when long passphrases are accepted?

**Answer:** Extremely large input can consume resources in request parsing and hashing. A documented upper bound and request-size limit prevent resource abuse while still supporting long passwords.

### 26. Why should a password not be trimmed or lowercased during registration?

**Answer:** That silently changes the user's secret and can make later verification confusing or inconsistent. The application should use the same clearly defined password representation for hashing and verification.

### 27. Why is the unique database index still needed if the registration handler checks for an existing account first?

**Answer:** Concurrent requests can both see no account and then attempt the same insert. The unique index resolves that race; the handler should catch the duplicate-key error.

### 28. What does a duplicate-key error tell the registration handler?

**Answer:** The database rejected a write that conflicts with an existing unique index value. The handler should map it to the chosen safe public response without exposing raw database details.

### 29. Why should an email-based account be verified before it is fully enabled?

**Answer:** Verification helps establish that the user controls the address and reduces mistaken or attacker-supplied addresses being treated as confirmed account identities.

### 30. Why should an API return a public user DTO instead of a complete Mongoose document?

**Answer:** A DTO explicitly includes only intended public fields. This reduces accidental disclosure of password hashes, roles, verification flags, internal identifiers, and future schema fields.

## Application questions

### 31. A developer proposes storing SHA-256(password) because it is a secure hash. What would you change and why?

**Answer:** Use a maintained password-hashing library such as Argon2id, with a unique salt and tuned work parameters. SHA-256 is fast, which lets attackers test guesses rapidly if the database is stolen. Store the complete encoded result and verify passwords through the library.

### 32. Your application supports a 100-character passphrase, but the chosen bcrypt library only processes 72 bytes. What should you do?

**Answer:** Do not silently truncate the input or assume characters equal bytes. Prefer a password KDF that supports the application's intended input policy, or explicitly enforce a compatible documented limit and reject longer input. Account for Unicode byte length as well as character length.

### 33. Two requests register the same username at nearly the same time. Both passed an initial lookup. What should happen?

**Answer:** A database unique index should allow only one insert. Catch the duplicate-key error from the losing write and return the public response selected by the product's enumeration policy. Do not treat the initial lookup as the guarantee.

### 34. A client sends an object with username, password, role, and verified status. How should the registration endpoint handle it?

**Answer:** Accept only the documented registration fields, validate their types and bounds, and ignore or reject unexpected fields. The server must set roles and verification state through trusted application flows, never from client-supplied registration data.

### 35. A sign-up form wants to tell users immediately that a username is already taken. What security tradeoff should be documented?

**Answer:** A specific conflict response is useful for user experience but confirms that an identifier exists. Document that enumeration tradeoff, rate-limit abuse, and consider a generic response or verification-based flow when account privacy is more important.

### 36. The team decides to lowercase all passwords so users can sign in more easily. What is wrong with this plan?

**Answer:** Lowercasing changes the secret and reduces the set of possible passwords. Passwords should not be normalized, trimmed, or changed implicitly. Apply a consistent, documented handling policy and verify exactly the intended submitted value.

### 37. A password hash accidentally appears in an API response even though its schema field uses **select: false**. What design change prevents this class of leak?

**Answer:** Build responses from an explicit allowlist such as an object containing only the account ID, public username, and display name. Treat field-selection defaults as defense in depth, not as the response security boundary.

### 38. An attacker sends many large registration requests to make Argon2id consume server resources. What controls should be applied before hashing?

**Answer:** Enforce request-body and password-size limits, validate types and lengths, rate-limit requests, and bound concurrent expensive hash operations. Monitor resource use and reject invalid input before invoking the KDF.

### 39. A registration failure is hard to debug, so a developer wants to log the entire request body. What should the logging design do instead?

**Answer:** Never log the password or other credentials. Log safe structured metadata such as a request ID, outcome category, and carefully chosen nonsecret context under the privacy policy. Keep hashes, tokens, reset links, and database details out of logs and public errors.

### 40. A new user registers with an email address that passes syntax validation. Is the account's email now verified? Describe the next step.

**Answer:** No. Syntax validation does not prove ownership. Send a time-limited verification challenge through the intended channel, activate or confirm the email only after successful verification, and protect the token from disclosure. The public response should follow the application's account-enumeration policy.

## Chapter navigation

| Previous chapter | Lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [049 - Authentication concepts and threat modeling](../lessons/049-authentication-concepts-and-threat-modeling.md) | [Lesson](../lessons/050-password-hashing-and-account-registration.md) | [Example](../examples/050-password-hashing-and-account-registration.md) | [051 - Login, logout, and session strategies](../lessons/051-login-logout-and-session-strategies.md) |
