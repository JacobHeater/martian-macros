/**
 * `address` as it is to be handed to a browser (MM-454): an absolute `https`
 * address, or an error. Nothing else (another scheme, a relative path, an
 * address that is not one) leaves the app.
 */
export function httpsAddress(address: string): string {
  let parsed: URL;
  try {
    parsed = new URL(address);
  } catch {
    throw new Error(`Not a web address: ${address}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`Only an https address is opened: ${address}`);
  return parsed.href;
}
