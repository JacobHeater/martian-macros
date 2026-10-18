import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarsCatalog } from '../../src/gallery/BarsCatalog';
import { ChartsCatalog } from '../../src/gallery/ChartsCatalog';
import { ComponentsCatalog } from '../../src/gallery/ComponentsCatalog';
import { IconsCatalog } from '../../src/gallery/IconsCatalog';
import { TokensCatalog } from '../../src/gallery/TokensCatalog';
import { mmIcons } from '../../src/ui/mmIcons';
import { DemoNotice } from '../../src/ui/DemoNotice';

/**
 * The demo's label and the design-system catalog. Carried over from
 * demo_notice_test.dart and gallery_test.dart; since MM-237 the catalog is
 * Storybook's, and these are its story components.
 */
describe('the demo notice', () => {
  it('synthetic identity stays visible above app content', () => {
    render(
      <DemoNotice>
        <p>Demo destination</p>
      </DemoNotice>,
    );
    const banner = screen.getByText('DEMO · Synthetic data');
    const content = screen.getByText('Demo destination');
    expect(banner.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('MM-182: the label is the palette’s own text on its own canvas, clear of the status bar', () => {
    // Every palette's text on its canvas is checked for contrast in tokens.test.ts.
    const css = readFileSync('src/ui/ui.css', 'utf8');
    const rule = /\.mm-demo-banner \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toContain('background: var(--canvas);');
    expect(rule).toContain('color: var(--text);');
    expect(rule).toContain('padding-top: env(safe-area-inset-top);');
  });
});

describe('the catalog', () => {
  it('shows every kind of component, chart and bar', () => {
    const view = render(
      <div className="theme-martian">
        <TokensCatalog />
        <ComponentsCatalog />
        <ChartsCatalog />
        <BarsCatalog />
      </div>,
    );
    // The 25 recorded colours, water, and the four grade fills with their ink (MM-370).
    expect(view.container.querySelectorAll('.gallery-swatch')).toHaveLength(31);
    for (const kind of ['.mm-button', '.mm-field', '.mm-surface', '.mm-list-row', '.mm-progress', '.chart-plot']) {
      expect(view.container.querySelectorAll(kind).length, kind).toBeGreaterThanOrEqual(1);
    }
  });

  it('names every icon beside its shape', () => {
    const view = render(<IconsCatalog />);
    const names = Object.keys(mmIcons);
    expect(view.container.querySelectorAll('.gallery-icon')).toHaveLength(names.length);
    for (const name of names) {
      expect(view.container.textContent, name).toContain(name);
    }
  });
});
