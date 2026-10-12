/**
 * A `SqlValue` as the plugin bridge carries it, which is JSON: a blob
 * becomes `{ $blob: base64 }`, and everything else is itself.
 */
export type BridgeSqlValue = string | number | null | { readonly $blob: string };
