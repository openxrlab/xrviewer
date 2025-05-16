import argparse

from xrviewer.server.pipelines.smpl import SMPLStreamPipeline


def setup_parser():
    parser = argparse.ArgumentParser(
        description='Run the smpl stream pipeline.')

    parser.add_argument('--websocket_port', type=int, default=18805)
    parser.add_argument('--zmq_port', type=int, default=18885)
    parser.add_argument('--websocket_server_ip', type=str, default='127.0.0.1')
    parser.add_argument(
        '--smpl_stream_server_ip', type=str, default='172.20.21.219')
    parser.add_argument('--smpl_stream_server_port', type=int, default=32003)

    args = parser.parse_args()

    return args


if __name__ == '__main__':
    args = setup_parser()

    websocket_port = args.websocket_port
    zmq_port = args.zmq_port
    websocket_server_ip = args.websocket_server_ip
    smpl_stream_server_ip = args.smpl_stream_server_ip
    smpl_stream_server_port = args.smpl_stream_server_port

    pipeline = SMPLStreamPipeline(
        websocket_port=websocket_port,
        zmq_port=zmq_port,
        websocket_server_ip=websocket_server_ip,
        smpl_stream_server_ip=smpl_stream_server_ip,
        smpl_stream_server_port=smpl_stream_server_port)

    pipeline.event_loop()
