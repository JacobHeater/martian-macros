/** What one `gh` invocation returned. */
export interface GhResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}
