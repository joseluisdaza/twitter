"""Tweet service gRPC server."""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import grpc
from concurrent import futures

from generated import tweet_pb2_grpc
from services.tweet_service.servicer import TweetServicer
from common.interceptors import AuthInterceptor

TWEET_SERVICE_PORT = int(os.environ.get("TWEET_SERVICE_PORT", "50053"))


def serve():
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[AuthInterceptor()],
    )
    tweet_pb2_grpc.add_TweetServiceServicer_to_server(TweetServicer(), server)
    server.add_insecure_port(f"[::]:{TWEET_SERVICE_PORT}")
    server.start()
    print(f"Tweet service started on port {TWEET_SERVICE_PORT}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
