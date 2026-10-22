import { CalendarDate } from '../domain/CalendarDate';
import type { NewProgressPhoto } from '../domain/photos/NewProgressPhoto';
import { decodePhotoArchive } from '../domain/photos/decodePhotoArchive';
import { encodePhotoArchive } from '../domain/photos/encodePhotoArchive';
import { PhotoPose } from '../domain/photos/PhotoPose';
import type { PhotoSettings } from '../domain/photos/PhotoSettings';
import type { ProgressPhoto } from '../domain/photos/ProgressPhoto';
import type { ProgressPhotoRepository } from '../domain/repositories/ProgressPhotoRepository';
import { FormatError } from '../lang/FormatError';
import type { Watched } from '../lang/Watched';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import { flag, integer, moment, named, number } from './columns';
import { progressPhotoSchema } from './progressPhotoSchema';

const version = 1;

const photoOf = (row: SqlRow): ProgressPhoto => ({
  id: integer(row, 'id'),
  date: CalendarDate.fromEpochDay(integer(row, 'epoch_day')),
  pose: named(PhotoPose.values, row, 'pose'),
  takenAt: moment(row, 'taken_at_ms'),
  width: integer(row, 'width'),
  height: integer(row, 'height'),
  bytes: integer(row, 'bytes'),
});

/**
 * `ProgressPhotoRepository` kept in the photo database (MM-157), a file of
 * its own (`progressPhotoSchema`). Ids are never reused.
 */
export class SqlProgressPhotoRepository implements ProgressPhotoRepository {
  private readonly db: SqlDatabase;
  private readonly listeners = new Set<() => void>();

  private constructor(db: SqlDatabase) {
    this.db = db;
  }

  /** Opens the photo database `db`, making its tables the first time. */
  static async open(db: SqlDatabase): Promise<SqlProgressPhotoRepository> {
    const found = Number((await db.select('PRAGMA user_version'))[0]?.['user_version'] ?? 0);
    if (found > version) throw new FormatError(`The photos were saved by a newer version of the app (${found}).`);
    if (found < version) {
      await db.executeScript(progressPhotoSchema);
      await db.execute(`PRAGMA user_version = ${version}`);
    }
    return new SqlProgressPhotoRepository(db);
  }

  watchPhotos(): Watched<ProgressPhoto[]> {
    return this.watched(async () =>
      (await this.db.select('SELECT * FROM progress_photos ORDER BY epoch_day, taken_at_ms, id')).map(photoOf),
    );
  }

  async photoBytes(id: number): Promise<Uint8Array | undefined> {
    const value = (await this.db.select('SELECT jpeg FROM progress_photo_pictures WHERE photo_id = ?', [id]))[0]?.['jpeg'];
    return value instanceof Uint8Array ? value : undefined;
  }

  watchPhotoSettings(): Watched<PhotoSettings> {
    return this.watched(async () => {
      const row = (await this.db.select('SELECT * FROM photo_settings WHERE id = 1'))[0];
      if (row === undefined) return { offered: undefined, backUp: false };
      return { offered: row['offered'] === null ? undefined : flag(row, 'offered'), backUp: flag(row, 'back_up') };
    });
  }

  async savePhoto(photo: NewProgressPhoto): Promise<number> {
    const id = await this.db.transaction((inside) => this.inserted(inside, photo));
    this.changed();
    return id;
  }

  async deletePhoto(id: number): Promise<void> {
    await this.db.transaction(async (inside) => {
      await inside.execute('DELETE FROM progress_photo_pictures WHERE photo_id = ?', [id]);
      await inside.execute('DELETE FROM progress_photos WHERE id = ?', [id]);
    });
    this.changed();
  }

  async savePhotoSettings(settings: PhotoSettings): Promise<void> {
    await this.db.execute(
      'INSERT INTO photo_settings (id, offered, back_up) VALUES (1, ?, ?) ' +
        'ON CONFLICT (id) DO UPDATE SET offered = excluded.offered, back_up = excluded.back_up',
      [settings.offered === undefined ? null : settings.offered ? 1 : 0, settings.backUp ? 1 : 0],
    );
    this.changed();
  }

  async totalBytes(): Promise<number> {
    return number((await this.db.select('SELECT coalesce(sum(bytes), 0) AS total FROM progress_photos'))[0] ?? {}, 'total');
  }

  async exportArchive(): Promise<Uint8Array> {
    const photos: NewProgressPhoto[] = [];
    for (const photo of (await this.db.select('SELECT * FROM progress_photos ORDER BY id')).map(photoOf)) {
      const jpeg = await this.photoBytes(photo.id);
      if (jpeg !== undefined) photos.push({ ...photo, jpeg });
    }
    return encodePhotoArchive(photos);
  }

  async restoreArchive(archive: Uint8Array): Promise<void> {
    const photos = decodePhotoArchive(archive);
    await this.db.transaction(async (inside) => {
      await inside.execute('DELETE FROM progress_photo_pictures');
      await inside.execute('DELETE FROM progress_photos');
      for (const photo of photos) await this.inserted(inside, photo);
    });
    this.changed();
  }

  async eraseAll(): Promise<void> {
    await this.db.transaction(async (inside) => {
      await inside.execute('DELETE FROM progress_photo_pictures');
      await inside.execute('DELETE FROM progress_photos');
      await inside.execute('DELETE FROM photo_settings');
    });
    // The space the pictures took is given back, so nothing of them stays in the file.
    await this.db.execute('VACUUM');
    this.changed();
  }

  private async inserted(db: SqlDatabase, photo: NewProgressPhoto): Promise<number> {
    await db.execute(
      'INSERT INTO progress_photos (epoch_day, pose, taken_at_ms, width, height, bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [photo.date.epochDay, photo.pose, photo.takenAt.getTime(), photo.width, photo.height, photo.jpeg.length],
    );
    const id = integer((await db.select('SELECT last_insert_rowid() AS id'))[0] ?? {}, 'id');
    await db.execute('INSERT INTO progress_photo_pictures (photo_id, jpeg) VALUES (?, ?)', [id, photo.jpeg]);
    return id;
  }

  private changed(): void {
    for (const listener of [...this.listeners]) listener();
  }

  /** What `query` reads, now and after every change made through this repository. */
  private watched<T>(query: () => Promise<T>): Watched<T> {
    return {
      subscribe: (listener, onError) => {
        let live = true;
        // A read that finishes after a newer one began is dropped, so the last change is the one given.
        let asked = 0;
        const read = () => {
          const mine = ++asked;
          query().then(
            (value) => {
              if (live && mine === asked) listener(value);
            },
            (error: unknown) => {
              if (live && mine === asked) onError?.(error);
            },
          );
        };
        this.listeners.add(read);
        read();
        return () => {
          live = false;
          this.listeners.delete(read);
        };
      },
    };
  }
}
