# 079 - Authentication user experience

Authentication answers “Who is signed in?” Authorization answers “What may this user do?” A good sign-in flow makes both states understandable to the user, while the server remains responsible for deciding whether a request is allowed.

This chapter focuses on the browser experience around authentication: signing in, restoring a session, protecting routes in the interface, handling expired sessions, and signing out. A hidden React page is not access control. Every protected API request must verify the session and the user’s permission on the server.

## Learning goals

After this chapter, you should be able to:

- Explain authentication and authorization as separate responsibilities.
- Model the browser’s authentication state without confusing “not checked yet” with “signed out.”
- Build accessible sign-in and sign-out interactions.
- Restore the current user from a server-managed session.
- Protect client routes for navigation while protecting API routes on the server.
- Preserve a safe intended destination after sign-in.
- Handle generic credential errors, session expiry, and network failures clearly.
- Use secure cookie-backed sessions without exposing credentials to browser storage.

## Authentication is not authorization

Authentication verifies an identity, usually with credentials such as an email address and password. Authorization decides whether the authenticated identity can perform a specific action on a specific resource.

For example:

- A signed-out visitor is not authenticated.
- A signed-in user may be authenticated but not allowed to edit another user’s course.
- A signed-in administrator may have additional permissions, but the API must still check those permissions for each protected operation.

Do not treat a client-side condition such as <code>user.role === "admin"</code> as authorization. Browser state is controlled by the visitor. The API must load or verify the authenticated identity and make the permission decision itself.

## Model authentication as an explicit state

At application startup, the browser may not know whether a session is still valid. A request to the server must establish that. Represent this “checking” period explicitly:

~~~js
const authState = {
  status: "loading", // loading | authenticated | anonymous | error
  user: null,
};
~~~

These states have distinct meanings:

- <code>loading</code>: the app is checking whether the existing session is valid.
- <code>authenticated</code>: the server confirmed a current user.
- <code>anonymous</code>: the server confirmed that there is no valid session.
- <code>error</code>: the app could not determine the state, for example because the network is unavailable.

Do not render a protected page while status is <code>loading</code>. Do not convert every network failure into “signed out”; show a retryable session-check error instead. Otherwise a temporary outage can look like an unexpected logout.

## Make the sign-in form clear and accessible

A sign-in form should use a real form, persistent labels, appropriate autocomplete hints, and a clear submit button:

~~~jsx
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    name="email"
    type="email"
    autoComplete="username"
    required
  />

  <label htmlFor="password">Password</label>
  <input
    id="password"
    name="password"
    type="password"
    autoComplete="current-password"
    required
  />

  <button type="submit">Sign in</button>
</form>
~~~

Use <code>autoComplete="username"</code> for the account identifier, even when it is an email address. Use <code>autoComplete="current-password"</code> for an existing password. These hints help browsers and password managers support the user.

Keep the form usable with a keyboard and assistive technology. Give every input a visible label. Associate an error message with the relevant field. Put focus on the error summary or first invalid field only when doing so helps the user recover. Do not rely on color alone, and do not clear the email or other non-secret fields after a failed attempt.

A show-password control can help users avoid typing mistakes. If provided, make it a <code>type="button"</code>, label it clearly, and preserve the password field’s value when toggling visibility. Do not make password visibility the only way to inspect a value, and do not log the password.

## Give safe, useful feedback

A typical sign-in flow has these states:

1. Ready for input.
2. Submitting credentials.
3. Signed in.
4. Credentials rejected.
5. Network or service failure.

Disable repeated submission while the request is pending and show a clear pending label. On success, update the shared authentication state and navigate to the requested in-app page or a sensible default. On failure, keep the user’s email available, clear the password if appropriate, and explain how to continue.

Use a generic message for rejected credentials, such as “Email or password is incorrect.” Do not reveal whether an email address exists, whether a password was wrong, or whether an account is locked. Rate-limit repeated attempts on the server and show a calm message if the service asks the user to wait.

Separate credential rejection from a network problem. “Email or password is incorrect” is actionable for a rejected login; “We couldn’t reach the server. Check your connection and try again” is appropriate when no response arrived. Never show a stack trace, database message, or raw server exception to the user.

Registration, recovery, and reset flows should also avoid revealing whether an account exists. For example, a recovery confirmation can say that instructions will be sent if the address belongs to an account.

## Restore a server-managed session

After a page reload, React memory is empty, but the browser may still have an authenticated session. Ask the server for the current user:

