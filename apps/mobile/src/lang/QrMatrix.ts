/**
 * A QR code as modules (MM-698): `size` by `size`, `dark[row][column]` true
 * where the module is dark. The quiet zone around it is not included.
 */
export interface QrMatrix {
  readonly size: number;
  readonly version: number;
  readonly dark: readonly (readonly boolean[])[];
}
