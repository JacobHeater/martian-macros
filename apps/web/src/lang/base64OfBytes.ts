/** The bytes as standard base64, which is how they cross the plugin bridge (MM-232). */
export function base64OfBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return btoa(binary);
}
