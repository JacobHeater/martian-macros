import { healthWritePrefix } from '../healthIngest/healthWritePrefix';

/**
 * The id a logged food is written to the health platform under (MM-70):
 * the app's own, found again to remove it. The namespace keeps it apart from
 * what was written before an erase, when entry ids start again (MM-522).
 */
export function foodRecordId(namespace: string, id: number): string {
  return `${healthWritePrefix.food}${namespace}-${id}`;
}
