import { bytesOfBase64 } from '../lang/bytesOfBase64';

/**
 * A one-pixel JPEG, the picture every fixture photo is (MM-157): small
 * enough to keep in a test, and a real image for a story to draw.
 */
export const fixturePhotoJpeg: Uint8Array = bytesOfBase64(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
);
