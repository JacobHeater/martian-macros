import type { JsonHttp } from '../domain/integration/JsonHttp';
import type { JsonResponse } from '../domain/integration/JsonResponse';

/**
 * A `JsonHttp` that answers from memory, for tests and stories: no network.
 * Give it answers by a piece of the address; it records every request made,
 * so a test can prove that none was.
 */
export class InMemoryJsonHttp implements JsonHttp {
  /** Each answer, keyed by text the address must contain; the first match answers. */
  readonly answers = new Map<string, JsonResponse>();

  /** Every request made, in order, with the headers it carried. */
  readonly requests: { url: URL; headers: Readonly<Record<string, string>> }[] = [];

  /** Throw on every request, as a phone with no connection would. */
  offline = false;

  answer(containing: string, body: unknown, statusCode = 200): this {
    this.answers.set(containing, { statusCode, body });
    return this;
  }

  async getJson(url: URL, options?: { headers?: Readonly<Record<string, string>> | undefined }): Promise<JsonResponse> {
    this.requests.push({ url, headers: options?.headers ?? {} });
    if (this.offline) throw new Error('No connection.');
    const text = url.toString();
    for (const [key, response] of this.answers) if (text.includes(key)) return response;
    return { statusCode: 404, body: undefined };
  }
}
