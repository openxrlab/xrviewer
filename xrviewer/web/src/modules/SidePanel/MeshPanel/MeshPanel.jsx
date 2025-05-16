import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button, Box, Grid, TextField, FormControl, FormControlLabel,
  Radio, RadioGroup, Checkbox,
} from '@mui/material';
import * as BABYLON from '@babylonjs/core';
import { Item } from '../../Common/UIComponents';
import { WebSocketContext } from '../../WebSocket/WebSocket';
import { ServerActionsEnum, sendMessage } from '../../../actions';
import { ViewerState } from '../../../reducer';

export type AnimationPanelProps = {
    mode: any
}

export default function MeshPanel(props: AnimationPanelProps) {
  const { mode } = props;

  const webSocket = React.useContext(WebSocketContext).socket;
  const dispatch = useDispatch();

  const animationFileInputRef = React.useRef(null);
  const handleAnimationFileUploadClick = () => {
    animationFileInputRef.current.click();
  };

  const handleAnimationFileInput = (event) => {
    const uploadedFile = event.target.files[0];

    const filename = uploadedFile.name;
    const blob = new Blob([uploadedFile]);
    BABYLON.FilesInput.FilesToLoad[filename] = blob;
    dispatch({
      type: 'write',
      path: 'local/reloadFlag',
      data: true,
    });

    dispatch({
      type: 'write',
      path: 'local/animationFile',
      data: filename,
    });
  };

  const staticMeshFileInputRef = React.useRef(null);
  const handleStaticMeshFileUploadClick = () => {
    staticMeshFileInputRef.current.click();
  };

  const handleStaticMeshFileInput = (event) => {
    const uploadedFile = event.target.files[0];

    const filename = uploadedFile.name;
    const blob = new Blob([uploadedFile]);
    BABYLON.FilesInput.FilesToLoad[filename] = blob;

    dispatch({
      type: 'write',
      path: 'local/staticMeshFile',
      data: filename,
    });
  };

  const handleObjFileExportClick = () => {
    dispatch({
      type: 'write',
      path: 'sceneState/exportSelectedMeshAsObj',
      data: true,
    });
  };

  const streamDataInput = React.useRef(null);
  const handleStreamDataUploadClick = () => {
    streamDataInput.current.click();
  };

  const handleStreamDataInput = (event) => {
    const uploadedStreamData = event.target.files[0];

    const promise = new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (res) => {
        const buffer = res.target.result;

        const uint8Array = new Uint8Array(buffer);
        resolve(uint8Array);
      };

      reader.readAsArrayBuffer(uploadedStreamData);
    });

    promise.then((fileContent) => {
      dispatch({
        type: 'write',
        path: 'streaming/frameIndex',
        data: 0,
      });

      dispatch({
        type: 'write',
        path: 'streaming/reloadFlag',
        data: true,
      });

      dispatch({
        type: 'write',
        path: 'streaming/meshVertices',
        data: null,
      });

      dispatch({
        type: 'write',
        path: 'streaming/meshFaces',
        data: null,
      });
      sendMessage(webSocket, ServerActionsEnum.UPDATE_FRAME_INDEX, 0);
      sendMessage(webSocket, ServerActionsEnum.UPDATE_STREAM_DATA, fileContent);
    });
  };

  const objectLocation = useSelector(
    (state: ViewerState) => state.sceneState.objectLocation,
  );

  const objectRotation = useSelector(
    (state: ViewerState) => state.sceneState.objectRotation,
  );

  const objectScale = useSelector(
    (state: ViewerState) => state.sceneState.objectScale,
  );

  const drawMeshWireframe = useSelector(
    (state: ViewerState) => state.sceneState.drawMeshWireframe,
  );

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
              <b>Mode</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <FormControl>
                <RadioGroup
                  row
                  name="row-radio-buttons-group"
                  value={mode}
                  onChange={(event) => {
                    dispatch({
                      type: 'write',
                      path: 'mode',
                      data: event.target.value,
                    });
                  }}
                >
                  <FormControlLabel value="local" control={<Radio />} label="Local" />
                  <FormControlLabel value="streaming" control={<Radio />} label="Stream" />
                </RadioGroup>
              </FormControl>
            </Item>
          </Grid>

          {
            (mode === 'streaming')
            && (
            <>
              <Grid item xs={1} />
              <Grid item xs={10}>
                <Item elevation={0}>
                  <Button
                    variant="outlined"
                    onClick={handleStreamDataUploadClick}
                    fullWidth
                  >
                    Load Stream Data
                    <input
                      type="file"
                      onChange={handleStreamDataInput}
                      hidden
                      multiple
                      ref={streamDataInput}
                    />
                  </Button>
                </Item>
              </Grid>
              <Grid item xs={1} />
            </>
            )
          }

          {
            (mode === 'local')
            && (
            <>
              <Grid item xs={1} />
              <Grid item xs={10}>
                <Item elevation={0}>
                  <Button
                    variant="outlined"
                    onClick={handleAnimationFileUploadClick}
                    fullWidth
                  >
                    Load Animated Mesh
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleAnimationFileInput}
                      hidden
                      multiple
                      ref={animationFileInputRef}
                    />
                  </Button>
                </Item>
              </Grid>
              <Grid item xs={1} />

              <Grid item xs={1} />
              <Grid item xs={10}>
                <Item elevation={0}>
                  <Button
                    variant="outlined"
                    onClick={handleStaticMeshFileUploadClick}
                    fullWidth
                  >
                    Load Static Mesh
                    <input
                      type="file"
                      accept=".obj,.gltf,.stl"
                      onChange={handleStaticMeshFileInput}
                      hidden
                      multiple
                      ref={staticMeshFileInputRef}
                    />
                  </Button>
                </Item>
              </Grid>
              <Grid item xs={1} />
            </>
            )
          }

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Wireframe</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <Checkbox
                color="secondary"
                value={drawMeshWireframe ? 'on' : 'off'}
                onChange={(event) => {
                  console.log(event.target.checked);
                  dispatch({
                    type: 'write',
                    path: 'sceneState/drawMeshWireframe',
                    data: event.target.checked,
                  });
                }}
              />
            </Item>
          </Grid>

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Location</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <Grid container spacing={1}>
                <Grid container item spacing={1}>
                  <>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectLocationX"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectLocation[0]}
                          onChange={(event) => {
                            const targetLocationX = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectLocation',
                              data: [targetLocationX, objectLocation[1], objectLocation[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectLocationY"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectLocation[1]}
                          onChange={(event) => {
                            const targetLocationY = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectLocation',
                              data: [objectLocation[0], targetLocationY, objectLocation[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectLocationZ"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectLocation[2]}
                          onChange={(event) => {
                            const targetLocationZ = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectLocation',
                              data: [objectLocation[0], objectLocation[1], targetLocationZ],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                  </>
                </Grid>
              </Grid>
            </Item>
          </Grid>

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Rotation</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <Grid container spacing={1}>
                <Grid container item spacing={1}>
                  <>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectRotationX"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectRotation[0]}
                          onChange={(event) => {
                            const targetRotationX = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectRotation',
                              data: [targetRotationX, objectRotation[1], objectRotation[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectRotationY"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectRotation[1]}
                          onChange={(event) => {
                            const targetRotationY = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectRotation',
                              data: [objectRotation[0], targetRotationY, objectRotation[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectRotationZ"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectRotation[2]}
                          onChange={(event) => {
                            const targetRotationZ = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectRotation',
                              data: [objectRotation[0], objectRotation[1], targetRotationZ],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                  </>
                </Grid>
              </Grid>
            </Item>
          </Grid>

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Scale</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <Grid container spacing={1}>
                <Grid container item spacing={1}>
                  <>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectScaleX"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectScale[0]}
                          onChange={(event) => {
                            const targetScaleX = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectScale',
                              data: [targetScaleX, objectScale[1], objectScale[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectScaleY"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectScale[1]}
                          onChange={(event) => {
                            const targetScaleY = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectScale',
                              data: [objectScale[0], targetScaleY, objectScale[2]],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <TextField
                          id="objectScaleZ"
                          type="number"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          size="small"
                          margin="none"
                          value={objectScale[2]}
                          onChange={(event) => {
                            const targetScaleZ = Number(event.target.value);
                            dispatch({
                              type: 'write',
                              path: 'sceneState/objectScale',
                              data: [objectScale[0], objectScale[1], targetScaleZ],
                            });
                          }}
                          variant="standard"
                        />
                      </Button>
                    </Grid>
                  </>
                </Grid>
              </Grid>
            </Item>
          </Grid>

          <Grid item xs={1} />
          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                variant="outlined"
                onClick={handleObjFileExportClick}
                fullWidth
              >
                Export Selected As OBJ
              </Button>
            </Item>
          </Grid>
          <Grid item xs={1} />
        </Grid>
      </Box>

    </div>
  );
}
