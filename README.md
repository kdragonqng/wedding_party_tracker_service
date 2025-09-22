# wedding_party_tracker_service

Quick start

- Install deps: `npm install`
- Dev run: `npm run dev`
- Build: `npm run build`
- Start built app: `npm start`

Health check

- Endpoint: `GET /health`
- Example with curl: `curl http://localhost:3000/health`
- Expected response:
  `{"status":"ok","uptime":<seconds>,"timestamp":"<ISO>"}`

API Docs

- Swagger UI at: `http://localhost:3000/api-docs`

MongoDB

- Environment variables:
  - `MONGODB_URI` (required) – MongoDB connection string
  - `MONGODB_DB` (optional) – database name; defaults to driver's default
- Local development can use `.env.local` at the project root. The app auto-loads it at startup without extra dependencies.
- The server waits for MongoDB to connect before listening.

Auth

- Endpoints:
  - `POST /auth/register` – body: `{ email, password, name? }` → returns `{ token, user }`
  - `POST /auth/login` – body: `{ email, password }` → returns `{ token, user }`
- JWT:
  - HMAC-SHA256 token, default expiry 7 days.
  - Secret from `JWT_SECRET` env (falls back to a dev default if unset).
- Environment variables:
  - `JWT_SECRET` (recommended) – your JWT signing secret.
