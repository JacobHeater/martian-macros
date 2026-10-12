/** A pack this app cannot read safely. */
export class UnsupportedPackVersion extends Error {
  override readonly name = 'UnsupportedPackVersion';
  readonly found: number;
  readonly supported: number;

  constructor({ found, supported }: { found: number; supported: number }) {
    super(
      `This food pack uses format ${found}; this app reads format ${supported}. ` +
        'Update the app or download a matching pack.',
    );
    this.found = found;
    this.supported = supported;
  }
}
