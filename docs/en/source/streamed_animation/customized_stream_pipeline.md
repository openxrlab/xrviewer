# Customized Stream Pipeline

Install XRViewer:
```shell
# Create conda virtual env and install XRViewer
conda create -n CustomizedStream python=3.10
git clone https://github.com/openxrlab/xrviewer.git
cd xrviewer/
pip install .
```

To create a customized stream pipeline, you should create a class inherited from `Pipeline` in `xrviewer/server/pipelines/base.py`. Then, implement the `forward`, `update_stream_data` and `get_faces` to parse your data:

```python
from xrviewer.server.pipelines import Pipeline
from typing import Union, Optional, List
import logging

class CustomizedStreamPipeline(Pipeline):

    def __init__(self,
                 websocket_port: int = 4567,
                 zmq_port: Optional[int] = None,
                 websocket_server_ip: str = '127.0.0.1',
                 state_relief_time: float = 0.5,
                 buffer_relief_time: float = 0.05,
                 logger: Union[None, str, logging.Logger] = None) -> None:
        super().__init__(websocket_port, zmq_port, websocket_server_ip,
                         state_relief_time, buffer_relief_time, logger)

    def forward(self, frame_idx: int) -> List[List[float]]:
        """Get mesh vertices by the given frame index.

        Args:
            frame_idx (int): frame index in infer

        Returns:
            List[List[float]]:
                A nested list for inferred vertices,
                shape: [n_verts, 3].
        """
        # implement your logic here
        pass

    def update_stream_data(self, stream_data: bytes) -> int:
        """Set stream data.

        Args:
            stream_data (bytes): stream data uploaded
                from the viewer in bytes

        Returns:
            int: number of frames in the stream data
        """
        # implement your logic here
        pass

    def get_faces(self) -> List[int]:
        """Get face indices.

        Returns:
            List[int]: the requested face indices, organized as a [|F|, 3] list
        """
        # implement your logic here
        pass

```

Once the CustomizedStreamPipeline is available, create the pipeline and enter the event loop:

```python
import CustomizedStreamPipeline

if __name__ == "__main__":
    pipeline = CustomizedStreamPipeline(
        websocket_port=websocket_port,
        zmq_port=zmq_port,
        websocket_server_ip=websocket_server_ip,
        frame_rate=60)

    pipeline.event_loop()
```
