## Project Description

This project is a comprehensive application built with PostgreSQL database integration, featuring robust authentication and authorization capabilities. It includes both email-based and Google OAuth2.0 login/registration processes, JWT-based authentication with refresh tokens, role-based access control, and user management functionalities.

### Key Features

- **Authentication & Authorization**:
  - Email-based registration, login, forgot password, and change password features.
  - Google OAuth2.0 based registration and login.
  - JWT authentication with refresh token mechanism.
  - Role-based access control with roles such as admin, user, etc.

- **User Management**:
  - Standard user operations: `register`, `login`, `forgot password`, `change password`, `update`, `get by id`.
  - Admin panel endpoints:
    - Soft delete, hard delete, and methods to display active, inactive, or all users.
    - User-related operations such as `add`, `update`, and `get by id`.

- **Email Notifications**:
  - Automated email notifications are sent during user registration, forgot password, and change password actions.

- **Database**:
  - Data is stored in a PostgreSQL database.

## Project Setup

Before running the project, you need to install the necessary dependencies and configure the environment variables.

### Environment Variables

Create a `.env` file in the root directory of your project with the following content:

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
DB_DROP_SCHEMA=false
JWT_SECRET=your-jwt-secret-key
EMAIL_HOST=your-email-smtp-host
EMAIL_PORT=your-email-smtp-port
EMAIL_USER=your-email-username
EMAIL_PASS=your-email-password
APP_URL=your-application-url
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=your-google-callback-url
SECRET_KEY=your-session-secret
```

## Multi-tenant and plan-based foundation

- Tenancy hierarchy added: `Company -> Branch -> Team -> Membership`
- Active branch context endpoint: `GET /v1/tenancy/context/active-branch`
- Mobile and tenant headers:
  - `x-device-id` (required for login/refresh token flow)
  - `x-branch-id` (required for tenant-scoped endpoints)

## Mobile-first token flow (Expo friendly)

- Access token lifetime is reduced to **15 minutes**.
- Refresh token is now:
  - device-bound (`deviceId`)
  - one-time use (rotation on refresh)
  - stored hashed on server (`tokenHash`)
- New endpoint: `POST /v1/auth/logout-all` revokes all user sessions.

## New domain modules

- `tenancy`: company/branch/team/membership management
- `billing`: plan/subscription feature and member-limit enforcement
- `workforce`: shift template, weekly schedule and shift assignment foundation
