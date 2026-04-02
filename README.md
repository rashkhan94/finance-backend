# Finance Dashboard Backend API

A RESTful backend service for managing financial data with role-based access control, built as part of a finance dashboard system. The API supports user management, financial record CRUD operations, and analytical dashboard endpoints.

**Live API**: [https://finance-backend-w8h4.onrender.com](https://finance-backend-w8h4.onrender.com)  
**API Docs**: [https://finance-backend-w8h4.onrender.com/api-docs](https://finance-backend-w8h4.onrender.com/api-docs)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Tradeoffs](#tradeoffs)

---

## Tech Stack

| Layer           | Technology                     |
| --------------- | ------------------------------ |
| Runtime         | Node.js (v18+)                 |
| Framework       | Express.js                     |
| Database        | MongoDB + Mongoose ODM         |
| Authentication  | JWT (jsonwebtoken + bcryptjs)  |
| Validation      | Joi                            |
| Documentation   | Swagger (OpenAPI 3.0)          |
| Testing         | Jest + Supertest               |
| Security        | Helmet, CORS, express-rate-limit |

---

## Project Structure

```
finance-backend/
├── server.js                    # Entry point — starts HTTP server
├── src/
│   ├── app.js                   # Express app configuration
│   ├── config/
│   │   ├── index.js             # Centralised env config
│   │   ├── database.js          # MongoDB connection logic
│   │   └── swagger.js           # OpenAPI specification
│   ├── models/
│   │   ├── User.js              # User schema (roles, soft delete)
│   │   └── FinancialRecord.js   # Transaction schema (indexed fields)
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access control
│   │   ├── validate.js          # Request validation (Joi)
│   │   └── errorHandler.js      # Centralised error handling
│   ├── validators/
│   │   ├── auth.validator.js    # Register/login schemas
│   │   ├── user.validator.js    # User update schema
│   │   └── record.validator.js  # Record CRUD + query schemas
│   ├── services/
│   │   ├── auth.service.js      # Auth business logic
│   │   ├── user.service.js      # User management logic
│   │   ├── record.service.js    # Record CRUD + filtering
│   │   └── dashboard.service.js # Aggregation pipelines
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── record.controller.js
│   │   └── dashboard.controller.js
│   ├── routes/
│   │   ├── index.js             # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── record.routes.js
│   │   └── dashboard.routes.js
│   └── utils/
│       ├── ApiError.js          # Custom error class
│       ├── ApiResponse.js       # Standardised response format
│       └── seedData.js          # Demo data seeder
├── tests/
│   ├── setup.js                 # In-memory MongoDB for tests
│   ├── auth.test.js
│   ├── records.test.js
│   └── dashboard.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The project follows a **layered architecture** — routes → controllers → services → models. This keeps each layer focused on a single responsibility:

- **Routes** define URL mappings and apply middleware (auth, validation).
- **Controllers** handle HTTP concerns (request/response) but delegate logic to services.
- **Services** contain all business logic and database queries.
- **Models** define data schemas and database-level behaviour.

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- **npm** (comes bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rashkhan94/finance-backend.git
cd finance-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and a JWT secret

# 4. (Optional) Seed the database with sample data
npm run seed

# 5. Start the development server
npm run dev
```

The server starts at `http://localhost:5000` by default. Interactive API documentation is available at `http://localhost:5000/api-docs`.

### Seed Data

Running `npm run seed` creates three demo users and ~45 financial records:

| Role    | Email               | Password     |
| ------- | ------------------- | ------------ |
| Admin   | admin@example.com   | admin123     |
| Analyst | analyst@example.com | analyst123   |
| Viewer  | viewer@example.com  | viewer123    |

---

## Environment Variables

| Variable                | Description                          | Default                                |
| ----------------------- | ------------------------------------ | -------------------------------------- |
| `PORT`                  | Server port                          | `5000`                                 |
| `NODE_ENV`              | Environment mode                     | `development`                          |
| `MONGO_URI`             | MongoDB connection string            | `mongodb://localhost:27017/finance_db`  |
| `JWT_SECRET`            | Secret key for signing JWTs          | *(must be set)*                        |
| `JWT_EXPIRES_IN`        | Token expiry duration                | `7d`                                   |
| `RATE_LIMIT_WINDOW_MS`  | Rate limit window (ms)               | `900000` (15 min)                      |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window            | `100`                                  |

---

## API Documentation

The live API documentation is available at **https://finance-backend-w8h4.onrender.com/api-docs**.

For local development, visit **http://localhost:5000/api-docs** after starting the server. You can test all endpoints directly from the browser.

---

## Authentication & Authorization

### Authentication

The API uses JWT bearer tokens. After registering or logging in, include the token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

### Role-Based Access Control

Three roles are defined, each with different permissions:

| Action                      | Viewer | Analyst | Admin |
| --------------------------- | :----: | :-----: | :---: |
| View own profile            |   ✓    |    ✓    |   ✓   |
| View financial records      |   ✓    |    ✓    |   ✓   |
| Access dashboard analytics  |   ✗    |    ✓    |   ✓   |
| Create/update/delete records |  ✗    |    ✗    |   ✓   |
| Manage users                |   ✗    |    ✗    |   ✓   |

Access control is enforced at the middleware level — the `authorize()` middleware checks the user's role before any controller logic runs.

---

## API Endpoints

### Auth

| Method | Endpoint             | Description                  | Auth Required |
| ------ | -------------------- | ---------------------------- | :-----------: |
| POST   | `/api/auth/register` | Register a new user          |      No       |
| POST   | `/api/auth/login`    | Login, receive JWT           |      No       |
| GET    | `/api/auth/me`       | Get current user profile     |      Yes      |

### Users (Admin only)

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| GET    | `/api/users`      | List all users         |
| GET    | `/api/users/:id`  | Get user by ID         |
| PATCH  | `/api/users/:id`  | Update user role/status |
| DELETE | `/api/users/:id`  | Soft-delete a user     |

### Financial Records

| Method | Endpoint            | Description                     | Who Can Access      |
| ------ | ------------------- | ------------------------------- | ------------------- |
| POST   | `/api/records`      | Create a record                 | Admin               |
| GET    | `/api/records`      | List records (filter, paginate) | All authenticated   |
| GET    | `/api/records/:id`  | Get single record               | All authenticated   |
| PUT    | `/api/records/:id`  | Update a record                 | Admin               |
| DELETE | `/api/records/:id`  | Soft-delete a record            | Admin               |

**Filtering options** for `GET /api/records`:

| Query Param  | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `type`       | string | Filter by `income` or `expense`          |
| `category`   | string | Filter by category name                  |
| `startDate`  | date   | Records from this date onwards           |
| `endDate`    | date   | Records up to this date                  |
| `sortBy`     | string | Sort field: `date`, `amount`, `createdAt`|
| `sortOrder`  | string | `asc` or `desc` (default: `desc`)        |
| `search`     | string | Text search on description               |
| `page`       | number | Page number (default: 1)                 |
| `limit`      | number | Records per page (default: 20, max: 100) |

### Dashboard (Analyst & Admin)

| Method | Endpoint                          | Description                           |
| ------ | --------------------------------- | ------------------------------------- |
| GET    | `/api/dashboard/summary`          | Total income, expenses, net balance   |
| GET    | `/api/dashboard/category-breakdown` | Category-wise income/expense totals |
| GET    | `/api/dashboard/trends`           | Monthly trends (last 12 months)       |
| GET    | `/api/dashboard/recent-activity`  | Latest N financial records            |

---

## Data Models

### User

| Field      | Type     | Description                                  |
| ---------- | -------- | -------------------------------------------- |
| name       | String   | User's full name (2–50 chars)                |
| email      | String   | Unique email address                         |
| password   | String   | bcrypt-hashed, excluded from query results   |
| role       | Enum     | `viewer`, `analyst`, or `admin`              |
| isActive   | Boolean  | Whether the account is active                |
| isDeleted  | Boolean  | Soft-delete flag (filtered out by default)   |
| timestamps | Auto     | `createdAt` and `updatedAt`                  |

### Financial Record

| Field       | Type     | Description                                   |
| ----------- | -------- | --------------------------------------------- |
| amount      | Number   | Transaction amount (must be > 0)              |
| type        | Enum     | `income` or `expense`                         |
| category    | Enum     | One of 15 predefined categories               |
| date        | Date     | Transaction date                              |
| description | String   | Optional notes (up to 300 chars)              |
| createdBy   | ObjectId | Reference to the User who created the record  |
| isDeleted   | Boolean  | Soft-delete flag                              |
| timestamps  | Auto     | `createdAt` and `updatedAt`                   |

**Categories**: salary, freelance, investments, rent, utilities, groceries, transport, entertainment, healthcare, education, shopping, travel, insurance, taxes, other.

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [],
  "stack": "..."
}
```

- The `errors` array contains field-level details for validation failures.
- The `stack` trace is only included in development mode.
- Mongoose errors (duplicate key, validation, cast) are translated into user-friendly messages.
- Standard HTTP status codes are used throughout (400, 401, 403, 404, 409, 500).

---

## Testing

Tests use **Jest** with **mongodb-memory-server** so no external database is needed.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

The test suite covers:
- User registration and login (including error cases)
- JWT authentication and token validation
- Role-based access control enforcement
- Financial record CRUD operations
- Record filtering and pagination
- Dashboard aggregation endpoints

---

## Design Decisions & Assumptions

1. **Soft deletes over hard deletes** — Both users and records use an `isDeleted` flag rather than being removed from the database. This preserves audit trails and allows potential recovery. Soft-deleted documents are automatically excluded from queries via Mongoose middleware.

2. **Predefined category enum** — Categories are restricted to a fixed set rather than being free-text. This ensures consistent data for aggregation queries and prevents messy category names from causing issues in analytics.

3. **Password not returned in queries** — The User model uses `select: false` on the password field, so it's never accidentally leaked in API responses. It's explicitly selected only during login.

4. **Admin self-protection** — An admin cannot change their own role or delete their own account. This prevents accidental lockout scenarios.

5. **Registration is open** — Any user can register with any role for demo purposes. In a production system, role assignment would typically be restricted to existing admins, or new users would default to the lowest role.

6. **In-memory database for testing** — Tests run against `mongodb-memory-server` so they're fast, isolated, and don't require a running MongoDB instance.

7. **Rate limiting** — Applied to all `/api` routes to prevent abuse. Configured via environment variables for flexibility.

---

## Tradeoffs

- **MongoDB over SQL**: Chose MongoDB because the data model is relatively flat and the aggregation pipeline is powerful enough for the summary endpoints. A relational database would also work well here — the choice was primarily about development speed and flexibility.

- **No refresh tokens**: The current implementation uses a single JWT with a 7-day expiry. A production system would use short-lived access tokens with refresh tokens for better security.

- **Synchronous seeding**: The seed script runs sequentially for simplicity. For a larger dataset, batch inserts with `insertMany` would be more efficient (already used for records).

- **No file uploads or attachments**: Financial records only store metadata. Adding receipt uploads would require integrating a file storage service.

---

## License

MIT
