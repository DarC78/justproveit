# JustProveIt Password Reset Technical Specification

## Objective

Implement a secure one-time password reset link flow for JustProveIt admin/CRM users.

The frontend already supports:

- Requesting a password reset link from the login page.
- Opening a reset link at `/reset-password`.
- Submitting a new password with the reset token.

The backend must implement the corresponding auth API endpoints, token storage, email delivery, and password update logic.

## Frontend URLs

Production reset page:

```text
https://www.justproveit.co.uk/reset-password
```

Expected email link format:

```text
https://www.justproveit.co.uk/reset-password?token=<raw-token>&email=<url-encoded-email>
```

The `email` query parameter is optional for the frontend but recommended for backend validation and user display.

## API Base

Current frontend auth API base:

```text
https://launchingstack-func-dev.azurewebsites.net/api
```

The backend should expose:

```text
POST /auth/forgot-password
POST /auth/reset-password
```

Full production URLs:

```text
POST https://launchingstack-func-dev.azurewebsites.net/api/auth/forgot-password
POST https://launchingstack-func-dev.azurewebsites.net/api/auth/reset-password
```

## Endpoint 1: Request Password Reset

### Route

```text
POST /auth/forgot-password
```

### Auth

Anonymous/public endpoint.

### Request Body

```json
{
  "email": "user@example.com",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk",
  "resetUrl": "https://www.justproveit.co.uk/reset-password"
}
```

### Validation

- `email` is required and must be a valid email address.
- `tenantKey` or `domain` must identify a valid tenant.
- `resetUrl` must be an approved HTTPS URL.
- For local development only, `localhost` may be allowed.

### Behavior

1. Normalize email to lowercase and trim whitespace.
2. Resolve tenant using `tenantKey` and/or `domain`.
3. Always return a successful generic response for valid request shape, even if:
   - the email does not exist,
   - the user is inactive,
   - the user is not attached to the tenant.
4. If a valid active user exists for that tenant:
   - Generate a cryptographically secure random token.
   - Hash the token with SHA-256 or stronger.
   - Store only the token hash.
   - Set an expiry of 15-30 minutes.
   - Invalidate any previous unused reset tokens for the same user and tenant.
   - Send the user an email containing the raw token only inside the reset URL.
5. Do not log raw reset tokens or plaintext passwords.

### Success Response

Always use this response for valid request shape:

```json
{
  "success": true
}
```

### Error Responses

Only return validation errors for invalid request shape or invalid tenant, for example:

```json
{
  "success": false,
  "error": {
    "code": "bad_request",
    "message": "Field 'email' is required."
  }
}
```

Do not expose whether an email address exists.

## Endpoint 2: Complete Password Reset

### Route

```text
POST /auth/reset-password
```

### Auth

Anonymous/public endpoint.

### Request Body

```json
{
  "email": "user@example.com",
  "token": "raw-token-from-link",
  "password": "new-user-password",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk"
}
```

### Validation

- `token` is required.
- `password` is required.
- Password must be validated server-side.
- Recommended minimum password rule: at least 10 characters.
- `tenantKey` or `domain` must identify a valid tenant.
- If `email` is supplied, require the token to belong to that email address.

### Behavior

1. Resolve tenant using `tenantKey` and/or `domain`.
2. Hash the submitted raw token.
3. Find a matching reset token where:
   - token hash matches,
   - tenant matches,
   - token is not consumed,
   - token has not expired,
   - email matches if supplied.
4. If no valid token is found, return `Invalid reset token`.
5. Hash the new password using the same password hashing algorithm as login.
6. Update the user credential password hash.
7. Mark the reset token as consumed.
8. Revoke existing refresh sessions/tokens for the user and tenant.
9. Reset failed login counters/lockout state if applicable.
10. Write an audit log entry.

### Success Response

```json
{
  "success": true,
  "message": "Password reset successfully."
}
```

### Invalid/Expired Token Response

The frontend expects this message:

```json
{
  "error": "Invalid reset token"
}
```

Recommended status: `400`.

### Weak Password Response

```json
{
  "success": false,
  "error": {
    "code": "bad_request",
    "message": "Password does not meet requirements"
  }
}
```

## Database Requirements

Create a password reset token table.

Suggested SQL Server schema:

```sql
CREATE TABLE platform.UserPasswordResetTokens (
  Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_UserPasswordResetTokens_Id DEFAULT NEWID(),
  UserId UNIQUEIDENTIFIER NOT NULL,
  TenantId UNIQUEIDENTIFIER NOT NULL,
  TokenHash NVARCHAR(255) NOT NULL,
  ExpiresAtUtc DATETIME2(3) NOT NULL,
  ConsumedAtUtc DATETIME2(3) NULL,
  CreatedAtUtc DATETIME2(3) NOT NULL CONSTRAINT DF_UserPasswordResetTokens_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
  CreatedByIp NVARCHAR(64) NULL,
  UserAgent NVARCHAR(500) NULL,
  CONSTRAINT PK_UserPasswordResetTokens PRIMARY KEY (Id),
  CONSTRAINT FK_UserPasswordResetTokens_User FOREIGN KEY (UserId) REFERENCES platform.Users(Id),
  CONSTRAINT FK_UserPasswordResetTokens_Tenant FOREIGN KEY (TenantId) REFERENCES platform.Tenants(Id)
);

CREATE UNIQUE INDEX UX_UserPasswordResetTokens_TokenHash
  ON platform.UserPasswordResetTokens(TokenHash);

CREATE INDEX IX_UserPasswordResetTokens_User_Active
  ON platform.UserPasswordResetTokens(UserId, TenantId, ConsumedAtUtc, ExpiresAtUtc);
```

## Email Requirements

Subject:

```text
Reset your JustProveIt password
```

Email body should include:

- A reset link.
- A note that the link expires shortly.
- A note that the link can only be used once.
- A note to ignore the email if the user did not request it.

Example plain text:

```text
Hi {{name}},

We received a request to reset your JustProveIt password.

Choose a new password:
{{resetLink}}

This link expires shortly and can only be used once.
If you did not request this, you can ignore this email.
```

## Security Requirements

- Never email a plaintext generated password.
- Never store the raw reset token.
- Never log raw reset tokens or submitted passwords.
- Use cryptographically secure random tokens.
- Reset tokens must be single-use.
- Reset tokens must expire within 15-30 minutes.
- Invalidate previous unused reset tokens when issuing a new one.
- Revoke active refresh sessions after a successful reset.
- Rate-limit by IP, email, and tenant.
- Use a generic success response for reset requests to prevent account enumeration.
- Consider alerting/auditing repeated reset attempts.

## Frontend Integration Already Implemented

The frontend sends this request when a user clicks “Forgot password?”:

```json
{
  "email": "user@example.com",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk",
  "resetUrl": "https://www.justproveit.co.uk/reset-password"
}
```

The frontend reset page submits:

```json
{
  "email": "user@example.com",
  "token": "raw-token-from-link",
  "password": "new-user-password",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk"
}
```

## Acceptance Criteria

- User can click “Forgot password?” on `/login`.
- User receives a reset email if their account exists and is active.
- The reset email link opens `/reset-password`.
- User can submit a new password.
- User can log in with the new password.
- Old password no longer works.
- The same reset link cannot be reused.
- Expired reset links are rejected.
- Existing sessions are revoked after reset.
- Non-existent emails do not reveal account existence.
