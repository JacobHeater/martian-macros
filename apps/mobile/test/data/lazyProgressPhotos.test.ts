import { expect, it, vi } from 'vitest';
import { LazyProgressPhotoRepository } from '../../src/data/LazyProgressPhotoRepository';
import { SqlProgressPhotoRepository } from '../../src/data/SqlProgressPhotoRepository';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { ProgressPhotoRepository } from '../../src/domain/repositories/ProgressPhotoRepository';
import { InMemoryProgressPhotoRepository } from '../../src/fixtures/InMemoryProgressPhotoRepository';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { progressPhotoRepositoryContract } from '../contracts/progressPhotoRepositoryContract';
import { first } from '../support/first';

/**
 * MM-694 (the owner's phone, 2026-10-29): the photo database is opened on first use, never when the app starts. On
 * iOS it cannot be opened while the phone is locked (MM-157), and the shell starts the app again whenever iOS drops
 * the web view's process; a start that opened it died at the door.
 */
progressPhotoRepositoryContract(
  'Lazily opened photo database',
  () => new LazyProgressPhotoRepository(async () => SqlProgressPhotoRepository.open(await WasmSqlDatabase.open())),
);

const photo = { date: CalendarDate.of(2026, 10, 5), pose: 'front' as const, takenAt: new Date(2026, 9, 5, 7), width: 10, height: 10, jpeg: new Uint8Array([1]) };

it('opens nothing until the photos are first asked for, and then once', async () => {
  const open = vi.fn(async (): Promise<ProgressPhotoRepository> => new InMemoryProgressPhotoRepository());
  const repo = new LazyProgressPhotoRepository(open);
  expect(open).not.toHaveBeenCalled();
  await repo.savePhoto(photo);
  expect((await first(repo.watchPhotos())).map((p) => p.pose)).toEqual(['front']);
  expect(await repo.totalBytes()).toBeGreaterThan(0);
  expect(open).toHaveBeenCalledTimes(1);
});

it('an opening that fails, as a locked phone’s does, is told to the subscriber and tried again by the next call', async () => {
  const locked = new Error('unable to open database file');
  const open = vi
    .fn<() => Promise<ProgressPhotoRepository>>()
    .mockRejectedValueOnce(locked)
    .mockResolvedValueOnce(new InMemoryProgressPhotoRepository());
  const repo = new LazyProgressPhotoRepository(open);
  await expect(first(repo.watchPhotos())).rejects.toBe(locked);
  await expect(first(repo.watchPhotoSettings())).resolves.toEqual({ offered: undefined, backUp: false });
  expect(open).toHaveBeenCalledTimes(2);
});

it('a failed opening is told to a write too, and does not stick', async () => {
  const open = vi
    .fn<() => Promise<ProgressPhotoRepository>>()
    .mockRejectedValueOnce(new Error('unable to open database file'))
    .mockResolvedValueOnce(new InMemoryProgressPhotoRepository());
  const repo = new LazyProgressPhotoRepository(open);
  await expect(repo.savePhoto(photo)).rejects.toThrow(/unable to open/);
  await expect(repo.savePhoto(photo)).resolves.toBeTypeOf('number');
});

it('a subscription stopped before the opening finished hears nothing', async () => {
  let release: (repo: ProgressPhotoRepository) => void = () => undefined;
  const repo = new LazyProgressPhotoRepository(() => new Promise<ProgressPhotoRepository>((resolve) => {
      release = resolve;
    }));
  const listener = vi.fn();
  const stop = repo.watchPhotos().subscribe(listener);
  stop();
  release(new InMemoryProgressPhotoRepository());
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(listener).not.toHaveBeenCalled();
});
