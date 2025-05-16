/* eslint-disable no-param-reassign */
import React, {
  useRef, useEffect, useContext,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Scene, Engine, SceneEventArgs,
} from 'react-babylonjs';

import * as BABYLON_GUI from '@babylonjs/gui';
import * as BABYLON from '@babylonjs/core';
import {
  Color3, Color4, Vector3, Matrix, StandardMaterial, ArcRotateCamera,
  Quaternion, MeshBuilder, HemisphericLight, TransformNode, Viewport, Mesh,
  ActionManager, ExecuteCodeAction,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import '@babylonjs/loaders';
import { WebSocketContext } from '../WebSocket/WebSocket';
import { ViewerState } from '../../reducer';
import StreamedVertexBuffer from '../../StreamedVertexBuffer';
import { CustomedCameraMeshes } from './CustomedCameraMeshes';
import { CustomedStaticMeshes } from './CustomedStaticMeshes';
import { CustomedSkeletalMeshes } from './CustomedSkeletalMeshes';
import { ProceduralMesh } from './ProceduralMesh';
import { ExportOBJ } from './Utils';

const MouseKeyCodeEnum = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

const TransBtnBgColorEnum = {
  ACTIVATE: '#88adf7',
  INACTIVATE: '#dcdedc',
};

function SpawnGround(scene: BABYLON.Scene) {
  const ground = MeshBuilder.CreateGround(
    'ground',
    { width: 100, height: 100 },
    scene,
  );
  ground.position = new Vector3(0, 0, 0);
  const groundMat = new GridMaterial(
    'groundMaterial',
    scene,
  );
  groundMat.majorUnitFrequency = 5;
  groundMat.minorUnitVisibility = 0.5;

  groundMat.gridRatio = 2;
  groundMat.opacity = 0.999;
  groundMat.useMaxLine = true;
  groundMat.lineColor = new Color3(1, 1, 1);
  groundMat.mainColor = new Color3(1, 1, 1);
  groundMat.backFaceCulling = false;

  ground.material = groundMat;
  ground.isPickable = false;

  return ground;
}

function SpawnLight(scene: BABYLON.Scene) {
  const hemiLight = new HemisphericLight(
    'hemiLight',
    new Vector3(0, -1, 0),
    scene,
  );
  hemiLight.intensity = 0.95;

  return hemiLight;
}

function SpawnEnvTex(scene: BABYLON.Scene) {
  const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData(
    '../../environment/pizzo_pernice_puresky.env',
    scene,
  );
  const reflectionMatrix = Matrix.Identity();
  Quaternion.FromEulerVector(new Vector3(-Math.PI, 0, 0)).toRotationMatrix(reflectionMatrix);
  envTex.setReflectionTextureMatrix(reflectionMatrix);
  scene.environmentTexture = envTex;
  scene.createDefaultSkybox(envTex, true);
  scene.environmentIntensity = 0.9;

  return envTex;
}

function SpawnCamera(
  engine: BABYLON.Engine,
  scene: BABYLON.Scene,
  alpha_degree: Number = 75,
  beta_degree: Number = 240,
) {
  // *********************** spawn roaming camera ***********************
  // the HUD camera must share the same configurations with the roaming camera
  const panningSensibility = 2000;
  const alpha = BABYLON.Tools.ToRadians(alpha_degree);
  const beta = BABYLON.Tools.ToRadians(beta_degree);

  const camera = new ArcRotateCamera(
    'camera',
    alpha,
    beta,
    10,
    Vector3.Zero(),
    scene,
  );

  camera.attachControl(true);
  // remove mouse event 0, 1
  // 0: left key code
  // 1: middle key code
  camera.inputs.attached.pointers.buttons.shift();
  camera.inputs.attached.pointers.buttons.shift();

  // disable keyboard control
  camera.inputs.remove(camera.inputs.attached.keyboard);

  camera.fov = BABYLON.Tools.ToRadians(60);
  camera.panningSensibility = panningSensibility;
  camera.maxZ = 999;
  camera.minZ = 0;
  camera.wheelPrecision = 50;
  // prevent camera from infinite zoom in
  // see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors
  camera.lowerRadiusLimit = 0.1;
  camera.useBouncingBehavior = true;
  camera.upperBetaLimit = 180;
  camera.lowerBetaLimit = -180;
  // enable keyboard control of camera
  // see https://www.toptal.com/developers/keycode for keycode.
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);

  const translation = Vector3.Zero();
  const rotation = Quaternion.Zero();

  function get_camera_translation_and_rotation(_camera: BABYLON.Camera) {
    const cameraWorldMatrix = _camera.getWorldMatrix();
    const cameraViewMatrix = _camera.getViewMatrix();
    cameraWorldMatrix.decompose(null, null, translation);
    cameraViewMatrix.decompose(null, rotation, null);
    const rotMat = Matrix.Zero();
    rotation.toRotationMatrix(rotMat);

    return [translation, rotMat];
  }

  const cameraTransXDiv = document.getElementById('cameraTransX');
  const cameraTransYDiv = document.getElementById('cameraTransY');
  const cameraTransZDiv = document.getElementById('cameraTransZ');
  const cameraRotationXDiv = document.getElementById('cameraRotationX');
  const cameraRotationYDiv = document.getElementById('cameraRotationY');
  const cameraRotationZDiv = document.getElementById('cameraRotationZ');

  camera.onViewMatrixChangedObservable.add(() => {
    let [camera_translation, camera_roation] = get_camera_translation_and_rotation(camera);
    const cameraEulerRotationRadians = Quaternion.FromRotationMatrix(
      camera_roation,
    ).toEulerAngles();
    const cameraEulerRotationDegrees = new BABYLON.Vector3(
      BABYLON.Tools.ToDegrees(cameraEulerRotationRadians.x),
      BABYLON.Tools.ToDegrees(cameraEulerRotationRadians.y),
      BABYLON.Tools.ToDegrees(cameraEulerRotationRadians.z),
    );

    cameraTransXDiv.innerText = camera_translation.x.toFixed(2);
    cameraTransYDiv.innerText = camera_translation.y.toFixed(2);
    cameraTransZDiv.innerText = camera_translation.z.toFixed(2);
    cameraRotationXDiv.innerText = cameraEulerRotationDegrees.x.toFixed(2);
    cameraRotationYDiv.innerText = cameraEulerRotationDegrees.y.toFixed(2);
    cameraRotationZDiv.innerText = cameraEulerRotationDegrees.z.toFixed(2);

    camera_translation = camera_translation.asArray();
    camera_roation = Array.from(Matrix.GetAsMatrix3x3(camera_roation));
  });

  // *********************** spawn roaming camera ***********************

  // *********************** spawn HUD camera ***********************
  const cameraHUD = new ArcRotateCamera(
    'cameraHUD',
    alpha,
    beta,
    3,
    Vector3.Zero(),
    scene,
  );
  cameraHUD.attachControl(true);
  cameraHUD.inputs.attached.pointers.buttons.shift();
  cameraHUD.inputs.attached.pointers.buttons.shift();
  cameraHUD.lowerRadiusLimit = 0.1;
  cameraHUD.layerMask = 0x20000000;
  cameraHUD.viewport = new Viewport(0.90, 0.85, 0.12, 0.17);
  cameraHUD.panningSensibility = panningSensibility;

  cameraHUD.upperBetaLimit = 180;
  cameraHUD.lowerBetaLimit = -180;

  scene.activeCameras = [camera, cameraHUD]; // HUD camera must be the last // must be last?
  // *********************** spawn HUD camera ***********************

  // register camera pointer event
  scene.onPointerObservable.add((eventData) => {
    const rect = engine.getRenderingCanvasClientRect();
    const x = eventData.event.clientX - rect.left;
    const y = eventData.event.clientY - rect.top;

    if (x >= (rect.width * 0.90) && y <= (rect.height * 0.15)) {
      scene.cameraToUseForPointers = cameraHUD;
    } else {
      scene.cameraToUseForPointers = camera;
    }
  }, BABYLON.PointerEventTypes.POINTERMOVE);

  // *********************** spawn axes ***********************
  const instance = new TransformNode('axes', scene);
  const size = 1;
  const origin = Vector3.Zero();
  const dot = MeshBuilder.CreateSphere('hover', { diameter: size / 2, segments: 4 }, scene);
  const mat = new StandardMaterial('mat', scene);
  mat.disableLighting = true;
  mat.emissiveColor = Color3.White();
  dot.material = mat;
  dot.renderingGroupId = 1;
  dot.layerMask = 0x20000000;
  dot.setEnabled(false);
  dot.parent = instance;

  function setCameraAngle(id) {
    switch (id) {
      case 'x':
        camera.alpha = cameraHUD.alpha = 0;
        camera.beta = cameraHUD.beta = -Math.PI / 2;
        return;
      case '-x':
        camera.alpha = cameraHUD.alpha = -Math.PI;
        camera.beta = cameraHUD.beta = -Math.PI / 2;
        return;
      case 'y':
        camera.alpha = cameraHUD.alpha = -Math.PI / 2;
        camera.beta = cameraHUD.beta = 0;
        return;
      case '-y':
        camera.alpha = cameraHUD.alpha = -Math.PI / 2;
        camera.beta = cameraHUD.beta = Math.PI;
        return;
      case 'z':
        camera.alpha = cameraHUD.alpha = Math.PI / 2;
        camera.beta = cameraHUD.beta = -Math.PI / 2;
        return;
      case '-z':
        camera.alpha = cameraHUD.alpha = -Math.PI / 2;
        camera.beta = cameraHUD.beta = -Math.PI / 2;
        break;
      default: break;
    }
  }

  function createAxis(name: string, color: Color3, sign: Number = 1) {
    const axisMat = new StandardMaterial(name, scene);
    axisMat.checkReadyOnlyOnce = true;
    axisMat.disableLighting = true;
    axisMat.emissiveColor = color;

    if (sign < 0) { // negative axis
      axisMat.alpha = 0.3;
      axisMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
    }
    let mesh = MeshBuilder.CreateSphere(name, { diameter: size, segments: 8 }, scene);

    if (sign > 0) {
      const pos = origin.clone();
      pos[name] = -sign * size * 2;
      const tube = MeshBuilder.CreateTube(
        'tube',
        {
          path: [pos, origin], radius: sign / 10, cap: 1, tessellation: 6,
        },
        scene,
      );
      tube.material = axisMat;
      mesh = Mesh.MergeMeshes([mesh, tube], true);
    }
    mesh.position[name] = sign * size * 2;
    mesh.layerMask = 0x20000000;
    mesh.material = axisMat;
    mesh.parent = instance;
    mesh.id = `${sign < 0 ? '-' : ''}${name}`;

    // interaction
    const actionManager = mesh.actionManager = new ActionManager(scene);
    actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        ({ meshUnderPointer }) => {
          dot.position = meshUnderPointer.position;
          dot.setEnabled(true);
        },
      ),
    );
    actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => {
          dot.setEnabled(false);
        },
      ),
    );
    actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnLeftPickTrigger,
        ({ meshUnderPointer }) => {
          setCameraAngle(meshUnderPointer.id);
        },
      ),
    );

    actionManager.hoverCursor = 'pointer';

    return mesh;
  }

  const red = new Color3(1.00, 0.10, 0.30);
  const green = new Color3(0.30, 0.65, 0.10);
  const blue = new Color3(0.10, 0.50, 0.90);

  createAxis('x', red, 1, true);
  createAxis('x', red, -1);
  createAxis('y', green, 1, true);
  createAxis('y', green, -1);
  createAxis('z', blue, 1, true);
  createAxis('z', blue, -1);

  // Update Axes position to be in the center of the screen without perspective distortion
  scene.onBeforeCameraRenderObservable.add(() => {
    instance.position = cameraHUD.getFrontPosition(size * 10);
  });
  // *********************** spawn axes ***********************

  return [camera, cameraHUD];
}

