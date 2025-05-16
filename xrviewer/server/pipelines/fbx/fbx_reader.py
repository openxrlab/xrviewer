import logging
from typing import List

import fbx
import numpy as np

from . import FbxCommon


def get_mesh_faces(node) -> List[int]:
    """Recursively get the mesh faces of a node.

    Args:
        node: fbx node to be traverserd. The entry point
            is the root node.

    Returns:
        List[int]: faces of the mesh, organized as a list.
    """
    faces = []

    mesh = node.GetNodeAttribute()
    if mesh and mesh.GetAttributeType() == fbx.FbxNodeAttribute.EType.eMesh:
        # Extracting faces
        for polygon_index in range(mesh.GetPolygonCount()):
            polygon_size = mesh.GetPolygonSize(polygon_index)
            face = []
            for vert_index in range(polygon_size):
                control_point_index = mesh.GetPolygonVertex(
                    polygon_index, vert_index)
                face.append(control_point_index)
            faces.append(face)

    for child_index in range(node.GetChildCount()):
        child_node = node.GetChild(child_index)
        child_faces = get_mesh_faces(child_node)
        faces.extend(child_faces)

    return faces


def traverse_node(node, time) -> list[fbx.FbxVector4]:
    """process each node and get deformed vertices.

    Args:
        node: node to be traversed. The entry point
            is the root node of fbx object.
        time: the desired time based on the frame index.

    Returns:
        list[fbx.FbxVector4]: a list that contains the
            deformed vertices.
    """
    deformed_points = []

    mesh = node.GetNodeAttribute()
    if mesh and mesh.GetAttributeType() == fbx.FbxNodeAttribute.EType.eMesh:
        control_points = mesh.GetControlPoints()
        deformed_points = [
            fbx.FbxVector4(p[0], p[1], p[2]) for p in control_points
        ]

        for deformer_idx in range(mesh.GetDeformerCount()):
            deformer = mesh.GetDeformer(deformer_idx)
            if deformer.GetDeformerType(
            ) != fbx.FbxDeformer.EDeformerType.eSkin:
                continue

            skin = deformer
            for cluster_idx in range(skin.GetClusterCount()):
                cluster = skin.GetCluster(cluster_idx)

                # Get the current and inverse bind pose
                # transformation of the bone (cluster)
                current_cluster_transform = cluster.GetLink(
                ).EvaluateGlobalTransform(time)
                init_cluster_transform = fbx.FbxAMatrix()
                cluster.GetTransformLinkMatrix(init_cluster_transform)
                init_cluster_transform_inv = \
                    init_cluster_transform.Inverse()

                indices = cluster.GetControlPointIndices()
                weights = cluster.GetControlPointWeights()

                for point_idx, weight in zip(indices, weights):
                    # Calculate the transformation caused
                    # by the current bone (cluster)
                    init_pos = init_cluster_transform_inv.MultT(
                        control_points[point_idx])
                    deformed_pos = current_cluster_transform.MultT(init_pos)

                    # Accumulate the weighted deformation for each bone
                    delta = deformed_pos - control_points[point_idx]
                    deformed_points[point_idx] = fbx.FbxVector4(
                        deformed_points[point_idx][0] + weight * delta[0],
                        deformed_points[point_idx][1] + weight * delta[1],
                        deformed_points[point_idx][2] + weight * delta[2],
                        deformed_points[point_idx][3] + weight * delta[3])

    for child_idx in range(node.GetChildCount()):
        deformed_points += traverse_node(node.GetChild(child_idx), time)

    return deformed_points


def get_mesh_verts(root_node, time_mode, frame_idx: int) -> list[list[float]]:
    """Compute the mesh vertices at a specific frame using the rigging weights
    of the skeletal mesh.

    Args:
        root_node: root node of the imported fbx object.
        time_mode: fbx time sampling mode.
        frame_idx: index of the frame to be processed.

    Returns:
        list[list[float]]: resulting vertex coordinates,
            organized as a [|V|, 3] list.
    """

    # Set the desired time based on the frame index
    time = fbx.FbxTime()
    time.SetFrame(frame_idx, time_mode)

    # Process the FBX hierarchy starting from the root node
    vertices = traverse_node(root_node, time)

    # Convert the results to a more convenient format, e.g., list of tuples
    return [(v[0], v[1], v[2]) for v in vertices]


class FbxReader:

    FRAME_RATE_MODE = {
        30: fbx.FbxTime.EMode.eFrames30,
        60: fbx.FbxTime.EMode.eFrames60,
        120: fbx.FbxTime.EMode.eFrames120
    }

    def __init__(self, logger: logging.Logger, frame_rate: int = 60) -> None:
        self.logger = logger
        available_frame_rates = (30, 60, 120)

        if frame_rate not in available_frame_rates:
            msg = 'target frame rate not supported, ' \
                f'available frame rates: {available_frame_rates}'
            self.logger.error(msg)
            raise ValueError(msg)

        self.time_mode = self.__class__.FRAME_RATE_MODE[frame_rate]
        self.root_node = None
        self.n_frames = 0
        self.scale_factor = 0.01

    def load(self, file_path: str) -> int:
        """Load fbx file and setup animation params.

        Args:
            file_path (str): path to the fbx file.

        Raises:
            ValueError: raises when the fbx file is invalid.

        Returns:
            int: frame number of the animation.
        """
        manager, scene = FbxCommon.InitializeSdkObjects()
        load_success = FbxCommon.LoadScene(manager, scene, file_path)
        if not load_success:
            self.logger.error('Failed to load scene')
            return 0

        self.root_node = scene.GetRootNode()

        # Recursive function to traverse nodes and set scale
        def traverse_and_scale(node, scale_factor):
            if node:
                # Set the scale of the current node
                node.LclScaling.Set(
                    fbx.FbxDouble3(scale_factor, scale_factor, scale_factor))

                # Recursively scale all children
                for i in range(node.GetChildCount()):
                    traverse_and_scale(node.GetChild(i), scale_factor)

        # Apply scaling to all nodes in the scene
        traverse_and_scale(self.root_node, self.scale_factor)

        # Get animation stack
        anim_stack = scene.GetSrcObject(
            fbx.FbxCriteria.ObjectType(fbx.FbxAnimStack.ClassId), 0)
        if not anim_stack:
            self.logger.error('No animation found')
            return 0

        # Get the duration of the animation
        time_span = anim_stack.GetLocalTimeSpan()
        start = time_span.GetStart()
        stop = time_span.GetStop()

        start_frame = int(start.GetFrameCount(self.time_mode))
        stop_frame = int(stop.GetFrameCount(self.time_mode))

        n_frames = stop_frame - start_frame + 1

        return n_frames

    def forward(self, frame_idx: int) -> list[list[float]]:
        """Simulate a LBS forward procedure at a specific frame.

        Args:
            frame_idx (int): index of frame to be processed.

        Returns:
            list[list[float]]: resulting vertex coordinates, organized
                as a [|V|, 3] list.
        """
        verts = get_mesh_verts(self.root_node, self.time_mode, frame_idx)

        return verts

    def get_faces(self) -> list[int]:
        """Get faces of the mesh in the fbx object.

        Returns:
            list[int]: resulting face indices, organzied as a flattened list.
        """
        faces = get_mesh_faces(self.root_node)
        faces = np.array(faces, dtype=np.int32).reshape((-1, 3)).tolist()
        return faces
