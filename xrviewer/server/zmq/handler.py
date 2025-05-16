import logging
import sys
from threading import Thread
from typing import Any, Dict, Union

import umsgpack
import zmq


class PingThread(Thread):

    def __init__(self, func, timeout_in_sec):
        super().__init__()
        self.func = func
        self.result = Exception(f'Failed to connect to websocket server in '
                                f'{timeout_in_sec} seconds.')

    def run(self):
        self.result = self.func()

    def get_result(self):
        return self.result


class ZMQHandler:
    """for pipeline interop with the websocket server."""

    context = zmq.Context()  # pylint: disable=abstract-class-instantiated

    def __init__(self,
                 zmq_port: int,
                 ip_address: str,
                 logger: Union[None, str, logging.Logger] = None):
        self.logger = logger

        self.logger = logger
        self.zmq_port = zmq_port
        self.client = self.context.socket(zmq.REQ)
        zmq_url = f'tcp://{ip_address}:{self.zmq_port}'
        self.client.connect(zmq_url)
        self.assert_connected()

    def send(self, command):
        """Send a message to websocket server."""
        self.client.send_multipart(
            [command['type'].encode('utf-8'),
             umsgpack.packb(command)])

        return umsgpack.packb(self.client.recv())

    def send_ping(self):
        """Ping to the websocket server."""
        msg_type = 'ping'
        msg_data = umsgpack.packb({'type': msg_type})
        self.client.send_multipart([msg_type.encode('utf-8'), msg_data])
        res = self.client.recv()

        return umsgpack.unpackb(res)

    def timeout_ping(self, timeout_in_sec: int = 5) -> Exception | Any:
        """Start a ping thread that check whether the client is connected with
        the websocket server.

        Args:
            timeout_in_sec (int, optional): maximum time in seconds that the
                client wait for the websocket server's response. Defaults to 5.

        Raises:
            res: raise exception if the client is not properly connected with
                the websocket server.
        """
        task = PingThread(self.send_ping, timeout_in_sec)
        task.start()
        task.join(timeout_in_sec)
        res = task.get_result()
        if isinstance(res, BaseException):
            raise res
        return res

    def assert_connected(self, timeout_in_sec: int = 10):
        """Check whether the connection has been established properly."""
        try:
            self.logger.info(
                '[ZMQHandler] Sending ping to the websocket server')
            _ = self.timeout_ping(timeout_in_sec)
            self.logger.info('[ZMQHandler] Successfully connected to '
                             'the websocket server.')
        except Exception as e:
            self.logger.error(e)
            sys.exit()

    def write(self, _type: str, _data: Union[Dict, str, int, None] = None):
        """write data to the websocket server."""
        return self.send({'type': _type, 'data': _data})

    def read(self, _type: str):
        """read data from the websocket server."""
        return self.send({'type': _type})
