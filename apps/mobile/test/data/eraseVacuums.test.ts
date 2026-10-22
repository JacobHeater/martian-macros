import { expect, it } from 'vitest';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { openSql } from './support/openRepositories';

/** MM-62: Erase all leaves nothing of what was erased in the file's freed pages. */
it('erasing everything vacuums the database, so no freed page is left', async () => {
  const sql = await openSql();
  const repos = await SqlRepositories.open(sql);
  const first = CalendarDate.of(2020, 1, 1);
  for (let day = 0; day < 1500; day += 1) await repos.weights.saveWeight(first.addDays(day), 80 + (day % 10) / 10);
  const pagesBefore = Number((await sql.select('PRAGMA page_count'))[0]?.['page_count']);
  await repos.eraser.eraseAll();
  const freelist = Number((await sql.select('PRAGMA freelist_count'))[0]?.['freelist_count']);
  const pagesAfter = Number((await sql.select('PRAGMA page_count'))[0]?.['page_count']);
  expect(freelist, 'no page freed by the erase is left holding what it held').toBe(0);
  expect(pagesAfter, 'the file shrank').toBeLessThan(pagesBefore);
});
