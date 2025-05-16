import {
  Button, Box, Grid, TextField,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

// XXX: Using 'Item' defined in the ../Common/UIComponents
// will make the auto-alginment of UI lose effect. Need to
// figure out why this happens.
const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(0),
  textAlign: 'center',
}));

export function StreamedTimelinePanel() {
  const isPlaying = useSelector(
    (state) => state.streaming.isPlaying,
  );

  const frameIndex = useSelector(
    (state) => state.streaming.frameIndex,
  );

  const minimumPlayableFrame = useSelector(
    (state) => state.streaming.minimumPlayableFrame,
  );

  const frameRate = useSelector(
    (state) => state.streaming.frameRate,
  );

  const maxBufferSize = useSelector(
    (state) => state.streaming.maxBufferSize,
  );

  const [sliderFrameIndex, setSliderFrameIndex] = React.useState(frameIndex);

  const numFrames = useSelector(
    (state) => state.streaming.numFrames,
  );

  const dispatch = useDispatch();

  const setPlaying = (_isPlaying: Boolean) => {
    dispatch({
      type: 'write',
      path: 'streaming/isPlaying',
      data: _isPlaying,
    });
  };

  React.useEffect(() => {
    setSliderFrameIndex(frameIndex);
  }, [frameIndex]);

  return (
    <div className="animation-panel">
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={0}
                    // justifyContent="center"
          alignItems="center"
        >
          <Grid item xs={1}>
            <Item
              elevation={0}
            >
              {
                isPlaying ? (
                  <Button
                    className="StreamedAnimationPanel-playingBtn"
                    variant="outlined"
                    onClick={() => {
                      setPlaying(false);
                    }}
                    size="small"
                  >
                    <PauseIcon />
                  </Button>
                ) : (
                  <Button
                    className="StreamedAnimationPanel-pauseBtn"
                    variant="outlined"
                    onClick={() => {
                      setPlaying(true);
                    }}
                    size="small"
                  >
                    <PlayArrowIcon />
                  </Button>
                )
              }
            </Item>
          </Grid>

          <Grid item xs={10}>
            <Item
              elevation={0}
            >
              <input
                className="StreamedAnimationPanel-slider"
                type="range"
                min={0}
                max={numFrames - 1}
                onChange={(event) => {
                  const targetFrameIndex = event.target.value;
                  setSliderFrameIndex(targetFrameIndex);
                  dispatch({
                    type: 'write',
                    path: 'streaming/bufferHeadFrameIndex',
                    data: targetFrameIndex,
                  });

                  dispatch({
                    type: 'write',
                    path: 'streaming/shouldClearBuffer',
                    data: true,
                  });
                }}
                value={sliderFrameIndex}
                step={1}
              />
            </Item>
          </Grid>

          <Grid item xs={1}>
            <Item elevation={0}>
              <b>
                {Math.round(frameIndex)}
                /
                {Math.round((Number(numFrames) - 1 > 0) ? numFrames - 1 : 0)}
              </b>
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <b>Frame cached: </b>
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <font id="frameCached">0</font>
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <b>Minimum Playable: </b>
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <TextField
                id="minimumPlayableFrame"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                margin="none"
                value={minimumPlayableFrame}
                onChange={(event) => {
                  let targetMinimumPlayableFrame = Number(event.target.value);
                  if (targetMinimumPlayableFrame > Number(maxBufferSize)) {
                    targetMinimumPlayableFrame = maxBufferSize;
                  }
                  dispatch({
                    type: 'write',
                    path: 'streaming/minimumPlayableFrame',
                    data: targetMinimumPlayableFrame,
                  });
                }}
                variant="standard"
              />
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <b>Frame Rate: </b>
            </Item>
          </Grid>

          <Grid item xs={2}>
            <Item elevation={0}>
              <TextField
                id="frameRate"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                value={frameRate}
                margin="none"
                onChange={(event) => {
                  let targetFrameRate = Number(event.target.value);
                  if (targetFrameRate > 240) {
                    targetFrameRate = 240;
                  } else if (targetFrameRate < 1) {
                    targetFrameRate = 1;
                  }
                  dispatch({
                    type: 'write',
                    path: 'streaming/frameRate',
                    data: targetFrameRate,
                  });
                }}
                variant="standard"
              />
            </Item>
          </Grid>
        </Grid>
      </Box>

    </div>
  );
}
