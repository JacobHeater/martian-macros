/** Where a phone listens on the local network (MM-695): its IPv4 address on the Wi-Fi and a port. */
export interface LinkAddress {
  readonly host: string;
  readonly port: number;
}
