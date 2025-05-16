import { Button, Box, Grid } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Item } from '../Common/UIComponents';

export function LocalTimelinePanel() {
  const isPlaying = useSelector(
    (state) => state.local.isPlaying,
  );

  const frameIndex = useSelector(
    (state) => state.local.frameIndex,
  );

  const frameEnd = useSelector(
    (state) => state.local.frameEnd,
  );

  const dispatch = useDispatch();

  const setPlaying = (_isPlaying: Boolean) => {
    dispatch({
      type: 'write',
      path: 'local/isPlaying',
      data: _isPlaying,
    });
  };

  return (
    <div className="animation-panel">
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={0}
          alignItems="center"
        >
          <Grid item xs={1}>
            <Item
              elevation={0}
            >
              {
                isPlaying ? (
                  <Button
                    className="SidePanel-refresh-page"
                    variant="outlined"
                    onClick={() => {
                      setPlaying(false);
                    }}
                  >
                    <PauseIcon />
                  </Button>
                ) : (
                  <Button
                    className="SidePanel-refresh-page"
                    variant="outlined"
                    onClick={() => {
                      setPlaying(true);
                    }}
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
                className="LocalAnimationPanel-slider"
                type="range"
                min={0}
                max={frameEnd}
                onChange={(event) => {
                  dispatch({
                    type: 'write',
                    path: 'local/frameIndex',
                    data: event.target.value,
                  });

                  dispatch({
                    type: 'write',
                    path: 'local/instantFrame',
                    data: true,
                  });
                }}
                value={frameIndex}
                step={1}
              />
            </Item>
          </Grid>

          <Grid item xs={1}>
            <Item elevation={0}>
              <b>
                {Math.round(frameIndex)}
                /
                {Math.round(frameEnd)}
              </b>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}
