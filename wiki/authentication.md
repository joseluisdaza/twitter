# Authentication & Authorization

## Overview

Authentication uses JWT (JSON Web Tokens) issued by the Auth Service. Authorization is enforced via a gRPC server interceptor in each service.

## Roles

| Role | Description |
|------|-------------|
| `USER` | Standard user: can create tweets, follow others, like tweets |
| `ADMIN` | Administrator: all USER permissions + list/delete any user |

## JWT Token Flow

1. **Register**: `POST /Register` → creates account with `USER` role by default
2. **Login**: `POST /Login` → returns `access_token` + `refresh_token`
3. **Access Protected Endpoints**: Add `Authorization: Bearer <access_token>` metadata
4. **Token Refresh**: `POST /RefreshToken` with `refresh_token` → new `access_token`

## Token Claims

Access token payload:
```json
{
  "sub": "user-uuid",
  "username": "alice",
  "role": "USER",
  "type": "access",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique-token-id"
}
```

## Protected vs Public Endpoints

Public (no token required):
- `AuthService/Register`
- `AuthService/Login`
- `*/Check` (health checks)

Admin-only:
- `UserService/DeleteUser`
- `UserService/ListUsers`

All others require a valid access token.

## Security Considerations

- Passwords are hashed with bcrypt (passlib)
- JWT secret key should be set via `JWT_SECRET_KEY` environment variable in production
- Access tokens expire in 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Refresh tokens expire in 7 days (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
