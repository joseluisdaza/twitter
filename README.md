# Twitter Backend - gRPC Microservices

A Python-based gRPC microservices backend emulating core Twitter functionality.

test

## Features

- **Authentication**: JWT-based auth (register, login, token refresh)
- **Authorization**: Role-based access control (USER, ADMIN)
- **Health Checks**: gRPC health check endpoints on every service
- **Microservices**: Independent Auth, User, and Tweet services
- **Twitter Features**: Tweets, likes, follows, timeline

## Quick Start

### Prerequisites
- Python 3.10+

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Generate Protobuf Stubs

```bash
bash scripts/generate_protos.sh
```

### Run Tests

```bash
pytest
```

### Start Services

Each service runs independently. Open separate terminals:

```bash
# Terminal 1 - Auth Service (port 50051)
python -m services.auth_service.server

# Terminal 2 - User Service (port 50052)
python -m services.user_service.server

# Terminal 3 - Tweet Service (port 50053)
python -m services.tweet_service.server
```

## Documentation

See the [wiki](wiki/README.md) for full documentation:

- [Architecture](wiki/architecture.md)
- [Authentication & Authorization](wiki/authentication.md)
- [Services Reference](wiki/services.md)

## Project Structure

```
twitter/
├── proto/              # Protobuf definitions
├── generated/          # Auto-generated gRPC stubs
├── common/             # Shared JWT utilities and interceptors
├── services/
│   ├── auth_service/   # Authentication & authorization
│   ├── user_service/   # User profiles & follows
│   └── tweet_service/  # Tweets, likes & timeline
├── tests/              # Unit tests
├── scripts/            # Helper scripts
└── wiki/               # Documentation
```
