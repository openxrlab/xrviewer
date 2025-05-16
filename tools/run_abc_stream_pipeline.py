import argparse

from xrviewer.server.pipelines.abc import AbcStreamPipeline


def setup_parser():
    parser = argparse.ArgumentParser(
        description='Run the abc stream pipeline.')

    parser.add_argument('--websocket_port', type=int, default=18877)
    parser.add_argument('--zmq_port', type=int, default=18817)
    parser.add_argument('--websocket_server_ip', type=str, default='127.0.0.1')
    args = parser.parse_args()

    return args


if __name__ == '__main__':
    args = setup_parser()

    websocket_port = args.websocket_port
    zmq_port = args.zmq_port
    websocket_server_ip = args.websocket_server_ip

    pipeline = AbcStreamPipeline(
        websocket_port=websocket_port,
        zmq_port=zmq_port,
        websocket_server_ip=websocket_server_ip)

    pipeline.event_loop()
