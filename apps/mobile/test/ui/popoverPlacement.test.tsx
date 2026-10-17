import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MmPopover } from '../../src/ui/MmPopover';

/**
 * MM-372: a popover opened from a trigger near the middle of a phone's
 * width hung off the left edge, so its explanation could not be read. The
 * bubble stays at least 16 px inside both edges, wherever its trigger is.
 */
afterEach(() => vi.unstubAllGlobals());

function placed(innerWidth: number, anchor: { left: number; right: number }) {
  vi.stubGlobal('innerWidth', innerWidth);
  vi.stubGlobal('innerHeight', 915);
  render(<MmPopover title="Can’t be graded" message="Why." anchor={{ top: 100, bottom: 148, ...anchor }} onDone={() => undefined} />);
  const style = screen.getByRole('dialog').style;
  const width = Math.min(300, innerWidth - 32);
  const right = Number.parseFloat(style.right);
  return { left: innerWidth - right - width, right };
}

describe('a popover', () => {
  it('stays inside the left edge when its trigger is in the middle of the screen (MM-372)', () => {
    // The Snacks header's question mark, as the panel found it.
    const { left, right } = placed(412, { left: 236, right: 284 });
    expect(left).toBeGreaterThanOrEqual(16);
    expect(right).toBeGreaterThanOrEqual(16);
  });

  it('stays inside both edges on a narrow phone', () => {
    const { left, right } = placed(320, { left: 120, right: 168 });
    expect(left).toBeGreaterThanOrEqual(16);
    expect(right).toBeGreaterThanOrEqual(16);
  });

  it('still hangs under the end of a trigger at the right edge', () => {
    const { right } = placed(412, { left: 348, right: 396 });
    expect(right).toBe(16);
  });
});
