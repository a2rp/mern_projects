# 050 - Password hashing and account registration

A password is a secret the user knows. If an application stores it in plaintext or with a fast general-purpose hash, a database leak can expose accounts. A password-storage function makes each guess expensive and stores a derived hash that the server can verify later without storing the original password.

Account registration also needs careful identifier handling, input limits, duplicate-account behavior, and protection against automated abuse.

## Learning goals

After this chapter, you should be able to:

- Explain password hashing, salts, and why fast hashes are unsuitable for passwords.
- Choose a maintained password-hashing library and tune its resource cost.
- Design a password policy that supports passphrases and avoids silent truncation.
- Validate registration input before performing expensive hashing.
- Enforce identifier uniqueness with a database unique index.
- Avoid returning password hashes or exposing unnecessary account information.
- Describe how registration fits into verification, abuse controls, and account security.

## Hash passwords; do not store or encrypt them

A password hash is a one-way, deliberately expensive derivation. During registration, the server hashes the submitted password and stores the encoded result. During sign-in, the server asks the password-hashing library to verify a candidate against that stored result.

Do not store plaintext passwords. Do not encrypt passwords for later decryption. The application should never need to recover the original password.

Do not use a fast general-purpose digest such as SHA-256 alone for password storage. Fast hashes are designed to process data quickly, which lets an attacker test many guesses rapidly after stealing a password database.

### Salts and encoded hashes

A password-hashing library generates a unique random **salt** for each hash and stores the salt and algorithm parameters in an encoded string. The salt prevents identical passwords from producing identical stored values and defeats precomputed lookup tables.

The library also stores the algorithm name and cost parameters in the encoded hash. Store that complete string. Do not invent a salt format or store a single fixed salt for all users.

A salt is not a secret. A **pepper** is a separate secret key sometimes used as additional defense in depth. It must be stored outside the password database and managed like a production secret. A pepper does not replace a password hash, unique salt, or database controls.

## Choose and tune a password-hashing algorithm

For new systems, use a maintained password-hashing library with **Argon2id** where it is supported. It is designed to make guessing expensive in both memory and computation. A commonly cited minimum configuration is:

| Parameter | Example minimum |
| --- | --- |
| Memory | 19 MiB |
| Iterations / time cost | 2 |
| Parallelism | 1 |

These values are a starting point, not a universal production setting. Benchmark on the actual deployment hardware and expected login/register load. Keep enough memory and CPU capacity for normal traffic, and limit how many expensive hash operations an attacker can trigger concurrently.

If Argon2id is unavailable, use a suitable password KDF such as scrypt. bcrypt is generally a legacy choice when better options are unavailable; many implementations have a 72-byte input limit. Never silently truncate passwords to fit an algorithm.

The stored encoding allows parameters to be upgraded later. After a successful sign-in, an application can verify whether the hash uses outdated parameters and rehash the password when needed. The next chapters cover sign-in and session handling.

## Set a useful password policy

Password rules should help users choose memorable, hard-to-guess secrets without rejecting reasonable passphrases.

- Set a minimum length appropriate to the authentication design. A common guidance is at least 15 characters when a password is the only factor, or at least 8 when it is used as part of MFA.
- Allow long passwords and passphrases; support at least 64 characters.
- Permit spaces and a broad range of characters. Avoid arbitrary rules requiring one uppercase letter, one digit, and one symbol.
- Reject common or known-compromised passwords using an appropriate blocklist.
- Do not silently truncate, trim, lowercase, or otherwise change a password.
- Set a reasonable upper bound and request-body limit to prevent excessive hashing work. Reject too-long values clearly.
- Define a consistent Unicode policy. Do not normalize a password differently during registration and verification.

The exact limits depend on the password-hashing library and system resource budget. Count and bound input deliberately; a very large password can consume memory and CPU before or during hashing.

## Register an account safely

A typical registration flow is:

1. Apply request-size limits and parse the expected content type.
2. Validate the identifier and password shape without logging the password.
3. Apply rate limits and any required password blocklist checks before hashing.
4. Normalize the identifier according to a documented policy.
5. Hash the password using a maintained library and an appropriate work factor.
6. Create the account with the encoded password hash and a database-enforced unique index.
7. Return a response containing only fields safe for the client.
8. If email is used as an identifier, verify ownership before enabling account use.
9. Emit security events without logging the password, hash, verification token, or other credentials.

Do not rely on a "does this account already exist?" query as the uniqueness guarantee. Two concurrent requests can both pass that check. A unique database index is the final authority; handle its duplicate-key error safely.

### Normalize identifiers deliberately

A username policy can define a simple canonical form, such as case-insensitive lowercase ASCII usernames. Apply that same rule during registration, sign-in, recovery, and account linking.

Email addresses need more care. Preserve the user's original address for display or communication and define a separate comparison form. The domain is case-insensitive; the local part has edge cases and should not be changed using provider-specific assumptions. Do not remove dots or plus-addressing based on a particular email provider unless the system fully controls that behavior. Validate with a maintained email library rather than a simplistic regular expression, and verify address ownership before account activation.

## Avoid account enumeration

Registration, login, and recovery responses can reveal whether an identifier exists. Different messages, HTTP statuses, response sizes, and processing times can all create a discrepancy.

For example, returning **409 USERNAME_ALREADY_EXISTS** is convenient for a registration form, but it tells the caller that the name is taken. A privacy-sensitive flow can use a generic response, require a verification step, and return the same public result whether an account was new or already present. This is a product and threat-model decision; document the tradeoff and avoid inconsistent behavior.

Do not perform a quick exit that makes one case dramatically faster than another when the identifier is known. Rate limiting and monitoring help reduce automated enumeration, but they do not replace careful response design.

## Protect the stored hash and the API

Password hashes are not plaintext, but a stolen hash can be attacked offline. Protect the database, backups, exports, and access logs. Do not return the hash in account JSON or include it in error messages.

In Mongoose, a field option such as **select: false** can reduce accidental reads, but it does not replace response allowlisting. Build a public response object explicitly instead of serializing an account document wholesale.

Only accept fields the registration endpoint is designed to handle. Do not let clients set roles, verified status, password hashes, account flags, or internal IDs. Keep authorization and identity verification separate from the registration body.

## Error handling and operational safeguards

- Validate type, length, and basic syntax before running Argon2id.
- Configure a JSON body-size limit and reject oversized input.
- Rate-limit registration and sign-in by multiple useful signals; avoid lockout behavior that lets an attacker deny service to a victim.
- Handle duplicate-key errors from the unique index without exposing database details.
- Do not log request bodies, passwords, password hashes, tokens, or reset links.
- Log security events such as registration attempts and failures with safe metadata, subject to privacy and retention policy.
- Consider email verification before enabling an email-based account.
- Require stronger authentication or re-authentication for sensitive account changes.
- Benchmark hashing under concurrent load and monitor for resource exhaustion.

## Summary

Use a maintained, adaptive password-hashing library such as Argon2id. Let the library generate a unique salt and store the complete encoded hash. Accept useful passphrases, bound input responsibly, and never silently change a password. Enforce identifier uniqueness with a database index, handle duplicate writes safely, and return only public account fields. Registration is part of the larger authentication system: verification, rate limits, recovery, sessions, and authorization need their own controls.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [049 - Authentication concepts and threat modeling](049-authentication-concepts-and-threat-modeling.md) | [Q&A](../qnas/050-password-hashing-and-account-registration.md) | [Example](../examples/050-password-hashing-and-account-registration.md) | [051 - Login, logout, and session strategies](051-login-logout-and-session-strategies.md) |
