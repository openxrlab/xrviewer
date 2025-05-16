#!/usr/bin/env bash
TAG=openxrlab/xrviewer_runtime:ubuntu1804_x64_py310_smpl_service
CONFIG_PATH=$1
. $CONFIG_PATH
echo "Starting smpl stream pipeline on ws_port $WEBSOCKET_PORT, zmq_port $ZMQ_PORT"
PORTS="-p $WEBSOCKET_PORT:$WEBSOCKET_PORT"
WORKSPACE_VOLUMES="-v $PWD:/workspace/xrviewer"
WORKDIR="-w /workspace/xrviewer"
MEMORY="--memory=2g"
docker run --runtime=nvidia -it --rm --entrypoint=/bin/bash --cpus=32 --privileged --net=host $PORTS $WORKSPACE_VOLUMES $WORKDIR $MEMORY $TAG -c "
  source /opt/miniconda/etc/profile.d/conda.sh
  conda activate xrviewer
  pip install .
  python tools/run_smpl_stream_pipeline.py --websocket_port $WEBSOCKET_PORT \
   --zmq_port $ZMQ_PORT --websocket_server_ip $WEBSOCKET_SERVER_IP \
   --smpl_stream_server_ip $SMPL_STREAM_SERVER_IP --smpl_stream_server_port $SMPL_STREAM_SERVER_PORT
"
