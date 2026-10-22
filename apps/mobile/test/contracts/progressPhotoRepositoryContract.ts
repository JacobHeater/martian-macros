import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { NewProgressPhoto } from '../../src/domain/photos/NewProgressPhoto';
import type { PhotoPose } from '../../src/domain/photos/PhotoPose';
import type { ProgressPhotoRepository } from '../../src/domain/repositories/ProgressPhotoRepository';
import { first } from '../support/first';

/** What every `ProgressPhotoRepository` must do (MM-157), in memory and in the photo database. */
export function progressPhotoRepositoryContract(
  name: string,
  create: () => ProgressPhotoRepository | Promise<ProgressPhotoRepository>,
): void {
  describe(`${name} as a ProgressPhotoRepository`, () => {
    let repo: ProgressPhotoRepository;
    const day = CalendarDate.of(2026, 10, 5);
    const photo = (pose: PhotoPose, on: CalendarDate = day, bytes: number[] = [0xff, 0xd8, 1, 2, 3]): NewProgressPhoto => ({
      date: on,
      pose,
      takenAt: new Date(2026, 9, on.day, 7, 30),
      width: 1200,
      height: 1600,
      jpeg: new Uint8Array(bytes),
    });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts with no photos and nothing chosen', async () => {
      expect(await first(repo.watchPhotos())).toEqual([]);
      expect(await first(repo.watchPhotoSettings())).toEqual({ offered: undefined, backUp: false });
      expect(await repo.totalBytes()).toBe(0);
    });

    it('keeps a photo with its day, pose, time and size, and its picture apart', async () => {
      const id = await repo.savePhoto(photo('front'));
      const [kept] = await first(repo.watchPhotos());
      expect(kept).toEqual({ id, date: day, pose: 'front', takenAt: new Date(2026, 9, 5, 7, 30), width: 1200, height: 1600, bytes: 5 });
      expect(await repo.photoBytes(id)).toEqual(new Uint8Array([0xff, 0xd8, 1, 2, 3]));
      expect(await repo.photoBytes(id + 100)).toBeUndefined();
      expect(await repo.totalBytes()).toBe(5);
    });

    it('lists oldest first; two of a pose on one day are both kept', async () => {
      await repo.savePhoto(photo('side', day.addDays(14)));
      await repo.savePhoto(photo('front'));
      await repo.savePhoto(photo('front'));
      const listed = await first(repo.watchPhotos());
      expect(listed.map((p) => [p.date, p.pose])).toEqual([
        [day, 'front'],
        [day, 'front'],
        [day.addDays(14), 'side'],
      ]);
    });

    it('deletes one photo and its picture; ids are not reused', async () => {
      const gone = await repo.savePhoto(photo('front'));
      const kept = await repo.savePhoto(photo('back'));
      await repo.deletePhoto(gone);
      await repo.deletePhoto(gone + 100);
      expect((await first(repo.watchPhotos())).map((p) => p.id)).toEqual([kept]);
      expect(await repo.photoBytes(gone)).toBeUndefined();
      expect(await repo.savePhoto(photo('side'))).toBeGreaterThan(kept);
    });

    it('keeps the choices', async () => {
      await repo.savePhotoSettings({ offered: true, backUp: true });
      expect(await first(repo.watchPhotoSettings())).toEqual({ offered: true, backUp: true });
      await repo.savePhotoSettings({ offered: undefined, backUp: false });
      expect(await first(repo.watchPhotoSettings())).toEqual({ offered: undefined, backUp: false });
    });

    it('tells a watcher of each change', async () => {
      const seen: number[] = [];
      const stop = repo.watchPhotos().subscribe((photos) => seen.push(photos.length));
      await expect.poll(() => seen).toEqual([0]);
      await repo.savePhoto(photo('front'));
      await expect.poll(() => seen.at(-1)).toBe(1);
      stop();
    });

    it('an archive holds every photo and its picture, and a restore replaces the photos with it', async () => {
      await repo.savePhoto(photo('front', day, [9, 9, 9]));
      await repo.savePhoto(photo('back', day.addDays(21), [7, 7]));
      await repo.savePhotoSettings({ offered: true, backUp: true });
      const archive = await repo.exportArchive();

      const other = await create();
      await other.savePhoto(photo('side', day.addDays(3)));
      await other.restoreArchive(archive);
      const restored = await first(other.watchPhotos());
      expect(restored.map((p) => [p.date, p.pose])).toEqual([
        [day, 'front'],
        [day.addDays(21), 'back'],
      ]);
      expect(await other.photoBytes(restored[1]!.id)).toEqual(new Uint8Array([7, 7]));
      expect(await first(other.watchPhotoSettings()), 'the choices are this phone’s').toEqual({ offered: undefined, backUp: false });
    });

    it('erasing removes every photo, picture and choice', async () => {
      const id = await repo.savePhoto(photo('front'));
      await repo.savePhotoSettings({ offered: false, backUp: true });
      await repo.eraseAll();
      expect(await first(repo.watchPhotos())).toEqual([]);
      expect(await repo.photoBytes(id)).toBeUndefined();
      expect(await first(repo.watchPhotoSettings())).toEqual({ offered: undefined, backUp: false });
      expect(await repo.totalBytes()).toBe(0);
    });
  });
}
