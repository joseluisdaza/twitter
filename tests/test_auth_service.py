"""Tests for the auth service."""

import pytest
from unittest.mock import MagicMock

from services.auth_service.models import init_db, create_user, get_user_by_username, get_user_by_id
from common.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


class TestAuthModels:
    def test_create_and_get_user(self, auth_db):
        init_db(auth_db)
        hashed = hash_password("testpassword")
        user = create_user("testuser", "test@example.com", hashed, db_path=auth_db)
        assert user["username"] == "testuser"
        assert user["email"] == "test@example.com"
        assert user["role"] == "USER"
        assert user["user_id"]

    def test_get_user_by_username(self, auth_db):
        init_db(auth_db)
        hashed = hash_password("password123")
        create_user("alice", "alice@example.com", hashed, db_path=auth_db)
        user = get_user_by_username("alice", auth_db)
        assert user is not None
        assert user["username"] == "alice"

    def test_get_user_not_found(self, auth_db):
        init_db(auth_db)
        assert get_user_by_username("nonexistent", auth_db) is None

    def test_create_admin_user(self, auth_db):
        init_db(auth_db)
        hashed = hash_password("adminpassword")
        user = create_user("admin", "admin@example.com", hashed, role="ADMIN", db_path=auth_db)
        assert user["role"] == "ADMIN"


class TestJWT:
    def test_create_and_decode_access_token(self):
        token = create_access_token("user-123", "testuser", "USER")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["username"] == "testuser"
        assert payload["role"] == "USER"
        assert payload["type"] == "access"

    def test_create_and_decode_refresh_token(self):
        token = create_refresh_token("user-123")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["type"] == "refresh"

    def test_invalid_token(self):
        import jwt
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("invalid.token.here")


class TestAuthServicer:
    def _get_servicer(self, auth_db):
        from services.auth_service.servicer import AuthServicer
        return AuthServicer(db_path=auth_db)

    def test_register_success(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        req = auth_pb2.RegisterRequest(username="newuser", email="new@example.com", password="password123")
        resp = servicer.Register(req, MagicMock())
        assert resp.success is True
        assert resp.user_id

    def test_register_duplicate(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        req = auth_pb2.RegisterRequest(username="dup", email="dup@example.com", password="password123")
        servicer.Register(req, MagicMock())
        resp = servicer.Register(req, MagicMock())
        assert resp.success is False

    def test_register_short_password(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        req = auth_pb2.RegisterRequest(username="user2", email="u2@example.com", password="short")
        resp = servicer.Register(req, MagicMock())
        assert resp.success is False

    def test_login_success(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        servicer.Register(
            auth_pb2.RegisterRequest(username="loginuser", email="login@example.com", password="password123"),
            MagicMock()
        )
        resp = servicer.Login(auth_pb2.LoginRequest(username="loginuser", password="password123"), MagicMock())
        assert resp.success is True
        assert resp.access_token
        assert resp.refresh_token

    def test_login_invalid_credentials(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        resp = servicer.Login(auth_pb2.LoginRequest(username="ghost", password="wrong"), MagicMock())
        assert resp.success is False

    def test_validate_token(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        servicer.Register(
            auth_pb2.RegisterRequest(username="vuser", email="v@example.com", password="password123"),
            MagicMock()
        )
        login_resp = servicer.Login(auth_pb2.LoginRequest(username="vuser", password="password123"), MagicMock())
        val_resp = servicer.ValidateToken(auth_pb2.ValidateTokenRequest(token=login_resp.access_token), MagicMock())
        assert val_resp.valid is True
        assert val_resp.username == "vuser"

    def test_health_check(self, auth_db):
        from generated import auth_pb2
        servicer = self._get_servicer(auth_db)
        resp = servicer.Check(auth_pb2.HealthCheckRequest(service="auth"), MagicMock())
        assert resp.status == "SERVING"
