import atexit
import logging
import os
import re
import signal
import socket
import sys
import threading
import time
from subprocess import PIPE, STDOUT, Popen
from typing import Optional, Union


def is_port_available(port: int) -> bool:
    """check whether the given port is open.

    Args:
        port (int): port to be checked.

    Returns:
        bool: whether the port is available.
    """

    try:
        sock = socket.socket()
        sock.bind(('', port))
        sock.close()

        return True
    except OSError:
        return False


def get_available_port() -> int:
    """Get a currently free port.

    Returns:
        int: id of the port.
    """
    sock = socket.socket()
    sock.bind(('', 0))
    port = sock.getsockname()[1]

    return port


class WebSocketServerSubprocess:

    def __init__(self,
                 pipeline_name: str,
                 websocket_port: int,
                 zmq_port: Optional[int] = None,
                 ip_address: str = '127.0.0.1',
                 logger: Union[None, str, logging.Logger] = None) -> None:
        """

        Args:
            pipeline_name (str): name of the pipeline.
            websocket_port (int): port exposed to websocket clients.
            zmq_port (Optional[int], optional): port exposed to the pipeline.
                Defaults to None.
            ip_address (str, optional): ip address of the websocket server.
                Defaults to '127.0.0.1'.
            logger (Union[None, str, logging.Logger], optional): Logger for
                logging. Defaults to None.

        Raises:
            ValueError: raises when the zmq port is not available
        """
        self.websocket_port = websocket_port

        # find an available port for zmq
        if zmq_port is None:
            self.zmq_port = get_available_port()
            logger.info(f'Using ZMQ port: {self.zmq_port}')
        else:
            if not is_port_available(zmq_port):
                msg = f'zmq port {zmq_port} is not available'
                logger.error(msg)
                raise ValueError(msg)
            self.zmq_port = zmq_port

        self.pipeline_name = pipeline_name
        self.ip_address = ip_address
        self.logger = logger

        self.log_level_pattern = re.compile(
            r'\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b')

    def cleanup(self, process: Popen[bytes]):
        """clean up the subprocess when terminating the websocket server."""
        process.kill()
        process.wait()

    def poll_process(self):
        """Continually check to see if the websocket server process is still
        running and has not failed.

        If it fails, alert the user and exit the entire program.
        """
        while self.ws_server_process.poll() is None:
            time.sleep(0.5)

        self.logger.warn(
            '[WebSocket Server] The websocket server subprocess dumped.')
        self.cleanup(self.ws_server_process)

        os.kill(os.getpid(), signal.SIGINT)

    def log_process(self):
        """Continually check to see if the websocket server has output and
        write it to log."""
        while True:
            with self.ws_server_process.stdout:
                for line in iter(self.ws_server_process.stdout.readline, b''):
                    line = line.decode('utf-8').strip()
                    match = self.log_level_pattern.search(line)
                    if not match:
                        # the line does not come from logger
                        self.logger.warning(f'[WebSocket Server] {line}')
                        continue

                    line = line.split(' - ')[-1]
                    msg = f'[WebSocket Server] {line}'
                    log_level = match.group(1)

                    if log_level == 'INFO':
                        self.logger.info(msg)
                    elif log_level == 'WARNING':
                        self.logger.warning(msg)
                    elif log_level == 'ERROR':
                        self.logger.error(msg)
                    elif log_level == 'DEBUG':
                        self.logger.debug(msg)
                    elif log_level == 'CRITICAL':
                        self.logger.critical(msg)
            time.sleep(0.5)

    def start(self) -> int:
        """Start websocket server as a sub-process.

        Returns:
           int : zmq port id
        """

        args = [
            sys.executable, '-u', '-c',
            'from xrviewer.server.websocket.server '
            'import WebSocketServer; '
            f'ws_server = WebSocketServer('
            f"pipeline_name='{self.pipeline_name}',"
            f'zmq_port={self.zmq_port},'
            f'websocket_port={self.websocket_port},'
            f"ip_address='{self.ip_address}'); "
            'ws_server.run()'
        ]
        self.ws_server_process = self.ws_server_process = Popen(
            args, start_new_session=True, stdout=PIPE, stderr=STDOUT)

        watcher_thread = threading.Thread(target=self.poll_process)
        watcher_thread.daemon = True
        watcher_thread.start()

        logging_thread = threading.Thread(target=self.log_process)
        logging_thread.daemon = True
        logging_thread.start()

        atexit.register(lambda: self.cleanup(self.ws_server_process))

        return self.zmq_port
