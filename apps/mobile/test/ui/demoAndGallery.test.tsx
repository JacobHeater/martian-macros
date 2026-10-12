import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Gallery } from '../../src/gallery/Gallery';
import { DemoNotice } from '../../src/ui/DemoNotice';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** The demo's label and the component gallery. Carried over from demo_notice_test.dart and gallery_test.dart. */
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

describe('the gallery', () => {
  it('shows every palette, each with every kind of component', () => {
    const view = render(<Gallery />);
    const palettes = view.container.querySelectorAll('.gallery-title');
    expect([...palettes].map((title) => title.textContent)).toEqual(['martian', 'dark', 'light']);
    for (const kind of ['.mm-button', '.mm-field', '.mm-surface', '.mm-list-row', '.mm-progress', '.chart-plot']) {
      expect(view.container.querySelectorAll(kind).length, kind).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('reaching the gallery', () => {
  const today = CalendarDate.of(2026, 10, 5);

  async function settings(environment: string) {
    const repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
    renderApp(repos, today, { change: (services) => ({ ...services, environment }) });
    return openSettings();
  }

  it('Settings offers it in development', async () => {
    const shown = await settings('dev');
    await userEvent.click(shown.getByRole('button', { name: /^Component gallery/ }));
    expect(within(topLayer()).getAllByText('martian').length).toBeGreaterThan(0);
  });

  it('Settings hides it in production', async () => {
    const shown = await settings('prod');
    expect(shown.getByText('Martian Macros · prod')).toBeInTheDocument();
    expect(shown.queryByRole('button', { name: /^Component gallery/ })).not.toBeInTheDocument();
  });
});
