/**
 * Reads CSV (RFC 4180: quoted fields, doubled quotes, line breaks inside
 * quotes) from text that arrives in pieces, one row at a time, without
 * holding the file in memory.
 */
export async function* csvRows(chunks: AsyncIterable<string> | Iterable<string>): AsyncGenerator<string[]> {
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawQuoteInside = false; // a `"` just ended a quoted run or is doubled
  let started = false; // anything seen for the current row

  for await (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i] as string;
      if (inQuotes) {
        if (sawQuoteInside) {
          sawQuoteInside = false;
          if (c === '"') {
            field += '"';
            continue;
          }
          inQuotes = false; // the quote closed the run; handle `c` below
        } else if (c === '"') {
          sawQuoteInside = true;
          continue;
        } else {
          field += c;
          continue;
        }
      }
      if (c === '"' && field === '') {
        inQuotes = true;
        started = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
        started = true;
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && i + 1 < chunk.length && chunk[i + 1] === '\n') i++;
        if (started || field !== '') {
          row.push(field);
          yield row;
        }
        row = [];
        field = '';
        started = false;
      } else {
        field += c;
        started = true;
      }
    }
  }
  if (started || field !== '') {
    row.push(field);
    yield row;
  }
}
