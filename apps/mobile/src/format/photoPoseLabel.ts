import type { PhotoPose } from '../domain/photos/PhotoPose';

/** A pose of the standard set, as a label: "Front", "Side", "Back" (MM-157). */
export function photoPoseLabel(pose: PhotoPose): string {
  switch (pose) {
    case 'front':
      return 'Front';
    case 'side':
      return 'Side';
    case 'back':
      return 'Back';
  }
}
