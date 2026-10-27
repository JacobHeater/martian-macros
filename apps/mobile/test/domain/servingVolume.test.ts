import { expect, it } from 'vitest';
import { PortionUnit } from '../../src/domain/food/portion/PortionUnit';
import { servingVolume } from '../../src/domain/food/portion/servingVolume';
import { servingForm } from '../../src/format/servingForm';

/** MM-636: a source's serving that is a measure of volume says how much it holds, in its own words. */
it('MM-636: a serving that begins with a measure of volume holds that much', () => {
  expect(servingVolume('1 cup, chopped')).toBe(PortionUnit.mlPerCup);
  expect(servingVolume('1/2 cup')).toBe(PortionUnit.mlPerCup / 2);
  expect(servingVolume('1 1/2 cups')).toBe(PortionUnit.mlPerCup * 1.5);
  expect(servingVolume('2 tbsp')).toBe(PortionUnit.mlPerTablespoon * 2);
  expect(servingVolume('1 tablespoon')).toBe(PortionUnit.mlPerTablespoon);
  expect(servingVolume('3 tsp')).toBe(PortionUnit.mlPerTeaspoon * 3);
  expect(servingVolume('8 fl oz')).toBe(PortionUnit.mlPerFluidOunce * 8);
  expect(servingVolume('250 ml')).toBe(250);
  expect(servingVolume('1 liter')).toBe(1000);
});

it('MM-636: a volume the source states in millilitres is the one taken, a label cup of 240 mL', () => {
  expect(servingVolume('1 cup (240 ml)')).toBe(240);
  expect(servingVolume('1 bottle (500mL)')).toBe(500);
});

it('MM-636: a serving that is not a volume holds none', () => {
  for (const words of ['1 medium', '1 slice', '100 g', '1 large egg', '1 cookie', '1 container (170 g)', 'cup']) {
    expect(servingVolume(words), words).toBeUndefined();
  }
});

it('MM-636: the form a serving names beyond its measure', () => {
  expect(servingForm('1 cup, chopped')).toBe('chopped');
  expect(servingForm('1 cup packed')).toBe('packed');
  expect(servingForm('1 cup')).toBeUndefined();
  expect(servingForm('8 fl oz')).toBeUndefined();
  expect(servingForm('1 cup (240 ml)')).toBeUndefined();
});
