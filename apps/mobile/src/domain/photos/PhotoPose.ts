const values = ['front', 'side', 'back'] as const;

/**
 * A pose of the standard set of progress photos (MM-157): front, side and
 * back, each standing relaxed, never flexed. Each is optional.
 */
export type PhotoPose = (typeof values)[number];

export const PhotoPose = { values } as const;
