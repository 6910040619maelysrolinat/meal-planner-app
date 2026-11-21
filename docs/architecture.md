# Architecture

```mermaid
flowchart TD
  U[User] --> FE[React + Vite frontend]
  FE -->|HTTP JSON + JWT| API[Express REST API]
  API --> SQL[(MySQL: relational data)]
  API --> NOSQL[(MongoDB: logs, reviews, carts, notifications)]
  API --> AUTH[JWT authentication + bcrypt]
  API -->|After successful SQL commit| NOSQL
```

The browser communicates only with the Express backend. The backend owns database access. MySQL stores structured relational data; MongoDB stores flexible documents and activity records.
