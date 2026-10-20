import { CapacitorHttp } from '@capacitor/core';
import type { JsonHttp } from '../domain/integration/JsonHttp';
import type { JsonResponse } from '../domain/integration/JsonResponse';

/**
 * `JsonHttp` over the shell's own HTTP stack (MM-58), so the request can
 * name the app in its User-Agent as Open Food Facts asks, which a page
 * inside a web view cannot do by itself. In a browser Capacitor falls back
 * to fetch, which drops that header; the web is never a product (MM-228).
 */
export class CapacitorJsonHttp implements JsonHttp {
  async getJson(url: URL, options?: { headers?: Readonly<Record<string, string>> | undefined }): Promise<JsonResponse> {
    const response = await CapacitorHttp.get({
      url: url.toString(),
      headers: { Accept: 'application/json', ...(options?.headers ?? {}) },
      responseType: 'json',
      connectTimeout: 15_000,
      readTimeout: 15_000,
    });
    return { statusCode: response.status, body: response.data };
  }
}
