import logging
import os
import uuid
from typing import List, Optional, Union

from ..base import Pipeline
from .fbx_reader import FbxReader


class FBXStreamPipeline(Pipeline):

    def __init__(self,
                 websocket_port: int = 4567,
                 zmq_port: Optional[int] = None,
                 websocket_server_ip: str = '127.0.0.1',
                 state_relief_time: float = 0.5,
                 buffer_relief_time: float = 0.05,
                 logger: Union[None, str, logging.Logger] = None,
                 frame_rate: int = 60) -> None:
        super().__init__(websocket_port, zmq_port, websocket_server_ip,
                         state_relief_time, buffer_relief_time, logger)
        self.fbx_reader = FbxReader(frame_rate=frame_rate, logger=self.logger)

    def update_stream_data(self, stream_data: bytes) -> int:
        file_path = os.path.join(self.tmp_dir.name, f'{str(uuid.uuid4())}.sd')
        with open(file_path, 'wb') as binary_file:
            binary_file.write(stream_data)
        n_frames = self.fbx_reader.load(file_path)
        os.unlink(file_path)
        return n_frames

    def get_faces(self) -> List[int]:
        faces = self.fbx_reader.get_faces()
        return faces

    def forward(self, frame_idx: int) -> List[List[float]]:
        verts = self.fbx_reader.forward(frame_idx=frame_idx)
        return verts
