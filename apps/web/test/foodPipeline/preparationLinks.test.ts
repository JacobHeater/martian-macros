import { expect, it } from 'vitest';
import { preparationLinks } from '../../src/foodPipeline/preparationLinks';

/** MM-151: raw and cooked versions of one food are linked, using USDA's names. */
it('rice raw and cooked pair both ways', () => {
  const links = preparationLinks([
    'Rice, white, long-grain, regular, raw, enriched',
    'Rice, white, long-grain, regular, enriched, cooked',
    'Oats',
  ]);
  expect(links[0]?.state).toBe('raw');
  expect(links[0]?.pairIndex).toBe(1);
  expect(links[1]?.state).toBe('cooked');
  expect(links[1]?.pairIndex).toBe(0);
  expect(links[2]?.state).toBe('unspecified');
  expect(links[2]?.pairIndex).toBeUndefined();
});

it('a food with one state has no pair and says which state it is', () => {
  const links = preparationLinks(['Beef, ground, raw', 'Bread, white']);
  expect(links[0]?.state).toBe('raw');
  expect(links[0]?.pairIndex).toBeUndefined();
  expect(links[1]?.state).toBe('unspecified');
});

it('several cooked entries: the raw one points to the plain method', () => {
  const links = preparationLinks([
    'Potatoes, russet, raw',
    'Potatoes, russet, baked',
    'Potatoes, russet, cooked, boiled',
    'Potatoes, russet, cooked, fried',
  ]);
  // Only entries that say cooked or raw have a state.
  expect(links[0]?.pairIndex, 'boiled is preferred').toBe(2);
  expect(links[2]?.pairIndex).toBe(0);
  expect(links[3]?.pairIndex).toBe(0);
  expect(links[1]?.state).toBe('unspecified');
});

it('dry counts as the uncooked state', () => {
  const links = preparationLinks(['Pasta, dry, enriched', 'Pasta, cooked, enriched']);
  expect(links[0]?.state).toBe('raw');
  expect(links[0]?.pairIndex).toBe(1);
  expect(links[1]?.pairIndex).toBe(0);
});

it('different foods never pair', () => {
  const links = preparationLinks(['Rice, white, raw', 'Rice, brown, cooked']);
  expect(links[0]?.pairIndex).toBeUndefined();
  expect(links[1]?.pairIndex).toBeUndefined();
});
