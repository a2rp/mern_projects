# 049 - Authentication concepts and threat modeling: example

This is a worked threat-modeling example for a small MERN customer portal. It covers account sign-in, authenticated sessions, reading a customer's own orders, and password recovery. It is a design review artifact, not a complete authentication implementation.

The example does not implement login, password hashing, cookies, tokens, or authorization middleware. Those implementation topics have their own chapters. The example code is not run.

## Scenario and scope

A customer portal uses a React browser application, an Express API, MongoDB, and an email provider. Customers can sign in, read their own orders, and request account recovery.

### In scope

- Account sign-in and sign-out.
- Carrying authenticated state between browser requests.
- Reading a customer's private order data.
- Password-recovery request and completion.
- Authentication secrets in requests, storage, and logs.
- Abuse of login and recovery endpoints.

### Out of scope for this example

- Payment-provider processing.
- Detailed password-hashing parameters.
- A particular session or token library configuration.
- Full role and permission policy for staff.
- Production risk acceptance. The risk ratings below are illustrative.

## System model

Start with the actors, components, data flows, and boundaries. A simple request flow is:

~~~text
Customer browser
    | sign-in, session credential, recovery request
    v
[Trust boundary: public network and TLS termination]
Reverse proxy
    | HTTPS application request
    v
Express API
    | account lookup, session validation, per-request access checks
    +---------------------> MongoDB
    |                         accounts, sessions, orders, audit events
    |
    +---------------------> Email provider
                              time-limited recovery message

Support operator
    | approved support workflow
    v
Express API and restricted administrative tools
~~~

The diagram should reflect the real deployment. Add a separate trust boundary if TLS terminates at a load balancer and traffic then crosses an internal network. Include queues, caches, observability services, identity providers, and administrative systems when the application uses them.

### Trust boundaries to review

| Boundary | Data crossing it | Review question |
| --- | --- | --- |
| Browser to public API | Password, session cookie or token, route parameters, request body | Is transport protected, and does the API validate and authorize every request? |
| API to MongoDB | Account identifiers, password hash, session state, order queries | Can only the API access the database, and are queries scoped to the authenticated user? |
| API to email provider | Recipient address and recovery link or token | Is the recovery secret protected from logs, redirects, and replay? |
| Support tools to customer accounts | Identity claims, account-recovery or account-change actions | Is access limited, authenticated, auditable, and resistant to social engineering? |

## Identify assets and attacker assumptions

### Assets

| Asset | Why it matters | Example classification |
| --- | --- | --- |
| Password and password hash | A password can grant account access; a hash can support offline guessing if stolen. | Secret |
| Session identifiers or access tokens | Possession may allow an attacker to impersonate an authenticated user. | Secret |
| Recovery token | May allow account access or password replacement. | Secret and short-lived |
| Customer profile and order data | Private data that should be available only to authorized users. | Private |
| Signing keys and service credentials | Can authorize or impersonate services if exposed. | Secret |
| Authentication and account-change events | Support investigation and accountability, but must not contain credentials. | Restricted operational data |

### Attacker assumptions

For this review, assume an attacker can:

- Send arbitrary requests from the internet and control the request body, headers, and URL parameters.
- Automate sign-in and recovery attempts.
- Create an ordinary account and attempt to access another account's data.
- Read public responses and observe visible timing and status differences.
- Exploit a stolen credential or recovery link if the victim is tricked into disclosing it.

Do not assume the attacker can access the production database or deployment secrets unless that is part of the threat being modeled. If the application handles higher-value data or a different user population, revise the assumptions.

## Apply the four threat-model questions

### 1. What are we building?

A customer portal with sign-in, authenticated requests, private orders, account recovery, an Express API, MongoDB, and an email service. The diagram and asset table above define the current scope and key trust boundaries.

### 2. What can go wrong?

Use STRIDE as a prompt for threats, then add workflow-specific abuse cases. For example:

- A stolen session impersonates a customer.
- A caller changes an order ID to read another customer's data.
- A recovery link is replayed after use.
- Login error messages reveal which email addresses have accounts.
- Logs accidentally capture a session cookie or recovery token.
- A forged role or account identifier bypasses a server-side check.

### 3. What will we do about it?

The threat register below assigns a response and a way to verify it. An initial rating and target residual rating are illustrative; the application team must reassess them against real impact, likelihood, and deployment controls.

