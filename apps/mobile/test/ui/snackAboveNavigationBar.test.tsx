import { readFileSync } from 'node:fs';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { MmNavigationBar } from '../../src/ui/MmNavigationBar';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-302: a snack stands above the navigation bar, never over it, and a
 * floating action rises above the snack. Nothing
 * lays out in the test browser, so this checks the two halves of the
 * contract: the bar says how tall it is while it is shown, and the snack
 * host's bottom is measured from that.
 */
const variable = '--mm-navigation-bar-height';

it('the navigation bar publishes its height while shown, and withdraws it when it goes', () => {
  const view = render(
    <MmNavigationBar destinations={[{ id: 'a', label: 'A', icon: 'home' }]} current="a" onSelect={() => undefined} />,
  );
  expect(document.documentElement.style.getPropertyValue(variable)).toMatch(/^\d+(\.\d+)?px$/);
  view.unmount();
  expect(document.documentElement.style.getPropertyValue(variable)).toBe('');
});

it('the snack host stands on the navigation bar’s height', () => {
  const css = readFileSync('src/ui/ui.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const host = /\.mm-snack-host\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  expect(host).toMatch(/bottom:\s*calc\(\s*var\(--mm-navigation-bar-height/);
});

it('while a snack shows, the floating action rises above it', async () => {
  let overlays: Overlays | undefined;
  function Grab() {
    overlays = useOverlays();
    return null;
  }
  render(
    <MmOverlays>
      <Grab />
    </MmOverlays>,
  );
  expect(document.documentElement.style.getPropertyValue('--mm-snack-clearance')).toBe('');
  act(() => overlays?.snack('Removed Oats', { label: 'Undo', onAction: () => undefined }));
  expect(document.documentElement.style.getPropertyValue('--mm-snack-clearance')).toMatch(/^\d+(\.\d+)?px$/);
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(document.documentElement.style.getPropertyValue('--mm-snack-clearance')).toBe('');
  const css = readFileSync('src/ui/ui.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const fab = /\.mm-fab\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  expect(fab).toMatch(/bottom:\s*calc\([^;]*var\(--mm-snack-clearance/);
});
