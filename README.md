# Backend API – Hera

## Overview
This repository contains the backend REST API for the Hera mobile application.  
The API is built with Node.js and TypeScript and is designed to be deployed using Docker, behind a reverse proxy handling HTTPS.

---

## Tech Stack
- Node.js 18+
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

The application relies on environment variables for configuration.

Create a '.env' file based on '.env.example'.

### Required variables
- 'NODE_ENV' – application environment (`development`, `production`)  
- 'PORT' – port the API listens on (default: `3000`)  
- 'MONGO_URI' – MongoDB connection string  
- 'JWT_SECRET '– secret used to sign authentication tokens  
- CORS_ORIGINS' – comma-separated list of allowed origins

### Example env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://mongo:27017/app_db
JWT_SECRET=change_me
CORS_ORIGINS=https://app.example.com

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
  * CI/CD can be added later (GitHub Actions, GitLab CI, etc.)

### License
Private project – all rights reserved.

