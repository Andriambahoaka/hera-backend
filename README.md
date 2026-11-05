# Backend API – Hera

## Overview
This repository contains the backend REST API for the Hera mobile application.  
The API is built with Node.js and TypeScript and is designed to be deployed using Docker, behind a reverse proxy handling HTTPS.

---

## Tech Stack
- Node.js 24 (LTS)
- TypeScript
- Express
- MongoDB
- Docker
- Docker Compose

---

## Project Structure
src/
├── app.ts (Express app configuration)
├── server.ts (HTTP server bootstrap)
├── routes/ (API routes)
├── controllers/ (Business logic)
├── models/ (MongoDB models)
├── utils/ (Utilities & helpers)
└── uploads/ (Uploaded files)


---

## Architecture Notes
- The API runs over HTTP internally  
- HTTPS (SSL/TLS) is handled by the infrastructure layer (reverse proxy)  
- The application is stateless  
- MongoDB can be deployed:  
  - as a Docker container (recommended), or  
  - as an external managed service (MongoDB Atlas, VPS MongoDB, etc.)

## Environment Variables

Copy `.env.example` to `.env` and fill it in. It documents every variable.

The API validates its environment at startup (`src/core/config/env.ts`):
in production it refuses to start if a required variable is missing or a
secret is shorter than 32 characters. Only variable names are ever logged.

With Docker Compose, the MongoDB container also needs `.env.mongo`
(see `.env.mongo.example`). It is separate so the API never sees root
database credentials.

Never commit `.env`, `.env.mongo`, or any file containing real secrets.

### Running Locally (without Docker)
- Install dependencies
   npm install

- Start the server
  npm run dev

The API will be available at:
http://localhost:3000

### Running with Docker (Recommended)
- Build and start the services :
  "docker compose up --build -d"

- Stop the services :
  "docker compose down"

The API will be available at:
http://localhost:3000

### Tests

  npm test              # all tests
  npm run test:watch    # re-run on change
  npm run test:coverage # coverage report
  npm run typecheck     # type-check src and tests

Tests use Jest + Supertest against an in-memory MongoDB replica set
(downloaded automatically on first run; no Docker or real database needed).
External services (Firebase, email, Dolynk, Cloudinary) are mocked in
`tests/setup/mocks.ts`. `tests/security/access-control.test.ts` lists the
pending security fixes as `todo` tests.

### Health Check

- A health endpoint is available to verify that the service is running:
 "GET /healthz"

### Logs & Maintenance

- View API logs:
  "docker compose logs api"

- Restart the API service:

 "docker compose restart api"

### Security Notes

 * HTTPS is handled by the reverse proxy (Nginx, Traefik, etc.)
 * The API trusts the proxy (trust proxy enabled)
 * Rate limiting is enabled on authentication routes
 * CORS is restricted via environment configuration
 * Helmet is used to set secure HTTP headers

### Deployment Notes
  * The API listens on 0.0.0.0 for Docker compatibility
  * Port mapping can be adjusted depending on infrastructure needs
  * MongoDB data must be persisted using Docker volumes or managed backups
  * MongoDB is not exposed outside the Docker network, requires authentication,
    and runs as a single-node replica set (needed for transactions)
  * Migrating an existing unauthenticated database: `docs/runbooks/mongo-hardening.md`
  * CI/CD can be added later (GitHub Actions, GitLab CI, etc.)

### License
Private project – all rights reserved.

