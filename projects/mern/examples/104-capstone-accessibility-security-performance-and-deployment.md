# 104 - Capstone: accessibility, security, performance, and deployment: Example

This example is the final release review for the Learning Library capstone. It records evidence instead of assuming that a green build or automated scan proves the product is ready.

Fill in measured results and owners for the actual application. The example includes no credentials and no external links.

## 1. Identify the release candidate

~~~~text
Application: Learning Library
Environment: Staging, then Production
Source revision: <reviewed revision>
Frontend artifact: <artifact identifier>
API artifact: <artifact identifier>
Database change: <migration identifier or none>
Release owner: <person or team>
~~~~

Promote the artifacts that passed review. Do not rebuild a different candidate manually for production.

## 2. Accessibility review of the critical journeys

| Journey | Keyboard and focus | Screen reader and names | Visual/reflow | Result and evidence |
| --- | --- | --- | --- | --- |
| Browse and search courses | Search, links, filters, pagination usable | Search and result count announced | Zoom and mobile reflow retain controls | <record result> |
| Register and sign in | Labels, order, password visibility, submit all keyboard usable | Labels and errors announced | Contrast and focus visible in all states | <record result> |
| Save a course | Save control is reachable and has a clear state | Saved/not-saved status announced | No unexpected layout movement | <record result> |
| Create and edit a note | Fields, validation, save, delete are reachable | Field errors and save result associated | Text remains usable at zoom | <record result> |
| Publish a course as admin | Editor and confirmation are operable | Required fields and status changes announced | Draft and published states do not rely on color alone | <record result> |

For each problem, record the affected users, severity, owner, and whether it blocks the release. Automated scan findings are evidence to review, not a complete conformance decision.

## 3. Test common accessibility conditions

- Navigate the full journey with a keyboard only.
- Verify the focus indicator and order on menus, dialogs, forms, and error states.
- Test the core forms with a screen reader.
- Check text and control contrast in normal, focus, disabled, success, and error states.
- Zoom and reflow at narrow viewport sizes.
- Confirm meaningful images have text alternatives and decorative images do not add noise.
- Confirm status, selection, and errors are not conveyed by color alone.
- Enable reduced motion and verify that essential information remains available.
- Confirm route changes announce a useful page title or heading.

Use the project's selected WCAG 2.2 AA review process and record exceptions with an owner and target date.

## 4. Exercise authorization and privacy boundaries

| Attempt | Expected outcome | Evidence |
| --- | --- | --- |
| Visitor requests learner notes | Authentication is required | API response and integration test |
| Learner submits an administrator role at registration | Role is ignored or rejected; account remains a learner | Request validation and database record |
| Learner changes a note ID to another user's note | No private note data is returned or changed | Two-user integration test |
| Learner calls the admin publish endpoint directly | Request is denied by server authorization | API test and sanitized log |
| State-changing request omits the CSRF token | Request is rejected | API test |
| User sends oversized search or body input | Request is bounded or rejected | Validation test |
| Error path occurs | Public response has no stack, URI, or internal host | Browser/API inspection |

Also verify that session cookies, CSRF tokens, database URIs, passwords, and private user content are absent from browser bundles and routine logs.

## 5. Review performance evidence

Measure representative user journeys on mobile and desktop. Record the results from actual staging or field data:

| Page or journey | LCP | INP | CLS | API latency | Result |
| --- | --- | --- | --- | --- | --- |
| Public catalog | <measured> | <measured> | <measured> | <measured> | <pass or follow-up> |
| Course detail | <measured> | <measured> | <measured> | <measured> | <pass or follow-up> |
| Learner notes | <measured> | <measured> | <measured> | <measured> | <pass or follow-up> |
| Course editor | <measured> | <measured> | <measured> | <measured> | <pass or follow-up> |

Use current Core Web Vitals good targets as a field signal: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile. Compare the capstone's API latency and database pool use with its own service objectives and measured baseline.

Inspect:

- Initial JavaScript and CSS size.
- Largest images and reserved layout dimensions.
- Slow or repeated API requests.
- MongoDB query plans and index use.
- Pagination limits and large-result handling.
- Connection pool wait, process memory, and event-loop delay.
- Cache behavior for HTML, runtime config, and hashed assets.

Record before-and-after measurements for performance changes. Do not claim a performance win based on bundle size alone.

## 6. Verify production security configuration

| Control | Evidence to collect | Result |
| --- | --- | --- |
| HTTPS and trusted edge | Public URL, certificate, forwarded-header path | <record result> |
| API secrets | Protected runtime configuration; absent from artifact | <record result> |
| MongoDB identity | Least-privilege app role and separate environment credentials | <record result> |
| MongoDB network | Runtime-only private route or approved egress addresses | <record result> |
| Sessions and CSRF | Cookie settings, shared store, CSRF checks | <record result> |
| CORS | Exact origin policy if cross-origin access is used | <record result> |
| Input and output | Validation bounds, safe rendering, public errors | <record result> |
| CI and release permissions | Minimal verification token and protected deployment access | <record result> |
| Logging | No cookies, secrets, request bodies, or raw database URI | <record result> |
| Dependencies | Lockfiles, reviewed updates, known remediation owner | <record result> |

