# Twitter Backend - Wiki

Welcome to the Twitter Backend wiki. This project is a Python-based gRPC microservices backend that emulates core Twitter functionality.

## Table of Contents

- [Architecture](architecture.md)
- [Authentication & Authorization](authentication.md)
- [Services](services.md)

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Generate protobuf stubs:
   ```bash
   bash scripts/generate_protos.sh
   ```

3. Run tests:
   ```bash
   pytest
   ```

4. Start services (each in a separate terminal):
   ```bash
   python -m services.auth_service.server
   python -m services.user_service.server
   python -m services.tweet_service.server
   ```
