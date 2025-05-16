#!/bin/bash
INPUT_TAG="openxrlab/xrviewer_runtime:nginx"
FINAL_TAG="${INPUT_TAG}_web"
echo "tag to build: $FINAL_TAG"
WEB_PATH="web_build/"
if [ ! -d $WEB_PATH ]; then
    echo "Web build files not found."
    exit 1
fi
BUILD_ARGS="--build-arg WEB_PATH=${WEB_PATH}"
# build according to Dockerfile
docker build -t $FINAL_TAG -f dockerfiles/web.dockerfile $BUILD_ARGS --progress=plain .
echo "Successfully tagged $FINAL_TAG"