function HandleWindowResize(canvas: HTMLCanvasElement) {
  const canvasSizeXDiv = document.getElementById('canvasSizeX');
  const canvasSizeYDiv = document.getElementById('canvasSizeY');

  canvasSizeXDiv.innerText = canvas.width.toFixed(0);
  canvasSizeYDiv.innerText = canvas.height.toFixed(0);

  function canvasResizeCallback() {
    canvasSizeXDiv.innerText = canvas.width.toFixed(0);
    canvasSizeYDiv.innerText = canvas.height.toFixed(0);
  }

  function setResizeHandler(callback, timeout) {
    let timer_id;
    window.addEventListener('resize', () => {
      if (timer_id !== undefined) {
        clearTimeout(timer_id);
        timer_id = undefined;
      }
      timer_id = setTimeout(() => {
        timer_id = undefined;
        callback();
      }, timeout);
    });
  }

  setResizeHandler(canvasResizeCallback, 0);
}

function SpawnProceduralMesh(scene: BABYLON.Scene) {
  const pMesh = new Mesh('pMesh', scene);
  /*
     Sometimes the mesh disappears when the camera is rotated or zoomed.
     We shortcut the frustum clipping phase to solve the issue.
  */
  pMesh.alwaysSelectAsActiveMesh = true;
  pMesh.isPickable = true;
  const mat = new BABYLON.StandardMaterial('mat', scene);
  mat.backFaceCulling = false;
  pMesh.material = mat;
  BABYLON.Tags.AddTagsTo(pMesh, 'spawnedMesh');
  return pMesh;
}

