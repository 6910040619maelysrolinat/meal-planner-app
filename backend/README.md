# Backend

Express API for the Meal Planner application.

## Run locally

1. Copy `.env.example` to `.env`.
2. Set the local MySQL password and a private `JWT_SECRET`.
3. Start the local MySQL and MongoDB services.
4. Run `npm.cmd install`, then `npm.cmd run dev`.

The API listens on `http://localhost:5000`. `GET /api/health` checks both databases. Protected routes require a JWT bearer token.

## Main modules
- `server.js`: authentication, SQL and MongoDB CRUD endpoints, transaction workflow
- `db.js`: local MySQL pool and MongoDB connection
- `middleware.js`: JWT authentication middleware

Do not commit `.env` or share its contents.
