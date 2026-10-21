import { describe, expect, it } from 'vitest';
import { Fmt } from '../../src/format/Fmt';
import { legalPageHtml } from '../../src/terms/legalPageHtml';
import { privacyPolicy } from '../../src/terms/privacyPolicy';
import { termsOfUse } from '../../src/terms/termsOfUse';

/**
 * MM-247: the public page the stores link to is built from the app's own
 * terms and policy, on both phones, and loads nothing from anywhere.
 */
const html = legalPageHtml();
const escaped = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

describe('one source', () => {
  it('carries the terms’ version and effective date, and the policy’s', () => {
    expect(html).toContain(`Version ${termsOfUse.version}, in effect from ${Fmt.longDate(termsOfUse.effectiveOn)}.`);
    expect(html).toContain(`Version ${privacyPolicy.version}, in effect from ${Fmt.longDate(privacyPolicy.effectiveOn)}.`);
  });

  it.each(['android', 'ios'] as const)('carries every sentence the app shows on %s, word for word', (platform) => {
    const texts = [
      ...termsOfUse.summary,
      ...termsOfUse.sectionsOn(platform).flatMap((section) => section.paragraphs),
      ...privacyPolicy.summaryOn(platform),
      ...privacyPolicy.sectionsOn(platform).flatMap((section) => section.paragraphs),
    ];
    for (const text of texts) expect(html, text).toContain(escaped(text));
  });

  it('labels what differs between the phones', () => {
    expect(html).toContain('<strong>On Android:</strong>');
    expect(html).toContain('<strong>On iPhone:</strong>');
  });
});

describe('nothing fetched', () => {
  it('has no script, no linked stylesheet, font or image, and no address to load', () => {
    expect(html).not.toMatch(/<(script|link|img|iframe|source|object|embed)\b/i);
    expect(html).not.toMatch(/@import|url\(|@font-face/i);
    expect(html).not.toMatch(/\b(src|href)\s*=\s*["']?(https?:)?\/\//i);
  });

  it('forbids loading anything, in case a later change forgets', () => {
    expect(html).toContain(`content="default-src 'none'; style-src 'unsafe-inline'"`);
  });
});

describe('the draft', () => {
  it('says above everything that it is a draft not in effect, until the attorney’s review is recorded', () => {
    expect(html.indexOf('Draft, not yet in effect.')).toBeGreaterThan(0);
    expect(html.indexOf('Draft, not yet in effect.')).toBeLessThan(html.indexOf('id="terms"'));
  });
});
