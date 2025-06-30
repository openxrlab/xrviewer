<br/>

<div align="center">
    <img src="resources/xrviewer_logo.png" width="600"/>
</div>

<br/>

<div align="center">

[![Documentation](https://readthedocs.org/projects/xrviewer/badge/?version=latest)](https://xrviewer.readthedocs.io/en/latest/?badge=latest)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/openxrlab/xrviewer)
[![Percentage of issues still open](https://isitmaintained.com/badge/open/openxrlab/xrviewer.svg)](https://github.com/openxrlab/xrviewer/issues)
[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

</div>

## Introduction


XRViewer is a toolbox for visualizing data structures and algorithms in OpenXRLab.

## Supported Tasks

- ***Camera Visualization***:
    - [x] cameras obtained from the [XRPrimer](https://github.com/openxrlab/xrprimer)

    https://github.com/user-attachments/assets/ab6b5f77-3893-4d86-88cf-6d0809904862

    - [ ] camera trajectory in [XRSLAM](https://github.com/openxrlab/xrslam)

- ***Mesh Visualization***.
    - [x] static mesh in .obj/.gltf(glb)/.stl format
    - [x] SMPL(X) animation in .npz format exported by the [XRMoCap](https://github.com/openxrlab/xrmocap) with unlimited sequence length

    https://github.com/user-attachments/assets/9403f019-b733-4606-a5ab-d73167341071

    - [x] geometry cache in [.abc](https://github.com/alembic/alembic) format, e.g., clothing deformations produced by [XRTailor](https://github.com/openxrlab/xrtailor)

    https://github.com/user-attachments/assets/45db3c56-5c14-4347-9a3f-ab28a9d6ca26

    - [x] skeletal mesh animation in .gltf(glb)/.fbx format

    https://github.com/user-attachments/assets/a7df1db6-7de6-44d1-9048-8f174de982f9

## Supported Platforms

XRViewer has been tested for successfully running on the following operation systems:
- Windows
- MacOS
- Ubuntu

## Quick Start

Please refer to our [documentation page](https://xrviewer.readthedocs.io) for more details.

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
