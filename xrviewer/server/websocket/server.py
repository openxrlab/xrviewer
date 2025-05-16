import argparse
import logging
import pickle
from enum import Enum
from typing import List, Optional, Tuple

import tornado.gen
import tornado.ioloop
import tornado.web
import tornado.websocket
import umsgpack
import zmq
from zmq.eventloop.zmqstream import ZMQStream

from ..actions import PipelineActionsEnum, ViewerActionsEnum
from .state import State, StreamBuffer


class WebSocketErrorCodeEnum(int, Enum):
    SERVER_ALREADY_IN_USE = 8001


class WebSocketHandler(tornado.websocket.WebSocketHandler):
    """For receiving and sending commands from/to the viewer."""

    def __init__(self,
                 *args,
                 websocket_max_message_size: int = 1024 * 1024 * 1024,
                 **kwargs):
        """

        Args:
            websocket_max_message_size (int, optional): maximum allowed
                message size. If the remote peer sends a message larger
                than this, the connection will be closed. Defaults to
                1024*1024*1024.
        """
        self.ws_server = kwargs.pop('ws_server')
        self.pipeline_name = kwargs.pop('pipeline_name')
        self.logger: logging.Logger = kwargs.pop('logger')
        super().__init__(*args, **kwargs)

        super().settings.setdefault('websocket_max_message_size',
                                    websocket_max_message_size)

        self.interop_with_server_on_dispose = True

    def check_origin(self, origin: str) -> bool:
        self.logger.info(f'origin: {origin}')
        return True

    def open(self, *args: str, **kwargs: str):
        if (self.ws_server.websocket_pool.__len__() != 0):
            self.logger.warning(
                'A new viewer tries to connect to '
                'the websocket server whereas it is already in use.')
            self.interop_with_server_on_dispose = False
            self.close(WebSocketErrorCodeEnum.SERVER_ALREADY_IN_USE,
                       'Websocket server is already in use')
            return
        self.ws_server.websocket_pool.add(self)
        self.ws_server.state = State()

        cmd = {
            'type': ViewerActionsEnum.CONFIRM_WEBSOCKET_CONNECTED,
            'data': True
        }
        self.write_message(message=umsgpack.packb(cmd), binary=True)

        cmd = {
            'type': ViewerActionsEnum.UPDATE_PIPELINE_NAME,
            'data': self.pipeline_name
        }
        self.write_message(message=umsgpack.packb(cmd), binary=True)

        self.logger.info('Viewer connected.')

    async def on_message(self, message: bytearray):
        """Parse the message from the viewer and call the appropriate
        function."""
        unpacked_message = umsgpack.unpackb(message)

        msg_type = unpacked_message['type']
        msg_data = unpacked_message['data']

        if msg_type == ViewerActionsEnum.UPDATE_BUFFER_FRAME_INDEX:
            self.ws_server.state.buffer_frame_idx = int(msg_data)
            self.ws_server.state.buffer_frame_idx_reload_flag = True
            self.logger.info('The viewer set buffer frame index to: '
                             f'{self.ws_server.state.buffer_frame_idx}')
            self.ws_server.state.relief_flag = True
        elif msg_type == ViewerActionsEnum.UPDATE_STREAM_DATA:
            self.ws_server.state = State()
            self.ws_server.state.should_update_stream_data = True
            self.ws_server.buffer.stream_data = msg_data.data
            self.logger.info('Received new stream data from the viewer')
        elif msg_type == ViewerActionsEnum.UPDATE_IS_BUFFER_OPEN:
            self.logger.info(
                f'The viewer set buffer opening state to: {msg_data}')
            self.ws_server.state.is_buffer_open = msg_data
        elif msg_type == ViewerActionsEnum.HEART_CHECK:
            cmd = {
                'type': ViewerActionsEnum.HEART_CHECK,
                'data': 'pong',
            }
            self.write_message(message=umsgpack.packb(cmd), binary=True)
        else:
            self.logger.warning(f'unknown command:{msg_type}')

    def on_close(self) -> None:
        self.logger.info('Viewer disconnected.')

        if not self.interop_with_server_on_dispose:
            return
        self.ws_server.websocket_pool.remove(self)
        self.ws_server.state.is_buffer_open = False


