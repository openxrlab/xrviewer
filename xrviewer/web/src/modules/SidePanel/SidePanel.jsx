/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button, Box, Grid, AlertTitle,
  Tab, Tabs, Typography,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Grid4x4Icon from '@mui/icons-material/Grid4x4';
import SensorsIcon from '@mui/icons-material/Sensors';

import { WebSocketErrorCodeEnum } from '../../actions';
import { Item } from '../Common/UIComponents';
import CameraPanel from './CameraPanel/CameraPanel';
import MeshPanel from './MeshPanel/MeshPanel';
import NetworkPanel from './NetworkPanel/NetworkPanel';

const Alert = React.forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

type TabPanelProps = {
    children: React.ReactNode,
    index: Number,
    value: Number,
}

function TabPanel(props: TabPanelProps) {
  const {
    children, value, index, ...other
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      <Box sx={{ p: 3, padding: 0 }}>
        <Typography component="div">{children}</Typography>
      </Box>
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function SidePanel() {
  const dispatch = useDispatch();

  const webSocketConnected = useSelector(
    (state) => state.webSocketState.webSocketConnected,
  );
  const webSocketUrl = useSelector(
    (state) => state.webSocketState.webSocketUrl,
  );
  const webSocketConnectionConfirmed = useSelector(
    (state) => state.webSocketState.webSocketConnectionConfirmed,
  );
  const webSocketConnectedText = (webSocketConnected && webSocketConnectionConfirmed) ? 'connected' : 'disconnected';
  const webSocketConnectedColor = (webSocketConnected && webSocketConnectionConfirmed) ? '#008000' : '#DC143C';

  const mode = useSelector(
    (state) => state.mode,
  );

  const websocketCloseEvent = useSelector(
    (state) => state.webSocketState.closeEvent,
  );

  const alertMessage = useSelector(
    (state) => state.alertMessage,
  );

  const [websocketOnClosedWidgetOpen, setWebSocketOnClosedWidgetOpen] = React.useState(false);
  const [websocketClosedCode, setWebsocketClosedCode] = React.useState(-1);
  const [websocketClosedReason, setWebsocketClosedReason] = React.useState('placeholder');

  React.useEffect(() => {
    if (websocketCloseEvent === null) return;

    setWebsocketClosedCode(websocketCloseEvent.code);
    let reason = '';
    if (
      Number(websocketCloseEvent.code) === WebSocketErrorCodeEnum.FAILED_TO_ESTABLISH_CONNECTION
    ) {
      reason = 'Failed to establish connection with the websocket server.';
    } else if (Number(websocketCloseEvent.code) === WebSocketErrorCodeEnum.VIEWER_SHUT_DOWN) {
      reason = 'The viewer shut down the connection.';
    } else {
      reason = websocketCloseEvent.reason;
    }
    setWebsocketClosedReason(reason);
    setWebSocketOnClosedWidgetOpen(true);
  }, [websocketCloseEvent]); // eslint-disable-line

  const [websocketConnectedWidgetOpen, setWebsocketConnectedWidgetOpen] = React.useState(false);
  React.useEffect(() => {
    if (webSocketConnected === true) {
      setWebsocketConnectedWidgetOpen(true);
    }
  }, [webSocketConnectionConfirmed]); // eslint-disable-line

  const handleWebsocketOnClosedWidgetClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setWebSocketOnClosedWidgetOpen(false);
  };

  const handleWebsocketConnectedWidgetClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setWebsocketConnectedWidgetOpen(false);
  };

  const [tabSelection, setTabSelection] = React.useState(0);

  const handleTabSelectionChange = (event, newValue) => {
    setTabSelection(newValue);
  };

  const [alertDialogOpeningState, setAlertDialogOpeningState] = React.useState(false);
  const handleAlertDialogClose = () => {
    setAlertDialogOpeningState(false);
  };
  const [alertDialogMessage, setAlertDialogMessage] = React.useState('');

  React.useEffect(() => {
    if (alertMessage !== '') {
      setAlertDialogOpeningState(true);
      setAlertDialogMessage(alertMessage);
      dispatch({
        type: 'write',
        path: 'alertMessage',
        data: '',
      });
    }
  }, [alertMessage]);

  return (
    <div className="SidePanel">
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={1}
          alignItems="center"
        >
          <Grid item xs={12}>
            <Item elevation={0}>
              <img
                style={{ height: 50, margin: 'auto' }}
                src="./logo.png"
                alt="logo"
              />
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                className="SidePanel-refreshPageButton"
                variant="outlined"
                onClick={() => {
                  // eslint-disable-next-line
                  location.reload();
                }}
                fullWidth
              >
                Refresh Page
              </Button>
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={5}>
            <Item elevation={0}>
              <b>WebSocket State</b>
            </Item>
          </Grid>

          <Grid item xs={7}>
            <Item elevation={0}>
              <font color={webSocketConnectedColor}>
                {webSocketConnectedText}
              </font>
            </Item>
          </Grid>

          <Grid item xs={5}>
            <Item elevation={0}>
              <b>Frame Rate</b>
            </Item>
          </Grid>

          <Grid item xs={7}>
            <Item elevation={0}>
              <font id="fpsDiv">0</font>
            </Item>
          </Grid>

          <Grid item xs={5}>
            <Item elevation={0}>
              <b>Canvas Size</b>
            </Item>
          </Grid>

          <Grid item xs={7}>
            <Item elevation={0}>
              <font id="canvasSizeX">0.0</font>
              x
              <font id="canvasSizeY">0.0</font>
            </Item>
          </Grid>

        </Grid>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabSelection} onChange={handleTabSelectionChange} aria-label="basic tabs example" centered>
            <Tab label="Camera" icon={<CameraAltIcon />} {...a11yProps(0)} />
            <Tab label="Mesh" icon={<Grid4x4Icon />} {...a11yProps(1)} />
            <Tab label="Network" icon={<SensorsIcon />} {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={tabSelection} index={0}>
          <CameraPanel />
        </TabPanel>
        <TabPanel value={tabSelection} index={1}>
          <MeshPanel mode={mode} />
        </TabPanel>
        <TabPanel value={tabSelection} index={2}>
          <NetworkPanel />
        </TabPanel>
      </Box>

      {
        websocketOnClosedWidgetOpen
          ? (
            <Snackbar
              open={websocketOnClosedWidgetOpen}
              autoHideDuration={6000}
              onClose={handleWebsocketOnClosedWidgetClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                onClose={handleWebsocketOnClosedWidgetClose}
                severity="warning"
                sx={{ width: '100%' }}
              >
                <AlertTitle style={{ fontSize: '16px' }}>Websocket disconnected</AlertTitle>
                <div style={{ fontSize: '12px' }}>
                  code:
                  {' '}
                  {websocketClosedCode}
                  {' '}
                  reason:
                  <strong>{websocketClosedReason}</strong>
                </div>
              </Alert>
            </Snackbar>
          ) : null
      }

      {
        websocketConnectedWidgetOpen
          ? (
            <Snackbar
              open={websocketConnectedWidgetOpen}
              autoHideDuration={6000}
              onClose={handleWebsocketConnectedWidgetClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                onClose={handleWebsocketConnectedWidgetClose}
                severity="success"
                sx={{ width: '100%' }}
              >
                <AlertTitle style={{ fontSize: '16px' }}>Websocket connected</AlertTitle>
                <div style={{ fontSize: '12px' }}>
                  connected to the websocket server:
                  {' '}
                  <strong>{webSocketUrl}</strong>
                </div>
              </Alert>
            </Snackbar>
          ) : null
      }

      <Dialog
        open={alertDialogOpeningState}
        keepMounted
        onClose={handleAlertDialogClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            {alertDialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAlertDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
