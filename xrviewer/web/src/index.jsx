import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import { Provider } from 'react-redux';
import { ProSidebarProvider } from 'react-pro-sidebar';
import App from './App';
import reportWebVitals from './reportWebVitals';
import WebSocketProvider from './modules/WebSocket/WebSocket';
import store from './store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <WebSocketProvider>
      <ProSidebarProvider>
        <App />
      </ProSidebarProvider>
    </WebSocketProvider>
  </Provider>,
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
