/** The one method of a native plugin that hands an address to the phone's browser (MM-454). */
export interface MmOpenInBrowserApi {
  /** Opens `url`, an `https` address, in the phone's browser; rejects when none can open it. */
  openInBrowser(options: { url: string }): Promise<void>;
}
