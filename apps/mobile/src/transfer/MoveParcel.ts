import type { MovePayload } from './MovePayload';

/**
 * What crosses the link between two phones (MM-698, MM-715): everything, the move's payload that replaces the
 * receiving phone, or a copy of some foods (the bytes `foodCopyBytes` makes), which the receiving phone adds.
 */
export type MoveParcel = { readonly kind: 'everything'; readonly payload: MovePayload } | { readonly kind: 'foods'; readonly foods: Uint8Array };
