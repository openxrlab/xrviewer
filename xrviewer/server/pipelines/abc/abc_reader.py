import logging

import numpy as np
from alembic.Abc import IArchive, ISampleSelector, WrapExistingFlag
from alembic.AbcGeom import IPolyMesh


def walk_objects(obj) -> list[IPolyMesh]:
    """Recursively get the meshes of an object.

    Args:
        obj: object to be traversed.

    Returns:
        list[IPolyMesh]: list of meshes in the object.
    """
    meshes = []
    if IPolyMesh.matches(obj.getHeader()):
        meshes.append(IPolyMesh(obj, WrapExistingFlag.kWrapExisting))

    for i in range(obj.getNumChildren()):
        meshes.extend(walk_objects(obj.getChild(i)))

    return meshes


class AbcReader:

    def __init__(self, logger: logging.Logger) -> None:
        self.logger = logger
        self.schema = None

        self.num_frames = 0
        self.frame_rate = 0

    def load_abc(self, abc_file_path: str) -> int:
        """Load an alembic file and setup the animation params.

        Args:
            abc_file_path (str): path to the alembic file.

        Returns:
            int: number of frames of the animation.
        """
        iarch = None
        try:
            iarch = IArchive(abc_file_path)
        except Exception as e:
            msg = f'[Pipeline] Not a valid abc file: {e}'
            self.logger.error(msg)
            return 0

        top = iarch.getTop()

        meshes = walk_objects(top)
        if len(meshes) == 0:
            msg = '[Pipeline] No poly mesh is found on the abc file'
            self.logger.error(msg)
            return 0

        mesh = walk_objects(top)[0]
        self.schema = mesh.getSchema()
        time_sampling = self.schema.getTimeSampling()
        num_samples = self.schema.getNumSamples()

        self.start_time = time_sampling.getSampleTime(0)
        self.end_time = time_sampling.getSampleTime(num_samples)

        self.num_frames = num_samples - 1

        time_interval = time_sampling.getSampleTime(
            2) - time_sampling.getSampleTime(1)
        self.frame_rate = round(1.0 / time_interval)

        return self.num_frames

    def forward(self, frame_idx: int) -> list[list[float]]:
        """Get mesh vertex coordinates at a specific frame.

        Args:
            frame_idx (int): frame index of the animation.

        Returns:
            list[list[float]]: vertex coordinates organized as
            a [|V|, 3] list at the given frame.
        """
        time = \
            self.start_time + \
            (self.end_time - self.start_time) * (frame_idx / self.num_frames)
        sel = ISampleSelector(time)
        mesh_samp = self.schema.getValue(sel)

        return np.array(
            mesh_samp.getPositions(), dtype=np.float32).reshape(
                (-1, 3)).tolist()

    def get_uvs(self) -> list[list[float]]:
        """Get texture coordinates of the mesh.

        Returns:
            list[list[float]]: texture coordinates organized as
                a [|V|, 2] list.
        """
        uv = self.schema.getUVsParam()
        uv_samp = uv.getIndexedValue()

        return np.array(
            uv_samp.getVals(), dtype=np.float32).reshape((-1, 2)).tolist()

    def get_faces(self) -> list[int]:
        """Get face indices of the mesh.

        Returns:
            list[int]: Face indices organized as a list.
        """
        mesh_samp = self.schema.getValue(0)
        indices = np.array(
            mesh_samp.getFaceIndices(), dtype=np.int32).reshape((-1, 3))
        indices[:, [2, 1]] = indices[:, [1, 2]]

        return indices.tolist()
