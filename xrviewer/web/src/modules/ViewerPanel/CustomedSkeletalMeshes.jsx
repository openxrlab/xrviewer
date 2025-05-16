/* eslint-disable no-param-reassign */
import React, { useRef, useEffect } from 'react';
import { useScene } from 'react-babylonjs';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export type CustomedSkeletalMeshesProps = {
    reloadFlag: Boolean,
    assetsManager: BABYLON.AssetsManager,
    animationFile: String,
    isPlaying: Boolean,
    frameIndex: Number,
    instantFrame: Boolean,
    dispatch: any
  };

export function CustomedSkeletalMeshes(props: CustomedSkeletalMeshesProps) {
  const {
    reloadFlag, animationFile, assetsManager, isPlaying,
    frameIndex, instantFrame, dispatch,
  } = props;
  const scene = useScene();
  const skeletalMeshRef = useRef(null);
  const skeletalAnimationRef = useRef(null);

  const getCurrentFrame = (animationGroup: BABYLON.AnimationGroup) => {
    if (!animationGroup) {
      return 0;
    }

    const { targetedAnimations } = animationGroup;
    if (targetedAnimations.length > 0) {
      const { runtimeAnimations } = targetedAnimations[0].animation;
      if (runtimeAnimations.length > 0) {
        return runtimeAnimations[0].currentFrame;
      }
    }

    return 0;
  };

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (scene) {
      const onBeforeRender = () => {
        if (reloadFlag) {
          if (skeletalMeshRef.current !== null) {
            // Clear the existing character animation before importing a new animtion.
            // Notice that Babylon.js will release all resources associated with the
            // mesh, including any textures, materials, and animations.
            skeletalMeshRef.current.dispose();
          }

          // BUG: if the filename is in upper case, the assets manager fails to parse animation file
          const meshTask = assetsManager.addMeshTask('task', '', 'file:', animationFile);
          assetsManager.loadAsync();

          meshTask.onSuccess = (task) => {
            const mesh = task.loadedMeshes[0];
            const animation = task.loadedAnimationGroups[0];
            skeletalMeshRef.current = mesh;
            skeletalAnimationRef.current = animation;

            const mat = new BABYLON.StandardMaterial('skeletalMeshMat', scene);
            mat.backFaceCulling = false;

            console.log(task.loadedMeshes);
            task.loadedMeshes.forEach((loadedMesh) => {
              loadedMesh.material = mat;
              BABYLON.Tags.AddTagsTo(loadedMesh, 'spawnedMesh skeletalMesh');
            });

            dispatch({
              type: 'write',
              path: 'local/frameEnd',
              data: animation.to,
            });
          };

          meshTask.onError = (task, message, exception) => {
            console.log(message);
            console.log(exception);
          };
          dispatch({
            type: 'write',
            path: 'local/reloadFlag',
            data: false,
          });
        }

        if (skeletalAnimationRef.current !== null) {
          if (isPlaying) {
            const currentFrameIndex = getCurrentFrame(skeletalAnimationRef.current);

            dispatch({
              type: 'write',
              path: 'local/frameIndex',
              data: currentFrameIndex,
            });

            if (skeletalAnimationRef.current.isPlaying === false) {
              skeletalAnimationRef.current.play();
            }
          } else if (skeletalAnimationRef.current.isPlaying === true) {
            skeletalAnimationRef.current.pause();
          }

          if (instantFrame) {
            skeletalAnimationRef.current.goToFrame(frameIndex);

            dispatch({
              type: 'write',
              path: 'local/instantFrame',
              data: false,
            });
          }
        }
      };
      scene.registerBeforeRender(onBeforeRender);

      return () => {
        scene.unregisterBeforeRender(onBeforeRender);
      };
    }
  }, [scene, reloadFlag, isPlaying, frameIndex,
    assetsManager, animationFile, instantFrame, dispatch,
  ]);

  return (
    <>
    </>
  );
}
