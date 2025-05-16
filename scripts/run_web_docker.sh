#!/usr/bin/env bash
TAG=openxrlab/xrviewer_runtime:nginx_web
CONFIG_PATH=$1
. $CONFIG_PATH
echo "Starting web on port $PORT"
PORTS="-p $PORT:80"
MEMORY="--memory=1g"
docker run -d --rm $PORTS $MEMORY $TAG
