import { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { WebSocketContext } from './WebSocket';
import { ServerActionsEnum } from '../../actions';

const msgpack = require('msgpack-lite');

const WebSocketListener = () => {
  const { socket } = useContext(WebSocketContext);
  const dispatch = useDispatch();
  useEffect(() => {
    socket.addEventListener('message', (originalCmd) => {
      const cmd = msgpack.decode(new Uint8Array(originalCmd.data));

      switch (cmd.type) {
        case ServerActionsEnum.UPDATE_MESH_FACES:
          dispatch({
            type: 'write',
            path: 'streaming/meshFaces',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.UPDATE_MESH_VERTICES:
          dispatch({
            type: 'write',
            path: 'streaming/meshVertices',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.UPDATE_NUM_FRAMES:
          dispatch({
            type: 'write',
            path: 'streaming/numFrames',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.UPDATE_IS_PLAYING:
          dispatch({
            type: 'write',
            path: 'streaming/isPlaying',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.UPDATE_STREAM_DATA_SUCCESS:
          dispatch({
            type: 'write',
            path: 'streaming/updateAnimationSuccess',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.CONFIRM_WEBSOCKET_CONNECTED:
          console.log('webSocketConnectionConfirmed: '.concat(cmd.data));
          dispatch({
            type: 'write',
            path: 'webSocketState/webSocketConnectionConfirmed',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.UPDATE_PIPELINE_NAME:
          console.log(cmd.data);
          dispatch({
            type: 'write',
            path: 'streaming/pipelineName',
            data: cmd.data,
          });
          break;
        case ServerActionsEnum.HEART_CHECK:
          console.log(cmd.data);
          break;
        case ServerActionsEnum.UPDATE_ALERT_MESSAGE:
          dispatch({
            type: 'write',
            path: 'alertMessage',
            data: cmd.data,
          });
          break;
        default:
          console.log(cmd);
          console.error(`Unrecognized message type from server: ${cmd.type}`);
      }
    });
  }, [socket, dispatch]);
};

export { WebSocketListener };
