export class StrapiHttpError extends Error {
  readonly name = 'StrapiHttpError';

  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
    readonly body?: string
  ) {
    super(message);
  }

  static async fromResponse(response: Response, url: string) {
    const body = await response.text().catch(() => undefined);
    const message = `Strapi request failed with ${response.status} ${response.statusText}`;
    return new StrapiHttpError(message, response.status, url, body || undefined);
  }
}
