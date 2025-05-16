import logging
from typing import List, Optional, Union

from xrmocap.client.smpl_stream_client import SMPLStreamClient

from ...actions import PipelineActionsEnum
from ..base import Pipeline


class SMPLStreamPipeline(Pipeline):

    def __init__(self,
                 websocket_port: int = 4567,
                 zmq_port: Optional[int] = None,
                 websocket_server_ip: str = '127.0.0.1',
                 state_relief_time: float = 0.5,
                 buffer_relief_time: float = 0.05,
                 smpl_stream_server_ip: str = '127.0.0.1',
                 smpl_stream_server_port: int = 29091,
                 logger: Union[None, str, logging.Logger] = None) -> None:
        super().__init__(websocket_port, zmq_port, websocket_server_ip,
                         state_relief_time, buffer_relief_time, logger)

        self.smpl_client = SMPLStreamClient(
            server_ip=smpl_stream_server_ip,
            server_port=smpl_stream_server_port,
            enable_bytes=True,
            logger=self.logger)

    def update_stream_data(self, stream_data: bytes) -> int:
        res = self.smpl_client.upload_smpl_data(stream_data)
        n_frames = int(res['n_frames'])

        if 0 == n_frames:
            self.zmq_handler.write(PipelineActionsEnum.UPDATE_ALERT_MESSAGE,
                                   str(res['msg']))
        return n_frames

    def get_faces(self) -> List[int]:
        faces = self.smpl_client.get_faces()
        return faces

    def forward(self, frame_idx: int) -> List[List[float]]:
        verts = self.smpl_client.forward(frame_idx)
        return verts
