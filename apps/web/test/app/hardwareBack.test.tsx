import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { NavigatorHost } from '../../src/app/NavigatorHost';
import type { Navigator } from '../../src/app/Navigator';
import { useNavigator } from '../../src/app/useNavigator';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-232: what the phone's back button leans on. It answers the question
 * on top first, then closes the screen on top, and only with nothing left
 * does the app itself go to the background.
 */
function Probe({ seen }: { seen: { navigator?: Navigator; overlays?: Overlays } }) {
  seen.navigator = useNavigator();
  seen.overlays = useOverlays();
  return <p>home</p>;
}

it('closeTop answers the question first, then the screen, then nothing is left', async () => {
  const seen: { navigator?: Navigator; overlays?: Overlays } = {};
  render(
    <MmOverlays>
      <NavigatorHost>
        <Probe seen={seen} />
      </NavigatorHost>
    </MmOverlays>,
  );

  const first = seen.navigator!.push((close) => <p>first {String(typeof close)}</p>);
  void first;
  seen.navigator!.push(() => <p>second screen</p>);
  await screen.findByText('second screen');

  const sheet = seen.overlays!.sheet('A question', () => <p>the question</p>);
  await screen.findByText('the question');

  // The question goes first, and the sheet answers as dismissed.
  expect(seen.overlays!.closeTop()).toBe(true);
  expect(await sheet).toBeUndefined();
  expect(seen.overlays!.closeTop()).toBe(false);

  // Then the screen on top; the one underneath is still there.
  expect(seen.navigator!.closeTop()).toBe(true);
  await waitFor(() => expect(screen.queryByText('second screen')).toBeNull());
  expect(screen.getByText(/^first/)).toBeInTheDocument();

  // And with everything closed, there is nothing left to close.
  expect(seen.navigator!.closeTop()).toBe(true);
  await waitFor(() => expect(seen.navigator!.closeTop()).toBe(false));
});
