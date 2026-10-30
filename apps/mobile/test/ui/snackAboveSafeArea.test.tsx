import { readFileSync } from 'node:fs';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { MmOverlays } from '../../src/ui/MmOverlays';
import type { Overlays } from '../../src/ui/Overlays';
import { useOverlays } from '../../src/ui/useOverlays';

/**
 * MM-302, MM-711: a snack stands above the phone's own safe area at the
 * bottom (the bar it once stood on is gone), and a floating action rises
 * above the snack. Nothing lays out in the test browser, so this reads the
 * rules.
 */
const css = () => readFileSync('src/ui/ui.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

it('the snack host stands on the safe area, never on a bar', () => {
  const host = /\.mm-snack-host\s*\{([^}]*)\}/.exec(css())?.[1] ?? '';
  expect(host).toMatch(/bottom:\s*calc\(\s*env\(safe-area-inset-bottom/);
  expect(css()).not.toMatch(/--mm-navigation-bar-height/);
});

it('the floating action hangs over the body’s end, on the safe area', () => {
  const app = readFileSync('src/app/app.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const anchor = /\.app-fab-anchor\s*\{([^}]*)\}/.exec(app)?.[1] ?? '';
  expect(anchor).toMatch(/bottom:\s*env\(safe-area-inset-bottom/);
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
  const fab = /\.mm-fab\s*\{([^}]*)\}/.exec(css())?.[1] ?? '';
  expect(fab).toMatch(/bottom:\s*calc\([^;]*var\(--mm-snack-clearance/);
});
