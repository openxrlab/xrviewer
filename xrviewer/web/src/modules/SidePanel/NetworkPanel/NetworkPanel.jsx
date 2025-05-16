import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, Grid, TextField,
} from '@mui/material';
import { Item } from '../../Common/UIComponents';
import { WebSocketContext } from '../../WebSocket/WebSocket';

export default function NetworkPanel() {
  const dispatch = useDispatch();
  const webSocket = React.useContext(WebSocketContext).socket;
  const webSocketUrl = useSelector(
    (state) => state.webSocketState.webSocketUrl,
  );

  const [wsUrlTextFieldContent, setWSUrlTextFieldContent] = React.useState(webSocketUrl);

  const pipelineName = useSelector(
    (state) => state.streaming.pipelineName,
  );

  const handleWsDisconnect = () => {
    if (webSocket !== undefined) {
      webSocket.close();
    }
  };

  const handleWsConnect = () => {
    if (webSocket !== undefined) {
      webSocket.close();
    }
    console.log(wsUrlTextFieldContent);
    dispatch({
      type: 'write',
      path: 'webSocketState/webSocketUrl',
      data: '',
    });
    dispatch({
      type: 'write',
      path: 'webSocketState/webSocketUrl',
      data: wsUrlTextFieldContent,
    });
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={1}
          alignItems="center"
        >

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Pipeline</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              {pipelineName}
            </Item>
          </Grid>

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Url</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <TextField
                id="ws_url"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  style: {
                    textAlign: 'center',
                  },
                }}
                size="small"
                margin="none"
                defaultValue={webSocketUrl}
                onChange={(event) => {
                  setWSUrlTextFieldContent(event.target.value);
                }}
                variant="standard"
              />
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                variant="outlined"
                onClick={handleWsDisconnect}
                fullWidth
              >
                Disconnect
              </Button>
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={1} />

          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                variant="outlined"
                onClick={handleWsConnect}
                fullWidth
              >
                Connect
              </Button>
            </Item>
          </Grid>

          <Grid item xs={1} />
        </Grid>
      </Box>

    </div>
  );
}
