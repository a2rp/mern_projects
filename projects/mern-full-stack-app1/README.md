# MERN Full Stack Contact Manager

A React contact manager with a Node.js/Express API, MongoDB storage, and JWT-based user sessions.

## Features

- User registration and login with bcrypt password hashing
- HttpOnly, signed session cookies with server-side verification
- Contact create, read, update, and delete routes scoped to the signed-in user
- Server-side validation, safe API responses, and duplicate checks
- Contact search and sorting in the dashboard

## Local setup

Requirements: Node.js 22 and MongoDB.

1. Create the backend environment file:

       Copy-Item backend/.env.example backend/.env

   Replace TOKEN_KEY with a random secret of at least 32 bytes. The previously documented sample key is not secure and is no longer accepted.

2. Start the API:

       cd backend
       npm install
       npm run start:dev

3. In another terminal, configure and start the frontend:

       Copy-Item frontend/.env.example frontend/.env.local
       cd frontend
       npm install
       npm start

The React app runs at http://localhost:3000 and the API at http://localhost:1198.

## Configuration

The API reads MONGO_URL, PORT, TOKEN_KEY, CLIENT_ORIGIN, NODE_ENV, and COOKIE_SAME_SITE from backend/.env. TOKEN_KEY must be a private random value at least 32 bytes long. Never commit or share .env files.

Set CLIENT_ORIGIN to the exact frontend origin. For an HTTPS deployment, set NODE_ENV=production; cookies then use Secure and HttpOnly flags. Set COOKIE_SAME_SITE=none when the frontend and API are hosted on different sites.

## API

All endpoints use the /api/v1 prefix.

- POST /user/register
- POST /user/login
- POST /user/logout
- POST /user (verify session)
- GET /contact (list the signed-in user's contacts)
- POST /contact (create a contact)
- PATCH /contact/:id (update an owned contact)
- DELETE /contact/:id (delete an owned contact)

Contact endpoints require a valid session cookie. The API derives the owner ID from the verified session and ignores client-supplied owner IDs.
