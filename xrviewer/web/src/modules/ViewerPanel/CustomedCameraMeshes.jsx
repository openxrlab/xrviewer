/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

import * as BABYLON_GUI from '@babylonjs/gui';
import * as BABYLON from '@babylonjs/core';
import {
  Vector3, Vector4, Quaternion,
} from '@babylonjs/core';
import '@babylonjs/loaders';

function disposeSpawnedCamera(
  name: string,
  scene: BABYLON.Scene,
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture,
) {
  const rootNode = scene.getTransformNodeByName(name);
  // dispose the camera
  const childNodes = rootNode.getChildren();
  childNodes.forEach((childNode) => {
    const cameraAxes = childNode.getChildren();
    cameraAxes.forEach((cameraAxis) => {
      cameraAxis.dispose();
    });

    childNode.dispose();
  });
  rootNode.dispose();

  // dispose the camera label
  const ellipses = advancedTexture.getControlsByType('Ellipse');
  const lines = advancedTexture.getControlsByType('Line');
  const rects = advancedTexture.getControlsByType('Rectangle');

  ellipses.forEach((ellipse_control: BABYLON_GUI.Control) => {
    if (ellipse_control.name === name) ellipse_control.dispose();
  });

  lines.forEach((line_control: BABYLON_GUI.Control) => {
    if (line_control.name === name) line_control.dispose();
  });

  rects.forEach((rect_control: BABYLON_GUI.Control) => {
    if (rect_control.name === name) rect_control.dispose();
  });
}

async function SpawnCameraInstance(
  idx: Number,
  scene: BABYLON.Scene,
  cameraParam: any,
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture,
  displayCameraLabel: Boolean,
  highlightLayer: BABYLON.HighlightLayer,
) {
  const name = String(cameraParam.name);
  const { extrinsic_r } = cameraParam;
  const { extrinsic_t } = cameraParam;
  const convention_type = cameraParam.convention;

  const rootNode = new BABYLON.TransformNode(name, scene);
  BABYLON.Tags.AddTagsTo(rootNode, 'spawned_camera');
  const imported = await BABYLON.SceneLoader.ImportMeshAsync(
    '',
    '../../models/',
    'Camera.glb',
  );
  const meshesRootNode = new BABYLON.TransformNode('meshes_root', scene);
  meshesRootNode.parent = rootNode;

  imported.meshes.forEach((mesh) => {
    // It's possible that the .gltf model being imported might have a
    // non-uniform scaling applied to it, which might cause it to look
    // distorted when assigning a new parent TransformNode to the mesh.
    //
    // To solve the issue:
    //  => Decompose the mesh's world matrix to extract the scaling information.
    //  => Reset the mesh's scaling to (1, 1, 1).
    //  => Set the extracted scaling to the parent TransformNode.
    //  => Set the TransformNode as the mesh's parent.
    const scaling = new BABYLON.Vector3();
    const rotation = new BABYLON.Quaternion();
    const position = new BABYLON.Vector3();

    mesh.getWorldMatrix().decompose(scaling, rotation, position);
    mesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
    meshesRootNode.scaling = scaling;
    mesh.parent = meshesRootNode;
    mesh.isPickable = false;
    highlightLayer.addExcludedMesh(mesh);
  });

  // create local axes viewer
  const axesRootNode = new BABYLON.TransformNode('axes_root', scene);
  axesRootNode.parent = rootNode;
  const localAxes = new BABYLON.AxesViewer(scene, 0.4);
  localAxes.xAxis.getChildMeshes().forEach((mesh) => {
    mesh.isPickable = false;
    highlightLayer.addExcludedMesh(mesh);
  });
  localAxes.yAxis.getChildMeshes().forEach((mesh) => {
    mesh.isPickable = false;
    highlightLayer.addExcludedMesh(mesh);
  });
  localAxes.zAxis.getChildMeshes().forEach((mesh) => {
    mesh.isPickable = false;
    highlightLayer.addExcludedMesh(mesh);
  });
  localAxes.xAxis.parent = axesRootNode;
  localAxes.yAxis.parent = axesRootNode;
  localAxes.zAxis.parent = axesRootNode;

  // configure camera using uploaded camera params
  const rotation = BABYLON.Matrix.Identity();
  for (let row = 0; row < 3; row++) {
    rotation.setRow(
      row,
      Vector4.FromVector3(Vector3.FromArray(extrinsic_r[row]), 0),
    );
  }

  // transform the rotation from world space back to the camera space
  const rotation_transposed = BABYLON.Matrix.Transpose(rotation);
  rootNode.rotationQuaternion = Quaternion.FromRotationMatrix(rotation_transposed);
  rootNode.position = new Vector3(extrinsic_t[0], extrinsic_t[1], extrinsic_t[2]);

  if (convention_type === 'opencv') {
    meshesRootNode.rotation = new Vector3(
      0,
      0,
      BABYLON.Tools.ToRadians(180),
    );
  }

  const rect = new BABYLON_GUI.Rectangle();
  rect.width = '400px';
  rect.height = '150px';
  rect.cornerRadius = 10;
  rect.color = 'Orange';
  rect.thickness = 2;
  rect.background = 'black';
  rect.isVisible = displayCameraLabel;
  rect.name = name;
  advancedTexture.addControl(rect);
  const label = new BABYLON_GUI.TextBlock();
  label.name = name;
  label.text = name;
  label.fontSize = 36;
  const rotation_euler = rootNode.rotationQuaternion.toEulerAngles();
  label.text += `\nT: (${
    rootNode.position.x.toFixed(2)}, ${
    rootNode.position.y.toFixed(2)}, ${
    rootNode.position.z.toFixed(2)})`;
  label.text += `\nR: (${
    BABYLON.Tools.ToDegrees(rotation_euler.x).toFixed(1)}, ${
    BABYLON.Tools.ToDegrees(rotation_euler.y).toFixed(1)}, ${
    BABYLON.Tools.ToDegrees(rotation_euler.z).toFixed(1)})`;
  rect.addControl(label);
  rect.linkWithMesh(meshesRootNode);
  rect.linkOffsetY = -300;

  const target = new BABYLON_GUI.Ellipse();
  target.name = name;
  target.width = '20px';
  target.height = '20px';
  target.color = 'Orange';
  target.thickness = 4;
  target.background = 'green';
  advancedTexture.addControl(target);
  target.linkWithMesh(meshesRootNode);
  target.isVisible = displayCameraLabel;

  const line = new BABYLON_GUI.Line();
  line.name = name;
  line.lineWidth = 4;
  line.color = 'Orange';
  line.y2 = 75;
  line.linkOffsetY = -10;
  advancedTexture.addControl(line);
  line.linkWithMesh(meshesRootNode);
  line.connectedControl = rect;
  line.isVisible = displayCameraLabel;
}

