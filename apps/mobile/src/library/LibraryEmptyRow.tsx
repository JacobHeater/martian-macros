import { MmListRow } from '../ui/MmListRow';

/** What fills an empty fold of the Library, in one line (MM-706): the sibling of the food database's "Nothing downloaded yet". */
export function LibraryEmptyRow({ text }: { text: string }) {
  return <MmListRow leadingIcon="info" title={text} />;
}
