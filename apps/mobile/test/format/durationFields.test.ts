import { describe, expect, it } from 'vitest';
import { durationFieldsOf } from '../../src/format/durationFieldsOf';
import { parseDurationFields } from '../../src/format/parseDurationFields';

/** MM-250, MM-415: minutes to the fields a person types and back, with what is refused and where it is said. */
describe('durationFieldsOf', () => {
  it('rounds to the minute before splitting, so a fraction never makes 60 minutes', () => {
    expect(durationFieldsOf(419.58)).toEqual({ hours: '7', minutes: '0' });
    expect(durationFieldsOf(419.4)).toEqual({ hours: '6', minutes: '59' });
    expect(durationFieldsOf(440)).toEqual({ hours: '7', minutes: '20' });
    expect(durationFieldsOf(undefined)).toEqual({ hours: '', minutes: '' });
  });
});

describe('parseDurationFields', () => {
  it('reads hours and minutes, an empty field as zero, and two empty fields as nothing', () => {
    expect(parseDurationFields({ hours: '7', minutes: '20' })).toEqual({ minutes: 440, error: undefined });
    expect(parseDurationFields({ hours: '7', minutes: '' })).toEqual({ minutes: 420, error: undefined });
    expect(parseDurationFields({ hours: '', minutes: '45' })).toEqual({ minutes: 45, error: undefined });
    expect(parseDurationFields({ hours: '7.5', minutes: '' })).toEqual({ minutes: 450, error: undefined });
    expect(parseDurationFields({ hours: '', minutes: '' })).toEqual({ minutes: undefined, error: undefined });
  });

  it('says what is wrong under the field it concerns', () => {
    expect(parseDurationFields({ hours: '25', minutes: '0' }).error).toEqual({ on: 'hours', text: 'Up to 24 hours.' });
    expect(parseDurationFields({ hours: 'x', minutes: '0' }).error).toEqual({ on: 'hours', text: 'Up to 24 hours.' });
    expect(parseDurationFields({ hours: '6', minutes: '75' }).error).toEqual({ on: 'minutes', text: 'Minutes from 0 to 59.' });
    expect(parseDurationFields({ hours: '24', minutes: '30' }).error).toEqual({ on: 'minutes', text: 'Up to 24 hours in all.' });
    expect(parseDurationFields({ hours: '0', minutes: '0' }).error).toEqual({ on: 'hours', text: 'Type the hours asleep.' });
    expect(parseDurationFields({ hours: '24', minutes: '0' })).toEqual({ minutes: 1440, error: undefined });
  });
});
