import { useEffect, useRef } from 'react';
import { useApp } from '../../app/useApp';
import { useNavigator } from '../../app/useNavigator';
import { useOverlays } from '../../ui/useOverlays';
import type { StoryStage } from './StoryStage';

/** Brings the app, once it is up, to the screen a story is about. Draws nothing. */
export function StoryOpener({ open }: { open: (stage: StoryStage) => void | Promise<void> }) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void open({ services, state, navigator, overlays, today: state.today.peek() });
  });
  return null;
}
