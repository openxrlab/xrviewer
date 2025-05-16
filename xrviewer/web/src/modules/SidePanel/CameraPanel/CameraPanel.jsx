import { useDispatch, useSelector } from 'react-redux';
import * as React from 'react';
import {
  Button, Box, Grid,
  ListItemButton, ListItemIcon, List, ListItemText, IconButton, ListItem, Collapse,
} from '@mui/material';
import {
  CameraAltTwoTone, VisibilityOutlined, VisibilityOffOutlined,
  ExpandLess, ExpandMore, SpeakerNotes, SpeakerNotesOff,
} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Item } from '../../Common/UIComponents';

export type CameraItemProps = {
    cameraParamsRef: React.MutableRefObject<any>,
    name: string,
    cameraMeshGroupVisible: Boolean,
    cameraLabelGroupVisible: Boolean,
    cameraGroupVisibility: any,
    dispatch: any
}

function CameraItem(props: CameraItemProps) {
  const {
    name, cameraMeshGroupVisible, cameraLabelGroupVisible,
    cameraGroupVisibility, cameraParamsRef, dispatch,
  } = props;
  const parsedCameraGroupVisibility = JSON.parse(cameraGroupVisibility);
  const [meshVisible, setMeshVisible] = React.useState(
    parsedCameraGroupVisibility[name].mesh_visible,
  );
  const [labelVisible, setLabelVisible] = React.useState(
    parsedCameraGroupVisibility[name].label_visible,
  );

  const toggleMeshVisible = () => {
    setMeshVisible(!meshVisible);
  };

  const toggleLabelVisible = () => {
    setLabelVisible(!labelVisible);
  };

  const toggleCameraDispose = () => {
    // eslint-disable-next-line arrow-body-style
    const newCameraParams = Object.values(cameraParamsRef.current).filter((cameraParam) => {
      return cameraParam.name !== name;
    });

    dispatch({
      type: 'write',
      path: 'cameraParams',
      data: newCameraParams,
    });

    dispatch({
      type: 'write',
      path: 'sceneState/cameraDisposeName',
      data: name,
    });

    dispatch({
      type: 'write',
      path: 'sceneState/cameraDisposeFlag',
      data: true,
    });
  };

  React.useEffect(() => {
    setMeshVisible(cameraMeshGroupVisible);
    setLabelVisible(cameraLabelGroupVisible);
  }, [cameraMeshGroupVisible, cameraLabelGroupVisible]);

  React.useEffect(() => {
    const newCameraGroupVisibility = parsedCameraGroupVisibility;
    newCameraGroupVisibility[name] = {
      mesh_visible: meshVisible,
      label_visible: labelVisible,
    };

    dispatch({
      type: 'write',
      path: 'sceneState/cameraGroupVisibility',
      data: JSON.stringify(newCameraGroupVisibility),
    });
  }, [meshVisible, labelVisible, dispatch, name, parsedCameraGroupVisibility]);

  return (
    <ListItem>
      <ListItemIcon>
        <CameraAltTwoTone color="primary" />
      </ListItemIcon>

      <ListItemText primary={name} />

      <IconButton aria-label="visibility" onClick={toggleMeshVisible}>
        {meshVisible ? <VisibilityOutlined color="primary" /> : <VisibilityOffOutlined color="primary" />}
      </IconButton>

      <IconButton aria-label="visibility" onClick={toggleLabelVisible}>
        {labelVisible ? <SpeakerNotes color="primary" /> : <SpeakerNotesOff color="primary" />}
      </IconButton>

      <IconButton aria-label="delete" onClick={toggleCameraDispose}>
        <DeleteIcon color="primary" />
      </IconButton>
    </ListItem>
  );
}

