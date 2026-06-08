# Password reset API contract

The frontend implements a one-time-link password reset flow. The backend auth API needs two endpoints.

## Request reset link

The login page calls:

```text
POST /auth/forgot-password
```

Request body:

```json
{
  "email": "user@example.com",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk",
  "resetUrl": "https://www.justproveit.co.uk/reset-password"
}
```

Expected behavior:

- Always return a 2xx response for a syntactically valid email, even when no account exists.
- If the account exists for the tenant, generate a cryptographically secure one-time reset token.
- Store only a hash of the token in the auth database.
- Give the token a short expiry, ideally 15-30 minutes.
- Invalidate any previous unused reset tokens for the same user.
- Send a reset link to the account email address.
- Rate-limit by IP, tenant, and email address.

Example success response:

```json
{
  "success": true
}
```

The frontend deliberately shows the same message regardless of whether the email exists:

```text
If that email belongs to a JustProveIt account, a password reset link has been sent.
```

This avoids leaking which email addresses have admin or CRM accounts.

Email link format:

```text
https://www.justproveit.co.uk/reset-password?token=<raw-token>&email=<url-encoded-email>
```

The `email` query parameter is optional for the frontend, but useful for display and extra backend validation.

## Complete reset

The reset password page calls:

```text
POST /auth/reset-password
```

Request body:

```json
{
  "email": "user@example.com",
  "token": "raw-token-from-link",
  "password": "new-user-password",
  "tenantKey": "justproveit",
  "domain": "justproveit.co.uk"
}
```

Expected behavior:

- Hash the submitted raw token and find a matching unused token for `tenantKey`.
- If `email` is supplied, require the token to belong to that email address.
- Reject expired, missing, already-used, or invalid tokens.
- Validate password strength server-side.
- Store only the new password hash.
- Mark the reset token as used.
- Revoke existing refresh tokens/sessions for that user.
- Return a 2xx response on success.

Example success response:

```json
{
  "success": true
}
```

Suggested error messages:

- `Invalid reset token` for invalid, expired, or already-used tokens.
- `Password does not meet requirements` for weak passwords.

Do not log raw reset tokens or plaintext passwords.
