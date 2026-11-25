# 053 - Authorization and role-based access

Authentication answers **who is making this request?** Authorization answers **may this authenticated identity perform this action on this resource now?** Logging in does not make every later request safe. The API must make an authorization decision for each protected action.

This chapter extends the authenticated session model from chapter 051 and the credential lifecycle from chapter 052. It focuses on server-side permission checks in an Express and MongoDB application.

## Learning goals

After this chapter, you should be able to:

- Distinguish authentication from authorization and explain common HTTP responses.
- Design a small role and permission model using least privilege.
- Apply authorization to routes, individual records, and tenant boundaries.
- Prevent users from assigning themselves roles, owners, or organizations.
- Keep list, read, create, update, and delete rules consistent.
- Test both allowed and denied cases, including direct-object and cross-tenant access.

## Authentication is not authorization

A valid session tells the server which account is making a request. It does not automatically tell the server what the account may do.

For example, after authentication the server may have trusted context like:

~~~js
req.user = {
  id: "account id loaded by the server",
  organizationId: "organization id loaded by the server",
  role: "member"
};
~~~

This context must come from a validated session or credential and trusted server-side data. It must not be copied from a request body, query string, URL, or client-controlled header.

The browser can hide an Edit button from a member, but a user can still call the API directly. React controls improve usability; only server-side checks protect data and actions.

## Authentication and authorization responses

Use response codes consistently:

| Situation | Typical response |
| --- | --- |
| No valid authentication was provided | **401 Unauthorized** |
| The identity is valid but lacks permission | **403 Forbidden** |
| The resource does not exist | **404 Not Found** |
| The resource is intentionally concealed from this identity | **404 Not Found** can be appropriate |

A 401 response means the request needs valid authentication. A 403 response means the server understood the identity but refuses the action. Some applications deliberately return 404 for an inaccessible record so that callers cannot distinguish a hidden record from a nonexistent one. Choose a policy and apply it consistently; do not reveal sensitive details in error messages.

## Model permissions before routes

A **role** is a named bundle of permissions, such as `member`, `editor`, or `admin`. A **permission** names an operation, such as `article:read`, `article:publish`, or `member:manage`.

A role-to-permission table makes the policy reviewable:

| Role | Read published articles | Create drafts | Edit own draft | Edit any organization article | Publish | Manage members |
| --- | --- | --- | --- | --- | --- | --- |
| Member | Yes | Yes | Yes | No | No | No |
| Editor | Yes | Yes | Yes | Yes | Yes | No |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |

This table describes organization-wide abilities. It does not mean a member may read another member's private draft or that an editor may reach into another organization. A request can need both a role permission and a resource-specific check.

Keep role names and permissions narrow and understandable. Do not make every route an administrator-only route because that is simpler to code. Grant only the permissions needed for a person's work.

## Common authorization models

### Role-based access control

**Role-based access control (RBAC)** maps users to roles and roles to permissions. It works well when users have a small number of stable job functions.

For example, an `editor` role may grant `article:edit:any` and `article:publish`. A route middleware can check those broad permissions.

### Attribute-based access control

**Attribute-based access control (ABAC)** makes a decision using attributes of the user, resource, action, and sometimes environment. For example: allow editing when the user and article have the same organization ID, the user owns the article, and the article is still a draft.

Ownership and tenant isolation are often ABAC-style rules, even in an application that otherwise uses RBAC.

### Resource-specific policy

An access-control list or policy can attach permissions to a specific record. This is useful when access differs per document, project, or team. It requires careful update and revocation behavior so old grants do not linger.

Most applications combine a few roles with resource-specific rules. Start with the simplest model that can state the business rule precisely. Avoid inventing a complex policy engine before the product needs one.

## Deny by default

Every protected action must have an explicit allow rule. If a role is unknown, a permission is absent, or a policy evaluation fails, deny access. Do not interpret a missing role as a powerful default role.

~~~js
const rolePermissions = {
  member: ["article:read", "article:create", "article:edit:own"],
  editor: [
    "article:read",
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
  ],
  admin: [
    "article:read",
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
    "member:manage",
  ],
};

function hasPermission(role, permission) {
  return rolePermissions[role]?.includes(permission) === true;
}
~~~

This example has no wildcard or implicit inheritance. If the application adds a role, it receives no permissions until the policy explicitly grants them.

## Express middleware and route checks

Express middleware runs in order. A protected route commonly needs these steps:

1. Parse and validate the request.
2. Establish trusted authentication context.
3. Check the operation-level permission.
4. Load the target resource within the caller's allowed scope.
5. Apply resource-specific policy.
6. Perform the operation and return only permitted fields.

A reusable guard can check a broad permission:

~~~js
function requirePermission(permission) {
  return function permissionGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Forbidden." });
    }

    next();
  };
}
~~~

The guard is not sufficient by itself for records whose access depends on ownership or organization. Add those checks close to the query or mutation so they cannot be skipped accidentally.

Do not protect a route only in React, and do not assume an obscure URL is private. APIs must check every HTTP method and every endpoint that accesses protected data.

## Scope database queries to the caller

An **insecure direct object reference (IDOR)** occurs when a caller changes an identifier and the server returns or changes a record without checking whether the caller may access it.

This is unsafe:

~~~js
const article = await Article.findById(req.params.id);
~~~

It looks up any article by an identifier supplied in the request. Instead, include trusted scope in the query:

~~~js
const article = await Article.findOne({
  _id: req.params.id,
  organizationId: req.user.organizationId,
});
~~~

