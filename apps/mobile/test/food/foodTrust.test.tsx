import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { TrustTier } from '../../src/foodCatalog/TrustTier';
import { FoodTrustMark } from '../../src/food/FoodTrustMark';
import { roundedToZeroNote } from '../../src/format/roundedToZeroNote';

/** MM-153: where a food's numbers came from, in words, and no false "verified". Carried over from food_trust_test.dart. */
const food = (source: string, tier: TrustTier, kcal = 100) =>
  new CatalogFood({
    id: 1,
    packId: 'p',
    name: 'Oats',
    kcal,
    proteinG: 10,
    carbsG: 10,
    fatG: 5,
    source,
    tier,
    tierReason: 'Energy and macros barely agree: compare with the package.',
  });

it('a reference food names its source and tier only', () => {
  render(<FoodTrustMark food={food('usda_foundation', 'reference')} />);
  expect(screen.getByText(/USDA, lab-analyzed/)).toBeInTheDocument();
  expect(screen.getByText('Reference')).toBeInTheDocument();
  expect(screen.queryByText(/compare with the package/)).not.toBeInTheDocument();
});

it('a doubtful food is marked Check this with the reason', () => {
  render(<FoodTrustMark food={food('off', 'checkThis')} />);
  expect(screen.getByText(/Community label \(Open Food Facts\)/)).toBeInTheDocument();
  expect(screen.getByText('Check this')).toBeInTheDocument();
  expect(screen.getByText(/compare with the package/)).toBeInTheDocument();
});

it('no tier or source is described as verified', () => {
  for (const tier of TrustTier.values) {
    for (const source of ['usda_foundation', 'usda_sr_legacy', 'usda_branded', 'off', 'other']) {
      const view = render(<FoodTrustMark food={food(source, tier)} />);
      expect(view.container.textContent?.toLowerCase(), `${source} ${tier}`).not.toContain('verif');
      cleanup();
    }
  }
});

describe('rounded to zero', () => {
  it('a 0 kcal spray serving gets the note', () => {
    expect(roundedToZeroNote(food('off', 'label', 0), { description: '1 spray', grams: 0.25 })).toContain(
      'round small servings to zero',
    );
  });

  it('a normal serving does not', () => {
    expect(roundedToZeroNote(food('off', 'label'), { description: '1 cup', grams: 240 })).toBeUndefined();
  });

  it('a tiny but energy-dense serving does not', () => {
    expect(roundedToZeroNote(food('off', 'label', 900), { description: 'tsp', grams: 4 })).toBeUndefined();
  });
});