Use a versioned web-application security verification baseline when the project needs systematic requirements. Record which requirements were selected and what evidence supports them.

## 7. Check the production performance and capacity plan

Before exposing the release:

1. Confirm request and database timeouts are bounded.
2. Confirm API pagination and expensive filters have limits.
3. Calculate maximum connections across all API instances and separate clients.
4. Confirm indexes support the measured catalog and learner-note queries.
5. Confirm the service has an agreed capacity and latency objective.
6. Confirm alerts exist for user-impacting error, latency, readiness, and database pressure.
7. Confirm load or capacity evidence matches the expected traffic range.

Do not copy an arbitrary pool size or request threshold from this example. Use the project's deployment topology and baseline.

## 8. Run the staging release gate

1. Deploy the reviewed frontend and API artifacts to staging.
2. Supply staging-only credentials and database.
3. Wait for API readiness before routing traffic.
4. Open the catalog, search, and refresh a nested course route.
5. Register and sign in with a synthetic learner.
6. Save a course, create a note, refresh, edit, and delete it.
7. Confirm a second learner cannot read or update that note.
8. Confirm a learner cannot use administrator operations.
9. Publish a synthetic course as an administrator and confirm public visibility.
10. Check session expiry/logout, CSRF behavior, API errors, logs, and alerts.
11. Inspect browser cache headers and public configuration.
12. Record performance and database pool evidence.

Never use real user data or production side effects in staging smoke checks.

## 9. Confirm the recovery path

- [ ] The latest backup and its restore procedure are known.
- [ ] An isolated restore rehearsal verified data and application access.
- [ ] RPO and RTO decisions have owners and measured evidence.
- [ ] The release migration is compatible with overlapping API versions.
- [ ] A prior artifact and its compatible configuration are retained.
- [ ] A code rollback will not corrupt data written by the new release.
- [ ] If data recovery is needed, the team has a write-reconciliation plan.
- [ ] The runbook identifies who can approve and perform a restore.

## 10. Define go, pause, and rollback conditions

### Continue

- Critical journeys work in staging.
- Readiness and API error rates stay within the agreed objective.
- No unresolved release-blocking accessibility or authorization issue remains.
- The migration and database connection load behave as expected.
- Monitoring, on-call ownership, and rollback are available.

### Pause

- A required accessibility workflow cannot be completed.
- A permission boundary is uncertain or an unauthorized request succeeds.
- A required dependency or health probe is unstable.
- The candidate artifact or configuration differs from the reviewed release.
- Observability is insufficient to assess user impact.

### Roll back or mitigate

- Private data is exposed or a secret appears in a public artifact.
- A critical user journey fails with broad user impact.
- Error or latency objectives are exceeded and the cause is release-related.
- The migration writes invalid data or threatens database stability.
- The new version is unsafe and a compatible previous version is available.

A data restore is a separate decision from an application rollback. Assess writes since the restore point and the data-loss impact before executing it.

## 11. Record the final decision

~~~~text
Decision: <go / pause / rollback>
Decision time: <timestamp>
Release revision: <revision>
Accessibility evidence: <record or location>
Security evidence: <record or location>
Performance evidence: <record or location>
Deployment and recovery evidence: <record or location>
Open risks: <risk, owner, and due date>
Decision owner: <person or team>
~~~~

Use the approved internal record for real production details. Do not put live credentials, session identifiers, personal records, or private incident data in a public project file.

## Final sign-off

- [ ] Critical journeys are keyboard- and screen-reader-usable.
- [ ] Accessibility review records actual evidence and open issues.
- [ ] Authentication, authorization, ownership, and CSRF boundaries are verified.
- [ ] Input limits and safe output behavior are checked.
- [ ] Frontend and API performance have measured baselines.
- [ ] MongoDB query and connection capacity have been reviewed.
- [ ] CI and production credentials are separated.
- [ ] Staging used synthetic data and the reviewed artifacts.
- [ ] Monitoring, alert ownership, backup, restore, and rollback are ready.
- [ ] The release decision and remaining risks are recorded.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [103 - Capstone: plan and build a complete MERN application](103-capstone-plan-and-build-a-complete-mern-application.md) | [Lesson](../lessons/104-capstone-accessibility-security-performance-and-deployment.md) | [Q&A](../qnas/104-capstone-accessibility-security-performance-and-deployment.md) | [Example](104-capstone-accessibility-security-performance-and-deployment.md) | End of course |
