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

```bash
$ npm install