| ID | Threat and STRIDE prompt | Initial risk | Mitigation decision | Owner and evidence | Illustrative residual |
| --- | --- | --- | --- | --- | --- |
| T1 | **Spoofing:** stolen password or session lets an attacker impersonate a customer. | High | Protect credential transport with TLS; use a deliberate session design; rotate and revoke sessions; add rate limits and MFA according to account risk. | API team: verify session rotation, logout revocation, TLS configuration, and monitored login throttling. | Medium |
| T2 | **Information disclosure:** login or recovery responses reveal whether an account exists. | Medium | Use generic public responses for unknown accounts and incorrect credentials; review timing and abuse controls. | API team: compare response behavior for known and unknown accounts; review rate-limit events. | Low |
| T3 | **Elevation of privilege / tampering:** a user edits an account ID, role, or order ID in a request. | High | Derive identity from verified server-side authentication state. Enforce ownership and permissions in the API query or service for every protected operation. | API team: verify that one test account cannot retrieve or change another account's records. | Low |
| T4 | **Spoofing / tampering:** a recovery token is guessed, leaked, or reused. | High | Make recovery tokens unpredictable, short-lived, single-use, and bound to the intended account and action. Do not place them in logs or unrelated redirects. | Identity team: verify expiry, single-use behavior, account binding, and log redaction. | Medium |
| T5 | **Information disclosure:** logs, analytics, or error reports capture passwords, session IDs, or recovery tokens. | High | Redact credentials at logging boundaries; avoid logging raw request bodies and authorization headers; restrict log access and retention. | Operations team: scan representative logs and error reports for seeded test secrets. | Low |
| T6 | **Denial of service:** automated login or recovery requests consume capacity or lock out legitimate users. | Medium | Apply layered rate limits, resource bounds, abuse monitoring, and recovery controls that do not let an attacker trivially lock out a victim. | API and operations teams: exercise throttling and alerting under controlled load. | Medium |
| T7 | **Repudiation:** a sensitive account change cannot be investigated because there is no useful audit event. | Medium | Record the authenticated actor, action, target, result, timestamp, and request correlation ID without recording secrets. Protect audit events from casual modification. | Operations team: verify representative account-change events and access controls for audit data. | Low |
| T8 | **Support-workflow abuse:** an attacker persuades support to bypass recovery checks or change account ownership. | High | Define a documented support process, require strong staff authentication, separate approval for high-impact changes, notify the account owner, and record the action. | Support and security owners: review a tabletop scenario and inspect the approval/audit trail. | Medium |

A “Low” residual rating in this sample is not a guarantee of safety. It means the illustrative team believes the listed controls reduce the risk for the stated assumptions and plans to verify them. Change the rating if evidence or deployment conditions differ.

### 4. Did we do enough?

Review the diagram and threat register when the design changes. Confirm that each mitigation has an owner and that evidence exists before treating it as complete. Revisit the model when adding a new login provider, mobile client, session store, admin tool, recovery channel, or sensitive operation.

## One request, two different security checks

Suppose the browser requests **GET /api/orders/order-92**. The request claims which order it wants, but the URL alone does not establish who the user is.

The intended server-side flow is:

1. Validate the session or token and derive the authenticated user identity.
2. Use that verified identity in the authorization decision.
3. Retrieve the order only if it belongs to that user or another explicit policy permits access.
4. Return a safe response and record the appropriate audit event.

The secure data-access idea can be summarized as:

~~~text
order = find order where:
    order ID = requested order ID
    AND owner ID = verified authenticated user ID
~~~

Do not build the query using a user ID or role supplied by the browser. A frontend route guard can improve the user experience, but the API must enforce the permission because a caller can bypass the frontend and send requests directly.

## Threat-model review output

A useful review should leave behind an actionable record:

- **Scope:** sign-in, sessions, customer orders, and account recovery.
- **System model:** components, external actors, data stores, data flows, and trust boundaries.
- **Assets:** credentials, recovery secrets, customer data, signing keys, and audit records.
- **Threats:** specific abuse cases tied to a component or flow.
- **Decisions:** mitigation, avoidance, transfer, or explicit risk acceptance for each threat.
- **Owners:** named teams or roles accountable for controls.
- **Evidence:** tests, configuration review, log inspection, or an operational exercise that checks the mitigation.
- **Residual risks:** remaining concerns and assumptions that need monitoring or a later decision.

For this example, the review identified eight threats, selected mitigations for each, assigned verification owners, and called out remaining medium risks for session theft, recovery-token abuse, availability, and support workflows. The implementation is not considered complete until the owners verify their controls.

## Verification plan

These are planned checks for the future implementation. They are not executed by this documentation example.

- Sign in as customer A and confirm the API denies access to customer B's order.
- Confirm a forged role or account ID in the request body does not change the authenticated identity.
- Confirm logout or revocation makes the old session unusable.
- Confirm recovery secrets expire, cannot be reused, and do not appear in logs.
- Compare login and recovery responses for existing and unknown accounts.
- Confirm request throttling applies without enabling trivial victim lockout.
- Review audit events for sensitive account changes and verify that secrets are absent.
- Walk through a support recovery scenario and verify required approvals and notifications.

## What this example teaches

- Threat modeling starts from the actual system and data flows, not a generic list of attacks.
- STRIDE helps generate threat questions; business-specific abuse cases add context.
- Authentication establishes identity, while authorization protects each resource and action.
- Recovery, support, logging, and availability are part of the authentication threat surface.
- A mitigation needs an owner and verification evidence.
- The model should change when the architecture, data, or attacker assumptions change.

## Chapter navigation

| Previous chapter | Lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [048 - CORS and browser cross-origin requests](../lessons/048-cors-and-browser-cross-origin-requests.md) | [Lesson](../lessons/049-authentication-concepts-and-threat-modeling.md) | [Q&A](../qnas/049-authentication-concepts-and-threat-modeling.md) | [050 - Password hashing and account registration](../lessons/050-password-hashing-and-account-registration.md) |
