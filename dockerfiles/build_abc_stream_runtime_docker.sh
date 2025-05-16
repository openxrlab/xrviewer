#!/bin/bash
INPUT_TAG="openxrlab/xrviewer_runtime:ubuntu1804_x64_py310"
FINAL_TAG="${INPUT_TAG}_abc_service"
echo "tag to build: $FINAL_TAG"
# build according to Dockerfile
docker build -t $FINAL_TAG -f dockerfiles/abc_stream.dockerfile --progress=plain .
echo "Successfully tagged $FINAL_TAG"
