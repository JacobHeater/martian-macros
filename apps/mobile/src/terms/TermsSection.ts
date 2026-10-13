/** One headed part of the terms of use: what it is about, and what it says. */
export interface TermsSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}