~~~js
const response = await fetch("/api/auth/me", {
  credentials: "include",
  headers: { Accept: "application/json" },
});
~~~

For a same-origin app, the browser sends cookies according to their normal rules. If the frontend and API use different origins, credentialed requests also require an exact allowed origin and credential support in the server’s CORS policy. A wildcard origin cannot be used with credentialed CORS.

The session cookie should be inaccessible to JavaScript and sent only under the intended transport and site conditions. A typical production cookie uses <code>HttpOnly</code>, <code>Secure</code>, and an intentional <code>SameSite</code> setting. Cookie options depend on the deployment’s origin and cross-site requirements. Do not store session IDs, refresh tokens, or authentication tokens in <code>localStorage</code> or <code>sessionStorage</code>; JavaScript running in the origin can read them.

Use a real shared session store in production. The in-memory store provided for local development is not suitable for a multi-process or production deployment. Configure server-side idle and absolute expiry. A browser closing is not a reliable way to end a session.

## Protect routes in the interface

A client route guard improves navigation and avoids flashing protected UI:

~~~jsx
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <p role="status">Checking your session…</p>;
  }

  if (status === "error") {
    return <SessionCheckError />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
~~~

This guard is a presentation feature only. A visitor can edit JavaScript, call an API directly, or open a URL without using the interface. Every protected endpoint must independently authenticate the request and authorize the requested operation.

If the login page remembers an intended destination, accept only a safe in-app path. Do not pass an arbitrary URL from query parameters or browser state to <code>window.location</code>; that can create an open redirect. Prefer route paths created by your app, reject protocol-relative paths beginning with <code>//</code>, and keep the fallback destination explicit.

## Handle an expired session

A session can expire while the user is viewing a page. When an API returns an authentication-required response:

- Update the shared auth state to <code>anonymous</code>.
- Stop rendering protected user data.
- Preserve a safe in-app destination if the user may sign in and retry.
- Explain that the session ended and provide a sign-in action.
- Avoid repeatedly redirecting every failed request independently.

Do not automatically replay a sensitive mutation after the user signs in. The user should review and submit that action again, unless the application has a carefully designed, idempotent retry flow.

A forbidden response is different from an unauthenticated response. The user may be signed in but lack permission. Keep the session and show a clear access-denied state rather than sending the user to sign in again.

## Sign out on the server

A sign-out button should be available from the authenticated interface. It should call an API endpoint that destroys or invalidates the server-side session, then update React state and move to a public page. Clearing a cookie only in the browser is insufficient: a copied session identifier could remain valid on the server.

Cookie-backed state-changing requests also need a CSRF strategy. SameSite cookies are useful defense in depth, but they do not replace CSRF protection when the app’s request model requires it. Use a suitable token or origin-check strategy for mutations and configure CORS narrowly. A logout action should use a state-changing request, not a link that triggers a GET.

## Common mistakes

- Treating “session check still running” as “signed out.”
- Showing protected page content before the server confirms the session.
- Treating a React route guard as API security.
- Trusting a role stored in local state or sent by the browser.
- Keeping authentication tokens in browser web storage.
- Revealing whether an account exists in login or recovery messages.
- Showing raw API exceptions to the user.
- Losing the email address after a failed login.
- Redirecting to an arbitrary URL supplied by query parameters.
- Clearing the browser cookie without invalidating the server session.
- Forgetting CSRF protections for cookie-authenticated mutations.
- Using an in-memory session store in production.
- Assuming that closing a browser reliably ends a session.

## Chapter checklist

Before shipping an authentication flow:

- Distinguish loading, authenticated, anonymous, and failed session checks.
- Use labeled fields, useful autocomplete hints, and accessible feedback.
- Show pending, rejected, network-failure, and success states distinctly.
- Keep credential error messages generic and rate-limit attempts.
- Store session state server-side and use appropriately protected cookies.
- Restore the current user from a server endpoint after reload.
- Guard client routes for presentation and protect every API route on the server.
- Validate user permissions on every protected operation.
- Allow only safe in-app post-login destinations.
- Invalidate the server-side session on logout and handle expiry.
- Add CSRF protections appropriate to the cookie and origin setup.
- Never log passwords, session identifiers, or authentication tokens.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [078 - Client-side form validation and user experience](078-client-side-form-validation-and-user-experience.md) | [Q&A](../qnas/079-authentication-user-experience.md) | [Example](../examples/079-authentication-user-experience.md) | [080 - Accessible forms, navigation, and components](080-accessible-forms-navigation-and-components.md) |