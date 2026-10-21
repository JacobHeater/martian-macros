import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { privacyPolicy } from '../../src/terms/privacyPolicy';

/**
 * MM-95: the privacy policy names every request the app can make and none it
 * does not, and promises no more privacy than the app delivers. What the
 * barcode and label reader sends is not yet observed (MM-244), so the policy
 * must be true either way: it never says nothing leaves the phone.
 */
const textOn = (platform: 'android' | 'ios') =>
  [
    ...privacyPolicy.summaryOn(platform),
    ...privacyPolicy.sectionsOn(platform).flatMap((section) => [section.heading, ...section.paragraphs]),
  ].join(' ');
const android = textOn('android');
const ios = textOn('ios');
const both = `${android} ${ios}`;

/** Every network address the app's code can contact, by host, and the name the policy gives it. */
const named: Readonly<Record<string, string>> = {
  'world.openfoodfacts.org': 'Open Food Facts',
  'api.nal.usda.gov': 'USDA FoodData Central',
  'github.com': 'GitHub',
  // The public page (MM-247), which the phone's browser fetches when "On the web" is pressed, not the app (MM-454).
  'jacobheater.github.io': 'GitHub Pages',
};

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Hosts written as addresses in the app's code (not the gallery's or the fixtures'), and the food packs' address it is built with. */
function contactedHosts(): Set<string> {
  const hosts = new Set<string>();
  const src = resolve('src');
  for (const path of filesIn(src)) {
    const file = path.substring(src.length + 1);
    if (/^(gallery|fixtures)[/\\]/.test(file)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      if (/^\s*(\*|\/\/)/.test(line)) continue;
      for (const match of line.matchAll(/['"`]https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) hosts.add(match[1]!.toLowerCase());
    }
  }
  const config = JSON.parse(readFileSync('../../config/prod.json', 'utf8')) as Record<string, string>;
  for (const value of Object.values(config)) {
    const host = /^https?:\/\/([^/]+)/.exec(value)?.[1];
    if (host !== undefined) hosts.add(host.toLowerCase());
  }
  return hosts;
}

describe('the policy matches the app', () => {
  it('finds the addresses the code contacts', () => {
    expect(contactedHosts()).toContain('world.openfoodfacts.org');
    expect(contactedHosts()).toContain('github.com');
  });

  it('names every address the code contacts, on both phones; a new one is named here and in the policy first', () => {
    for (const host of contactedHosts()) {
      expect(named[host], `${host} is contacted but not named in the policy`).toBeDefined();
      expect(android).toContain(named[host]!);
      expect(ios).toContain(named[host]!);
    }
  });

  it('names the Google reader on Android, as Google describes it, and says it is not given the records', () => {
    expect(android).toMatch(/ML Kit/);
    expect(android).toContain('It is not given your records.');
    expect(ios).not.toMatch(/ML Kit|Health Connect/);
    expect(ios).toContain('software that is part of iOS');
  });

  it('says how a backup leaves the phone: encrypted, only when made, through the share sheet, to no service of ours', () => {
    expect(both).toContain('A backup is made only when you choose "Back up now" in Settings.');
    expect(both).toContain('The app itself connects to no storage service.');
    expect(android).toContain('Android’s share menu');
    expect(ios).toContain('the iPhone’s share sheet');
  });

  it('says the public page is opened in the phone’s browser, which fetches it, not the app', () => {
    expect(both).toContain('The browser fetches it, not the app');
    expect(contactedHosts()).toContain('jacobheater.github.io');
  });

  it('names the health platform of each phone, read only', () => {
    expect(android).toContain('It never writes to Health Connect.');
    expect(ios).toContain('It never writes to Apple Health.');
  });
});

describe('what the policy never says', () => {
  it.each([
    ['that nothing leaves the phone', /nothing (is |ever )?(uploaded|leaves|sent)|never leaves?|only thing/i],
    ['that anything is safe or secure, as an assurance', /\bsafe(ly|ty)?\b|\bsecure(ly)?\b/i],
    ['that anything is guaranteed', /guarant/i],
    ['a law it has not been checked against', /HIPAA|GDPR|compliant/i],
  ])('%s', (_what, pattern) => {
    expect(both).not.toMatch(pattern);
  });
});

describe('the draft', () => {
  it('leaves the legal blanks visible for the attorney', () => {
    expect(both).toContain('[legal name of the developer, to be added]');
    expect(both).toContain('[contact address, to be added]');
  });

  it('is numbered in order, the same sections on both phones, each with something to say', () => {
    const onAndroid = privacyPolicy.sectionsOn('android');
    const onIos = privacyPolicy.sectionsOn('ios');
    expect(onIos).toHaveLength(onAndroid.length);
    onAndroid.forEach((section, index) => {
      expect(section.heading.startsWith(`${index + 1}. `), section.heading).toBe(true);
      expect(section.paragraphs.length).toBeGreaterThan(0);
      expect(onIos[index]!.paragraphs).toHaveLength(section.paragraphs.length);
    });
    expect(privacyPolicy.sections).toEqual(onAndroid);
  });

  it('keeps the short account to six points', () => {
    expect(privacyPolicy.summaryOn('android').length).toBeLessThanOrEqual(6);
    expect(privacyPolicy.summaryOn('ios').length).toBeLessThanOrEqual(6);
  });
});
