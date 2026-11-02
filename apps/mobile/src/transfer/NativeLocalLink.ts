import { base64OfBytes } from '../lang/base64OfBytes';
import { bytesOfBase64 } from '../lang/bytesOfBase64';
import type { MmTransferApi } from '../platform/MmTransferApi';
import type { LinkAddress } from './LinkAddress';
import type { LinkConnection } from './LinkConnection';
import type { LinkDialer } from './LinkDialer';
import type { LinkListener } from './LinkListener';
import { MoveProblem } from './MoveProblem';
import type { MoveProblemKind } from './MoveProblemKind';

/** The plugin's rejection as a move problem: its code when it names one, otherwise `fallback`. */
async function asked<T>(step: () => Promise<T>, fallback: MoveProblemKind): Promise<T> {
  try {
    return await step();
  } catch (error) {
    const code = (error as { code?: unknown } | undefined)?.code;
    throw new MoveProblem(code === 'noWifi' || code === 'unreachable' || code === 'stopped' ? code : fallback);
  }
}

/**
 * The phone's local network through the `MmTransfer` plugin (MM-698): a server socket on Android, an `NWListener` on
 * iOS, and a connection to the other phone's address. Frames cross the bridge as base64; the plugin puts each one's
 * length before it on the wire.
 */
export class NativeLocalLink implements LinkListener, LinkDialer {
  private readonly api: MmTransferApi;

  constructor(api: MmTransferApi) {
    this.api = api;
  }

  listen(): Promise<LinkAddress> {
    return asked(() => this.api.listen(), 'noWifi');
  }

  async accept(): Promise<LinkConnection> {
    return this.connection((await asked(() => this.api.accept(), 'stopped')).connection);
  }

  async stop(): Promise<void> {
    await this.api.stopListening();
  }

  async connect(address: LinkAddress): Promise<LinkConnection> {
    return this.connection((await asked(() => this.api.connect({ host: address.host, port: address.port }), 'unreachable')).connection);
  }

  private connection(id: string): LinkConnection {
    const api = this.api;
    return {
      send: (frame) => asked(() => api.send({ connection: id, data: base64OfBytes(frame) }), 'broken'),
      receive: async () => {
        const got = await asked(() => api.receive({ connection: id }), 'broken');
        return got.closed || got.data === undefined ? undefined : bytesOfBase64(got.data);
      },
      close: () => api.close({ connection: id }),
    };
  }
}
