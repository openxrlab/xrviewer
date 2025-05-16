# SMPL Stream Pipeline

- [Run with Docker Image](md-run-with-docker-image)
- [From-scratch Setup](md-from-scratch-setup)

(md-run-with-docker-image)=

## Run with Docker Image

(md-setup-smpl-stream-service)=

### Setup SMPL Stream Service

Make sure that you have [nvidia docker 2](https://github.com/NVIDIA/nvidia-docker) installed. Then, download the docker image:

```shell
docker pull openxrlab/xrmocap_runtime:ubuntu1804_x64_cuda116_py38_torch1121_mmcv161_service
```

Clone the XRMoCap repo:

```
git clone https://github.com/openxrlab/xrmocap.git
```

Setup the XRMoCap SMPL stream service config under `configs/modules/service/smpl_stream_service.py`:

```
type = 'SMPLStreamService'
name = 'smpl_stream_service'
work_dir = f'temp/{name}'
body_model_dir = 'xrmocap_data/body_models'
device = 'cuda:0'
enable_bytes = True
enable_cors = True
port = 29091                                    # port to be exposed to the SMPLStreamPipeline
max_http_buffer_size = 128 * 1024 * 1024
```

Start the service with the startup script:

```
sh scripts/start_service_docker.sh configs/modules/service/smpl_stream_service.py
```

### Run SMPL Stream Pipeline

Download the SMPLStreamPipeline docker image:

```shell
docker pull openxrlab/xrviewer_runtime:ubuntu1804_x64_py310_smpl_service
```

Setup the pipeline config under `configs/smpl_stream_pipeline.cfg`:

```
websocket_port=18835                  # port to be exposed to the viewer
zmq_port=18836                        # port that websocket server and pipeline used to communicate
websocket_server_ip='127.0.0.1'       # ip address to be exposed to the viewer
smpl_stream_server_ip='127.0.0.1'     # ip address of the smpl stream service on XRMoCap
smpl_stream_server_port=18800         # the smpl stream service exposed port
```

Run the pipeline with the config:

```bash
sudo sh scripts/run_smpl_stream_pipeline_docker.sh configs/smpl_stream_pipeline.cfg
```

(md-from-scratch-setup)=

## From-scratch Setup

The SMPL stream service is integrated into XRMoCap. The installation guideline of XRMoCap can be found [here](https://github.com/openxrlab/xrmocap/blob/main/docs/en/installation.md). The SMPL stream service can be started using:

```shell
python tools/start_service.py --config_path configs/modules/service/smpl_stream_service.py
```


`configs/modules/service/smpl_stream_service.py` can be configured as described in [Setup SMPL Stream Service](md-setup-smpl-stream-service).

Install the XRViewer:

```shell
# clone XRViewer
git clone https://gitlab.bj.sensetime.com/openxrlab/xrviewer.git

# make sure that your working directory is XRViewer root
cd xrviewer/

# install XRViewer
pip install .
```

Start the pipeline:

```shell
python tools/run_smpl_stream_pipeline.py \
    --websocket_port $websocket_port \
    --zmq_port $zmq_port \
    --websocket_server_ip $websocket_server_ip \
    --smpl_stream_server_ip $smpl_stream_server_ip \
    --smpl_stream_server_port $smpl_stream_server_port
```
