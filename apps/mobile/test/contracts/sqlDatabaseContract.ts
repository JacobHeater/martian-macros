import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SqlDatabase } from '../../src/sql/SqlDatabase';
import { SqlFailure } from '../../src/sql/SqlFailure';

/**
 * What every `SqlDatabase` must do (MM-231): the WebAssembly adapter on any
 * machine and, on a device, the native one. `open` gives a new, empty
 * database.
 */
export function sqlDatabaseContract(name: string, open: () => Promise<SqlDatabase>): void {
  describe(`${name} is a SqlDatabase`, () => {
    let db: SqlDatabase;
    let closed: boolean;

    beforeEach(async () => {
      db = await open();
      closed = false;
      await db.executeScript(`
        CREATE TABLE things (id INTEGER PRIMARY KEY, name TEXT NOT NULL, amount REAL, note TEXT, data BLOB);
        CREATE INDEX things_by_name ON things (name);
      `);
    });

    afterEach(async () => {
      if (!closed) await db.close();
    });

    const count = async (from: SqlDatabase = db) =>
      (await from.select('SELECT count(*) AS n FROM things'))[0]?.['n'];

    it('gives back what was stored, of every kind', async () => {
      await db.execute('INSERT INTO things (id, name, amount, note, data) VALUES (?, ?, ?, ?, ?)', [
        7,
        'Oats, "rolled"',
        82.25,
        null,
        new Uint8Array([0, 1, 254, 255]),
      ]);
      const rows = await db.select('SELECT id, name, amount, note, data FROM things');
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row?.['id']).toBe(7);
      expect(row?.['name']).toBe('Oats, "rolled"');
      expect(row?.['amount']).toBe(82.25);
      expect(row?.['note']).toBeNull();
      expect(row?.['data']).toBeInstanceOf(Uint8Array);
      expect([...(row?.['data'] as Uint8Array)]).toEqual([0, 1, 254, 255]);
    });

    it('fills each ? from the values given, in order, and never from the text', async () => {
      const hostile = "x'); DROP TABLE things; --";
      await db.execute('INSERT INTO things (name, note) VALUES (?, ?)', [hostile, 'second']);
      expect(await db.select('SELECT name, note FROM things WHERE name = ?', [hostile])).toEqual([
        { name: hostile, note: 'second' },
      ]);
    });

    it('gives rows in the order asked for, and none when nothing matches', async () => {
      for (const name of ['pear', 'apple', 'fig']) {
        await db.execute('INSERT INTO things (name) VALUES (?)', [name]);
      }
      expect((await db.select('SELECT name FROM things ORDER BY name')).map((r) => r['name'])).toEqual([
        'apple',
        'fig',
        'pear',
      ]);
      expect(await db.select('SELECT name FROM things WHERE name = ?', ['plum'])).toEqual([]);
    });

    it('a whole number comes back a whole number, and a decimal as it was', async () => {
      await db.execute('INSERT INTO things (id, name, amount) VALUES (?, ?, ?)', [9007199254740991, 'big', 0.1 + 0.2]);
      const row = (await db.select('SELECT id, amount FROM things'))[0];
      expect(row?.['id']).toBe(9007199254740991);
      expect(row?.['amount']).toBe(0.1 + 0.2);
    });

    it('a statement SQLite refuses fails as a SqlFailure, and the database goes on working', async () => {
      await expect(db.execute('INSERT INTO nowhere (x) VALUES (1)')).rejects.toBeInstanceOf(SqlFailure);
      await expect(db.select('SELEKT 1')).rejects.toBeInstanceOf(SqlFailure);
      await expect(db.execute('INSERT INTO things (name) VALUES (?)', [null])).rejects.toBeInstanceOf(SqlFailure);
      await db.execute('INSERT INTO things (name) VALUES (?)', ['fine']);
      expect(await count()).toBe(1);
    });

    it('a transaction that finishes is kept, and gives back what the work gave', async () => {
      const result = await db.transaction(async (inside) => {
        await inside.execute('INSERT INTO things (name) VALUES (?)', ['a']);
        await inside.execute('INSERT INTO things (name) VALUES (?)', ['b']);
        return (await count(inside)) as number;
      });
      expect(result).toBe(2);
      expect(await count()).toBe(2);
    });

    it('a transaction that throws is undone, and what it threw is thrown on', async () => {
      await db.execute('INSERT INTO things (name) VALUES (?)', ['before']);
      const reason = new Error('changed my mind');
      await expect(
        db.transaction(async (inside) => {
          await inside.execute('INSERT INTO things (name) VALUES (?)', ['during']);
          await inside.execute('DELETE FROM things WHERE name = ?', ['before']);
          throw reason;
        }),
      ).rejects.toBe(reason);
      expect((await db.select('SELECT name FROM things')).map((r) => r['name'])).toEqual(['before']);
    });

    it('a statement that fails inside a transaction undoes the rest of it', async () => {
      await expect(
        db.transaction(async (inside) => {
          await inside.execute('INSERT INTO things (name) VALUES (?)', ['kept?']);
          await inside.execute('INSERT INTO nowhere (x) VALUES (1)');
        }),
      ).rejects.toBeInstanceOf(SqlFailure);
      expect(await count()).toBe(0);
    });

    it('a call made while a transaction is open waits for it to end', async () => {
      const order: string[] = [];
      const transaction = db.transaction(async (inside) => {
        await inside.execute('INSERT INTO things (name) VALUES (?)', ['in flight']);
        // Let the call below be made while this transaction is still open.
        await new Promise((resolve) => setTimeout(resolve, 20));
        order.push('transaction ends');
        throw new Error('undo');
      });
      const seen = count().then((n) => {
        order.push('outside call answered');
        return n;
      });
      await expect(transaction).rejects.toThrow('undo');
      expect(await seen).toBe(0);
      expect(order).toEqual(['transaction ends', 'outside call answered']);
    });

    it('the database handed to a transaction cannot be used after it ends', async () => {
      let kept: SqlDatabase | undefined;
      await db.transaction(async (inside) => {
        kept = inside;
      });
      await expect((kept as SqlDatabase).execute('INSERT INTO things (name) VALUES (?)', ['late'])).rejects.toBeInstanceOf(
        SqlFailure,
      );
      expect(await count()).toBe(0);
    });

    it('calls are carried out in the order they were made', async () => {
      const writes = ['one', 'two', 'three', 'four'].map((name) =>
        db.execute('INSERT INTO things (name) VALUES (?)', [name]),
      );
      const read = db.select('SELECT name FROM things ORDER BY id');
      await Promise.all(writes);
      expect((await read).map((r) => r['name'])).toEqual(['one', 'two', 'three', 'four']);
    });

    it('keeps a version number, as a pack and a schema need', async () => {
      expect((await db.select('PRAGMA user_version'))[0]?.['user_version']).toBe(0);
      await db.execute('PRAGMA user_version = 3');
      expect((await db.select('PRAGMA user_version'))[0]?.['user_version']).toBe(3);
    });

    it('has full-text search with prefixes and ranking, which a food pack is built on', async () => {
      await db.executeScript(`
        CREATE TABLE foods (id INTEGER PRIMARY KEY, name TEXT NOT NULL, brand TEXT);
        CREATE VIRTUAL TABLE foods_fts USING fts5(
          name, brand,
          content = 'foods', content_rowid = 'id',
          tokenize = 'unicode61 remove_diacritics 2',
          prefix = '2 3'
        );
      `);
      const foods: readonly (readonly [number, string, string | null])[] = [
        [1, 'Rolled oats', null],
        [2, 'Oat milk, unsweetened', 'Oatly'],
        [3, 'Crème fraîche', null],
        [4, 'Chicken breast', null],
      ];
      for (const [id, foodName, brand] of foods) {
        await db.execute('INSERT INTO foods (id, name, brand) VALUES (?, ?, ?)', [id, foodName, brand]);
      }
      await db.execute('INSERT INTO foods_fts (rowid, name, brand) SELECT id, name, brand FROM foods');
      const search = async (match: string) =>
        (
          await db.select(
            'SELECT f.id, bm25(foods_fts, 10.0, 1.0) AS score FROM foods_fts JOIN foods f ON f.id = foods_fts.rowid ' +
              'WHERE foods_fts MATCH ? ORDER BY score, f.id',
            [match],
          )
        ).map((r) => r['id']);
      expect(new Set(await search('"oa"*'))).toEqual(new Set([1, 2]));
      expect(await search('"creme"*')).toEqual([3]);
      expect(await search('"chick"* "br"*')).toEqual([4]);
      expect(await search('"zzz"*')).toEqual([]);
    });

    it('cannot be used after it is closed', async () => {
      await db.close();
      closed = true;
      await expect(db.select('SELECT 1')).rejects.toBeInstanceOf(SqlFailure);
      await expect(db.execute('DELETE FROM things')).rejects.toBeInstanceOf(SqlFailure);
    });
  });
}
