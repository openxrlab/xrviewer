import { createContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import * as React from 'react';
import { sendMessage, ServerActionsEnum } from '../../actions';

const WebSocketContext = createContext(null);

export { WebSocketContext };

export default function WebSocketContextFunction(props) {
  const { children } = props;

  const dispatch = useDispatch();

  let ws = null;
  let socket = null;

  const webSocketUrl = useSelector(
    (state) => state.webSocketState.webSocketUrl,
  );

  /* eslint-disable */
  var heartCheck = {
    timeout: 60000,
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function(){
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        this.start();
    },
    start: function(){
        var self = this;
        this.timeoutObj = setTimeout(function(){
            console.log('ping');
            sendMessage(
              socket,
              ServerActionsEnum.HEART_CHECK,
              'ping',
            );
            self.serverTimeoutObj = setTimeout(function(){
                socket.close();
            }, self.timeout)
        }, this.timeout)
    },
  }
  /* eslint-enable */

  const connect = () => {
    console.log(`websocket url: ${webSocketUrl}`);
    try {
      socket = new WebSocket(webSocketUrl);
    } catch (error) {
      socket = new WebSocket('ws://localhost:4567');
    }
    socket.binaryType = 'arraybuffer';
    socket.onopen = () => {
      console.log('websocket connected');
      heartCheck.start();
      dispatch({
        type: 'write',
        path: 'webSocketState/webSocketConnected',
        data: true,
      });
    };
    socket.onmessage = () => {
      heartCheck.reset();
    };
    socket.onclose = (event: CloseEvent) => {
      console.log('websocket disconnected: ');
      console.log(event);

      dispatch({
        type: 'write',
        path: 'webSocketState/webSocketConnected',
        data: false,
      });

      dispatch({
        type: 'write',
        path: 'webSocketState/webSocketConnectionConfirmed',
        data: false,
      });

      dispatch({
        type: 'write',
        path: 'webSocketState/closeEvent',
        data: event,
      });
    };

    socket.onerror = (err: Event) => {
      console.error('Socket error occured: ', err, 'Closing socket');
      socket.close();
    };

    return socket;
  };

  useEffect(() => () => {
    if (socket !== null) {
      socket.close();
    }
  }, [webSocketUrl]);

  connect();

  ws = {
    socket,
  };

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
}

WebSocketContextFunction.propTypes = {
  children: PropTypes.node.isRequired,
};
