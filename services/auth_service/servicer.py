"""Auth service gRPC servicer implementation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc

from generated import auth_pb2, auth_pb2_grpc
from common.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from services.auth_service.models import init_db, create_user, get_user_by_username, get_user_by_id


class AuthServicer(auth_pb2_grpc.AuthServiceServicer):

    def __init__(self, db_path: str = "auth_service.db"):
        self.db_path = db_path
        init_db(db_path)

    def Register(self, request, context):
        if not request.username or not request.email or not request.password:
            return auth_pb2.RegisterResponse(success=False, message="All fields are required")

        if len(request.password) < 8:
            return auth_pb2.RegisterResponse(success=False, message="Password must be at least 8 characters")

        existing = get_user_by_username(request.username, self.db_path)
        if existing:
            return auth_pb2.RegisterResponse(success=False, message="Username already exists")

        try:
            hashed = hash_password(request.password)
            user = create_user(request.username, request.email, hashed, db_path=self.db_path)
            return auth_pb2.RegisterResponse(success=True, message="User registered successfully", user_id=user["user_id"])
        except Exception as exc:
            return auth_pb2.RegisterResponse(success=False, message=str(exc))

    def Login(self, request, context):
        if not request.username or not request.password:
            return auth_pb2.LoginResponse(success=False, message="Username and password are required")

        user = get_user_by_username(request.username, self.db_path)
        if not user:
            return auth_pb2.LoginResponse(success=False, message="Invalid credentials")

        if not verify_password(request.password, user["hashed_password"]):
            return auth_pb2.LoginResponse(success=False, message="Invalid credentials")

        access_token = create_access_token(user["user_id"], user["username"], user["role"])
        refresh_token = create_refresh_token(user["user_id"])
        role = auth_pb2.Role.ADMIN if user["role"] == "ADMIN" else auth_pb2.Role.USER

        return auth_pb2.LoginResponse(
            success=True,
            message="Login successful",
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user["user_id"],
            role=role,
        )

    def ValidateToken(self, request, context):
        if not request.token:
            return auth_pb2.ValidateTokenResponse(valid=False, message="Token is required")

        try:
            payload = decode_token(request.token)
        except Exception as exc:
            return auth_pb2.ValidateTokenResponse(valid=False, message=str(exc))

        if payload.get("type") != "access":
            return auth_pb2.ValidateTokenResponse(valid=False, message="Not an access token")

        role = auth_pb2.Role.ADMIN if payload.get("role") == "ADMIN" else auth_pb2.Role.USER

        return auth_pb2.ValidateTokenResponse(
            valid=True,
            user_id=payload["sub"],
            username=payload.get("username", ""),
            role=role,
            message="Token is valid",
        )

    def RefreshToken(self, request, context):
        if not request.refresh_token:
            return auth_pb2.RefreshTokenResponse(success=False, message="Refresh token is required")

        try:
            payload = decode_token(request.refresh_token)
        except Exception as exc:
            return auth_pb2.RefreshTokenResponse(success=False, message=str(exc))

        if payload.get("type") != "refresh":
            return auth_pb2.RefreshTokenResponse(success=False, message="Not a refresh token")

        user = get_user_by_id(payload["sub"], self.db_path)
        if not user:
            return auth_pb2.RefreshTokenResponse(success=False, message="User not found")

        access_token = create_access_token(user["user_id"], user["username"], user["role"])
        return auth_pb2.RefreshTokenResponse(success=True, access_token=access_token, message="Token refreshed")

    def Check(self, request, context):
        return auth_pb2.HealthCheckResponse(status="SERVING")
