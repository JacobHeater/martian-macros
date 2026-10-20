/**
 * What a button is for. A screen says this, never a color (MM-104). The
 * destructive kind is quiet (danger as text, never a fill), so the safe exit
 * beside it is the stronger button (MM-280). A text action is in the text
 * colour at the heading weight (MM-288); the lead kind is the screen's one
 * primary action where it stands in the app bar and cannot be a fill, the
 * only Ember text there is, and it counts as the screen's primary.
 */
export type MmButtonKind = 'primary' | 'secondary' | 'text' | 'lead' | 'destructive';
