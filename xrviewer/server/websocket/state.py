class State:
    """A group of values that describes and controls the animation.

    Small memory usage but frequently queried and updated.
    """

    def __init__(self):
        self.is_playing = False
        self.buffer_frame_idx = 0
        self.n_frames = 0
        self.should_update_stream_data = False
        self.is_buffer_open = True
        self.buffer_frame_idx_reload_flag = False
        self.relief_flag = False


class StreamBuffer:
    """Temporarily stores the stream data from the viewer.

    Occupies relatively large memory whereas not frequently queried or updated.
    """

    def __init__(self):
        self.stream_data = None
