from enum import Enum


# the viewer interop with the websocket server
class ViewerActionsEnum(str, Enum):
    # the viewer sends stream data to the websocket server
    UPDATE_STREAM_DATA = 'UPDATE_STREAM_DATA'
    # set playing state
    UPDATE_IS_PLAYING = 'UPDATE_IS_PLAYING'
    # set current frame index
    UPDATE_BUFFER_FRAME_INDEX = 'UPDATE_BUFFER_FRAME_INDEX'
    # set the buffer opening status
    UPDATE_IS_BUFFER_OPEN = 'UPDATE_IS_BUFFER_OPEN'
    # whether the websocket connection has been really established
    CONFIRM_WEBSOCKET_CONNECTED = 'CONFIRM_WEBSOCKET_CONNECTED'
    # send the pipeline name to the websocket server
    UPDATE_PIPELINE_NAME = 'UPDATE_PIPELINE_NAME'
    # check whether the websocket connection is available
    HEART_CHECK = 'HEART_CHECK'


# the pipeline interop with the websocket server
class PipelineActionsEnum(str, Enum):
    # request current state of the websocket server
    REQUEST_STATE = 'REQUEST_STATE'
    # request stream data from the websocket server
    REQUEST_STREAM_DATA = 'REQUEST_STREAM_DATA'
    # flag that determines whether the pipeline should load the stream data
    UPDATE_STREAM_DATA_FLAG = 'UPDATE_STREAM_DATA_FLAG'
    # send mesh vertices to the websocket server
    UPDATE_MESH_VERTICES = 'UPDATE_MESH_VERTICES'
    # send mesh faces to the websocket server
    UPDATE_MESH_FACES = 'UPDATE_MESH_FACES'
    # send frame index in playing to the websocket server
    UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX'
    # send sequence length to the websocket server
    UPDATE_NUM_FRAMES = 'UPDATE_NUM_FRAMES'
    # test whether the pipeline is connected with the the websocket server
    PING = 'ping'
    # whether the pipeline has updated the stream data
    UPDATE_STREAM_DATA_SUCCESS = 'UPDATE_STREAM_DATA_SUCCESS'
    # whether the buffer need to be set
    UPDATE_BUFFER_FRAME_IDX_RELOAD_FLAG = 'UPDATE_BUFFER_FRAME_IDX_RELOAD_FLAG'
    # whether the pipeline need to relief for sometime
    UPDATE_RELIEF_FLAG = 'UPDATE_RELIEF_FLAG'
    # send alert message to the viewer
    UPDATE_ALERT_MESSAGE = 'UPDATE_ALERT_MESSAGE'
