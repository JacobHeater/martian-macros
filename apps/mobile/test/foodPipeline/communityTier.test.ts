import { describe, expect, it } from 'vitest';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { CommunityReviewRule } from '../../src/foodPipeline/CommunityReviewRule';
import { packEntryFor } from '../../src/foodPipeline/packEntryFor';

/**
 * MM-153: a community record is a label when it is complete and comfortably
 * consistent, and "Check this" with its reason when it passes the energy check
 * only near its edge, leaves out fiber or sodium, or is five years old. No
 * food is ever called verified.
 */
const now = 1_790_000_000;
const community = (over: Partial<ConstructorParameters<typeof CandidateFood>[0]> = {}) =>
  new CandidateFood({
    source: 'off',
    sourceId: '1',
    kind: 'barcode',
    name: 'Granola',
    rawBarcode: '0737628064502',
    kcal: 400,
    proteinG: 10,
    carbsG: 60,
    fatG: 13.3,
    fiberG: 6,
    sodiumMg: 200,
    updatedAt: now - 3600,
    ...over,
  });
const tierOf = (food: CandidateFood) => packEntryFor(food, { id: 1, packId: 'p', asOfSeconds: now }).food;

describe('a community record', () => {
  it('complete and comfortably consistent is a label, and says nobody checked it', () => {
    const food = tierOf(community());
    expect(food.tier).toBe('label');
    expect(food.tierReason).toMatch(/nobody checked it\.$/);
    expect(food.tierReason).not.toMatch(/verified/i);
  });

  it('whose energy differs from its macros by 14% is "Check this", with the reason (the acceptance scenario)', () => {
    // The macros imply 400 kcal; 456 is 14% over, inside the 15% check, past the near-tolerance line.
    const food = tierOf(community({ kcal: 456 }));
    expect(food.tier).toBe('checkThis');
    expect(food.tierReason).toBe('Its calories and macros only just agree. Compare it with the package.');
  });

  it('a few kcal off on a tiny food is not marked, since rounding alone moves the ratio', () => {
    const food = tierOf(community({ kcal: 14, proteinG: 0, carbsG: 3, fatG: 0, fiberG: 0 }));
    expect(food.tier).toBe('label');
    expect(CommunityReviewRule.nearToleranceKcal).toBe(20);
  });

  it('leaving out fiber or sodium is "Check this"', () => {
    expect(tierOf(community({ fiberG: undefined })).tierReason).toMatch(/leaves out fiber or sodium/);
    expect(tierOf(community({ sodiumMg: undefined })).tier).toBe('checkThis');
  });

  it('unchanged for more than five years before the data it came with is "Check this"', () => {
    const old = tierOf(community({ updatedAt: now - CommunityReviewRule.staleSeconds - 1 }));
    expect(old.tier).toBe('checkThis');
    expect(old.tierReason).toMatch(/more than five years/);
    expect(tierOf(community({ updatedAt: now - CommunityReviewRule.staleSeconds + 86_400 })).tier).toBe('label');
  });

  it('a disagreement with another source still wins over everything', () => {
    const food = packEntryFor(community(), { id: 1, packId: 'p', asOfSeconds: now, disagreement: 'Two sources disagree.' }).food;
    expect(food.tier).toBe('checkThis');
    expect(food.tierReason).toBe('Two sources disagree.');
  });
});
