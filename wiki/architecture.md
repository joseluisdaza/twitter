# Architecture

## Overview

This project follows a microservices architecture where each service is independent and communicates via gRPC.

## Services

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 50051 | Authentication and JWT token management |
| User Service | 50052 | User profiles and social graph |
| Tweet Service | 50053 | Tweet CRUD and timeline |

## Directory Structure

```
twitter/
├── proto/              # Protocol Buffer definitions
├── generated/          # Auto-generated gRPC stubs (gitignored)
├── common/             # Shared utilities (JWT, interceptors)
├── services/
│   ├── auth_service/   # Authentication microservice
│   ├── user_service/   # User management microservice
│   └── tweet_service/  # Tweet microservice
├── tests/              # Unit tests
├── scripts/            # Helper scripts
└── wiki/               # Project documentation
```

## Communication Flow

```
Client → AuthService (register/login) → JWT token
Client → [Bearer token] → UserService / TweetService
```

## Data Storage

Each service uses its own SQLite database (for simplicity in development). In production, each service would connect to its own dedicated database server.

- `auth_service.db` - Users credentials and roles
- `user_service.db` - User profiles and follow relationships  
- `tweet_service.db` - Tweets, likes, and follow references
