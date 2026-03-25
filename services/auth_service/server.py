"""Auth service gRPC server."""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc
from concurrent import futures

from generated import auth_pb2_grpc
from services.auth_service.servicer import AuthServicer
from common.interceptors import AuthInterceptor

AUTH_SERVICE_PORT = int(os.environ.get("AUTH_SERVICE_PORT", "50051"))


def serve():
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[AuthInterceptor()],
    )
    auth_pb2_grpc.add_AuthServiceServicer_to_server(AuthServicer(), server)
    server.add_insecure_port(f"[::]:{AUTH_SERVICE_PORT}")
    server.start()
    print(f"Auth service started on port {AUTH_SERVICE_PORT}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
