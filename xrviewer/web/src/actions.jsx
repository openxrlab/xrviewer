export const ServerActionsEnum = {
  UPDATE_STREAM_DATA: 'UPDATE_STREAM_DATA',
  UPDATE_MESH_FACES: 'UPDATE_MESH_FACES',
  UPDATE_MESH_VERTICES: 'UPDATE_MESH_VERTICES',
  UPDATE_IS_PLAYING: 'UPDATE_IS_PLAYING',
  UPDATE_NUM_FRAMES: 'UPDATE_NUM_FRAMES',
  APPEND_VERTEX_DATA: 'APPEND_VERTEX_DATA',
  UPDATE_BUFFER_FRAME_INDEX: 'UPDATE_BUFFER_FRAME_INDEX',
  UPDATE_IS_BUFFER_OPEN: 'UPDATE_IS_BUFFER_OPEN',
  UPDATE_STREAM_DATA_SUCCESS: 'UPDATE_STREAM_DATA_SUCCESS',
  CONFIRM_WEBSOCKET_CONNECTED: 'CONFIRM_WEBSOCKET_CONNECTED',
  UPDATE_PIPELINE_NAME: 'UPDATE_PIPELINE_NAME',
  HEART_CHECK: 'HEART_CHECK',
  UPDATE_ALERT_MESSAGE: 'UPDATE_ALERT_MESSAGE',
};

export const WebSocketErrorCodeEnum = {
  VIEWER_SHUT_DOWN: 1005,
  FAILED_TO_ESTABLISH_CONNECTION: 1006,
  SERVER_ALREADY_IN_USE: 8001,
};

export const SynchronizeModeEnum = {
  ROLLBACK: 0,
  WAIT: 1,
};

const msgpack = require('msgpack-lite');

export function sendMessage(_webSocket: WebSocket, _type: String, _data) {
  if (_webSocket.readyState === WebSocket.OPEN) {
    const data_packet = {
      type: _type,
      data: _data,
    };
    const message = msgpack.encode(data_packet);
    _webSocket.send(message);

    return true;
  }

  return false;
}
