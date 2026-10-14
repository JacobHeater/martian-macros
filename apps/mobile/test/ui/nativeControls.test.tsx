import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MmCheckRow } from '../../src/ui/MmCheckRow';
import { MmSlider } from '../../src/ui/MmSlider';
import { rules } from '../support/stylesheetRules';

/**
 * MM-266: the check box and the slider are drawn by the design system. The
 * native control underneath has no appearance of its own, and no rule
 * anywhere tints an engine-drawn control with accent-color.
 */
const css = readFileSync('src/ui/ui.css', 'utf8');
const ui = rules(css);
const body = (selector: string) => ui.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join('\n');

describe('the check box', () => {
  it('has no native appearance, and draws our check glyph when checked', () => {
    expect(body('.mm-checkbox')).toMatch(/appearance: none/);
    expect(body('.mm-checkbox:checked')).toMatch(/background: var\(--ember\)/);
    const { container, rerender } = render(<MmCheckRow title="Thyroid condition" value onChange={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: 'Thyroid condition' })).toBeChecked();
    expect(container.querySelector('.mm-check-mark svg')).not.toBeNull();
    rerender(<MmCheckRow title="Thyroid condition" value={false} onChange={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: 'Thyroid condition' })).not.toBeChecked();
  });
});

describe('the slider', () => {
  it('has no native appearance; its track, filled part and thumb are drawn here', () => {
    expect(body('.mm-slider')).toMatch(/appearance: none/);
    expect(body('.mm-slider::-webkit-slider-runnable-track')).toMatch(/var\(--track\)/);
    expect(body('.mm-slider::-webkit-slider-runnable-track')).toMatch(/var\(--ember\)/);
    expect(body('.mm-slider::-webkit-slider-thumb')).toMatch(/width: 20px;[\s\S]*height: 20px;[\s\S]*background: var\(--ember\)/);
    expect(body('.mm-slider::-moz-range-thumb')).toMatch(/background: var\(--ember\)/);
    expect(body('.mm-slider:focus-visible::-webkit-slider-thumb')).toMatch(/outline: 2px solid var\(--text\)/);
    expect(body('.mm-slider')).toMatch(/min-height: 48px/);
  });

  it('speaks its value and carries the filled part as a share of the track', () => {
    render(<MmSlider name="Pace" value={0.75} min={0} max={1} divisions={4} label="0.75% a week" onChange={() => undefined} />);
    const slider = screen.getByRole('slider', { name: 'Pace' });
    expect(slider).toHaveAttribute('aria-valuetext', '0.75% a week');
    expect(slider.getAttribute('style')).toContain('--mm-slider-fill: 75%');
  });
});

it('no stylesheet uses accent-color', () => {
  expect(css).not.toMatch(/accent-color/);
});
