# Fbx Stream Pipeline

- [Run with Docker Image](md-run-with-docker-image)
- [From-scratch Setup](md-from-scratch-setup)

(md-run-with-docker-image)=

## Run with Docker Image

Download the FbxStreamPipeline docker image:

```shell
docker pull openxrlab/xrviewer_runtime:ubuntu1804_x64_py310_fbx_service
```

Setup the pipeline config under `configs/fbx_stream_pipeline.cfg`:

```
websocket_port=18836                  # port to be exposed to the viewer
zmq_port=18837                        # port that websocket server and pipeline used to communicate
websocket_server_ip='127.0.0.1'       # ip address to be exposed to the viewer
```

Run the pipeline with the config:

```bash
sudo sh scripts/run_fbx_stream_pipeline_docker.sh configs/fbx_stream_pipeline.cfg
```

(md-from-scratch-setup)=

## From-scratch Setup

Install XRViewer:
```shell
# Create conda virtual env and install XRViewer
conda create -n FbxStream python=3.10
git clone https://github.com/openxrlab/xrviewer.git
cd xrviewer/
pip install .
```

Install the [AutoDesk FBX Python SDK](https://aps.autodesk.com/developer/overview/fbx-sdk). Then, go to the installation directory and install the wheel:

```shell
# taking the Windows FBX SDK 2020.3.4 as an example
# by default, the SDK is installed at C:/Program Files/Autodesk/FBX/FBX Python SDK/2020.3.4
cd "C:/Program Files/Autodesk/FBX/FBX Python SDK/2020.3.4"
# install FBX Python package
pip install ./fbx-2020.3.4-cp310-none-win_amd64.whl
```

Start the pipeline:

```shell
python tools/run_fbx_stream_pipeline.py \
    --websocket_port $websocket_port \
    --zmq_port $zmq_port \
    --websocket_server_ip $websocket_server_ip
```
