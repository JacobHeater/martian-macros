import type { NewProgressPhoto } from './NewProgressPhoto';

/**
 * The photos as one block of bytes for the app's own backup (MM-157,
 * MM-63): "MMPA", then for each photo the length of its details as JSON,
 * the details, the length of its picture and the picture. The backup
 * encrypts it with everything else.
 */
export function encodePhotoArchive(photos: readonly NewProgressPhoto[]): Uint8Array {
  const parts: Uint8Array[] = [new TextEncoder().encode('MMPA')];
  for (const photo of photos) {
    const details = new TextEncoder().encode(
      JSON.stringify({
        epochDay: photo.date.epochDay,
        pose: photo.pose,
        takenAtMs: photo.takenAt.getTime(),
        width: photo.width,
        height: photo.height,
      }),
    );
    for (const part of [details, photo.jpeg]) {
      const length = new Uint8Array(4);
      new DataView(length.buffer).setUint32(0, part.length);
      parts.push(length, part);
    }
  }
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
