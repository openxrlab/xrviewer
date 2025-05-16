/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useScene } from 'react-babylonjs';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export type CustomedStaticMeshesProps = {
  assetsManager: BABYLON.AssetsManager,
  staticMeshFile: String,
}

export function CustomedStaticMeshes(props: CustomedStaticMeshesProps) {
  const { assetsManager, staticMeshFile } = props;

  const scene = useScene();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (scene && assetsManager && staticMeshFile) {
      // BUG: if the filename is in upper case, the assets manager fails to parse animation file
      const meshTask = assetsManager.addMeshTask('staticMeshTask', '', 'file:', staticMeshFile);
      assetsManager.loadAsync();
      meshTask.onSuccess = (task) => {
        task.loadedAnimationGroups.forEach((animationGroup) => {
          animationGroup.stop();
          animationGroup.dispose();
        });
        const mat = new BABYLON.StandardMaterial('staticMeshMat', scene);
        mat.backFaceCulling = false;
        const extension = staticMeshFile.split('.')[1];
        task.loadedMeshes.forEach((mesh: BABYLON.AbstractMesh) => {
          if (extension === 'obj') {
            const normals = [];
            const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = mesh.getIndices();
            BABYLON.VertexData.ComputeNormals(
              positions,
              indices,
              normals,
            );
            const vertexData = new BABYLON.VertexData();
            vertexData.normals = normals;
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.applyToMesh(mesh, true);
          }
          mesh.material = mat;
          BABYLON.Tags.AddTagsTo(mesh, 'spawnedMesh');
        });
      };
      meshTask.onError = (task, message, exception) => {
        console.log(message);
        console.log(exception);
      };
    }
  }, [staticMeshFile]);

  return (
    <>
    </>
  );
}
