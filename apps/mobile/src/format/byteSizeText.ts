/** A size in bytes as a person reads it: "850 KB", "12 MB", "1.4 GB" (MM-157). */
export function byteSizeText(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  if (bytes < 1_000_000_000) return `${Math.round(bytes / 1_000_000)} MB`;
  return `${Math.round(bytes / 100_000_000) / 10} GB`;
}
