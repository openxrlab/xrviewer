import React from 'react';
import { useSelector } from 'react-redux';
import { LocalTimelinePanel } from './LocalTimelinePanel';
import { StreamedTimelinePanel } from './StreamedTimelinePanel';

export function TimelinePanel() {
  const mode = useSelector(
    (state) => state.mode,
  );

  return (
    <div>
      {
        (mode === 'local')
        && <LocalTimelinePanel />
      }
      {
        (mode === 'streaming')
        && <StreamedTimelinePanel />
      }
    </div>
  );
}
