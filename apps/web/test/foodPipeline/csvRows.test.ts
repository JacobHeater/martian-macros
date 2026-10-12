import { expect, it } from 'vitest';
import { csvRows } from '../../src/foodPipeline/csvRows';
import { csvRowsFromBytes } from '../../src/foodPipeline/csvRowsFromBytes';

async function read(chunks: Iterable<string>): Promise<string[][]> {
  const rows: string[][] = [];
  for await (const row of csvRows(chunks)) rows.push(row);
  return rows;
}

it('plain rows, empty cells and a missing final newline', async () => {
  expect(await read(['a,b,c\n1,,3\nx,y,z'])).toEqual([
    ['a', 'b', 'c'],
    ['1', '', '3'],
    ['x', 'y', 'z'],
  ]);
});

it('quoted cells hold commas, doubled quotes and line breaks', async () => {
  expect(await read(['n,v\n"a, ""b""\nc",2\n'])).toEqual([
    ['n', 'v'],
    ['a, "b"\nc', '2'],
  ]);
});

it('a quoted empty cell and CRLF line ends', async () => {
  expect(await read(['a,"",c\r\n1,2,3\r\n'])).toEqual([
    ['a', '', 'c'],
    ['1', '2', '3'],
  ]);
});

it('the same rows however the text is cut into chunks', async () => {
  const text = 'a,"x ""y"""\r\n"p\nq",2\n';
  const whole = await read([text]);
  for (let cut = 1; cut < text.length; cut++) {
    expect(await read([text.substring(0, cut), text.substring(cut)]), `cut at ${cut}`).toEqual(whole);
  }
});

// Added in the move: Dart's decoder did this; here it is ours to get right.
it('a character cut in two between pieces of bytes is still read whole', async () => {
  const bytes = new TextEncoder().encode('name\nCrème brûlée\n');
  for (let cut = 1; cut < bytes.length; cut++) {
    const rows: string[][] = [];
    for await (const row of csvRowsFromBytes([bytes.slice(0, cut), bytes.slice(cut)])) rows.push(row);
    expect(rows, `cut at ${cut}`).toEqual([['name'], ['Crème brûlée']]);
  }
});
