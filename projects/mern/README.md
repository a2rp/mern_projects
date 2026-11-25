# MERN Stack: Practical Notes

A structured, hands-on guide to building full-stack web applications with **MongoDB, Express, React, and Node.js**. These personal learning notes are organized from web fundamentals through a production-minded capstone.

## Quick reference

- [MERN summary](mern-summary.md)
- [MERN keywords and concepts](mern-keywords.md)

## What MERN means

- **MongoDB** stores application data as documents.
- **Express** provides server-side routing and an HTTP API.
- **React** builds the interactive user interface.
- **Node.js** runs the JavaScript server and tooling.

A typical request flows from the React interface to an Express endpoint running on Node.js, which reads or writes data in MongoDB and returns a response to the interface.

## Learning outcomes

By following the roadmap, you will learn to:

- Explain how a browser, frontend, backend, HTTP, and a database work together.
- Build and query MongoDB collections, model data, validate documents, and use indexes.
- Design REST APIs with Express, validate requests, handle errors, and protect routes.
- Build responsive React interfaces with components, state, forms, routing, and accessible patterns.
- Connect the frontend, API, and database into complete features.
- Test, secure, configure, and deploy a full-stack application.
- Plan and deliver a complete MERN capstone project.

## Before you begin

You should be comfortable with basic HTML, CSS, and JavaScript, including functions, arrays, objects, modules, and promises. Familiarity with a terminal and Git is useful. The early chapters review the JavaScript and web concepts needed for this course.

## How to use this repository

1. Read the lesson in order and work through the concepts.
2. Recreate the code and commands in your own practice project.
3. Use the matching Q&A file to review key ideas and check your understanding.
4. Study the example file for complete code, expected output or UI behavior, and an explanation.
5. Follow the previous/next chapter links in each completed file.

Examples are learning material. Each one should say what needs to be installed or configured, show the relevant code, and describe the expected result. Do not place credentials or secrets in committed example code.

## Course roadmap

The roadmap is grouped into seven modules. Each chapter has a planned lesson, Q&A, and example file. The links use the repository's numbered naming convention; chapter files will be filled in as the course is written.

