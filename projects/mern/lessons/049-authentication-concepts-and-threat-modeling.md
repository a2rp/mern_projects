# 049 - Authentication concepts and threat modeling

Authentication answers **who or what is making a request?** Authorization answers **what is that identity allowed to do?** These are related controls, but they solve different problems. A secure MERN application must verify identity, manage authenticated sessions or tokens, and check permission for each protected action.

Threat modeling gives the team a repeatable way to reason about what can go wrong in that authentication flow before implementation and while the system changes.

## Learning goals

After this chapter, you should be able to:

- Distinguish identification, authentication, session management, and authorization.
- Describe common authentication factors and authentication approaches.
- Treat a session ID or bearer token as a credential.
- Identify assets, actors, data flows, and trust boundaries in a MERN application.
- Use STRIDE as a prompt for authentication threats.
- Rank threats and record mitigations, owners, and follow-up checks.

## Identity, authentication, sessions, and authorization

These terms describe different stages:

1. **Identification:** The request claims an identity, such as an account ID or username.
2. **Authentication:** The system verifies evidence for that identity, such as a password, passkey, or identity-provider result.
3. **Session management:** The application carries the authenticated state across later HTTP requests, commonly with a server-side session identifier or a token.
4. **Authorization:** The application checks whether the authenticated identity may perform this specific action on this specific resource.

A login does not grant access to every record or operation. For example, a logged-in customer may read their own order but must not read another customer's order by changing an ID in the URL. The server must check ownership or another explicit permission on every protected operation.

Authentication is not the same as role selection. A browser-supplied role, user ID, or account ID is untrusted input. Derive the identity from verified server-side session state or a validated credential, then check the policy on the server.

## Authentication factors

Authentication evidence is often grouped into three factor categories:

| Factor | Meaning | Example |
| --- | --- | --- |
| Something you know | A secret memorized by the user. | Password or PIN. |
| Something you have | A device or authenticator controlled by the user. | Security key, authenticator app, or registered device. |
| Something you are | A biometric characteristic. | Fingerprint or face match performed by a supported authenticator. |

Using two passwords or a password and a PIN is still one factor category. Multi-factor authentication uses independent factor categories. MFA can reduce risk from stolen passwords, but recovery, enrollment, and help-desk flows must also be protected.

A passkey can provide phishing-resistant authentication through a supported authenticator. The application should use a maintained implementation and protocol rather than inventing its own cryptographic challenge flow.

## Common authentication approaches

### Passwords

Passwords are shared secrets. Transmit them only over TLS, do not log them, and never store them in plaintext or reversible form. Password storage and account-registration implementation are the focus of the next chapter; here, include password handling in the threat model and make the storage decision explicit.

Login and recovery responses should avoid revealing whether a particular account exists. Rate-limit attempts and recovery requests, monitor abuse, and offer MFA for accounts or actions with higher impact.

### Server-side sessions

A session lets the application remember authenticated state across stateless HTTP requests. A browser usually carries a session identifier in a cookie, while the server stores or can validate the associated session.

Treat the session identifier like a password: anyone who steals it may be able to act as that user until it expires or is revoked. Generate unpredictable identifiers, rotate them after login or privilege changes, expire and revoke them deliberately, and invalidate the session on logout.

For browser cookies, consider the attributes **HttpOnly**, **Secure**, and **SameSite**:

- **HttpOnly** prevents ordinary JavaScript from reading the cookie. It does not stop injected script from making requests as the user.
- **Secure** restricts the cookie to secure transport.
- **SameSite** controls some cross-site cookie sending behavior. It does not replace a complete CSRF policy.

A cookie-based session needs a CSRF strategy for state-changing requests. It also needs protection against XSS, because malicious script may still perform actions even if it cannot read an HttpOnly cookie.

### Bearer tokens

A bearer token grants access to whoever possesses it. Send it only over TLS, protect it from logs and unintended disclosure, avoid placing it in URLs, and define its lifetime and revocation behavior. Scope a token to the intended audience and permissions when the design supports those restrictions.

A signed token such as a JWT is not automatically encrypted. A signature can provide integrity and issuer verification when correctly validated; it does not hide the claims. The API must validate signature, issuer, audience, expiry, and other required claims using a maintained library and a deliberate policy. A valid token still does not prove that every requested action is authorized.

For browser applications, avoid assuming that local storage is a safe place for session identifiers or sensitive tokens; JavaScript running in the origin can read it. Cookie-based and token-based designs each have tradeoffs. Choose deliberately and apply the corresponding CSRF, XSS, transport, storage, and revocation controls.

### Identity providers and delegated login

An external identity provider can handle parts of sign-in, but the application still has to validate the provider response, associate the identity with a local account, maintain its own session, and authorize local actions. Use established standards and maintained libraries.

OAuth 2.0 is primarily an authorization framework for delegated access. OpenID Connect adds an identity layer used for authentication. Do not treat an arbitrary OAuth access token as proof of a user's identity.

## Threat modeling

Threat modeling is a structured review of a system's security risks. It is a practical activity that should be revisited when important routes, data stores, identity flows, or trust boundaries change.

A useful review answers four questions:

