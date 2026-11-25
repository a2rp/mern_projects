# MERN2 Frontend

React client for the MERN2 Auth Workspace. Admin sessions use an HttpOnly cookie issued by the API; user records are loaded from MongoDB through authenticated API requests.

## Run locally

Install the root API dependencies and start the API first. Then, from this directory:

```bash
npm ci
npm start
```

The client connects to `http://localhost:1198` by default. To use another API origin, create a `.env` file here with:

```text
REACT_APP_API_URL=https://api.example.com
```

The API must allow this frontend origin with `CLIENT_ORIGIN`. For production, use HTTPS and host the frontend and API on the same site so the strict SameSite session cookie is sent correctly.
