/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useScene, useBeforeRender } from 'react-babylonjs';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import {
  ServerActionsEnum, SynchronizeModeEnum, sendMessage,
} from '../../actions';
import StreamedVertexBuffer from '../../StreamedVertexBuffer';

export type ProceduralMeshProps = {
  pMeshRef: React.MutableRefObject<BABYLON.Mesh>,
  faces: any,
  verts: any,
  webSocketRef: any,
  dispatch: any,
  vertexBuffer: StreamedVertexBuffer,
  isPlayingRef: React.MutableRefObject<Boolean>,
  updateAnimationSuccess: Boolean,
  previewFrameSpawnedRef: React.MutableRefObject<Boolean>,
  bufferHeadFrameIndexRef: React.MutableRefObject<Number>,
  numFramesRef: React.MutableRefObject<Number>,
  shouldClearBufferRef: React.MutableRefObject<Boolean>,
  frameCachedDivTextRef: React.MutableRefObject<Number>,
  minimumPlayableFrameRef: React.MutableRefObject<Number>,
  freezeBufferHeadRef: React.MutableRefObject<Boolean>,
  replayFlagRef: React.MutableRefObject<Boolean>,
  prevFrameTimeRef: React.MutableRefObject<Number>,
  currentFrameTimeRef: React.MutableRefObject<Number>,
  desiredFrameIntervalRef: React.MutableRefObject<Number>,
  frameRateRef: React.MutableRefObject<Number>,
}

