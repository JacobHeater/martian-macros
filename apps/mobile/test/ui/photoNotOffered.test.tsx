import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { fixturePhotoJpeg } from '../../src/fixtures/fixturePhotoJpeg';
import { MmCameraPreview } from '../../src/ui/MmCameraPreview';
import { MmPhoto } from '../../src/ui/MmPhoto';

/**
 * MM-157 (the panel's privacy finding 1): a progress photo is a plain image
 * in a web view, which offers "Save to Photos", "Share" and dragging out on
 * a long press unless told not to. Neither a photo nor the faint last photo
 * over the camera is offered: no callout, no selection, no drag, and the
 * context menu is cancelled. Nothing lays out in the test browser, so the
 * rules are read from the design system's stylesheet.
 */
function rules(css: string): { selectors: string[]; body: string }[] {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(',').map((selector) => selector.trim()),
    body: match[2]!,
  }));
}

const css = rules(readFileSync('src/ui/ui.css', 'utf8'));

it.each(['.mm-photo', '.mm-camera', '.mm-camera-overlay'])('%s offers no callout, selection or drag', (selector) => {
  const body = css
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
    .join(';');
  expect(body).toMatch(/-webkit-touch-callout:\s*none/);
  expect(body).toMatch(/(?:^|[;\s])user-select:\s*none/);
  expect(body).toMatch(/-webkit-user-select:\s*none/);
  expect(body).toMatch(/-webkit-user-drag:\s*none/);
});

it('a photo cannot be dragged, and its context menu is cancelled', () => {
  render(<MmPhoto jpeg={fixturePhotoJpeg} label="Front photo, October 5, 2026" />);
  const photo = screen.getByRole('img', { name: 'Front photo, October 5, 2026' });
  expect(photo).toHaveAttribute('draggable', 'false');
  expect(photo).toHaveClass('mm-photo');
  expect(fireEvent.contextMenu(photo), 'the menu is cancelled').toBe(false);
});

it('the faint last photo over the camera cannot be dragged, and its context menu is cancelled', () => {
  render(<MmCameraPreview attach={undefined} overlay={fixturePhotoJpeg} overlayLabel="Your last front photo" />);
  const overlay = screen.getByRole('img', { name: 'Your last front photo' });
  expect(overlay).toHaveAttribute('draggable', 'false');
  expect(fireEvent.contextMenu(overlay)).toBe(false);
  expect(fireEvent.contextMenu(screen.getByLabelText('The camera’s picture'))).toBe(false);
});
