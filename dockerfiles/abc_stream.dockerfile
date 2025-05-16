# Download base image ubuntu 18.04
FROM ubuntu:18.04

ARG BOOST_VERSION="1.81.0"
ARG CMAKE_VERSION="3.26.0"

ARG CMAKE_NUM_JOBS=8

# Replace apt source
RUN sed -i "s@http://archive.ubuntu.com@http://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    rm -Rf /var/lib/apt/lists/*

# Install apt packages
RUN apt-get update && \
    apt-get install -y \
        wget \
        git \
        vim \
        build-essential \
        software-properties-common \
        autoconf \
        automake \
        libtool \
        pkg-config \
        ca-certificates \
        libssl-dev \
        curl \
        language-pack-en \
        locales \
        locales-all \
        gdb \
        valgrind \
    && \
    apt-get autoclean

# Set timezone
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get install -yq tzdata && \
    dpkg-reconfigure -f noninteractive tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    apt-get autoclean

# Set proxy
ENV HTTPS_PROXY http://proxy.sensetime.com:3128
ENV HTTP_PROXY http://proxy.sensetime.com:3128

# Install miniconda
RUN wget -q \
    https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh \
    && bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/miniconda \
    && rm -f Miniconda3-latest-Linux-x86_64.sh

# Prepare conda env
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    conda create -n xrviewer python=3.10 -y && \
    conda activate xrviewer && \
    conda clean --all

# Install CMake
RUN cd /tmp && \
    wget -q https://mirrors.aliyun.com/blfs/conglomeration/cmake/cmake-${CMAKE_VERSION}.tar.gz && \
    tar xzf cmake-${CMAKE_VERSION}.tar.gz && \
    cd cmake-${CMAKE_VERSION} && \
    ./bootstrap && \
    make -j${CMAKE_NUM_JOBS} && \
    make install && \
    rm -rf /tmp/*

# Install Boost
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    mkdir -p /opt/install/boost && \
    conda activate xrviewer && \
    cd /tmp && \
    BOOST_VERSION_MOD=$(echo $BOOST_VERSION | tr . _) && \
    wget -q https://mirrors.aliyun.com/blfs/conglomeration/boost/boost_${BOOST_VERSION_MOD}.tar.bz2 && \
    tar --bzip2 -xf ./boost_${BOOST_VERSION_MOD}.tar.bz2 && \
    cd boost_${BOOST_VERSION_MOD} && \
    ./bootstrap.sh --with-python=$(which python) && \
    ./b2 install --prefix="/opt/install/boost" && \
    rm -rf /tmp/*

# COPY xrviewer's requirements
COPY requirements/service.txt /opt/service_requirements.txt
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    conda activate xrviewer && \
    pip install -r /opt/service_requirements.txt && \
    pip cache purge

# Install Imath
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    conda activate xrviewer && \
    cd /opt/ && \
    git clone https://github.com/AcademySoftwareFoundation/Imath.git && \
    cd Imath && \
    cmake -S . -B build \
        -DCMAKE_INSTALL_PREFIX="/opt/install/imath" \
        -DPYTHON=ON \
        -DBoost_ROOT="/opt/install/boost" \
        -DBoost_NO_BOOST_CMAKE=ON && \
    cmake --build build --config Release && \
    cmake --install build && \
    rm -rf /tmp/*

# Install Alembic
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    conda activate xrviewer && \
    cd /tmp/ && \
    git clone https://github.com/alembic/alembic.git && \
    cd alembic && \
    cmake -S . -B build \
        -DCMAKE_INSTALL_PREFIX="/opt/install/alembic" \
        -DImath_DIR="/opt/install/imath/lib/cmake/Imath" \
        -DUSE_PYALEMBIC=ON \
        -DPYALEMBIC_PYTHON_MAJOR=3 \
        -DBoost_ROOT="/opt/install/boost" \
        -DBoost_NO_BOOST_CMAKE=ON && \
    cmake --build build --config Release && \
    cmake --install build && \
    rm -rf /tmp/*

# Copy dependencies
RUN cp /opt/install/alembic/lib/python3.10/site-packages/alembic.so /opt/miniconda/envs/xrviewer/lib/python3.10/site-packages/ && \
    cp /opt/install/imath/lib/python3.10/site-packages/imath.so /opt/miniconda/envs/xrviewer/lib/python3.10/site-packages/

# Unset proxy
ENV HTTPS_PROXY=
ENV HTTP_PROXY=