export function ProceduralMesh(props: ProceduralMeshProps) {
  const {
    pMeshRef, faces, verts, webSocketRef, dispatch, vertexBuffer,
    isPlayingRef, updateAnimationSuccess, previewFrameSpawnedRef,
    bufferHeadFrameIndexRef, numFramesRef, shouldClearBufferRef,
    frameCachedDivTextRef, minimumPlayableFrameRef, freezeBufferHeadRef,
    replayFlagRef, prevFrameTimeRef, currentFrameTimeRef, desiredFrameIntervalRef,
    frameRateRef,
  } = props;
  const scene = useScene();

  useBeforeRender(() => {
    if (shouldClearBufferRef.current) {
      vertexBuffer.reset();
      frameCachedDivTextRef.current = vertexBuffer.data.length;

      dispatch({
        type: 'write',
        path: 'streaming/shouldClearBuffer',
        data: false,
      });
      sendMessage(
        webSocketRef.current,
        ServerActionsEnum.UPDATE_IS_BUFFER_OPEN,
        true,
      );
      sendMessage(
        webSocketRef.current,
        ServerActionsEnum.UPDATE_BUFFER_FRAME_INDEX,
        bufferHeadFrameIndexRef.current,
      );
      previewFrameSpawnedRef.current = false;
      return;
    }

    if (vertexBuffer.isPushable(bufferHeadFrameIndexRef.current, numFramesRef.current)) {
      if (!vertexBuffer.isOpen) {
        console.log(`head frame index: ${bufferHeadFrameIndexRef.current}`);
        sendMessage(webSocketRef.current, ServerActionsEnum.UPDATE_IS_BUFFER_OPEN, true);
        const bufferEnqueueFrameIndex = (bufferHeadFrameIndexRef.current
          + vertexBuffer.length()) % numFramesRef.current;
        sendMessage(
          webSocketRef.current,
          ServerActionsEnum.UPDATE_BUFFER_FRAME_INDEX,
          bufferEnqueueFrameIndex,
        );
        vertexBuffer.setIsOpen(true);
      }
    }

    let verts_out;
    let idx = -1;
    // preview mesh not spawned, fetch 1-st frame vertices from the buffer
    if (previewFrameSpawnedRef.current === false) {
      [verts_out, idx] = vertexBuffer.head();
      // buffer is empty, try re-fetching in the next scene update
      if (verts_out === undefined) return;
      previewFrameSpawnedRef.current = true;
    }

    if (isPlayingRef.current === true) {
      if (replayFlagRef.current === true || vertexBuffer.length() === 0) {
        // vertex buffer is empty, freeze the buffer head
        freezeBufferHeadRef.current = true;
        replayFlagRef.current = false;
      } else if (vertexBuffer.length() >= minimumPlayableFrameRef.current) {
        // frame count in vertex buffer is enough for playing for
        // some specified time, unfreeze the buffer
        freezeBufferHeadRef.current = false;
      } else if (bufferHeadFrameIndexRef.current + vertexBuffer.length() >= numFramesRef.current) {
        freezeBufferHeadRef.current = false;
      }

      // if vertex buffer head is frozen, skip dequeue
      if (freezeBufferHeadRef.current === false) {
        if (Number(frameRateRef.current) < 60) {
          currentFrameTimeRef.current = Date.now();
          const frameInterval = currentFrameTimeRef.current - prevFrameTimeRef.current;

          if (frameInterval < desiredFrameIntervalRef.current) return;

          prevFrameTimeRef.current = currentFrameTimeRef.current;
        }

        [verts_out, idx] = vertexBuffer.dequeue();  // eslint-disable-line
        if (verts_out !== undefined) {
          bufferHeadFrameIndexRef.current = Number(bufferHeadFrameIndexRef.current) + 1;
        }
        frameCachedDivTextRef.current = vertexBuffer.data.length;
      }
    }

    // vertex buffer is empty
    if (verts_out === undefined) return;

    const positions = verts_out.flat();
    const normals = [];

    BABYLON.VertexData.ComputeNormals(
      positions,
      pMeshRef.current.getIndices(),
      normals,
      { useRightHandedSystem: false },
    );

    pMeshRef.current.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    pMeshRef.current.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    pMeshRef.current.refreshBoundingInfo();
    dispatch({
      type: 'write',
      path: 'streaming/frameIndex',
      data: bufferHeadFrameIndexRef.current,
    });

    // animation is end
    if (
      Number(numFramesRef.current) > 0
      && Number(bufferHeadFrameIndexRef.current) >= Number(numFramesRef.current)
    ) {
      dispatch({
        type: 'write',
        path: 'streaming/shouldClearBuffer',
        data: true,
      });
      dispatch({
        type: 'write',
        path: 'streaming/bufferHeadFrameIndex',
        data: 0,
      });
      dispatch({
        type: 'write',
        path: 'streaming/frameIndex',
        data: 0,
      });
      replayFlagRef.current = true;
    }
  });

  useEffect(() => {
    if (scene === null || verts === null) return;
    const verts_data = verts.verts;
    const verts_idx = verts.frame_idx;

    // Once the stream data is uploaded to the websocket server, the server returns
    // the 1-st frame inferenced vertices(V0) and faces(F). We need to update the
    // initial state of the procedural mesh(M(V0, F)) before user playing the animation.
    if (updateAnimationSuccess) {
      vertexBuffer.reset();

      dispatch({
        type: 'write',
        path: 'streaming/frameIndex',
        data: 0,
      });

      const positions = verts_data.flat();
      const normals = [];
      BABYLON.VertexData.ComputeNormals(
        positions,
        pMeshRef.current.getIndices(),
        normals,
        { useRightHandedSystem: false },
      );

      pMeshRef.current.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
      pMeshRef.current.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

      dispatch({
        type: 'write',
        path: 'streaming/updateAnimationSuccess',
        data: false,
      });

      previewFrameSpawnedRef.current = false;
      bufferHeadFrameIndexRef.current = 0;
      return;
    }

    if (!vertexBuffer.isPushable(bufferHeadFrameIndexRef.current, numFramesRef.current)) {
      if (!vertexBuffer.isOpen) return;
      vertexBuffer.setIsOpen(false);
      sendMessage(webSocketRef.current, ServerActionsEnum.UPDATE_IS_BUFFER_OPEN, false);
      return;
    }

    const enqueue_vert_idx = Number(verts_idx);
    const expected_vert_idx = Number(bufferHeadFrameIndexRef.current) + vertexBuffer.length();
    if (Number(enqueue_vert_idx) !== Number(expected_vert_idx)) {
      // unexpected frame, tell the backend to resend the expected frame
      let info = `Expected frame ${expected_vert_idx} whereas frame ${enqueue_vert_idx} received, `;
      const diff = expected_vert_idx - enqueue_vert_idx;
      let syn_type;
      if (diff < 0 || diff > 10) {
        syn_type = SynchronizeModeEnum.ROLLBACK;
      } else {
        syn_type = SynchronizeModeEnum.WAIT;
      }

      if (syn_type === SynchronizeModeEnum.ROLLBACK) {
        info += `rollback to frame ${expected_vert_idx}.`;
        sendMessage(
          webSocketRef.current,
          ServerActionsEnum.UPDATE_BUFFER_FRAME_INDEX,
          expected_vert_idx,
        );
      } else if (syn_type === SynchronizeModeEnum.WAIT) {
        info += `wait for ${diff} frames.`;
      }
      console.log(info);
      return;
    }
    vertexBuffer.enqueue(verts_data, verts_idx);

    frameCachedDivTextRef.current = vertexBuffer.data.length;
  }, [updateAnimationSuccess, verts]); // eslint-disable-line

  useEffect(() => {
    if (scene === null || faces === null) {
      return;
    }

    const indices = [];
    // strip the vertex indices: |F|, 3 -> |F|x3
    faces.forEach((face) => {
      /*
            There exists a polygon winding order gap between the SMPL and
            the Babylon.js. For arbitrary face 'f' in mesh:

                   o  V1(#VERT1/#UV1/#NORMAL1)

                           V3(#VERT3/#UV3/#NORMAL3)
             o            o
               V2(#VERT2/#UV2/#NORMAL2)

            SMPL uses counter-clockwise(CCW) polygon winding order:
                f #VERT1/#UV1/#NORMAL1 #VERT2/#UV2/#NORMAL2 #VERT3/#UV3/#NORMAL3

            Whereas the Babylon.js uses clockwise(CW) polygon winding order:
                f #VERT1/#UV1/#NORMAL1 #VERT3/#UV3/#NORMAL3 #VERT2/#UV2/#NORMAL2
        */
      indices.push(face[0], face[2], face[1]);
    });

    const positions = Array(10475 * 3).fill(0.0);
    const vertexData = new BABYLON.VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;

    vertexData.applyToMesh(pMeshRef.current, true);
  }, [scene, faces]); // eslint-disable-line

  return (
    <>
    </>
  );
}
