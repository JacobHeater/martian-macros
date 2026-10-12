/**
 * A value SQLite can store or return. This is the one place `null` is used
 * for "nothing": it is SQL's own NULL, and it stops at the repositories.
 */
export type SqlValue = string | number | null | Uint8Array;
