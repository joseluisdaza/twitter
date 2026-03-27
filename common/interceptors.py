"""gRPC server interceptors for authentication and authorization."""

import grpc

from common.auth import decode_token

# Methods that do NOT require authentication
PUBLIC_METHODS = {
    "/auth.AuthService/Register",
    "/auth.AuthService/Login",
    "/auth.AuthService/Check",
    "/user.UserService/Check",
    "/tweet.TweetService/Check",
    "/health.HealthService/Check",
    "/health.HealthService/Watch",
}

# Methods that require ADMIN role
ADMIN_METHODS = {
    "/user.UserService/DeleteUser",
    "/user.UserService/ListUsers",
}


class AuthInterceptor(grpc.ServerInterceptor):
    """gRPC interceptor that validates JWT tokens for protected endpoints."""

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method

        if method in PUBLIC_METHODS:
            return continuation(handler_call_details)

        metadata = dict(handler_call_details.invocation_metadata or [])
        auth_header = metadata.get("authorization", "")

        if not auth_header.startswith("Bearer "):
            return self._abort(grpc.StatusCode.UNAUTHENTICATED, "Missing or invalid Authorization header")

        token = auth_header[len("Bearer "):]
        try:
            payload = decode_token(token)
        except Exception as exc:
            return self._abort(grpc.StatusCode.UNAUTHENTICATED, f"Invalid token: {exc}")

        if payload.get("type") != "access":
            return self._abort(grpc.StatusCode.UNAUTHENTICATED, "Token is not an access token")

        if method in ADMIN_METHODS and payload.get("role") != "ADMIN":
            return self._abort(grpc.StatusCode.PERMISSION_DENIED, "Admin role required")

        return continuation(handler_call_details)

    @staticmethod
    def _abort(code: grpc.StatusCode, details: str):
        def abort_handler(request, context):
            context.abort(code, details)

        return grpc.unary_unary_rpc_method_handler(abort_handler)
