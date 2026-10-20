/** How the key was derived from the passphrase: Argon2id and its parameters, stated in the file's plain header (MM-63). */
export interface BackupKdf {
  readonly algorithm: 'argon2id13';
  readonly opsLimit: number;
  readonly memLimit: number;
  /** Base64. */
  readonly salt: string;
}
