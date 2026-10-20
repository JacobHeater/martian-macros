import type { CatalogFood } from '../foodCatalog/CatalogFood';

/**
 * What asking online for a food came to (MM-58): found and now kept on the
 * phone; not known to any service; no service could be reached; or not
 * allowed, because the person has said never or has not yet been asked.
 */
export type OnlineLookupResult =
  | { readonly kind: 'found'; readonly food: CatalogFood }
  | { readonly kind: 'notFound' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'notAllowed' };