| No. | Module | Lesson | Q&A | Example |
| --- | --- | --- | --- | --- |
| 001 | Foundations | [Course overview and MERN architecture](lessons/001-course-overview-and-mern-architecture.md) | [Open Q&A](qnas/001-course-overview-and-mern-architecture.md) | [Open Example](examples/001-course-overview-and-mern-architecture.md) |
| 002 | Foundations | [How browsers, servers, and clients communicate](lessons/002-how-browsers-servers-and-clients-communicate.md) | [Open Q&A](qnas/002-how-browsers-servers-and-clients-communicate.md) | [Open Example](examples/002-how-browsers-servers-and-clients-communicate.md) |
| 003 | Foundations | [HTTP requests, responses, methods, and status codes](lessons/003-http-requests-responses-methods-and-status-codes.md) | [Open Q&A](qnas/003-http-requests-responses-methods-and-status-codes.md) | [Open Example](examples/003-http-requests-responses-methods-and-status-codes.md) |
| 004 | Foundations | [JSON and API data basics](lessons/004-json-and-api-data-basics.md) | [Open Q&A](qnas/004-json-and-api-data-basics.md) | [Open Example](examples/004-json-and-api-data-basics.md) |
| 005 | Foundations | [Terminal, files, Git, and GitHub workflow](lessons/005-terminal-files-git-and-github-workflow.md) | [Open Q&A](qnas/005-terminal-files-git-and-github-workflow.md) | [Open Example](examples/005-terminal-files-git-and-github-workflow.md) |
| 006 | Foundations | [JavaScript essentials for MERN development](lessons/006-javascript-essentials-for-mern-development.md) | [Open Q&A](qnas/006-javascript-essentials-for-mern-development.md) | [Open Example](examples/006-javascript-essentials-for-mern-development.md) |
| 007 | Foundations | [Functions, scope, arrays, and objects refresher](lessons/007-functions-scope-arrays-and-objects-refresher.md) | [Open Q&A](qnas/007-functions-scope-arrays-and-objects-refresher.md) | [Open Example](examples/007-functions-scope-arrays-and-objects-refresher.md) |
| 008 | Foundations | [Modern JavaScript syntax and modules](lessons/008-modern-javascript-syntax-and-modules.md) | [Open Q&A](qnas/008-modern-javascript-syntax-and-modules.md) | [Open Example](examples/008-modern-javascript-syntax-and-modules.md) |
| 009 | Foundations | [Asynchronous JavaScript: callbacks, promises, and async await](lessons/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Open Q&A](qnas/009-asynchronous-javascript-callbacks-promises-and-async-await.md) | [Open Example](examples/009-asynchronous-javascript-callbacks-promises-and-async-await.md) |
| 010 | Foundations | [Errors, exceptions, and debugging JavaScript](lessons/010-errors-exceptions-and-debugging-javascript.md) | [Open Q&A](qnas/010-errors-exceptions-and-debugging-javascript.md) | [Open Example](examples/010-errors-exceptions-and-debugging-javascript.md) |
| 011 | Node.js and project setup | [Node.js runtime and process model](lessons/011-node-js-runtime-and-process-model.md) | [Open Q&A](qnas/011-node-js-runtime-and-process-model.md) | [Open Example](examples/011-node-js-runtime-and-process-model.md) |
| 012 | Node.js and project setup | [Install and verify Node.js and npm](lessons/012-install-and-verify-node-js-and-npm.md) | [Open Q&A](qnas/012-install-and-verify-node-js-and-npm.md) | [Open Example](examples/012-install-and-verify-node-js-and-npm.md) |
| 013 | Node.js and project setup | [npm packages, scripts, and semantic version ranges](lessons/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Open Q&A](qnas/013-npm-packages-scripts-and-semantic-version-ranges.md) | [Open Example](examples/013-npm-packages-scripts-and-semantic-version-ranges.md) |
| 014 | Node.js and project setup | [Create a Node.js project with ES modules](lessons/014-create-a-node-js-project-with-es-modules.md) | [Open Q&A](qnas/014-create-a-node-js-project-with-es-modules.md) | [Open Example](examples/014-create-a-node-js-project-with-es-modules.md) |
| 015 | Node.js and project setup | [Environment variables, configuration, and secrets](lessons/015-environment-variables-configuration-and-secrets.md) | [Open Q&A](qnas/015-environment-variables-configuration-and-secrets.md) | [Open Example](examples/015-environment-variables-configuration-and-secrets.md) |
| 016 | MongoDB and data modeling | [MongoDB concepts: databases, collections, and documents](lessons/016-mongodb-concepts-databases-collections-and-documents.md) | [Open Q&A](qnas/016-mongodb-concepts-databases-collections-and-documents.md) | [Open Example](examples/016-mongodb-concepts-databases-collections-and-documents.md) |
| 017 | MongoDB and data modeling | [BSON, ObjectId, and document shape](lessons/017-bson-objectid-and-document-shape.md) | [Open Q&A](qnas/017-bson-objectid-and-document-shape.md) | [Open Example](examples/017-bson-objectid-and-document-shape.md) |
| 018 | MongoDB and data modeling | [Install, run, and connect to MongoDB](lessons/018-install-run-and-connect-to-mongodb.md) | [Open Q&A](qnas/018-install-run-and-connect-to-mongodb.md) | [Open Example](examples/018-install-run-and-connect-to-mongodb.md) |
| 019 | MongoDB and data modeling | [MongoDB Node.js driver and connection lifecycle](lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [Open Q&A](qnas/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [Open Example](examples/019-mongodb-node-js-driver-and-connection-lifecycle.md) |
| 020 | MongoDB and data modeling | [Create and read MongoDB documents](lessons/020-create-and-read-mongodb-documents.md) | [Open Q&A](qnas/020-create-and-read-mongodb-documents.md) | [Open Example](examples/020-create-and-read-mongodb-documents.md) |
| 021 | MongoDB and data modeling | [Query filters and projection](lessons/021-query-filters-and-projection.md) | [Open Q&A](qnas/021-query-filters-and-projection.md) | [Open Example](examples/021-query-filters-and-projection.md) |
| 022 | MongoDB and data modeling | [Sort, limit, skip, and pagination](lessons/022-sort-limit-skip-and-pagination.md) | [Open Q&A](qnas/022-sort-limit-skip-and-pagination.md) | [Open Example](examples/022-sort-limit-skip-and-pagination.md) |
| 023 | MongoDB and data modeling | [Update, replace, and upsert documents](lessons/023-update-replace-and-upsert-documents.md) | [Open Q&A](qnas/023-update-replace-and-upsert-documents.md) | [Open Example](examples/023-update-replace-and-upsert-documents.md) |
| 024 | MongoDB and data modeling | [Delete documents safely](lessons/024-delete-documents-safely.md) | [Open Q&A](qnas/024-delete-documents-safely.md) | [Open Example](examples/024-delete-documents-safely.md) |
| 025 | MongoDB and data modeling | [Schema design: embedding versus referencing](lessons/025-schema-design-embedding-versus-referencing.md) | [Open Q&A](qnas/025-schema-design-embedding-versus-referencing.md) | [Open Example](examples/025-schema-design-embedding-versus-referencing.md) |
| 026 | MongoDB and data modeling | [Data modeling and relationship patterns](lessons/026-data-modeling-and-relationship-patterns.md) | [Open Q&A](qnas/026-data-modeling-and-relationship-patterns.md) | [Open Example](examples/026-data-modeling-and-relationship-patterns.md) |
| 027 | MongoDB and data modeling | [Schema validation and data integrity](lessons/027-schema-validation-and-data-integrity.md) | [Open Q&A](qnas/027-schema-validation-and-data-integrity.md) | [Open Example](examples/027-schema-validation-and-data-integrity.md) |
| 028 | MongoDB and data modeling | [Indexes and query performance](lessons/028-indexes-and-query-performance.md) | [Open Q&A](qnas/028-indexes-and-query-performance.md) | [Open Example](examples/028-indexes-and-query-performance.md) |
| 029 | MongoDB and data modeling | [Aggregation pipelines](lessons/029-aggregation-pipelines.md) | [Open Q&A](qnas/029-aggregation-pipelines.md) | [Open Example](examples/029-aggregation-pipelines.md) |
| 030 | MongoDB and data modeling | [Transactions and atomic operations](lessons/030-transactions-and-atomic-operations.md) | [Open Q&A](qnas/030-transactions-and-atomic-operations.md) | [Open Example](examples/030-transactions-and-atomic-operations.md) |
| 031 | MongoDB and data modeling | [Mongoose ODM: when and how to use it](lessons/031-mongoose-odm-when-and-how-to-use-it.md) | [Open Q&A](qnas/031-mongoose-odm-when-and-how-to-use-it.md) | [Open Example](examples/031-mongoose-odm-when-and-how-to-use-it.md) |
| 032 | MongoDB and data modeling | [Mongoose schemas, models, and CRUD](lessons/032-mongoose-schemas-models-and-crud.md) | [Open Q&A](qnas/032-mongoose-schemas-models-and-crud.md) | [Open Example](examples/032-mongoose-schemas-models-and-crud.md) |
| 033 | MongoDB and data modeling | [Mongoose validation, hooks, and virtuals](lessons/033-mongoose-validation-hooks-and-virtuals.md) | [Open Q&A](qnas/033-mongoose-validation-hooks-and-virtuals.md) | [Open Example](examples/033-mongoose-validation-hooks-and-virtuals.md) |
| 034 | MongoDB and data modeling | [Seed data, migrations, and database lifecycle](lessons/034-seed-data-migrations-and-database-lifecycle.md) | [Open Q&A](qnas/034-seed-data-migrations-and-database-lifecycle.md) | [Open Example](examples/034-seed-data-migrations-and-database-lifecycle.md) |
| 035 | MongoDB and data modeling | [MongoDB security, backup, and restore](lessons/035-mongodb-security-backup-and-restore.md) | [Open Q&A](qnas/035-mongodb-security-backup-and-restore.md) | [Open Example](examples/035-mongodb-security-backup-and-restore.md) |
| 036 | Express and API development | [REST API design and resource modeling](lessons/036-rest-api-design-and-resource-modeling.md) | [Open Q&A](qnas/036-rest-api-design-and-resource-modeling.md) | [Open Example](examples/036-rest-api-design-and-resource-modeling.md) |
| 037 | Express and API development | [Create an Express app and server](lessons/037-create-an-express-app-and-server.md) | [Open Q&A](qnas/037-create-an-express-app-and-server.md) | [Open Example](examples/037-create-an-express-app-and-server.md) |
| 038 | Express and API development | [Middleware order and request lifecycle](lessons/038-middleware-order-and-request-lifecycle.md) | [Open Q&A](qnas/038-middleware-order-and-request-lifecycle.md) | [Open Example](examples/038-middleware-order-and-request-lifecycle.md) |
| 039 | Express and API development | [Routes, route parameters, and routers](lessons/039-routes-route-parameters-and-routers.md) | [Open Q&A](qnas/039-routes-route-parameters-and-routers.md) | [Open Example](examples/039-routes-route-parameters-and-routers.md) |
| 040 | Express and API development | [Requests, responses, and content types](lessons/040-requests-responses-and-content-types.md) | [Open Q&A](qnas/040-requests-responses-and-content-types.md) | [Open Example](examples/040-requests-responses-and-content-types.md) |
| 041 | Express and API development | [Parse path, query, and body inputs](lessons/041-parse-path-query-and-body-inputs.md) | [Open Q&A](qnas/041-parse-path-query-and-body-inputs.md) | [Open Example](examples/041-parse-path-query-and-body-inputs.md) |
| 042 | Express and API development | [Separate routes, controllers, and services](lessons/042-separate-routes-controllers-and-services.md) | [Open Q&A](qnas/042-separate-routes-controllers-and-services.md) | [Open Example](examples/042-separate-routes-controllers-and-services.md) |
| 043 | Express and API development | [Connect an Express app to MongoDB](lessons/043-connect-an-express-app-to-mongodb.md) | [Open Q&A](qnas/043-connect-an-express-app-to-mongodb.md) | [Open Example](examples/043-connect-an-express-app-to-mongodb.md) |
| 044 | Express and API development | [Async route handlers and error propagation](lessons/044-async-route-handlers-and-error-propagation.md) | [Open Q&A](qnas/044-async-route-handlers-and-error-propagation.md) | [Open Example](examples/044-async-route-handlers-and-error-propagation.md) |
| 045 | Express and API development | [Centralized API errors and not-found handling](lessons/045-centralized-api-errors-and-not-found-handling.md) | [Open Q&A](qnas/045-centralized-api-errors-and-not-found-handling.md) | [Open Example](examples/045-centralized-api-errors-and-not-found-handling.md) |
| 046 | Express and API development | [Validate and sanitize client input](lessons/046-validate-and-sanitize-client-input.md) | [Open Q&A](qnas/046-validate-and-sanitize-client-input.md) | [Open Example](examples/046-validate-and-sanitize-client-input.md) |
| 047 | Express and API development | [REST status codes and consistent response shapes](lessons/047-rest-status-codes-and-consistent-response-shapes.md) | [Open Q&A](qnas/047-rest-status-codes-and-consistent-response-shapes.md) | [Open Example](examples/047-rest-status-codes-and-consistent-response-shapes.md) |
| 048 | Express and API development | [CORS and browser cross-origin requests](lessons/048-cors-and-browser-cross-origin-requests.md) | [Open Q&A](qnas/048-cors-and-browser-cross-origin-requests.md) | [Open Example](examples/048-cors-and-browser-cross-origin-requests.md) |
| 049 | Express and API development | [Authentication concepts and threat modeling](lessons/049-authentication-concepts-and-threat-modeling.md) | [Open Q&A](qnas/049-authentication-concepts-and-threat-modeling.md) | [Open Example](examples/049-authentication-concepts-and-threat-modeling.md) |
| 050 | Express and API development | [Password hashing and account registration](lessons/050-password-hashing-and-account-registration.md) | [Open Q&A](qnas/050-password-hashing-and-account-registration.md) | [Open Example](examples/050-password-hashing-and-account-registration.md) |
| 051 | Express and API development | [Login, logout, and session strategies](lessons/051-login-logout-and-session-strategies.md) | [Open Q&A](qnas/051-login-logout-and-session-strategies.md) | [Open Example](examples/051-login-logout-and-session-strategies.md) |
| 052 | Express and API development | [Cookies, tokens, refresh, and expiration](lessons/052-cookies-tokens-refresh-and-expiration.md) | [Open Q&A](qnas/052-cookies-tokens-refresh-and-expiration.md) | [Open Example](examples/052-cookies-tokens-refresh-and-expiration.md) |
| 053 | Express and API development | [Authorization and role-based access](lessons/053-authorization-and-role-based-access.md) | [Open Q&A](qnas/053-authorization-and-role-based-access.md) | [Open Example](examples/053-authorization-and-role-based-access.md) |
| 054 | Express and API development | [CSRF, XSS, and injection protection](lessons/054-csrf-xss-and-injection-protection.md) | [Open Q&A](qnas/054-csrf-xss-and-injection-protection.md) | [Open Example](examples/054-csrf-xss-and-injection-protection.md) |
| 055 | Express and API development | [Rate limits, security headers, and API hardening](lessons/055-rate-limits-security-headers-and-api-hardening.md) | [Open Q&A](qnas/055-rate-limits-security-headers-and-api-hardening.md) | [Open Example](examples/055-rate-limits-security-headers-and-api-hardening.md) |
| 056 | Express and API development | [File uploads and validation](lessons/056-file-uploads-and-validation.md) | [Open Q&A](qnas/056-file-uploads-and-validation.md) | [Open Example](examples/056-file-uploads-and-validation.md) |
| 057 | Express and API development | [Logging and request tracing](lessons/057-logging-and-request-tracing.md) | [Open Q&A](qnas/057-logging-and-request-tracing.md) | [Open Example](examples/057-logging-and-request-tracing.md) |
| 058 | Express and API development | [API documentation and versioning](lessons/058-api-documentation-and-versioning.md) | [Open Q&A](qnas/058-api-documentation-and-versioning.md) | [Open Example](examples/058-api-documentation-and-versioning.md) |
| 059 | Express and API development | [Test Express routes and services](lessons/059-test-express-routes-and-services.md) | [Open Q&A](qnas/059-test-express-routes-and-services.md) | [Open Example](examples/059-test-express-routes-and-services.md) |
| 060 | Express and API development | [Search, filtering, sorting, and pagination APIs](lessons/060-search-filtering-sorting-and-pagination-apis.md) | [Open Q&A](qnas/060-search-filtering-sorting-and-pagination-apis.md) | [Open Example](examples/060-search-filtering-sorting-and-pagination-apis.md) |
| 061 | React and user interfaces | [React mental model and declarative UI](lessons/061-react-mental-model-and-declarative-ui.md) | [Open Q&A](qnas/061-react-mental-model-and-declarative-ui.md) | [Open Example](examples/061-react-mental-model-and-declarative-ui.md) |
| 062 | React and user interfaces | [Create a React app with modern tooling](lessons/062-create-a-react-app-with-modern-tooling.md) | [Open Q&A](qnas/062-create-a-react-app-with-modern-tooling.md) | [Open Example](examples/062-create-a-react-app-with-modern-tooling.md) |
| 063 | React and user interfaces | [JSX and rendering values](lessons/063-jsx-and-rendering-values.md) | [Open Q&A](qnas/063-jsx-and-rendering-values.md) | [Open Example](examples/063-jsx-and-rendering-values.md) |
| 064 | React and user interfaces | [Components and composition](lessons/064-components-and-composition.md) | [Open Q&A](qnas/064-components-and-composition.md) | [Open Example](examples/064-components-and-composition.md) |
| 065 | React and user interfaces | [Props and one-way data flow](lessons/065-props-and-one-way-data-flow.md) | [Open Q&A](qnas/065-props-and-one-way-data-flow.md) | [Open Example](examples/065-props-and-one-way-data-flow.md) |
| 066 | React and user interfaces | [Events and state updates](lessons/066-events-and-state-updates.md) | [Open Q&A](qnas/066-events-and-state-updates.md) | [Open Example](examples/066-events-and-state-updates.md) |
| 067 | React and user interfaces | [useState and state design](lessons/067-usestate-and-state-design.md) | [Open Q&A](qnas/067-usestate-and-state-design.md) | [Open Example](examples/067-usestate-and-state-design.md) |
| 068 | React and user interfaces | [Conditional rendering and lists](lessons/068-conditional-rendering-and-lists.md) | [Open Q&A](qnas/068-conditional-rendering-and-lists.md) | [Open Example](examples/068-conditional-rendering-and-lists.md) |
| 069 | React and user interfaces | [Forms and controlled inputs](lessons/069-forms-and-controlled-inputs.md) | [Open Q&A](qnas/069-forms-and-controlled-inputs.md) | [Open Example](examples/069-forms-and-controlled-inputs.md) |
| 070 | React and user interfaces | [Share state by lifting it](lessons/070-share-state-by-lifting-it.md) | [Open Q&A](qnas/070-share-state-by-lifting-it.md) | [Open Example](examples/070-share-state-by-lifting-it.md) |
| 071 | React and user interfaces | [Effects and external synchronization](lessons/071-effects-and-external-synchronization.md) | [Open Q&A](qnas/071-effects-and-external-synchronization.md) | [Open Example](examples/071-effects-and-external-synchronization.md) |
| 072 | React and user interfaces | [Refs and DOM access](lessons/072-refs-and-dom-access.md) | [Open Q&A](qnas/072-refs-and-dom-access.md) | [Open Example](examples/072-refs-and-dom-access.md) |
| 073 | React and user interfaces | [Custom hooks](lessons/073-custom-hooks.md) | [Open Q&A](qnas/073-custom-hooks.md) | [Open Example](examples/073-custom-hooks.md) |
| 074 | React and user interfaces | [Context and shared application state](lessons/074-context-and-shared-application-state.md) | [Open Q&A](qnas/074-context-and-shared-application-state.md) | [Open Example](examples/074-context-and-shared-application-state.md) |
| 075 | React and user interfaces | [Client-side routing and route layouts](lessons/075-client-side-routing-and-route-layouts.md) | [Open Q&A](qnas/075-client-side-routing-and-route-layouts.md) | [Open Example](examples/075-client-side-routing-and-route-layouts.md) |
| 076 | React and user interfaces | [Fetch data from an API](lessons/076-fetch-data-from-an-api.md) | [Open Q&A](qnas/076-fetch-data-from-an-api.md) | [Open Example](examples/076-fetch-data-from-an-api.md) |
| 077 | React and user interfaces | [Loading, error, empty, and success states](lessons/077-loading-error-empty-and-success-states.md) | [Open Q&A](qnas/077-loading-error-empty-and-success-states.md) | [Open Example](examples/077-loading-error-empty-and-success-states.md) |
| 078 | React and user interfaces | [Client-side form validation and user experience](lessons/078-client-side-form-validation-and-user-experience.md) | [Open Q&A](qnas/078-client-side-form-validation-and-user-experience.md) | [Open Example](examples/078-client-side-form-validation-and-user-experience.md) |
| 079 | React and user interfaces | [Authentication user experience](lessons/079-authentication-user-experience.md) | [Open Q&A](qnas/079-authentication-user-experience.md) | [Open Example](examples/079-authentication-user-experience.md) |
| 080 | React and user interfaces | [Accessible forms, navigation, and components](lessons/080-accessible-forms-navigation-and-components.md) | [Open Q&A](qnas/080-accessible-forms-navigation-and-components.md) | [Open Example](examples/080-accessible-forms-navigation-and-components.md) |
| 081 | React and user interfaces | [CSS styling and responsive interface architecture](lessons/081-css-styling-and-responsive-interface-architecture.md) | [Open Q&A](qnas/081-css-styling-and-responsive-interface-architecture.md) | [Open Example](examples/081-css-styling-and-responsive-interface-architecture.md) |
| 082 | React and user interfaces | [Component tests with React](lessons/082-component-tests-with-react.md) | [Open Q&A](qnas/082-component-tests-with-react.md) | [Open Example](examples/082-component-tests-with-react.md) |
| 083 | React and user interfaces | [React performance and memoization](lessons/083-react-performance-and-memoization.md) | [Open Q&A](qnas/083-react-performance-and-memoization.md) | [Open Example](examples/083-react-performance-and-memoization.md) |
| 084 | React and user interfaces | [Error boundaries and recovery](lessons/084-error-boundaries-and-recovery.md) | [Open Q&A](qnas/084-error-boundaries-and-recovery.md) | [Open Example](examples/084-error-boundaries-and-recovery.md) |
| 085 | React and user interfaces | [State management choices and tradeoffs](lessons/085-state-management-choices-and-tradeoffs.md) | [Open Q&A](qnas/085-state-management-choices-and-tradeoffs.md) | [Open Example](examples/085-state-management-choices-and-tradeoffs.md) |
| 086 | Full-stack integration and delivery | [Build a reusable component system](lessons/086-build-a-reusable-component-system.md) | [Open Q&A](qnas/086-build-a-reusable-component-system.md) | [Open Example](examples/086-build-a-reusable-component-system.md) |
| 087 | Full-stack integration and delivery | [Full-stack application architecture and folder structure](lessons/087-full-stack-application-architecture-and-folder-structure.md) | [Open Q&A](qnas/087-full-stack-application-architecture-and-folder-structure.md) | [Open Example](examples/087-full-stack-application-architecture-and-folder-structure.md) |
| 088 | Full-stack integration and delivery | [Configure frontend and backend origins](lessons/088-configure-frontend-and-backend-origins.md) | [Open Q&A](qnas/088-configure-frontend-and-backend-origins.md) | [Open Example](examples/088-configure-frontend-and-backend-origins.md) |
| 089 | Full-stack integration and delivery | [Connect React to Express end to end](lessons/089-connect-react-to-express-end-to-end.md) | [Open Q&A](qnas/089-connect-react-to-express-end-to-end.md) | [Open Example](examples/089-connect-react-to-express-end-to-end.md) |
| 090 | Full-stack integration and delivery | [Build a CRUD feature across UI, API, and database](lessons/090-build-a-crud-feature-across-ui-api-and-database.md) | [Open Q&A](qnas/090-build-a-crud-feature-across-ui-api-and-database.md) | [Open Example](examples/090-build-a-crud-feature-across-ui-api-and-database.md) |
| 091 | Full-stack integration and delivery | [Authentication end to end](lessons/091-authentication-end-to-end.md) | [Open Q&A](qnas/091-authentication-end-to-end.md) | [Open Example](examples/091-authentication-end-to-end.md) |
| 092 | Full-stack integration and delivery | [File uploads end to end](lessons/092-file-uploads-end-to-end.md) | [Open Q&A](qnas/092-file-uploads-end-to-end.md) | [Open Example](examples/092-file-uploads-end-to-end.md) |
| 093 | Full-stack integration and delivery | [Production configuration, CORS, and secure cookies](lessons/093-production-configuration-cors-and-secure-cookies.md) | [Open Q&A](qnas/093-production-configuration-cors-and-secure-cookies.md) | [Open Example](examples/093-production-configuration-cors-and-secure-cookies.md) |
| 094 | Full-stack integration and delivery | [Unit, integration, and end-to-end testing](lessons/094-unit-integration-and-end-to-end-testing.md) | [Open Q&A](qnas/094-unit-integration-and-end-to-end-testing.md) | [Open Example](examples/094-unit-integration-and-end-to-end-testing.md) |
| 095 | Full-stack integration and delivery | [Validation across the full stack](lessons/095-validation-across-the-full-stack.md) | [Open Q&A](qnas/095-validation-across-the-full-stack.md) | [Open Example](examples/095-validation-across-the-full-stack.md) |
| 096 | Full-stack integration and delivery | [Profile MongoDB queries and improve indexes](lessons/096-profile-mongodb-queries-and-improve-indexes.md) | [Open Q&A](qnas/096-profile-mongodb-queries-and-improve-indexes.md) | [Open Example](examples/096-profile-mongodb-queries-and-improve-indexes.md) |
| 097 | Full-stack integration and delivery | [Deployment architecture and environment separation](lessons/097-deployment-architecture-and-environment-separation.md) | [Open Q&A](qnas/097-deployment-architecture-and-environment-separation.md) | [Open Example](examples/097-deployment-architecture-and-environment-separation.md) |
| 098 | Full-stack integration and delivery | [Deploy the API and configure database secrets](lessons/098-deploy-the-api-and-configure-database-secrets.md) | [Open Q&A](qnas/098-deploy-the-api-and-configure-database-secrets.md) | [Open Example](examples/098-deploy-the-api-and-configure-database-secrets.md) |
| 099 | Full-stack integration and delivery | [Deploy the frontend and production API URLs](lessons/099-deploy-the-frontend-and-production-api-urls.md) | [Open Q&A](qnas/099-deploy-the-frontend-and-production-api-urls.md) | [Open Example](examples/099-deploy-the-frontend-and-production-api-urls.md) |
| 100 | Full-stack integration and delivery | [Continuous integration: lint, test, and build](lessons/100-continuous-integration-lint-test-and-build.md) | [Open Q&A](qnas/100-continuous-integration-lint-test-and-build.md) | [Open Example](examples/100-continuous-integration-lint-test-and-build.md) |
| 101 | Production practice and capstone | [Monitoring, logs, and health checks](lessons/101-monitoring-logs-and-health-checks.md) | [Open Q&A](qnas/101-monitoring-logs-and-health-checks.md) | [Open Example](examples/101-monitoring-logs-and-health-checks.md) |
| 102 | Production practice and capstone | [Backups, migrations, recovery, and releases](lessons/102-backups-migrations-recovery-and-releases.md) | [Open Q&A](qnas/102-backups-migrations-recovery-and-releases.md) | [Open Example](examples/102-backups-migrations-recovery-and-releases.md) |
| 103 | Production practice and capstone | [Capstone: plan and build a complete MERN application](lessons/103-capstone-plan-and-build-a-complete-mern-application.md) | [Open Q&A](qnas/103-capstone-plan-and-build-a-complete-mern-application.md) | [Open Example](examples/103-capstone-plan-and-build-a-complete-mern-application.md) |
| 104 | Production practice and capstone | [Capstone: accessibility, security, performance, and deployment](lessons/104-capstone-accessibility-security-performance-and-deployment.md) | [Open Q&A](qnas/104-capstone-accessibility-security-performance-and-deployment.md) | [Open Example](examples/104-capstone-accessibility-security-performance-and-deployment.md) |

## Suggested projects

- **After the foundations:** a small Node.js command-line utility.
- **After MongoDB:** a data model with sample records, validation, and useful queries.
- **After Express:** a documented REST API with validation and consistent errors.
- **After React:** a responsive interface that consumes an API and handles loading and error states.
- **Capstone:** a complete full-stack application with authentication, authorization, testing, deployment configuration, and a clear setup guide.

## Repository structure

~~~text
mern/
├── lessons/    # Concept-by-concept lessons
├── qnas/       # Questions with answers and explanations
├── examples/   # Complete code examples and expected results
├── LICENSE
└── README.md
~~~

Chapter filenames follow this pattern: `001-short-topic-name.md`. The lesson, Q&A, and example for a chapter share the same number and topic slug.

## Content conventions

- Lessons explain concepts in a beginner-friendly order and define new terms.
- Code examples use consistent names and include the context needed to understand them.
- Q&A files include answers immediately after their questions, with explanations where useful.
- Examples explain prerequisites, setup, expected output or behavior, and common mistakes.
- Chapter pages link to the previous and next lesson, plus the matching Q&A and example.
- The roadmap avoids pinning package versions so its guidance does not depend on one frozen toolchain.

## Course scope

This course focuses on the core MERN stack and the practices needed to build and maintain a full-stack application. It also covers testing, accessibility, security, performance, and deployment. Optional libraries and hosting choices can vary; lessons should explain a tool's purpose and tradeoffs before relying on it.

---

*These are practical learning notes, written to be studied, revisited, and improved chapter by chapter.*
