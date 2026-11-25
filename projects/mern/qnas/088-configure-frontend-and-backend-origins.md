# 088 - Configure frontend and backend origins: Q&A

These questions review origins, browser CORS behavior, Vite configuration, Express allowlists, preflight requests, credentials, proxies, deployment environments, and troubleshooting.

## Multiple-choice questions

### 1. Which parts define a web origin?

- **A.** Scheme, host, and port
- **B.** Path, query string, and fragment
- **C.** File name, extension, and query
- **D.** HTTP method, status, and body

**Answer: A.** The origin is the scheme, host, and port tuple.

### 2. Are these two URLs same-origin: <code>http://localhost:5173</code> and <code>http://localhost:4000</code>?

- **A.** Yes, because the hostname is the same
- **B.** No, because the ports differ
- **C.** Yes, because both use HTTP
- **D.** No, because localhost cannot host an API

**Answer: B.** A different port means a different origin.

### 3. Do these URLs have different origins: <code>https://app.example.test/courses</code> and <code>https://app.example.test/settings</code>?

- **A.** Yes, because their paths differ
- **B.** No, because scheme, host, and port are the same
- **C.** Yes, because they are different pages
- **D.** No, only if CORS is disabled

**Answer: B.** Paths do not form part of an origin.

### 4. What is a frontend API base URL used for?

- **A.** To identify where the browser should send API requests
- **B.** To give React access to MongoDB directly
- **C.** To authorize all users
- **D.** To set the browser's document origin

**Answer: A.** It is public client configuration that points requests to the API.

### 5. What happens to a Vite variable prefixed with <code>VITE_</code>?

- **A.** It is available only to MongoDB
- **B.** It can be exposed in the client bundle
- **C.** It is automatically encrypted
- **D.** It is available only to Express middleware

**Answer: B.** Treat every value exposed to client code as public.

### 6. Which value is appropriate for a public client variable?

- **A.** A database password
- **B.** A private JWT signing key
- **C.** A public API base URL
- **D.** A production database URI with credentials

**Answer: C.** An API URL is usually public; credentials must remain server-side.

### 7. Why might a developer restart Vite after editing an env file?

- **A.** Vite reads env files when it starts
- **B.** Express requires the browser to restart
- **C.** The browser cannot make network requests otherwise
- **D.** MongoDB caches the URL in React

**Answer: A.** Restart the development server after changing Vite env configuration.

### 8. What does the Express CORS middleware primarily do?

- **A.** Adds response headers used by browsers to decide whether JavaScript can read a cross-origin response
- **B.** Encrypts every request
- **C.** Prevents all non-browser clients from connecting
- **D.** Validates database schemas

**Answer: A.** CORS headers do not replace API authentication or authorization.

### 9. Does CORS block requests from curl or another backend server?

- **A.** Yes, all clients enforce browser CORS
- **B.** No, non-browser clients generally do not enforce browser CORS
- **C.** Yes, unless Express is in development mode
- **D.** No, because curl cannot send an Origin header

**Answer: B.** CORS is enforced by browsers; other clients can still send requests.

### 10. What is a CORS preflight?

- **A.** A preliminary OPTIONS request asking whether a cross-origin request is allowed
- **B.** A database connection check
- **C.** A React build step
- **D.** An automatic retry after every 500 response

**Answer: A.** Browsers preflight some cross-origin methods, headers, and content types.

### 11. Which request is likely to cause a preflight?

- **A.** A cross-origin POST with Content-Type application/json
- **B.** A same-origin GET with no special headers
- **C.** Loading a local CSS file
- **D.** Rendering a React component

**Answer: A.** JSON content type is not a CORS-safelisted content type.

### 12. Which method can a browser use for a CORS preflight?

- **A.** OPTIONS
- **B.** TRACE only
- **C.** CONNECT
- **D.** CREATE

**Answer: A.** The browser sends an OPTIONS request describing the desired method and headers.

### 13. What should a server return for a permitted credentialed origin?

- **A.** A specific allowed origin and permission for credentials
- **B.** A wildcard origin and credentials
- **C.** No CORS headers
- **D.** Only a JSON body

**Answer: A.** Credentialed CORS responses require an explicit origin rather than wildcard.

### 14. What client option includes browser credentials in a cross-origin fetch?

- **A.** <code>credentials: "include"</code>
- **B.** <code>headers: {"origin": "*"}</code>
- **C.** <code>mode: "public"</code>
- **D.** <code>cors: true</code>

**Answer: A.** The request and server policy must both allow credentials.

### 15. Does <code>credentials: "include"</code> alone guarantee cookies are sent?

- **A.** Yes, cookie attributes never matter
- **B.** No, cookie policy, domain, path, and browser rules still apply
- **C.** Yes, it disables SameSite
- **D.** No, cookies cannot be sent to APIs

**Answer: B.** Fetch credentials do not override cookie scope or browser policy.

### 16. When is a Vite development proxy useful?

- **A.** To forward a frontend path such as /api to the local Express API
- **B.** To publish the production API automatically
- **C.** To hide frontend source from browser users
- **D.** To replace server authorization

**Answer: A.** A dev proxy can simplify local development routing.

### 17. Does configuring a Vite dev proxy automatically configure production?

- **A.** Yes, the setting is copied to every host
- **B.** No, production needs an API URL or a separately configured reverse proxy
- **C.** Yes, if the API is written in Express
- **D.** No, production cannot use proxies

**Answer: B.** Development server proxy settings do not deploy themselves.

### 18. What is a safe way to compare allowed browser origins?

