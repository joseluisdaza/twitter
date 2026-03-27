#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROTO_DIR="$PROJECT_ROOT/proto"
OUTPUT_DIR="$PROJECT_ROOT/generated"

mkdir -p "$OUTPUT_DIR"
touch "$OUTPUT_DIR/__init__.py"

echo "Generating protobuf stubs..."
python -m grpc_tools.protoc \
    -I"$PROTO_DIR" \
    --python_out="$OUTPUT_DIR" \
    --grpc_python_out="$OUTPUT_DIR" \
    "$PROTO_DIR/health.proto" \
    "$PROTO_DIR/auth.proto" \
    "$PROTO_DIR/user.proto" \
    "$PROTO_DIR/tweet.proto"

echo "Proto stubs generated in $OUTPUT_DIR"
