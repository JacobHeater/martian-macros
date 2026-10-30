import sodium from 'libsodium-wrappers-sumo';
import type { MoveCipher } from './MoveCipher';
import type { MoveOpener } from './MoveOpener';
import type { MoveSealer } from './MoveSealer';

/** The same bytes as a view in this realm: libsodium refuses a typed array from another one (a WebView frame, a test's document). */
const local = (bytes: Uint8Array): Uint8Array => new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/**
 * libsodium's secretstream, XChaCha20-Poly1305 (MM-698): every frame authenticated, in order, the last one marked,
 * so a frame changed, dropped, repeated or cut short is refused. The key is the one in the code, never derived from
 * anything typed.
 */
export class SodiumMoveCipher implements MoveCipher {
  private async ready(): Promise<typeof sodium> {
    await sodium.ready;
    return sodium;
  }

  async newKey(): Promise<Uint8Array> {
    return (await this.ready()).crypto_secretstream_xchacha20poly1305_keygen();
  }

  async sealer(key: Uint8Array): Promise<MoveSealer> {
    const s = await this.ready();
    const { state, header } = s.crypto_secretstream_xchacha20poly1305_init_push(local(key));
    return {
      header,
      seal: (plain, final = false) =>
        s.crypto_secretstream_xchacha20poly1305_push(
          state,
          local(plain),
          null,
          final ? s.crypto_secretstream_xchacha20poly1305_TAG_FINAL : s.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
        ),
    };
  }

  async opener(key: Uint8Array, header: Uint8Array): Promise<MoveOpener> {
    const s = await this.ready();
    if (header.length !== s.crypto_secretstream_xchacha20poly1305_HEADERBYTES) throw new Error('Not a stream header.');
    const state = s.crypto_secretstream_xchacha20poly1305_init_pull(local(header), local(key));
    return {
      open: (sealed) => {
        const opened = s.crypto_secretstream_xchacha20poly1305_pull(state, local(sealed), null);
        if (opened === false) throw new Error('The frame did not open.');
        return { plain: opened.message, final: opened.tag === s.crypto_secretstream_xchacha20poly1305_TAG_FINAL };
      },
    };
  }
}