function disposeSpawnedCameras(
  scene: BABYLON.Scene,
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture,
) {
  const rootNodes = scene.getTransformNodesByTags('spawned_camera');
  const existingCameraNames = [];
  rootNodes.forEach((rootNode) => {
    const childNodes = rootNode.getChildren();
    existingCameraNames.push(rootNode.name);
    childNodes.forEach((childNode) => {
      const cameraAxes = childNode.getChildren();
      cameraAxes.forEach((cameraAxis) => {
        cameraAxis.dispose();
      });

      childNode.dispose();
    });
    rootNode.dispose();
  });

  const controls = advancedTexture.rootContainer.children.filter(
    (child) => existingCameraNames.includes(child.name),
  );

  if (controls !== null) {
    controls.forEach((control) => {
      control.dispose();
    });
  }
}

function UpdateCameraMeshVisibility(
  scene: BABYLON.Scene,
  cameraGroupVisibility: any,
) {
  Object.keys(cameraGroupVisibility).forEach((cameraName) => {
    const visible = cameraGroupVisibility[cameraName].mesh_visible;
    const rootNode = scene.getNodeByName(cameraName);

    if (rootNode !== null) {
      rootNode.setEnabled(visible);
    }
  });
}

function UpdateCameraLabelVisibility(
  cameraGroupVisibility: any,
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture,
) {
  Object.keys(cameraGroupVisibility).forEach((cameraName) => {
    const visible = cameraGroupVisibility[cameraName].label_visible;
    const controls = advancedTexture.rootContainer.children.filter(
      (child) => child.name === cameraName,
    );

    if (controls !== null) {
      controls.forEach((control) => {
        control.isVisible = visible;
      });
    }
  });
}

export type CustomedCameraMeshesProps = {
  cameraReloadFlag: any,
  cameraParams: any,
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture,
  displayCameraLabel: Boolean,
  dispatch: any,
  cameraGroupVisibility: Boolean,
  cameraDisposeName: string,
  cameraDisposeFlag: Boolean,
  highlightLayer: BABYLON.HighlightLayer,
};

export function CustomedCameraMeshes(props: CustomedCameraMeshesProps) {
  const {
    cameraReloadFlag, cameraParams, advancedTexture,
    displayCameraLabel, cameraGroupVisibility, cameraDisposeFlag,
    dispatch, cameraDisposeName, highlightLayer,
  } = props;
  const scene = useScene();
  let parsedCameraGroupVisibility;
  useEffect(() => {
    if (advancedTexture) {
      parsedCameraGroupVisibility = JSON.parse(cameraGroupVisibility);
      UpdateCameraLabelVisibility(parsedCameraGroupVisibility, advancedTexture);
      UpdateCameraMeshVisibility(scene, parsedCameraGroupVisibility);
    }
  }, [scene, advancedTexture, cameraGroupVisibility]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (scene) {
      const onBeforeRender = () => {
        if (cameraReloadFlag === true) {
          disposeSpawnedCameras(scene, advancedTexture);
          for (let idx = 0; idx < cameraParams.length; idx++) {
            SpawnCameraInstance(
              idx,
              scene,
              cameraParams[idx],
              advancedTexture,
              displayCameraLabel,
              highlightLayer,
            );
          }
          dispatch({
            type: 'write',
            path: 'sceneState/cameraReloadFlag',
            data: false,
          });
        }
      };
      scene.registerBeforeRender(onBeforeRender);

      return () => {
        scene.unregisterBeforeRender(onBeforeRender);
      };
    }
  }, [scene, cameraReloadFlag, cameraParams, displayCameraLabel, advancedTexture, dispatch]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (scene === null || cameraDisposeName === null) return;
    console.log('dispose flag: '.concat(cameraDisposeFlag));
    if (cameraDisposeFlag === true) {
      console.log('dispose camera '.concat(cameraDisposeName));
      dispatch({
        type: 'write',
        path: 'sceneState/cameraDisposeFlag',
        data: false,
      });
      disposeSpawnedCamera(cameraDisposeName, scene, advancedTexture);
    }
  }, [scene, cameraDisposeFlag]);

  return (
    <>
    </>
  );
}