function ViewerWindow() {
  const webSocket = useContext(WebSocketContext).socket;
  const webSocketRef = useRef(webSocket);
  const sceneRef = useRef(null);
  const assetManagerRef = useRef(null);
  const pMeshRef = useRef(null);
  const advancedTextureRef = useRef(null);
  const highlightLayerRef = useRef(null);

  const vertexBuffer = new StreamedVertexBuffer();
  const vertexBufferRef = useRef(vertexBuffer);

  const state: ViewerState = useSelector(
    (state) => state, // eslint-disable-line no-shadow
  );

  const streamingIsPlaying = state.streaming.isPlaying;
  const streamingIsPlayingRef = useRef(streamingIsPlaying);

  const streamingPreviewFrameSpawned = state.streaming.previewFrameSpawned;
  const streamingPreviewFrameSpawnedRef = useRef(streamingPreviewFrameSpawned);

  const streamingBufferHeadFrameIndex = state.streaming.bufferHeadFrameIndex;
  const streamingBufferHeadFrameIndexRef = useRef(streamingBufferHeadFrameIndex);

  const streamingNumFrames = state.streaming.numFrames;
  const streamingNumFramesRef = useRef(streamingNumFrames);

  const streamingShouldClearBuffer = state.streaming.shouldClearBuffer;
  const streamingShouldClearBufferRef = useRef(streamingShouldClearBuffer);

  const streamingMinimumPlayableFrame = state.streaming.minimumPlayableFrame;
  const streamingMinimumPlayableFrameRef = useRef(streamingMinimumPlayableFrame);

  useEffect(() => {
    webSocketRef.current = webSocket;
  }, [webSocket]);

  useEffect(() => {
    streamingBufferHeadFrameIndexRef.current = streamingBufferHeadFrameIndex;
    streamingShouldClearBufferRef.current = streamingShouldClearBuffer;
    streamingPreviewFrameSpawnedRef.current = streamingPreviewFrameSpawned;
  }, [streamingBufferHeadFrameIndex, streamingShouldClearBuffer, streamingPreviewFrameSpawned]);

  useEffect(() => {
    streamingNumFramesRef.current = streamingNumFrames;
  }, [streamingNumFrames]);

  useEffect(() => {
    streamingMinimumPlayableFrameRef.current = streamingMinimumPlayableFrame;
  }, [streamingMinimumPlayableFrame]);

  useEffect(() => {
    streamingIsPlayingRef.current = streamingIsPlaying;
  }, [streamingIsPlaying]);

  const dispatch = useDispatch();

  const pickedObjectRef = useRef(null);

  useEffect(() => {
    if (pickedObjectRef.current === null) return;

    const newLocation = state.sceneState.objectLocation;
    pickedObjectRef.current.position = new Vector3(
      newLocation[0],
      newLocation[1],
      newLocation[2],
    );
  }, [state.sceneState.objectLocation]);

  useEffect(() => {
    if (pickedObjectRef.current === null) return;

    const newRotation = state.sceneState.objectRotation;
    pickedObjectRef.current.rotation = new Vector3(
      BABYLON.Tools.ToRadians(newRotation[0]),
      BABYLON.Tools.ToRadians(newRotation[1]),
      BABYLON.Tools.ToRadians(newRotation[2]),
    );
  }, [state.sceneState.objectRotation]);

  useEffect(() => {
    if (pickedObjectRef.current === null) return;

    const newScale = state.sceneState.objectScale;
    pickedObjectRef.current.scaling = new Vector3(
      newScale[0],
      newScale[1],
      newScale[2],
    );
  }, [state.sceneState.objectScale]);

  useEffect(() => {
    if (state.sceneState.exportSelectedMeshAsObj === true) {
      if (pickedObjectRef.current === null) {
        dispatch({
          type: 'write',
          path: 'alertMessage',
          data: 'No mesh selected.',
        });
      } else {
        ExportOBJ(pickedObjectRef.current);
      }
      dispatch({
        type: 'write',
        path: 'sceneState/exportSelectedMeshAsObj',
        data: false,
      });
    }
  }, [state.sceneState.exportSelectedMeshAsObj]);

  const positionButtonRef = useRef(null);
  const rotationButtonRef = useRef(null);
  const scaleButtonRef = useRef(null);
  const gizmoManagerRef = useRef(null);

  useEffect(() => {
    if (positionButtonRef.current === null || gizmoManagerRef.current === null) return;
    switch (state.sceneState.gizmoSelection) {
      case 0: {
        positionButtonRef.current.background = TransBtnBgColorEnum.ACTIVATE;
        rotationButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;
        scaleButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;

        // eslint-disable-next-line max-len
        gizmoManagerRef.current.positionGizmoEnabled = !gizmoManagerRef.current.positionGizmoEnabled;
        gizmoManagerRef.current.rotationGizmoEnabled = false;
        gizmoManagerRef.current.scaleGizmoEnabled = false;
        break;
      }
      case 1: {
        positionButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;
        rotationButtonRef.current.background = TransBtnBgColorEnum.ACTIVATE;
        scaleButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;

        gizmoManagerRef.current.positionGizmoEnabled = false;
        // eslint-disable-next-line max-len
        gizmoManagerRef.current.rotationGizmoEnabled = !gizmoManagerRef.current.rotationGizmoEnabled;
        gizmoManagerRef.current.scaleGizmoEnabled = false;
        break;
      }
      case 2: {
        positionButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;
        rotationButtonRef.current.background = TransBtnBgColorEnum.INACTIVATE;
        scaleButtonRef.current.background = TransBtnBgColorEnum.ACTIVATE;

        gizmoManagerRef.current.positionGizmoEnabled = false;
        gizmoManagerRef.current.rotationGizmoEnabled = false;
        gizmoManagerRef.current.scaleGizmoEnabled = !gizmoManagerRef.current.scaleGizmoEnabled;
        break;
      }
      default: break;
    }
  }, [state.sceneState.gizmoSelection]);

  useEffect(() => {
    if (sceneRef.current === null) return;
    console.log(state.sceneState.drawMeshWireframe);
    sceneRef.current.meshes.forEach((mesh: BABYLON.Mesh) => {
      if (BABYLON.Tags.MatchesQuery(mesh, 'spawnedMesh')) {
        console.log(mesh);
        mesh.material.wireframe = state.sceneState.drawMeshWireframe;
      }
    });
  }, [state.sceneState.drawMeshWireframe]);

  const onSceneMount = (e: SceneEventArgs) => {
    const { canvas, scene } = e;
    const engine = scene.getEngine();

    scene.useRightHandedSystem = true;
    sceneRef.current = scene;

    const ground = SpawnGround(scene);
    /* eslint-disable no-unused-vars */
    const light = SpawnLight(scene);
    const envTex = SpawnEnvTex(scene);
    /* eslint-enable no-unused-vars */
    const [roamingCamera, HUDCamera] = SpawnCamera(engine, scene);
    HandleWindowResize(canvas);

    let posX = null;
    let posY = null;
    const turnFactor = 800;
    let mouseKeyCode = null;

    scene.onPointerObservable.add((eventData: BABYLON.PointerInfo) => {
      posX = scene.pointerX;
      posY = scene.pointerY;

      mouseKeyCode = eventData.event.button;
    }, BABYLON.PointerEventTypes.POINTERDOWN);

    scene.onPointerObservable.add(() => {
      posX = null;
      posY = null;
    }, BABYLON.PointerEventTypes.POINTERUP);

    scene.onPointerObservable.add(() => {
      if (posX != null) {
        const diffX = scene.pointerX - posX;
        const diffY = scene.pointerY - posY;
        posX = scene.pointerX;
        posY = scene.pointerY;

        switch (mouseKeyCode) {
          case MouseKeyCodeEnum.LEFT:
          case MouseKeyCodeEnum.MIDDLE:
            roamingCamera.alpha -= diffX / turnFactor;
            roamingCamera.beta -= diffY / turnFactor;
            HUDCamera.alpha -= diffX / turnFactor;
            HUDCamera.beta -= diffY / turnFactor;
            break;
          case MouseKeyCodeEnum.RIGHT:
            break;
          default:
            break;
        }
      }
    }, BABYLON.PointerEventTypes.POINTERMOVE);

    const pMesh = SpawnProceduralMesh(scene);
    pMeshRef.current = pMesh;

    const assetsManager = new BABYLON.AssetsManager(scene);
    assetManagerRef.current = assetsManager;

    const advancedTexture = BABYLON_GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    advancedTextureRef.current = advancedTexture;

    // gizmo
    const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
    utilLayer.setRenderCamera(roamingCamera);
    const gizmoManager = new BABYLON.GizmoManager(scene, 2, utilLayer);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.scaleGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;
    gizmoManager.gizmos.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    gizmoManager.gizmos.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    gizmoManagerRef.current = gizmoManager;

    const handlePositionDragging = () => {
      const newLocation = pickedObjectRef.current.position;
      // console.log(newLocation);
      dispatch({
        type: 'write',
        path: 'sceneState/objectLocation',
        data: [newLocation.x, newLocation.y, newLocation.z],
      });
    };

    const handleRotationDragging = () => {
      const newRotation = pickedObjectRef.current.rotation;
      const newRotationDegrees = new BABYLON.Vector3(
        BABYLON.Tools.ToDegrees(newRotation.x),
        BABYLON.Tools.ToDegrees(newRotation.y),
        BABYLON.Tools.ToDegrees(newRotation.z),
      );
      dispatch({
        type: 'write',
        path: 'sceneState/objectRotation',
        data: [newRotationDegrees.x, newRotationDegrees.y, newRotationDegrees.z],
      });
    };

    const handleScaleDragging = () => {
      const newScale = pickedObjectRef.current.scaling;
      dispatch({
        type: 'write',
        path: 'sceneState/objectScale',
        data: [newScale.x, newScale.y, newScale.z],
      });
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const axis of ['x', 'y', 'z']) {
      const positionGizmo: BABYLON.PositionGizmo = gizmoManager.gizmos.positionGizmo[axis.concat('Gizmo')];
      positionGizmo.dragBehavior.onDragObservable.add(handlePositionDragging);

      const rotationGizmo: BABYLON.RotationGizmo = gizmoManager.gizmos.rotationGizmo[axis.concat('Gizmo')];
      rotationGizmo.dragBehavior.onDragObservable.add(handleRotationDragging);

      const scaleGizmo: BABYLON.ScaleGizmo = gizmoManager.gizmos.scaleGizmo[axis.concat('Gizmo')];
      scaleGizmo.dragBehavior.onDragObservable.add(handleScaleDragging);
    }

    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;

    document.onkeydown = (keyboardEvent) => {
      switch (keyboardEvent.key) {
        case 'w':
          dispatch({
            type: 'write',
            path: 'sceneState/gizmoSelection',
            data: 0,
          });
          break;
        case 'e':
          dispatch({
            type: 'write',
            path: 'sceneState/gizmoSelection',
            data: 1,
          });
          break;
        case 'r':
          dispatch({
            type: 'write',
            path: 'sceneState/gizmoSelection',
            data: 2,
          });
          break;
        default: break;
      }
    };

    const transformPanel = new BABYLON_GUI.StackPanel();
    transformPanel.name = 'transformPanel';
    transformPanel.width = '70px';
    transformPanel.height = '170px';
    transformPanel.horizontalAlignment = BABYLON_GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    transformPanel.verticalAlignment = BABYLON_GUI.Control.VERTICAL_ALIGNMENT_TOP;
    transformPanel.paddingLeft = '10px';
    transformPanel.paddingTop = '10px';
    advancedTexture.addControl(transformPanel);

    const positionButton = BABYLON_GUI.Button.CreateImageButton('positionButton', '', 'textures/move.png');
    positionButton.width = '50px';
    positionButton.height = '50px';
    positionButton.background = TransBtnBgColorEnum.ACTIVATE;
    positionButton.alpha = 0.6;
    positionButton.image.width = '50px';
    positionButton.image.height = '50px';
    positionButton.onPointerClickObservable.add(() => {
      dispatch({
        type: 'write',
        path: 'sceneState/gizmoSelection',
        data: 0,
      });
    });
    positionButtonRef.current = positionButton;
    transformPanel.addControl(positionButton);

    const rotationButton = BABYLON_GUI.Button.CreateImageButton('rotationButton', '', 'textures/rotate.png');
    rotationButton.width = '50px';
    rotationButton.height = '50px';
    rotationButton.background = TransBtnBgColorEnum.INACTIVATE;
    rotationButton.alpha = 0.6;
    rotationButton.image.width = '50px';
    rotationButton.image.height = '50px';
    rotationButton.onPointerClickObservable.add(() => {
      dispatch({
        type: 'write',
        path: 'sceneState/gizmoSelection',
        data: 1,
      });
    });
    rotationButtonRef.current = rotationButton;
    transformPanel.addControl(rotationButton);

    const scaleButton = BABYLON_GUI.Button.CreateImageButton('scaleButton', '', 'textures/scale.png');
    scaleButton.width = '50px';
    scaleButton.height = '50px';
    scaleButton.background = TransBtnBgColorEnum.INACTIVATE;
    scaleButton.alpha = 0.6;
    scaleButton.image.width = '50px';
    scaleButton.image.height = '50px';
    scaleButton.onPointerClickObservable.add(() => {
      dispatch({
        type: 'write',
        path: 'sceneState/gizmoSelection',
        data: 2,
      });
    });
    scaleButtonRef.current = scaleButton;
    transformPanel.addControl(scaleButton);

    const highlightLayer = new BABYLON.HighlightLayer('highlightLayer', scene);
    highlightLayerRef.current = highlightLayer;
    highlightLayer.addExcludedMesh(ground);

    let isMouseDown = false;
    let mouseMoved = false;
    let mouseInitPos = null;
    // Even a slight movement when clicking can trigger the POINTERMOVE event.
    // To work around this, a threshold for movement is introduced, so only
    // movements beyond a certain threshold are considered actual drags,
    // rather than accidental slight movements.
    const moveThreshold = 5;
    scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          isMouseDown = true;
          mouseMoved = false;
          mouseInitPos = {
            x: pointerInfo.event.clientX,
            y: pointerInfo.event.clientY,
          };
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          if (isMouseDown && !mouseMoved) {
            const dx = pointerInfo.event.clientX - mouseInitPos.x;
            const dy = pointerInfo.event.clientY - mouseInitPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
              mouseMoved = true;
            }
          }
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          if (!mouseMoved) {
            // click event
            highlightLayer.removeAllMeshes();
            // eslint-disable-next-line prefer-destructuring
            const pickedMesh = pointerInfo.pickInfo.pickedMesh;
            pickedObjectRef.current = pickedMesh;
            if (pickedMesh !== null) {
              highlightLayer.addMesh(pointerInfo.pickInfo.pickedMesh, BABYLON.Color3.FromHexString('#ed9237'));
              const newLocation = pickedMesh.position;
              dispatch({
                type: 'write',
                path: 'sceneState/objectLocation',
                data: [newLocation.x, newLocation.y, newLocation.z],
              });
              const newRotation = pickedMesh.rotation;
              const newRotationDegrees = new BABYLON.Vector3(
                BABYLON.Tools.ToDegrees(newRotation.x),
                BABYLON.Tools.ToDegrees(newRotation.y),
                BABYLON.Tools.ToDegrees(newRotation.z),
              );
              dispatch({
                type: 'write',
                path: 'sceneState/objectRotation',
                data: [newRotationDegrees.x, newRotationDegrees.y, newRotationDegrees.z],
              });
              const newScale = pickedMesh.scaling;
              dispatch({
                type: 'write',
                path: 'sceneState/objectScale',
                data: [newScale.x, newScale.y, newScale.z],
              });
            } else {
              dispatch({
                type: 'write',
                path: 'sceneState/objectLocation',
                data: ['', '', ''],
              });
              dispatch({
                type: 'write',
                path: 'sceneState/objectRotation',
                data: ['', '', ''],
              });
              dispatch({
                type: 'write',
                path: 'sceneState/objectScale',
                data: ['', '', ''],
              });
            }
            gizmoManager.attachToMesh(pointerInfo.pickInfo.pickedMesh);
          }
          isMouseDown = false;
          mouseInitPos = null;
          break;
        default: break;
      }
    });

    // *********************** render loop ***********************
    const fpsDiv = document.getElementById('fpsDiv');
    engine.runRenderLoop(() => {
      if (scene) {
        fpsDiv.innerText = `${engine.getFps().toFixed()}fps`;
      }
    });
    // *********************** render loop ***********************
  };

  const frameCachedDiv = document.getElementById('frameCached');
  const frameCachedDivText = 0;
  const frameCachedDivTextRef = useRef(frameCachedDivText);

  const streamingReplayFlag = false;
  const streamingReplayFlagRef = useRef(streamingReplayFlag);

  useEffect(() => {
    if (frameCachedDiv === null) return;
    frameCachedDiv.innerText = frameCachedDivTextRef.current;
  }, [frameCachedDivTextRef.current]);  // eslint-disable-line

  const streamingFreezeBufferHead = false;
  const streamingFreezeBufferHeadRef = useRef(streamingFreezeBufferHead);

  const prevFrameTime = 0;
  const prevFrameTimeRef = useRef(prevFrameTime);

  const currentFrameTime = 0;
  const currentFrameTimeRef = useRef(currentFrameTime);

  const streamingFrameRate = state.streaming.frameRate;
  const streamingFrameRateRef = useRef(streamingFrameRate);

  const desiredFrameInterval = 1000.0 / Number(state.streaming.frameRate);
  const desiredFrameIntervalRef = useRef(desiredFrameInterval);

  useEffect(() => {
    desiredFrameIntervalRef.current = Math.trunc((1000.0 / Number(state.streaming.frameRate)));
    streamingFrameRateRef.current = streamingFrameRate;
  }, [streamingFrameRate]); // eslint-disable-line

  return (
    <div className="canvas-container">
      <Engine antialias adaptToDeviceRatio canvasId="babylon-canvas" engineOptions={{ preserveDrawingBuffer: true }}>
        <Scene
          clearColor={new Color4(0, 0, 0, 0.4)}
          onSceneMount={onSceneMount}
        >
          <CustomedCameraMeshes
            cameraParams={state.cameraParams}
            cameraReloadFlag={state.sceneState.cameraReloadFlag}
            advancedTexture={advancedTextureRef.current}
            displayCameraLabel={state.sceneState.displayCameraLabel}
            cameraGroupVisibility={state.sceneState.cameraGroupVisibility}
            cameraDisposeName={state.sceneState.cameraDisposeName}
            cameraDisposeFlag={state.sceneState.cameraDisposeFlag}
            dispatch={dispatch}
            highlightLayer={highlightLayerRef.current}
          />
          <CustomedSkeletalMeshes
            reloadFlag={state.local.reloadFlag}
            assetsManager={assetManagerRef.current}
            animationFile={state.local.animationFile}
            isPlaying={state.local.isPlaying}
            frameIndex={state.local.frameIndex}
            instantFrame={state.local.instantFrame}
            dispatch={dispatch}
          />
          <CustomedStaticMeshes
            assetsManager={assetManagerRef.current}
            staticMeshFile={state.local.staticMeshFile}
          />
          <ProceduralMesh
            pMeshRef={pMeshRef}
            faces={state.streaming.meshFaces}
            verts={state.streaming.meshVertices}
            isBufferOpen={state.streaming.isBufferOpen}
            webSocketRef={webSocketRef}
            dispatch={dispatch}
            frameIndex={state.streaming.frameIndex}
            vertexBuffer={vertexBufferRef.current}
            isPlayingRef={streamingIsPlayingRef}
            updateAnimationSuccess={state.streaming.updateAnimationSuccess}
            previewFrameSpawnedRef={streamingPreviewFrameSpawnedRef}
            bufferHeadFrameIndexRef={streamingBufferHeadFrameIndexRef}
            numFramesRef={streamingNumFramesRef}
            shouldClearBufferRef={streamingShouldClearBufferRef}
            frameCachedDivTextRef={frameCachedDivTextRef}
            minimumPlayableFrameRef={streamingMinimumPlayableFrameRef}
            freezeBufferHeadRef={streamingFreezeBufferHeadRef}
            replayFlagRef={streamingReplayFlagRef}
            prevFrameTimeRef={prevFrameTimeRef}
            currentFrameTimeRef={currentFrameTimeRef}
            desiredFrameIntervalRef={desiredFrameIntervalRef}
            frameRateRef={streamingFrameRateRef}
          />
        </Scene>
      </Engine>
    </div>
  );
}

export default ViewerWindow;
