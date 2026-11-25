# 104 - Capstone: accessibility, security, performance, and deployment

The final capstone review checks whether the application works for people using different input and assistive technologies, protects its users and data, performs well under realistic use, and can be released and recovered safely.

This chapter brings those concerns together as a practical release gate for the Learning Library or another MERN application. Accessibility, security, performance, and deployment are design responsibilities throughout the project; this final pass finds gaps and verifies the complete system.

## Learning outcomes

After this chapter, you should be able to:

- Review key journeys for keyboard, screen reader, visual, and motion accessibility.
- Use WCAG 2.2 AA as a technical review target while considering the application's own obligations.
- Verify authentication, authorization, input handling, and data protections across the stack.
- Measure browser and API performance with real user journeys.
- Find inefficient MongoDB queries and unbounded work.
- Review production configuration, CI permissions, observability, and backup recovery.
- Run a staged release and decide whether to continue, pause, or roll back.
- Record evidence and remaining risks instead of relying on an unverified checklist.

## 1. Review the complete user journey

Choose the most important journeys before auditing individual components. For the Learning Library, review:

1. A visitor browses, searches, and opens a published course.
2. A learner registers, signs in, saves a course, and creates a private note.
3. The learner edits and deletes their own note, then signs out.
4. A different learner attempts to access the first learner's note.
5. An administrator creates and publishes a course.
6. A user with a slow or failed network recovers from an error.

For each journey, identify the browser screen, API request, session state, database query, success response, denied response, and recovery path. This gives the audit a concrete boundary and prevents a polished home page from hiding broken protected workflows.

## 2. Target accessibility deliberately

Use WCAG 2.2 AA as a technical review target for the capstone. Confirm any formal conformance or legal obligations that apply to the actual product and audience; this checklist by itself is not a conformance certification.

Review the four WCAG principles:

- **Perceivable:** content and controls can be perceived through appropriate alternatives, contrast, reflow, and status.
- **Operable:** all actions work with keyboard and other input methods, with usable focus and timing.
- **Understandable:** labels, instructions, errors, and navigation are clear and consistent.
- **Robust:** markup and names expose reliable information to browsers and assistive technologies.

### Keyboard and focus

- Navigate every route without a mouse.
- Confirm all links, buttons, menus, tabs, and dialogs are reachable in a logical order.
- Make focused controls clearly visible and not hidden under sticky UI.
- Ensure dialogs move focus into the dialog, keep focus usable, and return it to the trigger when closed.
- Avoid keyboard traps and controls that activate only on hover.
- Preserve a skip link or another efficient way to reach main content.

### Names, labels, and semantics

- Use buttons for actions and links for navigation.
- Give every input a persistent visible label or accessible name.
- Group related fields and explain required formats.
- Use headings in a meaningful hierarchy.
- Give icon-only controls a useful accessible name.
- Provide text alternatives for meaningful images and empty alternatives for decorative images.
- Do not use color alone to convey errors, status, or selection.

### Forms and asynchronous states

- Associate field errors with their inputs and explain how to fix them.
- Focus or announce an error summary after an unsuccessful submission where appropriate.
- Announce important asynchronous status changes without moving focus unexpectedly.
- Preserve safe user input after a network failure where possible.
- Ensure loading indicators and disabled states are understandable.
- Test login, registration, search, note editing, and admin publishing with keyboard and screen reader output.

### Visual presentation and motion

- Check text and control contrast in normal, hover, focus, disabled, and error states.
- Test zoom and narrow viewport reflow without loss of content or function.
- Ensure target sizes and spacing make interactive controls usable.
- Respect reduced-motion preferences and avoid animation that causes discomfort.
- Test with browser zoom, high contrast or forced colors where available, and more than one viewport.

Automated accessibility scans can find some problems, but cannot determine whether an alternative is meaningful, a label is understandable, or a workflow is usable. Combine automation with keyboard and assistive-technology review.

## 3. Review authentication and authorization boundaries

Trace the authority for every protected operation:

- The server identifies the user from the established session or token.
- The server checks role and ownership for the specific action.
- The database query is scoped to the authorized user where appropriate.
- The response exposes only fields the caller may read.
- The UI may guide the user but does not grant permission.

Verify the negative cases:

- A visitor cannot call a protected API directly.
- A learner cannot assign themselves an administrator role.
- Changing a note or saved-course ID never exposes another user's records.
- An expired or revoked session no longer authorizes requests.
- A logout destroys the server-side session.
- State-changing cookie-authenticated requests require the established CSRF token.

Do not trust a client route guard, hidden button, submitted user ID, or CORS policy as authorization.

## 4. Review input, output, and browser security

For every input boundary:

