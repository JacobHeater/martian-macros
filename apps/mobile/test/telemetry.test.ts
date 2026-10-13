import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MM-243: the developer tools this app is built with report usage to their
 * makers unless told not to. The app itself fetches one thing, ever; the
 * tools around it send nothing either. Both opt-outs are read here as they
 * are written, since neither tool can be asked without running it.
 */
const scripts = (JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }).scripts;

describe('Storybook', () => {
  const main = readFileSync('.storybook/main.ts', 'utf8');

  it('sends no telemetry and no crash reports', () => {
    expect(main).toMatch(/disableTelemetry:\s*true/);
    expect(main).toMatch(/enableCrashReports:\s*false/);
  });

  it('fetches no news and checks for no new version', () => {
    expect(main).toMatch(/disableWhatsNewNotifications:\s*true/);
    expect(scripts['storybook']).toContain('--no-version-updates');
  });
});

describe('Capacitor', () => {
  it('is opted out before every command of its CLI the scripts run', () => {
    const running = Object.entries(scripts).filter(([, script]) => /\bcap\s+(?!telemetry\b)\w+/.test(script));
    expect(running.length).toBeGreaterThan(0);
    for (const [name, script] of running) {
      const optOut = script.indexOf('cap telemetry off');
      const first = script.search(/\bcap\s+(?!telemetry\b)\w+/);
      expect(optOut, `"${name}" runs cap without opting out first`).toBeGreaterThanOrEqual(0);
      expect(optOut, `"${name}" opts out after it has already run cap`).toBeLessThan(first);
    }
  });
});
