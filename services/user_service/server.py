"""User service gRPC server."""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc
from concurrent import futures

from generated import user_pb2_grpc
from services.user_service.servicer import UserServicer
from common.interceptors import AuthInterceptor

USER_SERVICE_PORT = int(os.environ.get("USER_SERVICE_PORT", "50052"))


def serve():
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[AuthInterceptor()],
    )
    user_pb2_grpc.add_UserServiceServicer_to_server(UserServicer(), server)
    server.add_insecure_port(f"[::]:{USER_SERVICE_PORT}")
    server.start()
    print(f"User service started on port {USER_SERVICE_PORT}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