- Validate type, shape, length, allowed values, and size.
- Normalize values only when the product's data rules permit it.
- Reject unexpected object structures and mass assignment.
- Bound page size, search length, request body size, upload size, and expensive operations.
- Use safe database query construction; never merge arbitrary client objects into MongoDB filters or updates.
- Encode output for its rendering context and avoid unsafe HTML injection.

For the browser and session:

- Use HTTPS and secure, HttpOnly cookies with a deliberate SameSite policy.
- Keep the session secret and database credentials server-side.
- Configure exact CORS origins when cross-origin browser access is required.
- Keep CSRF protection for cookie-authenticated state changes.
- Use security headers and a Content Security Policy that matches the actual assets and integrations.
- Start a restrictive policy in report-only mode if needed, resolve violations, and then enforce it.
- Avoid wildcard trust of proxy headers and broad cookie domains without a documented need.

Do not return stack traces, database details, secrets, or authorization reasoning that reveals private records.

## 5. Threat-model the capstone's important assets

Create a short threat model before release:

| Asset | Example threat | Main controls to verify |
| --- | --- | --- |
| Learner account | Credential guessing or session theft | Password hashing, rate limits, secure session lifecycle |
| Private notes | IDOR or authorization bypass | Owner-scoped queries and denied-access tests |
| Course editor | Unauthorized publication or mass assignment | Server role checks and allowlisted fields |
| MongoDB | Credential leak or unwanted network access | Least privilege, private route, secret handling |
| Browser session | CSRF or script injection | CSRF checks, safe output, cookie attributes, CSP |
| Release pipeline | Untrusted workflow gains production access | Minimal permissions, separated deploy job, protected secrets |
| Backups | Deletion or unauthorized restore | Separate roles, encryption, retention, recovery audit |

The list is a starting point. Add assets, abuse cases, and owners that match the real application. A framework such as OWASP ASVS can provide a structured verification baseline; record the version and selected requirements when using it.

## 6. Check dependencies and the release pipeline

- Install from committed lockfiles.
- Review direct and transitive dependency updates.
- Remove unused packages and credentials from package configuration.
- Keep CI permissions minimal.
- Do not expose production secrets to untrusted pull-request workflows.
- Review action and build-tool changes.
- Make lint, relevant tests, and production build required before merge.
- Keep deployment separate from ordinary verification.
- Tie release artifacts to a source revision.
- Limit who can approve and execute production deployment.

A passing vulnerability scanner does not prove the application has no security weaknesses. Review actual data flows, configuration, and authorization behavior.

## 7. Measure performance from user journeys

Measure both laboratory and real-user behavior. Test representative mobile and desktop devices, realistic network conditions, and the important pages.

For current Core Web Vitals, field targets commonly used for a good experience at the 75th percentile are:

| Metric | Measures | Good target |
| --- | --- | --- |
| Largest Contentful Paint (LCP) | Loading of the main visible content | 2.5 seconds or less |
| Interaction to Next Paint (INP) | Responsiveness to interactions | 200 milliseconds or less |
| Cumulative Layout Shift (CLS) | Unexpected visual movement | 0.1 or less |

The metrics and thresholds can evolve. Treat these as field-oriented signals, not a replacement for the application's own user and API performance objectives.

Also measure:

- Time to first useful content and route transitions.
- JavaScript bundle size and long main-thread tasks.
- API latency by route and status.
- MongoDB query duration and pool wait.
- Error rate and retry behavior.
- Memory use and event-loop delay under load.

## 8. Improve browser performance from evidence

- Split code by route or feature when it materially reduces initial work.
- Remove unused dependencies and duplicate bundles.
- Compress and correctly size images; reserve their layout space.
- Cache content-hashed assets for longer than the HTML entry document.
- Avoid rendering large lists without pagination or windowing.
- Prevent repeated fetches and unnecessary component work.
- Keep loading, error, and content states visually stable to reduce layout shift.
- Do not delay essential content for analytics or optional third-party scripts.

Measure before and after the change on the same route and conditions. A smaller bundle does not guarantee a faster page if the critical request path or main-thread work remains slow.

## 9. Improve API and database performance safely

- Bound list results and enforce a maximum page size.
- Add indexes for measured query patterns and uniqueness rules.
- Use projections to return only required fields.
- Avoid N+1 queries and repeated lookups inside loops.
- Use stable pagination for large or changing datasets.
- Limit expensive filters, sorts, and regex searches.
- Budget connections across every instance and MongoDB client.
- Add timeouts and rate limits to work that can consume substantial resources.
- Measure query plans and production latency before adding complexity.

Do not add indexes indiscriminately: they consume storage and add write work. Verify the actual query and workload.

