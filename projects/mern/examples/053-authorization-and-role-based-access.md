# 053 - Authorization and role-based access: example

This example adds role and resource authorization to the Express session API from chapter 051. It loads the current account and role from MongoDB on each request, scopes article operations to the authenticated user's organization, and keeps ownership and workflow rules on the server.

The code is a learning example and is not run. Integrate it into the chapter 051 API after the existing JSON, session, and CSRF middleware. It assumes that a successful login sets `req.session.userId` to the authenticated account ID. Keep the login, logout, session store, cookie, and CSRF configuration from that chapter.

## What the example demonstrates

- Load current authorization attributes from the database instead of trusting role data from the browser.
- Give members, editors, and administrators different explicit permissions.
- Let members edit only their own drafts.
- Scope every article query to the authenticated organization.
- Allow editors and administrators to publish articles in their own organization.
- Allow only administrators to view organization member summaries or delete any organization article.
- Reject client-supplied role, owner, organization, and workflow fields.
- Return 404 for inaccessible article IDs under this example's concealment policy.

## Prerequisites

Use the Express application and MongoDB connection from chapter 051. Install Mongoose and Express if they are not already installed:

~~~powershell
npm install express mongoose
~~~

Chapter 051 calls its account model `User`. Merge trusted authorization fields like these into that existing schema; do not create a second account collection. The route factory below calls the injected model `Account`, so pass the chapter 051 `User` model as `Account: User`.

~~~js
const roleValues = ["member", "editor", "admin"];

const authorizationFields = {
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: roleValues,
    default: "member",
    required: true,
  },
  disabledAt: {
    type: Date,
    default: null,
  },
};
~~~

Provision roles using a trusted administrative process. Do not add `role` to a self-service profile update. For a real product, the account's organization membership and role-grant workflow should match its business rules.

## Article model

Add an article model with explicit owner, organization, and workflow state fields. These values are set by the server.

~~~js
const mongoose = require("mongoose");

const { Schema } = mongoose;

const articleSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

articleSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
articleSchema.index({ organizationId: 1, ownerId: 1, status: 1 });

const Article = mongoose.model("Article", articleSchema);
~~~

If the model already exists, merge the fields and indexes into it. Do not create an unscoped duplicate model just for this example.

## Authorization routes

Create **authorization-routes.js**. The route factory receives the existing account model and the article model. It expects session middleware to run before the router and expects `express.json()` to be enabled.

~~~js
const express = require("express");
const mongoose = require("mongoose");

const ROLE_PERMISSIONS = Object.freeze({
  member: new Set([
    "article:read:published",
    "article:create",
    "article:edit:own",
    "article:delete:own-draft",
  ]),
  editor: new Set([
    "article:read:published",
    "article:read:any",
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
  ]),
  admin: new Set([
    "article:read:published",
    "article:read:any",
    "article:create",
    "article:edit:own",
    "article:edit:any",
    "article:publish",
    "article:delete:any",
    "member:read",
  ]),
});

