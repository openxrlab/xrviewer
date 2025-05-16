<br/>

<div align="center">
    <img src="resources/xrviewer_logo.png" width="600"/>
</div>

<br/>

<div align="center">

</div>

## Introduction


XRViewer is a toolbox for visualizing data structures and algorithms in OpenXRLab.

## Supported Tasks

- ***Camera Visualization***:
    - [x] cameras obtained from the [XRPrimer](https://github.com/openxrlab/xrprimer)

    https://gitlab.bj.sensetime.com/openxrlab/xrviewer/uploads/a2ed2ea89b65c2c6bfa8684b1b9cbf5e/camera.mp4

    - [ ] camera trajectory in [XRSLAM](https://github.com/openxrlab/xrslam)

- ***Mesh Visualization***.
    - [x] static mesh in .obj/.gltf(glb)/.stl format
    - [x] SMPL(X) animation in .npz format exported by the [XRMoCap](https://github.com/openxrlab/xrmocap) with unlimited sequence length

    https://gitlab.bj.sensetime.com/openxrlab/xrviewer/uploads/14afff105c91b142e1f9da9ca90d4194/smpl.mp4

    - [x] geometry cache in [.abc](https://github.com/alembic/alembic) format, e.g., clothing deformations produced by [XRTailor](https://gitlab.bj.sensetime.com/openxrlab/xrtailor)

    https://gitlab.bj.sensetime.com/openxrlab/xrviewer/uploads/303e376726a01199c0b9c190dfe982e3/abc.mp4

    - [x] skeletal mesh animation in .gltf(glb)/.fbx format

    https://gitlab.bj.sensetime.com/openxrlab/xrviewer/uploads/577c44906320a6491c5c01dac52d12be/glb.mp4

## Supported Platforms

XRViewer has been tested for successfully running on the following operation systems:
- Windows
- MacOS
- Ubuntu

## Quick Start

Please refer to our [documentation page](https://xrviewer.doc.diamond.zoe.sensetime.com/) for more details.

## License

XRViewer is an open source project that is contributed by researchers and engineers from both the academia and the industry. We appreciate all the contributors who implement their methods or add new features, as well as users who give valuable feedbacks. We wish that the toolbox could serve the growing research community by providing a flexible toolkit to reimplement existing methods and develop their own new models.

The license of our codebase is Apache-2.0, see [LICENSE](LICENSE) for more information.


## Citation

If you find this project useful in your research, please consider cite:

```bibtex
@misc{xrviewer,
    title={OpenXRLab Data Visualization Toolbox},
    author={XRViewer Contributors},
    howpublished = {\url{https://github.com/openxrlab/xrviewer}},
    year={2025}
}
```

### Projects in OpenXRLab

- [XRPrimer](https://github.com/openxrlab/xrprimer): OpenXRLab foundational library for XR-related algorithms.
- [XRSLAM](https://github.com/openxrlab/xrslam): OpenXRLab Visual-inertial SLAM Toolbox and Benchmark.
- [XRSfM](https://github.com/openxrlab/xrsfm): OpenXRLab Structure-from-Motion Toolbox and Benchmark.
- [XRLocalization](https://github.com/openxrlab/xrlocalization): OpenXRLab Visual Localization Toolbox and Server.
- [XRMoCap](https://github.com/openxrlab/xrmocap): OpenXRLab Multi-view Motion Capture Toolbox and Benchmark.
- [XRMoGen](https://github.com/openxrlab/xrmogen): OpenXRLab Human Motion Generation Toolbox and Benchmark.
- [XRNeRF](https://github.com/openxrlab/xrnerf): OpenXRLab Neural Radiance Field (NeRF) Toolbox and Benchmark.
- [XRFeitoria](https://github.com/openxrlab/xrfeitoria): OpenXRLab Synthetic Data Rendering Toolbox.
- [XRTailor](https://github.com/openxrlab/xrtailor): OpenXRLab GPU Cloth Simulator.
