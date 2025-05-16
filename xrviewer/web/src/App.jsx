import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { TimelinePanel } from './modules/TimelinePanel/TimelinePanel';
import { appTheme } from './themes/theme.ts';
import { WebSocketListener } from './modules/WebSocket/WebSocketListener';
import ViewerWindow from './modules/ViewerPanel/ViewerWindow';
import { SidePanel } from './modules/SidePanel/SidePanel';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      <div className="App">
        <WebSocketListener />
        <header className="App-body">
          <ViewerWindow />
          <SidePanel />
          <TimelinePanel />
        </header>
      </div>
    </ThemeProvider>
  );
}

export default App;