export default function CameraPanel() {
  const dispatch = useDispatch();

  const cameraFileInputRef = React.useRef(null);
  const handleCameraFileUploadClick = () => {
    cameraFileInputRef.current.click();
  };

  const handleCameraFileInput = (event) => {
    function readCameraFiles(file_list: Array) {
      const cameraParamPromises = [];
      Object.values(file_list).forEach((file) => {
        const cameraParamPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = (res) => {
            resolve(JSON.parse(res.target.result));
          };
        });
        cameraParamPromises.push(cameraParamPromise);
      });
      Promise.all(cameraParamPromises).then((cameraParamContents) => {
        if (cameraParamContents.length !== 0) {
          const cameraGroupVisibilityContents = {};
          cameraParamContents.forEach((cameraParamContent) => {
            cameraGroupVisibilityContents[cameraParamContent.name] = {
              mesh_visible: true,
              label_visible: false,
            };
          });

          dispatch({
            type: 'write',
            path: 'cameraParams',
            data: cameraParamContents,
          });

          dispatch({
            type: 'write',
            path: 'sceneState/cameraReloadFlag',
            data: true,
          });

          dispatch({
            type: 'write',
            path: 'sceneState/cameraGroupVisibility',
            data: JSON.stringify(cameraGroupVisibilityContents),
          });
        }
      });
    }
    const uploadedFiles = event.target.files;
    console.log(uploadedFiles);
    readCameraFiles(uploadedFiles);
  };

  const cameraParams = useSelector(
    (state) => state.cameraParams,
  );

  const cameraParamsRef = React.useRef(cameraParams);

  React.useEffect(() => {
    cameraParamsRef.current = cameraParams;
  }, [cameraParams]);

  const cameraGroupVisibility = useSelector(
    (state) => state.sceneState.cameraGroupVisibility,
  );

  const [cameraListOpened, setCameraListOpened] = React.useState(true);
  const [cameraMeshGroupVisible, setcameraMeshGroupVisible] = React.useState(true);
  const [cameraLabelGroupVisible, setcameraLabelGroupVisible] = React.useState(false);

  const toggleCameraListOpened = () => {
    setCameraListOpened(!cameraListOpened);
  };

  const togglecameraMeshGroupVisible = () => {
    setcameraMeshGroupVisible(!cameraMeshGroupVisible);

    const newCameraGroupVisibility = JSON.parse(cameraGroupVisibility);

    Object.keys(newCameraGroupVisibility).forEach((key) => {
      newCameraGroupVisibility[key].mesh_visible = !cameraMeshGroupVisible;
    });

    dispatch({
      type: 'write',
      path: 'sceneState/cameraGroupVisibility',
      data: JSON.stringify(newCameraGroupVisibility),
    });
  };

  const togglecameraLabelGroupVisible = () => {
    setcameraLabelGroupVisible(!cameraLabelGroupVisible);

    const newCameraGroupVisibility = JSON.parse(cameraGroupVisibility);
    Object.keys(newCameraGroupVisibility).forEach((key) => {
      newCameraGroupVisibility[key].label_visible = !cameraLabelGroupVisible;
    });

    dispatch({
      type: 'write',
      path: 'sceneState/cameraGroupVisibility',
      data: JSON.stringify(newCameraGroupVisibility),
    });
  };

  const cameraFileAppendRef = React.useRef(null);
  const handleCameraFileAppendClick = () => {
    cameraFileAppendRef.current.click();
  };

  const handleCameraFileAppend = (event) => {
    function readCameraFiles(file_list: Array) {
      const cameraParamPromises = [];
      Object.values(file_list).forEach((file) => {
        const cameraParamPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = (res) => {
            resolve(JSON.parse(res.target.result));
          };
        });
        cameraParamPromises.push(cameraParamPromise);
      });

      const existingCameraNames = [];
      cameraParams.forEach((cameraParam) => {
        existingCameraNames.push(cameraParam.name);
      });

      console.log(existingCameraNames);

      Promise.all(cameraParamPromises).then((cameraParamContents) => {
        console.log(cameraParamContents);
        if (cameraParamContents.length !== 0) {
          const cameraGroupVisibilityContents = {};

          const filteredCameraParams = [];
          cameraParamContents.forEach((cameraParamContent) => {
            if (!existingCameraNames.includes(cameraParamContent.name)) {
              // console.log('already exists'.concat(cameraParamContent.name));
              filteredCameraParams.push(cameraParamContent);
            }
          });
          console.log(filteredCameraParams);
          filteredCameraParams.forEach((cameraParamContent) => {
            cameraGroupVisibilityContents[cameraParamContent.name] = {
              mesh_visible: true,
              label_visible: false,
            };
          });

          const newCameraParams = cameraParams.concat(filteredCameraParams);
          const existingGroupVisibilityContents = JSON.parse(cameraGroupVisibility);
          const newCamerGroupVisibility = {
            ...existingGroupVisibilityContents,
            ...cameraGroupVisibilityContents,
          };

          dispatch({
            type: 'write',
            path: 'cameraParams',
            data: newCameraParams,
          });

          dispatch({
            type: 'write',
            path: 'sceneState/cameraReloadFlag',
            data: true,
          });

          dispatch({
            type: 'write',
            path: 'sceneState/cameraGroupVisibility',
            data: JSON.stringify(newCamerGroupVisibility),
          });
        }
      });
    }
    const uploadedFiles = event.target.files;
    console.log(uploadedFiles);
    readCameraFiles(uploadedFiles);
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={1}
          alignItems="center"
        >
          <Grid item xs={1} />

          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                className="CameraPanel-loadCameraButton"
                id="load-camera"
                variant="outlined"
                onClick={handleCameraFileUploadClick}
                fullWidth
              >
                Load Camera
                <input
                  type="file"
                  accept=".json"
                  name="Camera"
                  onChange={handleCameraFileInput}
                  hidden
                  multiple
                  ref={cameraFileInputRef}
                />
              </Button>
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={1} />

          <Grid item xs={10}>
            <Item elevation={0}>
              <Button
                className="CameraPanel-addCameraButton"
                id="add-camera"
                variant="outlined"
                onClick={handleCameraFileAppendClick}
                fullWidth
              >
                Append Camera
                <input
                  type="file"
                  accept=".json"
                  name="Camera"
                  onChange={handleCameraFileAppend}
                  hidden
                  multiple
                  ref={cameraFileAppendRef}
                />
              </Button>
            </Item>
          </Grid>

          <Grid item xs={1} />

          <Grid item xs={4}>
            <Item elevation={0}>
              <b>Location</b>
            </Item>
          </Grid>

          <Grid item xs={8}>
            <Item elevation={0}>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={1}>
                  <Grid container item spacing={1}>
                    <>
                      <Grid item xs={4}>
                        <Button variant="outlined" size="small">
                          <font id="cameraTransX">0.0</font>
                        </Button>
                      </Grid>
                      <Grid item xs={4}>
                        <Button variant="outlined" size="small">
                          <font id="cameraTransY">0.0</font>
                        </Button>
                      </Grid>
                      <Grid item xs={4}>
                        <Button variant="outlined" size="small">
                          <font id="cameraTransZ">0.0</font>
                        </Button>
                      </Grid>
                    </>
                  </Grid>
                </Grid>
              </Box>
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
                        <font id="cameraRotationX">0.0</font>
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <font id="cameraRotationY">0.0</font>
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button variant="outlined" size="small">
                        <font id="cameraRotationZ">0.0</font>
                      </Button>
                    </Grid>
                  </>
                </Grid>
              </Grid>
            </Item>
          </Grid>

          <Grid item xs={12}>
            <Item elevation={0}>
              <ListItem>
                <ListItemButton onClick={toggleCameraListOpened}>
                  <IconButton>
                    <CameraAltTwoTone color="primary" />
                  </IconButton>

                  <ListItemText primary="Cameras" />
                </ListItemButton>

                <IconButton
                  aria-label="visibility"
                  onClick={() => {
                    togglecameraMeshGroupVisible();
                  }}
                >
                  {cameraMeshGroupVisible ? <VisibilityOutlined color="primary" /> : <VisibilityOffOutlined color="primary" />}
                </IconButton>

                <IconButton
                  aria-label="visibility"
                  onClick={() => {
                    togglecameraLabelGroupVisible();
                    dispatch({
                      type: 'write',
                      path: 'sceneState/displayCameraLabel',
                      data: !cameraLabelGroupVisible,
                    });
                  }}
                >
                  {cameraLabelGroupVisible ? <SpeakerNotes color="primary" /> : <SpeakerNotesOff color="primary" />}
                </IconButton>

                <IconButton
                  aria-label="delete"
                  onClick={() => {
                    dispatch({
                      type: 'write',
                      path: 'cameraParams',
                      data: [],
                    });
                    dispatch({
                      type: 'write',
                      path: 'sceneState/cameraReloadFlag',
                      data: true,
                    });
                  }}
                >
                  <DeleteIcon color="primary" />
                </IconButton>

                {cameraListOpened ? <ExpandLess /> : <ExpandMore />}
              </ListItem>

              <Collapse in={cameraListOpened} timeout="auto">
                <List>
                  {cameraParams ? cameraParams.map((cameraParam) => (
                    <CameraItem
                      cameraParamsRef={cameraParamsRef}
                      name={cameraParam.name}
                      // Each child in a list should have a unique “key” prop
                      // https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
                      key={cameraParam.name}
                      cameraMeshGroupVisible={cameraMeshGroupVisible}
                      cameraLabelGroupVisible={cameraLabelGroupVisible}
                      cameraGroupVisibility={cameraGroupVisibility}
                      dispatch={dispatch}
                    />
                  )) : null}
                </List>
              </Collapse>
            </Item>
          </Grid>

          <Grid item xs={7}>
            <Item elevation={0} />
          </Grid>

          <Grid item xs={5}>
            <Item elevation={0} />
          </Grid>

          <Grid item xs={7}>
            <Item elevation={0} />
          </Grid>

        </Grid>
      </Box>
    </div>
  );
}
