/**
 * A question a user might ask, answered in plain language and tied to the
 * register rows it draws on.
 */
export interface EvidenceQuestion {
  readonly title: string;
  readonly answer: string;
  readonly rowNames: readonly string[];
}
