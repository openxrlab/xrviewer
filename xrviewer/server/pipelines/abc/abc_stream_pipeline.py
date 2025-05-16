import logging
import os
import uuid
from typing import List, Optional, Union

from ..base import Pipeline
from .abc_reader import AbcReader


class AbcStreamPipeline(Pipeline):

    def __init__(self,
                 zmq_port: Optional[int] = None,
                 websocket_server_ip: str = '127.0.0.1',
                 websocket_port: int = 4567,
                 state_relief_time: float = 0.5,
                 buffer_relief_time: float = 0.05,
                 logger: Union[None, str, logging.Logger] = None) -> None:
        super().__init__(websocket_port, zmq_port, websocket_server_ip,
                         state_relief_time, buffer_relief_time, logger)
        self.abc_reader = AbcReader(self.logger)

    def update_stream_data(self, stream_data: bytes) -> int:
        file_path = os.path.join(self.tmp_dir.name, f'{str(uuid.uuid4())}.sd')
        self.logger.warn(file_path)
        with open(file_path, 'wb') as binary_file:
            binary_file.write(stream_data)
        n_frames = self.abc_reader.load_abc(file_path)
        os.unlink(file_path)
        return n_frames

    def get_faces(self) -> List[int]:
        faces = self.abc_reader.get_faces()
        return faces

    def forward(self, frame_idx: int) -> List[List[float]]:
        verts = self.abc_reader.forward(frame_idx)
        return verts
