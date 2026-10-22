import { FormatError } from '../../lang/FormatError';
import { CalendarDate } from '../CalendarDate';
import type { NewProgressPhoto } from './NewProgressPhoto';
import { PhotoPose } from './PhotoPose';

/** The photos `encodePhotoArchive` wrote; a `FormatError` for bytes it did not write. */
export function decodePhotoArchive(archive: Uint8Array): NewProgressPhoto[] {
  if (new TextDecoder().decode(archive.subarray(0, 4)) !== 'MMPA') throw new FormatError('Not a photo archive.');
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const photos: NewProgressPhoto[] = [];
  let at = 4;
  const next = (): Uint8Array => {
    if (at + 4 > archive.length) throw new FormatError('The photo archive is cut short.');
    const length = view.getUint32(at);
    at += 4;
    if (at + length > archive.length) throw new FormatError('The photo archive is cut short.');
    const part = archive.slice(at, at + length);
    at += length;
    return part;
  };
  while (at < archive.length) {
    const details = JSON.parse(new TextDecoder().decode(next())) as Record<string, unknown>;
    const jpeg = next();
    const pose = details['pose'];
    const numbers = ['epochDay', 'takenAtMs', 'width', 'height'].map((key) => details[key]);
    if (!(PhotoPose.values as readonly unknown[]).includes(pose) || numbers.some((n) => typeof n !== 'number')) {
      throw new FormatError('A photo in the archive is not one this app wrote.');
    }
    const [epochDay, takenAtMs, width, height] = numbers as number[];
    photos.push({
      date: CalendarDate.fromEpochDay(epochDay as number),
      pose: pose as PhotoPose,
      takenAt: new Date(takenAtMs as number),
      width: width as number,
      height: height as number,
      jpeg,
    });
  }
  return photos;
}