1. **What are we building?** Describe components, actors, data flows, and trust boundaries.
2. **What can go wrong?** Identify threats for this particular design and rank them.
3. **What will we do about it?** Select mitigations, owners, and acceptable residual risk.
4. **Did we do enough?** Validate that the design and implemented controls match the model.

### Map the authentication flow

For a MERN app, sketch the actual flow rather than only listing components. A basic flow might be:

~~~text
Browser
  -> Express API: login credentials or session cookie
Express API
  -> user store: account lookup and password-hash verification
Express API
  -> session store: create, rotate, expire, or revoke session
Browser
  -> Express API: authenticated request with session cookie
Express API
  -> MongoDB: authorized read or write
~~~

Mark which data crosses each boundary. Include frontend code, reverse proxies, the API, MongoDB, email or SMS providers, identity providers, logs, support staff, and deployment secrets when they are part of the design.

### Identify assets and abuse goals

Assets are things the system must protect or keep available. Examples include:

- User accounts and private profile or order data.
- Password hashes, reset tokens, session IDs, access tokens, and signing keys.
- Privileged actions such as changing email, payment details, or account roles.
- Audit records, support workflows, and service availability.
- The integrity of account ownership and authorization decisions.

For each asset, ask how it could be stolen, changed, misused, exposed, or made unavailable. Consider both attackers outside the system and abuse by an authenticated user or operator.

### Use STRIDE as a prompt

STRIDE is a mnemonic for six threat categories. Apply it to the components, data flows, and trust boundaries in the model:

| Category | Authentication example |
| --- | --- |
| Spoofing | An attacker uses a stolen session ID to impersonate a customer. |
| Tampering | A caller changes an account ID or role in a request. |
| Repudiation | Important account changes lack reliable audit events. |
| Information disclosure | Logs expose passwords, reset tokens, or session identifiers. |
| Denial of service | Automated login or recovery attempts consume service capacity or lock out users. |
| Elevation of privilege | A normal account obtains an administrator action through a missing server-side permission check. |

STRIDE is a way to generate questions, not a guarantee that every risk is identified. Add business-specific abuse cases, such as repeated password resets, changing the account email before taking over a purchase, or replaying a sensitive operation.

### Rank threats and choose responses

For each threat, record:

- The affected asset, component, data flow, and trust boundary.
- The attacker capability and the preconditions required.
- Likely impact and a reasoned likelihood estimate.
- The chosen response: mitigate, avoid or remove, transfer, or explicitly accept the risk.
- The mitigation owner and how its effectiveness will be checked.
- Any remaining risk after the mitigation.

A simple likelihood-and-impact matrix can help prioritize work, but estimates are not precise measurements. Explain assumptions and do not let a low numeric score hide a severe consequence or a regulatory requirement.

## Example: threat-model a customer sign-in

| Threat | Impact | Example mitigation |
| --- | --- | --- |
| Password guessing or credential stuffing | Account takeover or service exhaustion. | Rate-limit by account and network signals, use MFA where appropriate, monitor abuse, and design recovery carefully. |
| Account enumeration | Attackers learn which email addresses have accounts. | Use generic login and recovery responses and avoid timing differences where practical. |
| Session theft | Attacker impersonates a logged-in customer. | Use TLS, protect cookie attributes, rotate and revoke sessions, reduce XSS risk, and avoid leaking session IDs in logs. |
| Broken object authorization | One customer reads another customer's records. | Derive identity from the verified session and check ownership or permission on every operation. |
| Password-reset token theft or replay | Account takeover through recovery. | Make reset tokens unpredictable, short-lived, single-use, and protected from logs and referrer leakage. |
| Insecure account recovery | Attacker bypasses the normal sign-in controls. | Threat-model recovery as part of authentication; verify the user appropriately and notify them about sensitive changes. |

These are starting points, not a universal checklist. Choose defenses based on the data, user population, threat environment, and consequences of compromise.

## Security review checklist

Before shipping an authentication flow, ask:

- What identity does each request claim, and what evidence verifies it?
- Are authentication and authorization implemented as distinct checks?
- Are all secrets transmitted over TLS and kept out of logs, URLs, analytics, and error messages?
- Can users enumerate accounts through login, registration, or recovery responses?
- Can sessions or tokens be rotated, expired, and revoked after logout, compromise, or account changes?
- Does the API check ownership and permissions for every protected resource and action?
- Are login, MFA, recovery, and sensitive-account changes rate-limited and monitored?
- Can an attacker abuse password reset, email change, MFA enrollment, or support recovery?
- Are browser storage, cookies, CSRF, and XSS risks covered by the chosen session design?
- Does the threat model show current components, data flows, trust boundaries, mitigations, and remaining risks?
- Who will review the model after a major authentication or authorization change?

## Summary

Authentication establishes an identity; session management carries that authenticated state; authorization decides what that identity may do. Treat passwords, session IDs, and bearer tokens as secrets. Threat-model the full sign-in, session, recovery, and authorization flows by mapping components and trust boundaries, identifying threats, ranking them, choosing mitigations, and reviewing the result as the system changes.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [048 - CORS and browser cross-origin requests](048-cors-and-browser-cross-origin-requests.md) | [Q&A](../qnas/049-authentication-concepts-and-threat-modeling.md) | [Example](../examples/049-authentication-concepts-and-threat-modeling.md) | [050 - Password hashing and account registration](050-password-hashing-and-account-registration.md) |
