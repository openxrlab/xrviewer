import logging
import pickle
import tempfile
import time
from abc import abstractmethod
from typing import List, Optional, Union

import umsgpack

from ..actions import PipelineActionsEnum
from ..websocket.state import State
from ..websocket.subprocess import WebSocketServerSubprocess
from ..zmq import ZMQHandler


class Pipeline:

    def __init__(self,
                 websocket_port: int = 4567,
                 zmq_port: Optional[int] = None,
                 websocket_server_ip: str = '127.0.0.1',
                 state_relief_time: float = 0.5,
                 buffer_relief_time: float = 0.05,
                 logger: Union[None, str, logging.Logger] = None) -> None:
        """

        Args:
            websocket_port (int, optional): port used to communicate with
                the viewer. Defaults to 4567.
            zmq_port (Optional[int], optional): port that the websocket server
                exposed to interop with pipeline. Defaults to None.
            websocket_server_ip (str, optional): ip address of the websocket
                server. Defaults to '127.0.0.1'.
            state_relief_time (float, optional): time in seconds that the
                backend should sleep to avoid websocket blocking when the
                following events happen: (a).the viewer's slider value changed
                to a specific frame; (b).the animation is end and rollback to
                the first frame. Larger value is recommended when the network
                connection is not good. Defaults to 0.5s.
            buffer_relief_time (float, optional): time in seconds that the
                backend should sleep to avoid websocket blocking. When the
                viewer plays the geometry cache at a frame rate that is slower
                than the backend inference speed, the buffer frequently switch
                the status between the opening and closed. Larger value is
                recommended when the network connection is not good. Defaults
                to 0.05s.
            logger (Union[None, str, logging.Logger], optional): Logger for
                logging. If None, root logger will be selected. Defaults to
                None.
        """
        if logger is None or isinstance(logger, str):
            self.logger = logging.getLogger(logger)
        else:
            self.logger = logger

        self.state = State()

        self.websocket_server_subprocess = WebSocketServerSubprocess(
            pipeline_name=self.__class__.__name__,
            websocket_port=websocket_port,
            zmq_port=zmq_port,
            ip_address=websocket_server_ip,
            logger=self.logger)
        zmq_port = self.websocket_server_subprocess.start()

        self.zmq_handler = ZMQHandler(
            zmq_port=zmq_port,
            ip_address=websocket_server_ip,
            logger=self.logger)

        self.state_relief_time = state_relief_time
        self.buffer_relief_time = buffer_relief_time
        self.n_cached_frames = 0
        self.n_frames = 0

        self.step_time = 0
        self.tmp_dir = tempfile.TemporaryDirectory(prefix='xrviewer_pipeline_')

    def step(self, should_update_frame_idx: bool = True) -> Optional[float]:
        idx = self.state.buffer_frame_idx + self.n_cached_frames

        if idx >= self.n_frames:
            self.n_cached_frames = 0
            self.step_time = 0
            return

        verts_begin = time.time()
        verts = self.forward(idx)

        data = {'verts': verts, 'frame_idx': idx}
        self.zmq_handler.write(PipelineActionsEnum.UPDATE_MESH_VERTICES, data)

        if should_update_frame_idx:
            self.n_cached_frames += 1

        time_elapsed = (time.time() - verts_begin) * 1000

        self.step_time += time_elapsed

        if self.n_cached_frames % 50 == 0 and self.n_cached_frames != 0:
            avg_time_elapsed = self.step_time / 50
            self.logger.info(
                '[Pipeline] inferred frame '
                f'{idx}/{self.state.n_frames - 1}, '
                f'avg time elapsed: {round(avg_time_elapsed, 2)} ms')
            self.step_time = 0

        return time_elapsed

    @abstractmethod
    def forward(self, frame_idx: int) -> List[List[float]]:
        """Get mesh vertices by the given frame index.

        Args:
            frame_idx (int): frame index in infer

        Returns:
            List[List[float]]:
                A nested list for inferred vertices,
                shape: [n_verts, 3].
        """
        pass

    @abstractmethod
    def update_stream_data(self, stream_data: bytes) -> int:
        """Set stream data.

        Args:
            stream_data (bytes): stream data uploaded
                from the viewer in bytes

        Returns:
            int: number of frames in the stream data
        """
        pass

    @abstractmethod
    def get_faces(self) -> List[int]:
        """Get face indices.

        Returns:
            List[int]: the requested face indices, organized as a [|F|, 3] list
        """
        pass

    def event_loop(self) -> None:
        """Enter the event loop, which continually checks the viewer state
        change and gives appropriate response."""
        while True:
            iter_begin = time.time()
            # fetch state from the websocket server
            serialized_state = umsgpack.unpackb(
                self.zmq_handler.read(PipelineActionsEnum.REQUEST_STATE))

            self.state: State = pickle.loads(serialized_state)

            if self.state.relief_flag:
                diff = self.state_relief_time - (time.time() - iter_begin)
                if diff > 0:
                    time.sleep(diff)
                self.zmq_handler.write(PipelineActionsEnum.UPDATE_RELIEF_FLAG,
                                       False)

            # When the viewer uploaded some stream data, the pipeline
            # loads it and sets it as the current playing animation.
            if self.state.should_update_stream_data:
                serialized_stream_data = umsgpack.unpackb(
                    self.zmq_handler.read(
                        PipelineActionsEnum.REQUEST_STREAM_DATA))

                self.n_frames = self.update_stream_data(serialized_stream_data)

                self.zmq_handler.write(
                    PipelineActionsEnum.UPDATE_STREAM_DATA_FLAG, False)

                self.zmq_handler.write(PipelineActionsEnum.UPDATE_NUM_FRAMES,
                                       self.n_frames)

                if self.n_frames == 0:
                    self.logger.warn('[Pipeline] Failed to parse stream data.')
                    continue
                else:
                    self.logger.info('[Pipeline] The sequence has '
                                     f'{self.n_frames} frames')

                faces = self.get_faces()

                # Since the stream data has changed, the mesh topology
                # may change, we need to resend faces to the viewer.
                self.zmq_handler.write(PipelineActionsEnum.UPDATE_MESH_FACES,
                                       faces)
                self.zmq_handler.write(
                    PipelineActionsEnum.UPDATE_STREAM_DATA_SUCCESS, True)

                self.n_cached_frames = 0

            if self.state.is_buffer_open and self.state.n_frames != 0:
                if self.state.buffer_frame_idx_reload_flag:
                    self.n_cached_frames = 0
                    self.zmq_handler.write(
                        PipelineActionsEnum.
                        UPDATE_BUFFER_FRAME_IDX_RELOAD_FLAG, False)

                self.step()
            else:
                diff = self.buffer_relief_time - (time.time() - iter_begin)
                if diff > 0:
                    time.sleep(diff)

    def __del__(self):
        self.tmp_dir.cleanup()
