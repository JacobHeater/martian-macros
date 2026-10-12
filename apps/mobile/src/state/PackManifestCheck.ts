import type { PackHttp } from '../foodCatalog/download/PackHttp';
import { PackManifest } from '../foodCatalog/download/PackManifest';
import { FormatError } from '../lang/FormatError';
import type { Cell } from './Cell';
import type { PackManifestState } from './PackManifestState';
import { ValueCell } from './ValueCell';

/** The most a list of packs can be: it is a few lines. */
const largestBytes = 1024 * 1024;

/** Reads the list of available packs, once, when the user asks. */
export class PackManifestCheck {
  private readonly held = new ValueCell<PackManifestState>({ checking: false });
  private readonly http: PackHttp;
  private readonly url: string;

  constructor({ http, url }: { http: PackHttp; url: string }) {
    this.http = http;
    this.url = url;
  }

  get state(): Cell<PackManifestState> {
    return this.held;
  }

  async check(): Promise<void> {
    if (this.url === '' || this.held.peek().checking) return;
    this.held.put({ checking: true });
    const failed = (message: string) => this.held.put({ checking: false, message });
    try {
      const response = await this.http.get(new URL(this.url));
      if (response.statusCode !== 200) {
        response.abort();
        failed(`The host answered with an error (${response.statusCode}).`);
        return;
      }
      const chunks: Uint8Array[] = [];
      let length = 0;
      for await (const chunk of response.body) {
        chunks.push(chunk);
        length += chunk.length;
        if (length > largestBytes) {
          response.abort();
          failed('The list was too large.');
          return;
        }
      }
      const bytes = new Uint8Array(length);
      let at = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, at);
        at += chunk.length;
      }
      this.held.put({ checking: false, manifest: PackManifest.parse(new TextDecoder().decode(bytes)) });
    } catch (error) {
      failed(error instanceof FormatError ? 'The list could not be read.' : 'The host could not be reached.');
    }
  }
}
