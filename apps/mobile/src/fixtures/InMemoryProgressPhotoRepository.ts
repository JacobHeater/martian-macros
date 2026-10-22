import type { NewProgressPhoto } from '../domain/photos/NewProgressPhoto';
import { decodePhotoArchive } from '../domain/photos/decodePhotoArchive';
import { encodePhotoArchive } from '../domain/photos/encodePhotoArchive';
import type { PhotoSettings } from '../domain/photos/PhotoSettings';
import type { ProgressPhoto } from '../domain/photos/ProgressPhoto';
import type { ProgressPhotoRepository } from '../domain/repositories/ProgressPhotoRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

const noChoices: PhotoSettings = { offered: undefined, backUp: false };

/** `ProgressPhotoRepository` held in memory (MM-157), for tests and stories. Ids count up from 1 and are never reused. */
export class InMemoryProgressPhotoRepository implements ProgressPhotoRepository {
  private readonly photos = new ObservableValue<readonly (ProgressPhoto & { jpeg: Uint8Array })[]>([]);
  private readonly settings = new ObservableValue<PhotoSettings>(noChoices);
  private nextId = 1;

  watchPhotos(): Watched<ProgressPhoto[]> {
    return this.photos.watchAs((all) =>
      [...all]
        .sort((a, b) => a.date.epochDay - b.date.epochDay || a.takenAt.getTime() - b.takenAt.getTime() || a.id - b.id)
        .map(({ jpeg: _jpeg, ...photo }) => photo),
    );
  }

  async photoBytes(id: number): Promise<Uint8Array | undefined> {
    const jpeg = this.photos.value.find((photo) => photo.id === id)?.jpeg;
    return jpeg === undefined ? undefined : new Uint8Array(jpeg);
  }

  watchPhotoSettings(): Watched<PhotoSettings> {
    return this.settings.watch();
  }

  async savePhoto(photo: NewProgressPhoto): Promise<number> {
    const id = this.nextId++;
    this.photos.value = [...this.photos.value, this.kept(id, photo)];
    return id;
  }

  async deletePhoto(id: number): Promise<void> {
    this.photos.value = this.photos.value.filter((photo) => photo.id !== id);
  }

  async savePhotoSettings(settings: PhotoSettings): Promise<void> {
    this.settings.value = settings;
  }

  async totalBytes(): Promise<number> {
    return this.photos.value.reduce((sum, photo) => sum + photo.jpeg.length, 0);
  }

  async exportArchive(): Promise<Uint8Array> {
    return encodePhotoArchive(
      [...this.photos.value].sort((a, b) => a.id - b.id).map(({ date, pose, takenAt, width, height, jpeg }) => ({ date, pose, takenAt, width, height, jpeg })),
    );
  }

  async restoreArchive(archive: Uint8Array): Promise<void> {
    const photos = decodePhotoArchive(archive);
    this.photos.value = photos.map((photo) => this.kept(this.nextId++, photo));
  }

  async eraseAll(): Promise<void> {
    this.photos.value = [];
    this.settings.value = noChoices;
  }

  private kept(id: number, photo: NewProgressPhoto): ProgressPhoto & { jpeg: Uint8Array } {
    return {
      id,
      date: photo.date,
      pose: photo.pose,
      takenAt: photo.takenAt,
      width: photo.width,
      height: photo.height,
      bytes: photo.jpeg.length,
      jpeg: new Uint8Array(photo.jpeg),
    };
  }
}