- **A.** Compare complete expected origin strings
- **B.** Check if the origin contains the text "example.com"
- **C.** Allow every value ending in any hostname
- **D.** Compare only the path

**Answer: A.** Exact origins avoid unsafe substring or broad suffix matches.

### 19. What should happen if a static frontend is built with a production API URL?

- **A.** The URL may be embedded in the generated bundle
- **B.** The URL is encrypted on the user's computer
- **C.** The URL can only be changed by Express without rebuilding
- **D.** The frontend can use it as a database password

**Answer: A.** Vite client env values are replaced during build; changing the server environment later does not rewrite a static bundle.

### 20. Which statement about CORS is correct?

- **A.** It is an access-control system that replaces server authentication
- **B.** It controls browser access to cross-origin responses and is separate from API authorization
- **C.** It prevents curl from making a request
- **D.** It secures database credentials in browser code

**Answer: B.** An allowed origin does not prove a user is authenticated or authorized.

## Short-answer and scenario questions

### 21. The frontend runs at localhost port 5173 and the API at localhost port 4000. Why is the browser cross-origin request subject to CORS?

**Answer:** The ports differ, so the URLs have different origins despite sharing the localhost hostname.

### 22. A developer adds a path such as <code>/api</code> to an allowed-origin value. What should the value contain instead?

**Answer:** The origin only: scheme, host, and port. Route paths are not part of the origin.

### 23. A request works in Postman but the React page cannot read the response. What should you inspect?

**Answer:** Inspect the browser Network panel for the request and any OPTIONS preflight, check the Origin and response CORS headers, and inspect API/proxy logs. Postman does not enforce browser CORS.

### 24. The browser shows an OPTIONS request failing before the JSON POST. What does that usually indicate?

**Answer:** The preflight response did not permit the requesting origin, method, or requested headers, or an upstream proxy failed to route OPTIONS.

### 25. Why can a failed API or proxy response appear as a CORS error in the browser?

**Answer:** If the failure response lacks the required CORS headers, frontend JavaScript cannot read it; the browser may report a CORS access error even though the underlying cause is a server or routing failure.

### 26. Your team wants cross-origin cookie authentication. What must the client and server configure?

**Answer:** The client opts in with credentials, and the server returns an explicit allowed origin plus credential permission. Cookie attributes, HTTPS, and CSRF protections must also be configured separately.

### 27. Why is returning wildcard origin with credentials invalid for browser CORS?

**Answer:** A browser does not accept a wildcard allowed-origin value for a credentialed response; the server must identify the permitted origin.

### 28. A reviewer finds a production MongoDB URI in a Vite env variable. What is wrong?

**Answer:** Vite exposes prefixed client values in the browser bundle. Move the URI to server-only protected configuration, rotate the exposed credential, and rebuild the client without it.

### 29. Why is an allowed-origin list not a replacement for authentication?

**Answer:** CORS controls whether browser JavaScript can read responses. Non-browser clients can still send requests, so protected operations must authenticate and authorize at the API.

### 30. A server accepts any origin containing "example.com". What is the risk?

**Answer:** An attacker-controlled hostname could contain that substring. Compare the full scheme, host, and port against an explicit allowlist.

### 31. When could a relative API path avoid local CORS configuration?

**Answer:** When the browser calls the frontend origin and a development proxy forwards that path to Express. The proxy must be configured for the active development server.

### 32. The frontend is deployed on one host and the API on another. What two common routing choices exist?

**Answer:** Use a public API base URL and configure CORS on the API, or route an API path through a same-origin production reverse proxy.

### 33. Why must production routing be checked separately when local proxying works?

**Answer:** The Vite dev proxy exists only in the development server. A production reverse proxy or public API URL must be configured by the deployment platform.

### 34. The API allowlist includes localhost port 5173, but the browser reports its origin as localhost port 4173. Why is it rejected?

**Answer:** The actual browser origin contains a different port. Add the intended preview origin deliberately or use the correct preview routing, rather than broadening the policy indiscriminately.

### 35. Why can an env variable's boolean-looking value still need conversion?

**Answer:** Vite exposes custom environment values as strings. Application code must parse them into the type it needs.

### 36. A developer changes the client API URL after a static production build but the site still calls the old API. Why?

**Answer:** The public Vite value was incorporated at build time. Rebuild the bundle or use an intentional runtime configuration mechanism.

### 37. Should every cross-origin API request include browser credentials?

**Answer:** No. Only send credentials when the authentication design requires them; enabling them unnecessarily expands the credential-sharing policy.

### 38. The API allows the frontend origin, but an unauthenticated user can still call a protected route with curl. Is this a CORS defect?

**Answer:** No. CORS is not server authorization. Add or correct authentication and authorization checks on the protected route.

### 39. A preview deployment uses a new randomized hostname for every branch. How should access be configured?

**Answer:** Choose a controlled preview origin strategy, such as trusted preview-host configuration or a same-origin proxy, with strict validation. Avoid accepting arbitrary origins based on a loose substring rule.

### 40. Give a practical order for diagnosing a browser CORS failure.

**Answer:** Check the browser Network panel, identify the actual or OPTIONS request, compare its origin and headers with the API policy, inspect response headers/status, verify client URL and proxy routing, then review server and host logs.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [087 - Full-stack application architecture and folder structure](../lessons/087-full-stack-application-architecture-and-folder-structure.md) | [Lesson](../lessons/088-configure-frontend-and-backend-origins.md) | [Example](../examples/088-configure-frontend-and-backend-origins.md) | [089 - Connect React to Express end to end](../lessons/089-connect-react-to-express-end-to-end.md) |
