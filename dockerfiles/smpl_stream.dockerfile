# Download base image ubuntu 18.04
FROM ubuntu:18.04

# Replace apt source
RUN sed -i "s@http://archive.ubuntu.com@http://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    rm -Rf /var/lib/apt/lists/*

# Install apt packages
RUN apt-get update && \
    apt-get install -y \
        wget git vim \
    && \
    apt-get autoclean

# Set timezone
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get install -yq tzdata && \
    dpkg-reconfigure -f noninteractive tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    apt-get autoclean

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

# COPY xrviewer's requirements
COPY requirements/service.txt /opt/service_requirements.txt
RUN . /opt/miniconda/etc/profile.d/conda.sh && \
    conda activate xrviewer && \
    pip install -r /opt/service_requirements.txt && \
    pip install git+https://github.com/openxrlab/xrmocap.git && \
    pip cache purge
