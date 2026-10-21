import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { decodePhotoArchive } from '../../src/domain/photos/decodePhotoArchive';
import { encodePhotoArchive } from '../../src/domain/photos/encodePhotoArchive';
import { photoSets } from '../../src/domain/photos/photoSets';
import { photosOffered } from '../../src/domain/photos/photosOffered';
import type { ProgressPhoto } from '../../src/domain/photos/ProgressPhoto';
import { tooSoonForPhotos } from '../../src/domain/photos/tooSoonForPhotos';
import { byteSizeText } from '../../src/format/byteSizeText';
import { FormatError } from '../../src/lang/FormatError';

/** MM-157: the rules of the progress photos that need no screen. */
const day = CalendarDate.of(2026, 10, 5);
const photo = (id: number, on: CalendarDate, pose: ProgressPhoto['pose']): ProgressPhoto => ({
  id,
  date: on,
  pose,
  takenAt: new Date(2026, 9, on.day, 7),
  width: 1200,
  height: 1600,
  bytes: 300_000,
});

describe('the photo archive', () => {
  it('carries every photo and its picture, as they were', () => {
    const photos = [
      { date: day, pose: 'front' as const, takenAt: new Date(2026, 9, 5, 7, 1), width: 1200, height: 1600, jpeg: new Uint8Array([1, 2, 3]) },
      { date: day.addDays(14), pose: 'back' as const, takenAt: new Date(2026, 9, 19, 7, 2), width: 900, height: 1200, jpeg: new Uint8Array([]) },
    ];
    expect(decodePhotoArchive(encodePhotoArchive(photos))).toEqual(photos);
    expect(decodePhotoArchive(encodePhotoArchive([]))).toEqual([]);
  });

  it('refuses bytes it did not write, and an archive cut short', () => {
    expect(() => decodePhotoArchive(new TextEncoder().encode('SQLite format 3'))).toThrow(FormatError);
    const archive = encodePhotoArchive([{ date: day, pose: 'side', takenAt: new Date(2026, 9, 5), width: 1, height: 1, jpeg: new Uint8Array([5, 5, 5]) }]);
    expect(() => decodePhotoArchive(archive.subarray(0, archive.length - 1))).toThrow(FormatError);
  });
});

describe('the sets', () => {
  it('are grouped by day, newest first, front, side and back in order', () => {
    const sets = photoSets([photo(1, day, 'back'), photo(2, day, 'front'), photo(3, day.addDays(14), 'side')]);
    expect(sets.map((set) => [set.date, set.photos.map((p) => p.pose)])).toEqual([
      [day.addDays(14), ['side']],
      [day, ['front', 'back']],
    ]);
  });

  it('a second set within seven days is noted; a set a fortnight on, or more of the same day, is not', () => {
    const before = [photo(1, day, 'front')];
    expect(tooSoonForPhotos(before, day.addDays(6))).toBe(true);
    expect(tooSoonForPhotos(before, day.addDays(7))).toBe(false);
    expect(tooSoonForPhotos(before, day.addDays(14))).toBe(false);
    expect(tooSoonForPhotos(before, day)).toBe(false);
    expect(tooSoonForPhotos([], day)).toBe(false);
  });
});

describe('offered', () => {
  it('to everyone without an eating-disorder history, until chosen otherwise', () => {
    expect(photosOffered({ offered: undefined, backUp: false }, false)).toBe(true);
    expect(photosOffered({ offered: false, backUp: false }, false)).toBe(false);
  });

  it('Eating-disorder history: not offered until turned on in Settings', () => {
    expect(photosOffered({ offered: undefined, backUp: false }, true)).toBe(false);
    expect(photosOffered(undefined, true)).toBe(false);
    expect(photosOffered({ offered: true, backUp: false }, true)).toBe(true);
  });
});

it('a size is said in the unit a person reads', () => {
  expect(byteSizeText(850_000)).toBe('850 KB');
  expect(byteSizeText(12_400_000)).toBe('12 MB');
  expect(byteSizeText(1_400_000_000)).toBe('1.4 GB');
  expect(byteSizeText(10)).toBe('1 KB');
});
