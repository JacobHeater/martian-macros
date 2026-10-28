import type { CSSProperties } from 'react';
import { MmIcon } from './MmIcon';
import type { PullState } from './PullState';
import './ui.css';

const words: Readonly<Record<PullState['phase'], string>> = {
  idle: '',
  pulling: 'Pull to refresh',
  ready: 'Let go to refresh',
  refreshing: 'Refreshing…',
};

/**
 * What a pull to refresh shows (MM-670): a strip at the top of the body, as
 * tall as the pull, with the sync mark and a word on where the pull is. It
 * takes no room when there is no pull. The gesture is `usePullToRefresh`.
 */
export function MmPullToRefresh({ pull }: { pull: PullState }) {
  const style = { '--mm-pull': `${pull.distance}px` } as CSSProperties;
  return (
    <div className="mm-pull" data-phase={pull.phase} data-distance={pull.distance} style={style}>
      <span className="mm-pull-mark" aria-hidden="true">
        <MmIcon name="sync" size={20} />
      </span>
      {/* A status only while there is one to say: idle, it is no live region at all. */}
      {pull.phase === 'idle' ? (
        <span className="mm-pull-words" />
      ) : (
        <span className="mm-pull-words" role="status">
          {words[pull.phase]}
        </span>
      )}
    </div>
  );
}