## 10. Review production configuration and data protection

Confirm each environment has:

- A separate database identity, session secret, and origin configuration.
- Protected runtime secrets absent from Git and frontend artifacts.
- Database network access limited to intended runtime networks.
- TLS verification enabled.
- Correct API base URL, CORS, cookie, CSRF, and trusted proxy settings.
- A readiness route that reflects required dependencies.
- Sanitized structured logs and useful alerts.
- Backups and a rehearsed isolated restore process.
- A migration plan compatible with application-version overlap.
- A known prior artifact and data-compatible rollback decision.

Review logs, dashboards, build output, and error responses for accidental secrets or personal information.

## 11. Use a staged release gate

### Before release

1. Complete the focused accessibility review for key journeys.
2. Complete authorization and negative-case checks.
3. Run the required lint, unit, integration, component, and end-to-end checks.
4. Build the production artifacts from the reviewed revision.
5. Verify public client configuration and secret boundaries.
6. Confirm migrations, backup status, restore procedure, and rollback compatibility.
7. Confirm dashboards, alerts, and release ownership.

### In staging

1. Deploy the same artifact intended for production.
2. Apply staging-only credentials and database.
3. Test the public URL, authentication, CSRF, CORS, nested routes, and key user journeys.
4. Check logs, health probes, errors, latency, and database capacity.
5. Confirm the operator can follow the runbook.

### In production

1. Apply protected production configuration.
2. Keep new instances out of traffic until ready.
3. Release gradually when the platform supports it.
4. Check the key journey and monitor user-impacting signals.
5. Continue only while acceptance signals remain healthy.
6. Roll back or pause when a release gate fails.
7. Record the revision, outcome, and follow-up work.

## 12. Define release stop conditions

Decide in advance what should stop or reverse a release. Examples include:

- Authentication or authorization failures on a critical journey.
- Readiness failures across the service.
- Error rate or latency beyond the agreed objective.
- A database migration that is incomplete or producing invalid records.
- A private-data exposure or secret in a public artifact.
- A serious keyboard or screen-reader blocker in a core workflow.
- Database connection pressure that threatens stability.

A stop condition should name who decides, how the release is paused, and whether the safe response is to roll back code, disable a feature, or begin data recovery.

## 13. Record evidence and remaining issues

For each review item, record:

| Field | Example |
| --- | --- |
| Requirement | Learners can edit only their own notes |
| Evidence | API integration test plus manual session check |
| Result | Pass, fail, or not applicable |
| Risk | Impact if the check fails |
| Owner | Person or team responsible |
| Follow-up | Action and due date |

Do not mark an item complete because it was discussed or because a tool returned no findings. Record what was actually verified and what remains uncertain.

## Common mistakes

- Declaring accessibility complete after only an automated scan.
- Testing only visual appearance and not keyboard or assistive technology use.
- Trusting client-side route guards to protect APIs.
- Using a user's submitted ID or role as the authority for access.
- Treating CORS as authentication or CSRF protection.
- Assuming an input schema prevents unsafe output rendering.
- Tuning performance without a before-and-after measurement.
- Adding indexes without measuring workload or write cost.
- Treating a clean dependency scan as proof of application security.
- Deploying an artifact different from the one verified in staging.
- Releasing a migration that makes rollback code incompatible.
- Treating a backup job as proof of successful restore.
- Having no release owner, stop condition, or runbook.
- Closing the capstone without recording evidence and open risks.

## Final capstone review

1. Navigate the core journeys by keyboard and confirm visible focus and understandable errors.
2. Test forms and dynamic states with a screen reader.
3. Check contrast, zoom, reflow, reduced motion, and meaningful alternatives.
4. Attempt direct API access with anonymous, learner, other-learner, and administrator identities.
5. Verify ownership, role checks, CSRF, input limits, and safe public errors.
6. Inspect client bundles, logs, workflow permissions, and runtime settings for secrets.
7. Measure Core Web Vitals and API/database behavior on representative journeys.
8. Verify pagination, indexes, connection budgets, and bounded expensive operations.
9. Deploy the reviewed artifact to staging and follow the release runbook.
10. Verify readiness, monitoring, backups, migrations, and rollback compatibility.
11. Record evidence, result, owner, and follow-up for every release criterion.
12. Update the project README and handoff notes with the final operational truth.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [103 - Capstone: plan and build a complete MERN application](103-capstone-plan-and-build-a-complete-mern-application.md) | [Lesson](104-capstone-accessibility-security-performance-and-deployment.md) | [Q&A](../qnas/104-capstone-accessibility-security-performance-and-deployment.md) | [Example](../examples/104-capstone-accessibility-security-performance-and-deployment.md) | End of course |
