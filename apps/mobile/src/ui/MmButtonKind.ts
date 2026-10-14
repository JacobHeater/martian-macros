/**
 * What a button is for. A screen says this, never a color (MM-104). The
 * destructive kind is quiet (danger as text, never a fill), so the safe exit
 * beside it is the stronger button (MM-280).
 */
export type MmButtonKind = 'primary' | 'secondary' | 'text' | 'destructive';
