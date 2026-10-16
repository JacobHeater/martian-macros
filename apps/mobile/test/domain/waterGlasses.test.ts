import { describe, expect, it } from 'vitest';
import { waterGlasses } from '../../src/domain/water/waterGlasses';
import { WaterUnits } from '../../src/domain/water/WaterUnits';
import { glassesLabel } from '../../src/format/glassesLabel';

/** MM-326: the day's water as glasses of the goal. */
describe('waterGlasses', () => {
  it('a gallon is 16 glasses of 8 fl oz, not 17 after the conversion', () => {
    expect(waterGlasses(WaterUnits.flOzToMl(24), WaterUnits.flOzToMl(128), 'imperial')).toEqual({ drunk: 3, of: 16 });
  });

  it('a goal between glasses rounds up; 6 L is 24 glasses in metric and 26 in imperial', () => {
    expect(waterGlasses(0, 2300, 'metric').of).toBe(10);
    expect(waterGlasses(0, 6000, 'metric').of).toBe(24);
    expect(waterGlasses(0, 6000, 'imperial').of).toBe(26);
  });

  it('what is drunk rounds to the nearest half glass', () => {
    expect(waterGlasses(375, 2000, 'metric').drunk).toBe(1.5);
    expect(waterGlasses(300, 2000, 'metric').drunk).toBe(1);
    expect(waterGlasses(330, 2000, 'metric').drunk).toBe(1.5);
  });

  it('the last glass fills only when the goal is reached', () => {
    expect(waterGlasses(1950, 2000, 'metric').drunk).toBe(7.5);
    expect(waterGlasses(2000, 2000, 'metric').drunk).toBe(8);
    expect(waterGlasses(2250, 1500, 'metric')).toEqual({ drunk: 6, of: 6 });
  });
});

describe('glassesLabel', () => {
  it('says whole glasses, halves and the first half', () => {
    expect(glassesLabel(3, 16)).toBe('3 of 16 glasses');
    expect(glassesLabel(1.5, 8)).toBe('1½ of 8 glasses');
    expect(glassesLabel(0.5, 8)).toBe('½ of 8 glasses');
    expect(glassesLabel(0, 8)).toBe('0 of 8 glasses');
    expect(glassesLabel(1, 1)).toBe('1 of 1 glass');
  });
});