function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.has(permission) === true;
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function requireAuthentication(Account) {
  return asyncHandler(async (req, res, next) => {
    const accountId = req.session?.userId;

    if (!accountId || !mongoose.isValidObjectId(accountId)) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const account = await Account.findById(accountId)
      .select("_id organizationId role disabledAt")
      .lean();

    if (!account || account.disabledAt) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const knownRole = Object.prototype.hasOwnProperty.call(
      ROLE_PERMISSIONS,
      account.role
    );

    if (!knownRole || !account.organizationId) {
      return res.status(403).json({ error: "Forbidden." });
    }

    req.user = {
      id: account._id,
      organizationId: account.organizationId,
      role: account.role,
    };

    next();
  });
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function validateArticleFields(body, { partial = false } = {}) {
  if (!isPlainObject(body)) {
    return { error: "A JSON object is required." };
  }

  const allowed = new Set(["title", "body"]);
  const keys = Object.keys(body);

  if (keys.some((key) => !allowed.has(key))) {
    return { error: "Only title and body may be changed." };
  }

  if (partial && keys.length === 0) {
    return { error: "Provide at least one editable field." };
  }

  const values = {};

  for (const key of keys) {
    if (typeof body[key] !== "string") {
      return { error: `${key} must be a string.` };
    }

    const value = key === "title" ? body[key].trim() : body[key];

    if (key === "title" && (value.length < 1 || value.length > 120)) {
      return { error: "title must contain 1 to 120 characters." };
    }

    if (key === "body" && (value.length < 1 || value.length > 20000)) {
      return { error: "body must contain 1 to 20000 characters." };
    }

    values[key] = value;
  }

  if (!partial && (!Object.hasOwn(values, "title") || !Object.hasOwn(values, "body"))) {
    return { error: "Both title and body are required." };
  }

  return { values };
}

function validArticleId(value) {
  return mongoose.isValidObjectId(value);
}

function createAuthorizationRouter({ Account, Article }) {
  const router = express.Router();

  router.use(requireAuthentication(Account));

  router.get(
    "/articles",
    asyncHandler(async (req, res) => {
      const filter = {
        organizationId: req.user.organizationId,
      };

      if (!hasPermission(req.user.role, "article:read:any")) {
        filter.$or = [
          { status: "published" },
          { ownerId: req.user.id },
        ];
      }

      const articles = await Article.find(filter)
        .select("_id title body status ownerId createdAt updatedAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(50)
        .lean();

      res.json({ articles });
    })
  );

  router.get(
    "/articles/:articleId",
    asyncHandler(async (req, res) => {
      if (!validArticleId(req.params.articleId)) {
        return res.status(404).json({ error: "Article not found." });
      }

      const filter = {
        _id: req.params.articleId,
        organizationId: req.user.organizationId,
      };

      if (!hasPermission(req.user.role, "article:read:any")) {
        filter.$or = [
          { status: "published" },
          { ownerId: req.user.id },
        ];
      }

      const article = await Article.findOne(filter)
        .select("_id title body status ownerId createdAt updatedAt")
        .lean();

      if (!article) {
        return res.status(404).json({ error: "Article not found." });
      }

      res.json({ article });
    })
  );

  router.post(
    "/articles",
    asyncHandler(async (req, res) => {
      if (!hasPermission(req.user.role, "article:create")) {
        return res.status(403).json({ error: "Forbidden." });
      }

      const result = validateArticleFields(req.body);

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      const article = await Article.create({
        organizationId: req.user.organizationId,
        ownerId: req.user.id,
        title: result.values.title,
        body: result.values.body,
        status: "draft",
      });

      res.status(201).json({
        article: {
          id: article.id,
          title: article.title,
          body: article.body,
          status: article.status,
          ownerId: article.ownerId,
          createdAt: article.createdAt,
        },
      });
    })
  );

  router.patch(
    "/articles/:articleId",
    asyncHandler(async (req, res) => {
      if (!validArticleId(req.params.articleId)) {
        return res.status(404).json({ error: "Article not found." });
      }

      const result = validateArticleFields(req.body, { partial: true });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      const filter = {
        _id: req.params.articleId,
        organizationId: req.user.organizationId,
      };

      if (hasPermission(req.user.role, "article:edit:any")) {
        // Editors and administrators may update any article in their organization.
      } else if (hasPermission(req.user.role, "article:edit:own")) {
        // Members may update only their own drafts.
        filter.ownerId = req.user.id;
        filter.status = "draft";
      } else {
        return res.status(403).json({ error: "Forbidden." });
      }

      const article = await Article.findOneAndUpdate(
        filter,
        { $set: result.values },
        { new: true, runValidators: true }
      )
        .select("_id title body status ownerId createdAt updatedAt")
        .lean();

      if (!article) {
        return res.status(404).json({ error: "Article not found." });
      }

      res.json({ article });
    })
  );

  router.post(
    "/articles/:articleId/publish",
    asyncHandler(async (req, res) => {
      if (!hasPermission(req.user.role, "article:publish")) {
        return res.status(403).json({ error: "Forbidden." });
      }

      if (!validArticleId(req.params.articleId)) {
        return res.status(404).json({ error: "Article not found." });
      }

      const scope = {
        _id: req.params.articleId,
        organizationId: req.user.organizationId,
      };

      const article = await Article.findOneAndUpdate(
        { ...scope, status: "draft" },
        { $set: { status: "published" } },
        { new: true, runValidators: true }
      )
        .select("_id title body status ownerId createdAt updatedAt")
        .lean();

      if (article) {
        return res.json({ article });
      }

      const existsInOrganization = await Article.exists(scope);

      if (!existsInOrganization) {
        return res.status(404).json({ error: "Article not found." });
      }

      res.status(409).json({ error: "Article is not a draft." });
    })
  );

  router.delete(
    "/articles/:articleId",
    asyncHandler(async (req, res) => {
      if (!validArticleId(req.params.articleId)) {
        return res.status(404).json({ error: "Article not found." });
      }

      const filter = {
        _id: req.params.articleId,
        organizationId: req.user.organizationId,
      };

      if (hasPermission(req.user.role, "article:delete:any")) {
        // Administrators may delete any article in their organization.
      } else if (hasPermission(req.user.role, "article:delete:own-draft")) {
        // Members may delete only their own drafts.
        filter.ownerId = req.user.id;
        filter.status = "draft";
      } else {
        return res.status(403).json({ error: "Forbidden." });
      }

      const deleted = await Article.findOneAndDelete(filter).select("_id").lean();

      if (!deleted) {
        return res.status(404).json({ error: "Article not found." });
      }

      res.status(204).end();
    })
  );

  router.get(
    "/members",
    asyncHandler(async (req, res) => {
      if (!hasPermission(req.user.role, "member:read")) {
        return res.status(403).json({ error: "Forbidden." });
      }

      const members = await Account.find({
        organizationId: req.user.organizationId,
        disabledAt: null,
      })
        .select("_id displayName role createdAt")
        .sort({ displayName: 1, _id: 1 })
        .limit(100)
        .lean();

      res.json({ members });
    })
  );

  router.use((error, req, res, next) => {
    // Log only safe operational metadata. Never log cookies, tokens, or request bodies.
    console.error("Authorization API error", {
      name: error?.name || "Error",
      method: req.method,
      path: req.path,
    });

    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  return router;
}

module.exports = { createAuthorizationRouter };
~~~

## Mount the routes

Keep the session middleware and CSRF protection from chapter 051. Mount the authorization router after those middleware and after the MongoDB connection is ready.

~~~js
const { createAuthorizationRouter } = require("./authorization-routes");

// Keep the existing setup from chapter 051:
app.use(express.json({ limit: "16kb" }));
app.use(existingSessionMiddleware);
app.use(existingCsrfProtection);

app.use(
  "/api",
  createAuthorizationRouter({
    Account: User,
    Article,
  })
);
~~~

The existing login handler must regenerate the session after verifying the password and set `req.session.userId` from the database account ID. The router reloads the account on each request, so an account disabled or demoted in MongoDB loses that permission on the next authorization check. Do not put a caller's role in a URL, request body, or client-controlled header.

The CSRF middleware matters because a browser session cookie is sent automatically. Keep the CSRF token flow for state-changing requests. Chapter 054 covers CSRF, XSS, and injection protections in more detail.

## Example requests

Log in through the existing chapter 051 login route first and keep the resulting session cookie. These requests assume the CSRF protection from that application is also satisfied for POST, PATCH, and DELETE requests.

### A member creates a draft

~~~http
POST /api/articles
Content-Type: application/json
Cookie: mern.sid=<member-session>

{
  "title": "A first draft",
  "body": "Draft text written by the signed-in member."
}
~~~

Expected response: **201 Created**. The server sets `ownerId` to the authenticated account, takes `organizationId` from trusted account data, and sets `status` to `draft`. The client cannot choose those fields.

### Another member requests that private draft

~~~http
GET /api/articles/<article-id>
Cookie: mern.sid=<different-member-session>
~~~

Expected response: **404 Article not found**. Under this example's policy, a member can read published articles and their own drafts, but not another member's draft. A user in another organization also receives 404.

### A member tries to assign an administrator role

~~~http
PATCH /api/articles/<article-id>
Content-Type: application/json
Cookie: mern.sid=<member-session>

{
  "title": "Changed title",
  "role": "admin"
}
~~~

Expected response: **400 Only title and body may be changed**. The request is rejected before the database update. No article field or account role changes.

### An editor publishes an in-organization draft

~~~http
POST /api/articles/<article-id>/publish
Cookie: mern.sid=<editor-session>
~~~

Expected response: **200 OK** with the article status set to `published`. An editor in another organization receives 404 because the record is outside the editor's scope.

### An anonymous caller requests a protected list

~~~http
GET /api/articles
~~~

Expected response: **401 Authentication required**. A valid session is needed before the route evaluates the user's permissions.

## Permission summary

| Action | Member | Editor | Admin |
| --- | --- | --- | --- |
| List published articles in own organization | Yes | Yes | Yes |
| Read another user's draft in own organization | No | Yes | Yes |
| Create a draft in own organization | Yes | Yes | Yes |
| Edit own draft | Yes | Yes | Yes |
| Edit another article in own organization | No | Yes | Yes |
| Publish an article in own organization | No | Yes | Yes |
| Delete own draft | Yes | No | Yes |
| Delete any article in own organization | No | No | Yes |
| View member summaries in own organization | No | No | Yes |
| Access an article in another organization | No | No | No |

The checks combine role permissions with organization scope and, for members, ownership and draft state. Roles do not grant access across tenant boundaries.

## Review the behavior

Try each scenario with separate member, editor, and admin accounts in the same organization, then repeat with an account in a different organization:

1. A member lists articles and sees published articles plus that member's own drafts.
2. A member opens another member's draft and receives 404.
3. A member edits their own draft and receives 200.
4. A member attempts to edit a published article or another user's draft and receives 404.
5. A member submits `ownerId`, `organizationId`, `status`, or `role`; the request is rejected.
6. An editor edits or publishes an article from their organization.
7. An editor attempts to read an article from another organization and receives 404.
8. An administrator lists member summaries from their organization, with no password hashes or authentication secrets in the response.
9. An anonymous caller receives 401.
10. A disabled account or an account with an unknown role cannot proceed.

For every denied write, inspect the database and confirm that the record did not change. Test counts, search, exports, and background jobs with the same tenant boundaries when adding those features.

## Production considerations

- Add request rate limits and operational monitoring appropriate for the API.
- Use pagination with a bounded maximum page size for article and member lists.
- Keep CSRF protection enabled for cookie-authenticated state-changing routes.
- Validate and normalize input according to product rules; escape or safely render article text in the React interface.
- Review every route and HTTP method, including exports, nested resources, file downloads, and background jobs.
- Decide how administrator grants are approved, audited, revoked, and protected from accidental removal of the last administrator.
- Ensure audit records do not contain passwords, cookies, bearer tokens, or private article contents.
- If roles or organization memberships are cached elsewhere, define invalidation and maximum staleness.
- Use transactions when one business action changes several records that must stay consistent.
- Do not treat this teaching code as a complete production security review.

## Expected learning outcome

An authenticated user receives only the article actions permitted by the current database role and resource policy. Every article lookup is scoped to that user's organization. Members see published content and their own drafts; editors can edit and publish within their organization; administrators receive the additional member-read and delete permissions. Client-supplied role, ownership, tenant, and workflow fields cannot grant access.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [052 - Cookies, tokens, refresh, and expiration](../lessons/052-cookies-tokens-refresh-and-expiration.md) | [Q&A](../qnas/053-authorization-and-role-based-access.md) | [054 - CSRF, XSS, and injection protection](../lessons/054-csrf-xss-and-injection-protection.md) |
