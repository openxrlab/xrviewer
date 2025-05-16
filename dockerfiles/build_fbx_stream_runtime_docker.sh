#!/bin/bash
INPUT_TAG="openxrlab/xrviewer_runtime:ubuntu1804_x64_py310"
FINAL_TAG="${INPUT_TAG}_fbx_service"
echo "tag to build: $FINAL_TAG"
FBX_PYTHON_SDK_PATH="service_build/fbx-2020.3.4-cp310-cp310-manylinux1_x86_64.whl"
BUILD_ARGS="--build-arg FBX_PYTHON_SDK_PATH=${FBX_PYTHON_SDK_PATH}"
# build according to Dockerfile
docker build -t $FINAL_TAG -f dockerfiles/fbx_stream.dockerfile $BUILD_ARGS --progress=plain .
echo "Successfully tagged $FINAL_TAG"
