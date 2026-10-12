import type { Denied } from './Denied';
import type { NotFound } from './NotFound';
import type { Succeeded } from './Succeeded';
import type { Unavailable } from './Unavailable';

/**
 * The result of asking an outside provider for something.
 *
 * Every integration seam returns this, so consumers handle the same four
 * cases whichever provider is behind it, and a fixture can simulate each.
 * Tell the cases apart by `kind`, or with `instanceof`.
 */
export type Outcome<T> = Succeeded<T> | NotFound | Denied | Unavailable;