class WebSocketServer:

    context = zmq.Context()  # pylint: disable=abstract-class-instantiated

    def __init__(self, pipeline_name: str, zmq_port: int, websocket_port: int,
                 ip_address: str):
        self.logger = logging.getLogger()
        self.zmq_port = zmq_port
        self.websocket_pool = set()
        self.app = tornado.web.Application([(r'/', WebSocketHandler, {
            'ws_server': self,
            'pipeline_name': pipeline_name,
            'logger': self.logger
        })])
        self.ioloop = tornado.ioloop.IOLoop.current()
        # zmq
        zmq_url = f'tcp://{ip_address}:{self.zmq_port:d}'
        self.zmq_socket, self.zmq_stream, self.zmq_url = \
            self.setup_zmq(zmq_url)

        # websocket
        listen_kwargs = {'address': '0.0.0.0'}
        self.app.listen(websocket_port, **listen_kwargs)
        self.websocket_port = websocket_port
        self.websocket_url = f'0.0.0.0:{self.websocket_port}'

        # state
        self.state = State()

        self.buffer = StreamBuffer()

    def handle_zmq(self, frames: List[bytes]):
        """Handle messages from the backend.

        Args:
            frames (List[bytes]): data frame from the backend,
                including message type and data
        """
        msg_type = frames[0].decode('utf-8')
        msg_data = frames[1]
        if msg_type in [
                PipelineActionsEnum.UPDATE_MESH_VERTICES,
                PipelineActionsEnum.UPDATE_MESH_FACES,
                PipelineActionsEnum.UPDATE_ALERT_MESSAGE,
                PipelineActionsEnum.UPDATE_STREAM_DATA_SUCCESS
        ]:
            self.forward_to_websockets(frames)
            self.zmq_socket.send(umsgpack.packb(b'ok'))
        elif msg_type == PipelineActionsEnum.UPDATE_NUM_FRAMES:
            unpacked_data = umsgpack.unpackb(msg_data)
            self.state.n_frames = unpacked_data['data']
            self.forward_to_websockets(frames)
            self.zmq_socket.send(umsgpack.packb(b'ok'))
        elif msg_type == PipelineActionsEnum.REQUEST_STATE:
            serialized = pickle.dumps(self.state)
            self.zmq_socket.send(serialized)
        elif msg_type == PipelineActionsEnum.REQUEST_STREAM_DATA:
            self.zmq_socket.send(self.buffer.stream_data)
        elif msg_type == PipelineActionsEnum.UPDATE_STREAM_DATA_FLAG:
            unpacked_data = umsgpack.unpackb(msg_data)
            self.state.should_update_stream_data = unpacked_data['data']
            self.zmq_socket.send(b'ok')
        elif msg_type == PipelineActionsEnum.PING:
            self.zmq_socket.send(umsgpack.packb(b'ping received'))
        elif msg_type == \
                PipelineActionsEnum.UPDATE_BUFFER_FRAME_IDX_RELOAD_FLAG:
            unpacked_data = umsgpack.unpackb(msg_data)
            self.state.buffer_frame_idx_reload_flag = unpacked_data['data']
            self.zmq_socket.send(umsgpack.packb(b'ok'))
        elif msg_type == PipelineActionsEnum.UPDATE_RELIEF_FLAG:
            unpacked_data = umsgpack.unpackb(msg_data)
            self.state.relief_flag = unpacked_data['data']
            self.zmq_socket.send(umsgpack.packb(b'ok'))
        else:
            self.logger.warning(f'unknown command:{msg_type}')
            self.zmq_socket.send(umsgpack.packb(b'error: unknown command'))

    def forward_to_websockets(
            self,
            frames: Tuple[str, bytes],
            websocket_to_skip: Optional[WebSocketHandler] = None):
        """forward a message from the zmq(backend) to all websockets(viewers).

        Args:
            frames (Tuple[str, str, bytes]): data frame from the zmq
            websocket_to_skip (Optional[WebSocketHandler], optional): whether
                forward to the websocket. Defaults to None.
        """
        _type, _data = frames  # cmd, data
        for websocket in self.websocket_pool:
            if websocket_to_skip and websocket == websocket_to_skip:
                pass
            else:
                websocket.write_message(_data, binary=True)

    def setup_zmq(self, url: str):
        """setup a zmq socket and connect it to the given url."""
        zmq_socket = self.context.socket(zmq.REP)  # pylint: disable=no-member
        zmq_socket.bind(url)
        zmq_stream = ZMQStream(zmq_socket)
        zmq_stream.on_recv(self.handle_zmq)

        return zmq_socket, zmq_stream, url

    def run(self):
        """starts and runs the websocet server."""
        self.logger.warning('Start websocket server, '
                            f'ZeroMQ port: {self.zmq_port}, '
                            f'websocket port: {self.websocket_port}')
        self.ioloop.start()


def setup_parser():
    parser = argparse.ArgumentParser(description='Start a websocket server.')

    parser.add_argument('--pipeline_name', type=str, required=True)
    parser.add_argument('--zmq_port', type=int, default=6000)
    parser.add_argument('--websocket_port', type=int, default=4567)
    parser.add_argument('--ip_address', type=str, default='127.0.0.1')

    args = parser.parse_args()

    return args
