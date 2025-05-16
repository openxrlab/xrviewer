# Helper functions to facilitate fbx IO. Notice that the script
# is obtained from FBX Python SDK 2020.3.4 installation folder.
import sys

import fbx


def InitializeSdkObjects():
    # The first thing to do is to create the FBX SDK manager which is the
    # object allocator for almost all the classes in the SDK.
    lSdkManager = fbx.FbxManager.Create()
    if not lSdkManager:
        sys.exit(0)

    # Create an IOSettings object
    ios = fbx.FbxIOSettings.Create(lSdkManager, fbx.IOSROOT)
    lSdkManager.SetIOSettings(ios)

    # Create the entity that will hold the scene.
    lScene = fbx.FbxScene.Create(lSdkManager, '')

    return (lSdkManager, lScene)


def SaveScene(pSdkManager,
              pScene,
              pFilename,
              pFileFormat=-1,
              pEmbedMedia=False):
    lExporter = fbx.FbxExporter.Create(pSdkManager, '')
    if pFileFormat < 0 or pFileFormat >= pSdkManager.GetIOPluginRegistry(
    ).GetWriterFormatCount():
        pFileFormat = pSdkManager.GetIOPluginRegistry().GetNativeWriterFormat()
        if not pEmbedMedia:
            lFormatCount = pSdkManager.GetIOPluginRegistry(
            ).GetWriterFormatCount()
            for lFormatIndex in range(lFormatCount):
                if pSdkManager.GetIOPluginRegistry().WriterIsFBX(lFormatIndex):
                    lDesc = pSdkManager.GetIOPluginRegistry(
                    ).GetWriterFormatDescription(lFormatIndex)
                    if 'ascii' in lDesc:
                        pFileFormat = lFormatIndex
                        break

    if not pSdkManager.GetIOSettings():
        ios = fbx.FbxIOSettings.Create(pSdkManager, fbx.IOSROOT)
        pSdkManager.SetIOSettings(ios)

    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_MATERIAL, True)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_TEXTURE, True)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_EMBEDDED, pEmbedMedia)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_SHAPE, True)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_GOBO, True)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_ANIMATION, True)
    pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_GLOBAL_SETTINGS, True)

    result = lExporter.Initialize(pFilename, pFileFormat,
                                  pSdkManager.GetIOSettings())
    if result is True:
        result = lExporter.Export(pScene)

    lExporter.Destroy()
    return result


def LoadScene(pSdkManager, pScene, pFileName):
    lImporter = fbx.FbxImporter.Create(pSdkManager, '')
    result = lImporter.Initialize(pFileName, -1, pSdkManager.GetIOSettings())
    if not result:
        return False

    if lImporter.IsFBX():
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_MATERIAL, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_TEXTURE, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_EMBEDDED, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_SHAPE, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_GOBO, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_ANIMATION, True)
        pSdkManager.GetIOSettings().SetBoolProp(fbx.EXP_FBX_GLOBAL_SETTINGS,
                                                True)

    result = lImporter.Import(pScene)
    lImporter.Destroy()
    return result
