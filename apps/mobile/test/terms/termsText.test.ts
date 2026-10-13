import { describe, expect, it } from 'vitest';
import { termsOfUse } from '../../src/terms/termsOfUse';

/**
 * MM-242: what the terms have to say and must never say, from the expert
 * panel's guidance (docs/agent-runs/mm242-eula). A disclaimer cannot
 * rescue a claim that contradicts it, and terms must not promise more
 * privacy than the app delivers, so the words themselves are tested.
 */
const summary = termsOfUse.summary.join(' ');
const full = termsOfUse.sections.flatMap((section) => [section.heading, ...section.paragraphs]).join(' ');
const everything = `${summary} ${full}`;

describe('the short account', () => {
  it('is six sentences or fewer', () => {
    expect(termsOfUse.summary.length).toBeLessThanOrEqual(6);
  });

  it('carries the facts that matter for safety by itself, since most people read no further', () => {
    expect(summary).toMatch(/not medical advice/);
    expect(summary).toMatch(/not a medical device/);
    expect(summary).toMatch(/estimates/);
    expect(summary).toMatch(/talk to your clinician/);
    expect(summary).toMatch(/call 911/);
    expect(summary).toMatch(/your decision/);
    expect(summary).toMatch(/18 and over/);
  });
});

describe('the full terms', () => {
  it('say what a general wellness app must, in the words the store asks for', () => {
    expect(full).toContain('It does not diagnose, treat, cure or prevent any disease or condition');
    expect(full).toContain('No health professional reviews your information or your numbers.');
    expect(full).toContain('Those limits are not medical clearance, and the questions do not cover everything.');
    expect(full).toContain('We do not promise that you will lose fat, gain muscle or reach any weight in any time.');
  });

  it('say only what the app does with records, and nothing absolute it cannot keep to', () => {
    expect(full).toContain('The app does not send your records anywhere.');
    // The scanner is Google's, and Google says it reports on itself: no "nothing ever leaves this phone".
    expect(full).toMatch(/ML Kit/);
    expect(everything).not.toMatch(/nothing (is|ever) (uploaded|leaves)/i);
    expect(everything).not.toMatch(/never leaves?/i);
    // No protection the app does not add, and no promise of a feature that is not built.
    expect(everything).not.toMatch(/encrypt|securely|HIPAA|backed up|backup/i);
  });

  it('are numbered in order, each section with something to say', () => {
    termsOfUse.sections.forEach((section, index) => {
      expect(section.heading.startsWith(`${index + 1}. `), section.heading).toBe(true);
      expect(section.paragraphs.length).toBeGreaterThan(0);
    });
  });
});

describe('what the terms never say', () => {
  it.each([
    ['prescribes anything', /prescri/i],
    ['guarantees anything', /guarant/i],
    ['is safe, as an assurance', /\bsafe(ly|ty)?\b/i],
    ['is clinically anything, or approved by anyone', /clinically|doctor-approved|dietitian-designed|FDA/i],
    ['has patients, therapy or a plan of treatment', /\bpatients?\b|therapy|treatment/i],
    ['blames the person', /at your own risk|solely responsible|misuse|non-compliance|violation/i],
    ['names a helpline nobody has checked', /\b988\b|helpline|hotline/i],
  ])('that the app %s', (_what, pattern) => {
    expect(everything).not.toMatch(pattern);
  });

  it('use "treat", "cure" and "diagnose" only to say what the app does not do', () => {
    for (const sentence of everything.split(/(?<=\.)\s+/)) {
      if (/\b(treat|cure|diagnose)/i.test(sentence)) expect(sentence, sentence).toMatch(/does not|not medical advice/);
    }
  });
});