If members may only read their own drafts while published articles are shared within the organization, express that rule in the query or an explicit policy:

~~~js
const article = await Article.findOne({
  _id: req.params.id,
  organizationId: req.user.organizationId,
  $or: [
    { status: "published" },
    { ownerId: req.user.id },
    ...(hasPermission(req.user.role, "article:read:any")
      ? [{}]
      : []),
  ],
});
~~~

In production code, prefer a clearly named query builder or policy function over a complicated conditional that is hard to review. The important property is that the record lookup is scoped before it is returned or changed.

A list endpoint needs the same care. Query only records the caller is allowed to see. Fetching every record and filtering some out later can leak data through counts, pagination, sorting, timing, or accidental serialization.

## Check ownership and organization on writes

A user may be allowed to edit a record only when all relevant conditions hold. For a member editing a draft, that may mean:

- The article ID is valid.
- The article belongs to the user's organization.
- The user owns the article.
- The article is still a draft.
- The requested fields are editable.

Do not use a client-supplied `ownerId`, `organizationId`, or `role` to decide this. Load the trusted values from the authenticated account and stored record.

Use allowlists for updates. Never pass an arbitrary request body directly into a database update:

~~~js
// Avoid: accepts fields the client should not control.
await Article.findByIdAndUpdate(articleId, req.body);
~~~

Instead, pick and validate fields that the user may edit:

~~~js
const updates = {
  title: validatedTitle,
  body: validatedBody,
};

await Article.updateOne(
  { _id: articleId, organizationId: req.user.organizationId },
  { $set: updates }
);
~~~

This prevents mass assignment, where a caller adds fields such as `role`, `ownerId`, `organizationId`, or `status` to a request body and the server stores them without permission checks.

## Authentication context and role changes

Load a user's current role and organization from trusted server-side data. If the application stores a role snapshot in a long-lived session or token, define how privilege changes take effect. Otherwise a demoted account may keep an old administrator role until the credential expires.

For sensitive applications, reload authorization attributes on each request, use short-lived credentials with deliberate revocation, or version sessions so changes invalidate stale credentials. A cached decision is safe only when its invalidation and maximum staleness are understood.

Never allow self-service profile updates to change privileged fields. Role grants, organization transfers, and account disabling need a separate, authorized administrative workflow. Protect that workflow against changing the current administrator in a way that locks out all administrators.

## Tenant isolation

A tenant is an organization, workspace, or customer boundary within a shared application. Every read and write must carry the tenant scope from trusted identity context.

Do not take a tenant ID directly from the request and assume it is valid. A user may supply an organization ID to select context only if the server first checks that the account belongs to that organization and the selected context is allowed. Then use the verified organization ID consistently in all data access.

Tenant scope should cover:

- Individual document lookups and updates.
- List queries, counts, exports, and search.
- Nested resources and file downloads.
- Background jobs and administrative actions.
- Cache keys and any data copied to another service.

A single unscoped query can expose data across every tenant.

## Frontend behavior

The React interface can hide controls a user cannot use and show a helpful explanation. It may request capabilities from the API to decide which controls to display. These decisions are only presentation hints.

The server remains authoritative. It must re-check the current identity, permission, record, organization, and workflow state when the user submits the action. A stale browser tab, modified JavaScript, or handcrafted HTTP request must not bypass the policy.

## Errors, logs, and audit events

Return a small, predictable error response. Do not include stack traces, secret policy data, internal account notes, or another tenant's identifiers.

For administrative actions such as changing roles, transferring ownership, publishing, or deleting a record, maintain an audit event when appropriate. Record the actor, action, target, timestamp, and outcome. Do not log session identifiers, bearer tokens, passwords, or full sensitive request bodies.

Authorization failures can be useful security signals. Monitor unusual repeated denials and cross-tenant probes, while avoiding logs that expose protected content.

## Testing authorization rules

For each protected operation, test both the intended allow case and nearby deny cases. A useful matrix includes:

- Anonymous caller.
- Authenticated member.
- Owner of the target record.
- Different member in the same organization.
- Editor in the same organization.
- Administrator in the same organization.
- User from a different organization.
- Disabled account or unknown role.
- Missing, malformed, or tampered resource ID.
- Attempts to submit privileged fields in a request body.
- All supported HTTP methods, including alternate routes to the same operation.

Test the API directly rather than relying only on a browser screen. Assert that denied requests do not change data. Also test list counts and pagination so they do not disclose records outside the caller's scope.

## Common mistakes

- Treating a successful login as permission to access every resource.
- Trusting a role, owner, or tenant ID provided by the browser.
- Checking a role but forgetting object ownership or tenant boundaries.
- Scoping a single-record lookup but leaving list, export, or count queries unscoped.
- Hiding a button in React and leaving the API open.
- Updating a document with the full request body.
- Adding a new route without adding an explicit authorization decision.
- Returning a different error that confirms a sensitive record exists.
- Caching role decisions without a clear revocation strategy.

## Summary

Authorization is a server-side decision for an authenticated identity, action, and resource. Use explicit permissions, least privilege, and deny-by-default behavior. Check every endpoint, scope MongoDB reads and writes to the trusted organization and resource policy, and allow only intended fields to change. Frontend visibility is a usability feature; it is never an authorization boundary.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [052 - Cookies, tokens, refresh, and expiration](052-cookies-tokens-refresh-and-expiration.md) | [Q&A](../qnas/053-authorization-and-role-based-access.md) | [Example](../examples/053-authorization-and-role-based-access.md) | [054 - CSRF, XSS, and injection protection](054-csrf-xss-and-injection-protection.md) |
