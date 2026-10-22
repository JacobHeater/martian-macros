import type { ProgressPhotoArchive } from './ProgressPhotoArchive';
import type { ProgressPhotoReader } from './ProgressPhotoReader';
import type { ProgressPhotoWriter } from './ProgressPhotoWriter';

/** The progress photos kept on this phone (MM-157), read, written and handled as a whole. */
export interface ProgressPhotoRepository extends ProgressPhotoReader, ProgressPhotoWriter, ProgressPhotoArchive {}
