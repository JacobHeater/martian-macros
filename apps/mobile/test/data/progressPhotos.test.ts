import { expect, it } from 'vitest';
import { SqlProgressPhotoRepository } from '../../src/data/SqlProgressPhotoRepository';
import { InMemoryProgressPhotoRepository } from '../../src/fixtures/InMemoryProgressPhotoRepository';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { first } from '../support/first';
import { progressPhotoRepositoryContract } from '../contracts/progressPhotoRepositoryContract';

/** MM-157: the progress photos, in memory and in their own database file. */
progressPhotoRepositoryContract('In-memory', () => new InMemoryProgressPhotoRepository());
progressPhotoRepositoryContract('SQLite photo database', async () => SqlProgressPhotoRepository.open(await WasmSqlDatabase.open()));

it('the photo database keeps its photos when it is opened again, and its tables are made once', async () => {
  const db = await WasmSqlDatabase.open();
  const repo = await SqlProgressPhotoRepository.open(db);
  await repo.savePhoto({
    date: CalendarDate.of(2026, 10, 5),
    pose: 'side',
    takenAt: new Date(2026, 9, 5, 7),
    width: 1155,
    height: 1732,
    jpeg: new Uint8Array([1, 2, 3, 4]),
  });
  const again = await SqlProgressPhotoRepository.open(await WasmSqlDatabase.open({ bytes: await db.exportBytes() }));
  expect((await first(again.watchPhotos())).map((photo) => photo.pose)).toEqual(['side']);
  expect((await db.select('PRAGMA user_version'))[0]?.['user_version']).toBe(1);
});

it('a photo database from a newer app is refused, not opened', async () => {
  const db = await WasmSqlDatabase.open();
  await db.execute('PRAGMA user_version = 9');
  await expect(SqlProgressPhotoRepository.open(db)).rejects.toThrow(/newer version/);
});

it('erasing leaves nothing of a picture in the file', async () => {
  const db = await WasmSqlDatabase.open();
  const repo = await SqlProgressPhotoRepository.open(db);
  const marker = new TextEncoder().encode('PICTURE-BYTES-THAT-MUST-GO');
  await repo.savePhoto({ date: CalendarDate.of(2026, 10, 5), pose: 'front', takenAt: new Date(2026, 9, 5, 7), width: 10, height: 10, jpeg: marker });
  await repo.eraseAll();
  const file = new TextDecoder('latin1').decode(await db.exportBytes());
  expect(file).not.toContain('PICTURE-BYTES-THAT-MUST-GO');
});

it('a deleted photo leaves nothing of its picture in the file, while the others stay (secure_delete)', async () => {
  const db = await WasmSqlDatabase.open();
  const repo = await SqlProgressPhotoRepository.open(db);
  const gone = new TextEncoder().encode('DELETED-PICTURE-BYTES-MUST-GO');
  const kept = new TextEncoder().encode('KEPT-PICTURE-BYTES-STAY');
  const doomed = await repo.savePhoto({ date: CalendarDate.of(2026, 10, 5), pose: 'front', takenAt: new Date(2026, 9, 5, 7), width: 10, height: 10, jpeg: gone });
  await repo.savePhoto({ date: CalendarDate.of(2026, 10, 5), pose: 'side', takenAt: new Date(2026, 9, 5, 7), width: 10, height: 10, jpeg: kept });
  await repo.deletePhoto(doomed);
  expect((await db.select('PRAGMA secure_delete'))[0]?.['secure_delete']).toBe(1);
  const file = new TextDecoder('latin1').decode(await db.exportBytes());
  expect(file).not.toContain('DELETED-PICTURE-BYTES-MUST-GO');
  expect(file).toContain('KEPT-PICTURE-BYTES-STAY');
});
