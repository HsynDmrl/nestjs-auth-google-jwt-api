## Project Description

This project is a comprehensive application built with MySQL database integration, featuring robust authentication and authorization capabilities. It includes both email-based and Google OAuth2.0 login/registration processes, JWT-based authentication with refresh tokens, role-based access control, and user management functionalities.

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
  - Data is stored in a MySQL database.

## Project Setup

Before running the project, you need to install the necessary dependencies and configure the environment variables.

### Environment Variables

Create a `.env` file in the root directory of your project with the following content:

```env
DB_HOST=your-database-host
DB_PORT=your-database-port
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
JWT_SECRET=your-jwt-secret-key
EMAIL_HOST=your-email-smtp-host
EMAIL_PORT=your-email-smtp-port
EMAIL_USER=your-email-username
EMAIL_PASS=your-email-password
APP_URL=your-application-url
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=your-google-callback-url
