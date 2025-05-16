export interface WebSocketState {
    webSocketConnected: Boolean,
    webSocketUrl: String,
    closeEvent: CloseEvent,
    webSocketConnectionConfirmed: Boolean
}

export interface SceneState {
    cameraReloadFlag: Boolean,
    displayCameraLabel: Boolean,
    cameraGroupVisibility: String,
    cameraDisposeName: string,
    cameraDisposeFlag: Boolean,
    objectLocation: Array<Number>,
    objectRotation: Array<Number>,
    objectScale: Array<Number>,
    gizmoSelection: Number,
    drawMeshWireframe: Boolean,
    exportSelectedMeshAsObj: Boolean,
}

export interface Local {
    animationFile: any,
    staticMeshFile: any,
    reloadFlag: Boolean,
    isPlaying: Boolean,
    frameIndex: Number,
    frameEnd: Number,
    instantFrame: Boolean,
}

export interface Streaming {
    pipelineName: any,
    meshFaces: any,
    meshVertices: any,
    isPlaying: Boolean,
    frameIndex: Number,
    numFrames: Number,
    stepSize: Number,
    reloadFlag: Boolean,
    updateAnimationSuccess: Boolean,
    bufferHeadFrameIndex: Number,
    shouldClearBuffer: Boolean,
    previewFrameSpawned: Boolean,
    instantFrame: Boolean,
    minimumPlayableFrame: Number,
    frameRate: Number,
    maxBufferSize: Number
}

export interface ViewerState{
    webSocketState: WebSocketState,
    mode: String,
    convention: String,
    cameraParams: Array,
    sceneState: SceneState,
    local: Local,
    streaming: Streaming
}

const initialState: ViewerState = {
  webSocketState: {
    webSocketConnected: false,
    webSocketUrl: 'ws://localhost:18805',
    closeEvent: null,
    webSocketConnectionConfirmed: false,
  },
  // local, streaming
  mode: 'local',

  convention: 'XRMoCap',

  cameraParams: [],
  alertMessage: '',
  sceneState: {
    cameraReloadFlag: false,
    cameraAppendFlag: false,
    displayCameraLabel: false,
    // contains the metadata of camera group visibility, e.g.
    // {
    //   'camera1': {
    //        'mesh_visible': true,
    //        'label_visible': true
    //   },
    //   ...
    // }
    cameraGroupVisibility: JSON.stringify({}),
    cameraDisposeName: null,
    cameraDisposeFlag: false,
    objectLocation: [0.0, 0.0, 0.0],
    objectRotation: [0.0, 0.0, 0.0],
    objectScale: [1.0, 1.0, 1.0],
    gizmoSelection: 0,
    drawMeshWireframe: false,
    exportSelectedMeshAsObj: false,
  },

  local: {
    animationFile: null,
    staticMeshFile: null,
    reloadFlag: false,
    isPlaying: false,
    frameIndex: 0,
    frameEnd: 0,
    instantFrame: false,
    bSnapshot: false,
  },

  streaming: {
    pipelineName: 'unknown',
    meshFaces: null,
    meshVertices: null,
    isPlaying: false,
    frameIndex: 0,
    numFrames: 0,
    stepSize: 1,
    reloadFlag: false,
    updateAnimationSuccess: false,
    bufferHeadFrameIndex: 0,
    shouldClearBuffer: false,
    previewFrameSpawned: false,
    instantFrame: false,
    minimumPlayableFrame: 0,
    frameRate: 60,
    maxBufferSize: 256,
  },
};

function setData(newState, state, path, data) {
  if (path.length === 1) {
    newState[path[0]] = data; // eslint-disable-line no-param-reassign
  } else {
    newState[path[0]] = { ...state[path[0]] }; // eslint-disable-line no-param-reassign
    setData(newState[path[0]], state[path[0]], path.slice(1), data);
  }
}

export function split_path(path_str) {
  return path_str.split('/').filter((x) => x.length > 0);
}

// eslint-disable-next-line default-param-last
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'write': {
      const path = split_path(action.path);
      const { data } = action;
      const newState = { ...state };
      setData(newState, state, path, data);

      return newState;
    }
    default: { // never
      return state;
    }
  }
};

export default rootReducer;
