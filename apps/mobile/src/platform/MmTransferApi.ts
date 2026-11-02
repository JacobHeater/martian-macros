/**
 * The native `MmTransfer` plugin (MM-698): a listener and connections on the
 * local network, carrying whole frames (each sent with its length first).
 * A connection is named by the id the plugin gives. Nothing is sent to the
 * internet: the address is the other phone's on the same Wi-Fi.
 */
export interface MmTransferApi {
  /** Starts listening on the Wi-Fi. Rejects with code `noWifi` when the phone has no Wi-Fi address. */
  listen(): Promise<{ host: string; port: number }>;
  /** The next connection. Rejects with code `stopped` once `stopListening` is called. */
  accept(): Promise<{ connection: string }>;
  stopListening(): Promise<void>;
  /** Rejects with code `unreachable` when the other phone does not answer within a few seconds. */
  connect(options: { host: string; port: number }): Promise<{ connection: string }>;
  send(options: { connection: string; data: string }): Promise<void>;
  /** The next frame as base64, or `closed` once the other side hung up. */
  receive(options: { connection: string }): Promise<{ data?: string; closed: boolean }>;
  close(options: { connection: string }): Promise<void>;
}
