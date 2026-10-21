/**
 * Hands a web address to the phone's own browser (MM-454), when the person
 * presses a link. The app fetches nothing itself: the browser opens the page,
 * under its own policy. Only an `https` address is ever handed over.
 */
export interface ExternalLinks {
  /**
   * Opens `address` in the phone's browser. Rejects, and opens nothing, when
   * the address is not `https`, or when the phone has no browser to open it.
   */
  openInBrowser(address: string): Promise<void>;
}
