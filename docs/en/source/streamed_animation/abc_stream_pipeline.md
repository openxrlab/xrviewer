# Abc Stream Pipeline

- [Run with Docker Image](md-run-with-docker-image)
- [From-scratch Setup](md-from-scratch-setup)

(md-run-with-docker-image)=

## Run with Docker Image

Download the AbcStreamPipeline docker image:

```shell
docker pull openxrlab/xrviewer_runtime:ubuntu1804_x64_py310_abc_service
```

Setup the pipeline config under `configs/abc_stream_pipeline.cfg`:

```
websocket_port=18836                  # port to be exposed to the viewer
zmq_port=18837                        # port that websocket server and pipeline used to communicate
websocket_server_ip='127.0.0.1'       # ip address to be exposed to the viewer
```

Run the pipeline with the config:

```bash
sudo sh scripts/run_abc_stream_pipeline_docker.sh configs/abc_stream_pipeline.cfg
```

(md-from-scratch-setup)=

## From-scratch Setup

Install the [PyAlembic](https://github.com/alembic/alembic) package, which involves compiling [Boost](https://www.boost.org/), [Imath](https://github.com/AcademySoftwareFoundation/Imath) and Alembic. This could be quite annoying:

```bash
# setup variables
IMATH_INSTALL_DIR="PATH/TO/IMATH/INSTALL/DIR"       # imath install directory
ALEMBIC_INSTALL_DIR="PATH/TO/ALEMBIC/INSTALL/DIR"   # alembic install directory
CONDA_ENVS_DIR="PATH/TO/CONDA/ENVS"                 # conda virtual environments root directory

# Create conda virtual env and install XRViewer
conda create -n AbcStream python=3.10
git clone https://github.com/openxrlab/xrviewer.git
cd xrviewer/
pip install .

# Install boost
wget https://boostorg.jfrog.io/artifactory/main/release/1.81.0/source/boost_1_81_0.tar.gz
tar -xzvf boost_1_81_0.tar.gz
cd boost_1_81_0
./bootstrap.sh --with-python=$(which python)
sudo ./b2

# Install Imath
git clone https://github.com/AcademySoftwareFoundation/Imath.git
cd imath
cmake -S . -B build \
    -DCMAKE_INSTALL_PREFIX=$IMATH_INSTALL_DIR \
    -DPYTHON=ON \
    -DBOOST_ROOT="/usr/local/lib/"
cmake --build build --config Release
cmake --install build

# Install Alembic
git clone https://github.com/alembic/alembic.git
cd alembic
cmake -S . -B build \
    -DCMAKE_INSTALL_PREFIX=$ALEMBIC_INSTALL_DIR \
    -DImath_DIR="${IMATH_INSTALL_DIR}/lib/cmake/Imath" \
    -DUSE_PYALEMBIC=ON \
    -DPYALEMBIC_PYTHON_MAJOR=3 \
    -DBOOST_ROOT="/usr/local/lib/"
cmake --build build --config Release
cmake --install build

# Copy deps
cp ${ALEMBIC_INSTALL_DIR}/lib/python3.10/site-packages/alembic.so \
    ${CONDA_ENVS_DIR}/AbcStream/lib/python3.10/site-packages/
cp ${IMATH_INSTALL_DIR}/lib/python3.10/site-packages/imath.so \
    ${CONDA_ENVS_DIR}/AbcStream/lib/python3.10/site-packages/
```

Start the pipeline:

```shell
python tools/run_abc_stream_pipeline.py \
    --websocket_port $websocket_port \
    --zmq_port $zmq_port \
    --websocket_server_ip $websocket_server_ip
```
