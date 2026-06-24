export class StrapiHttpError extends Error {
    status;
    url;
    body;
    name = 'StrapiHttpError';
    constructor(message, status, url, body) {
        super(message);
        this.status = status;
        this.url = url;
        this.body = body;
    }
    static async fromResponse(response, url) {
        const body = await response.text().catch(() => undefined);
        const message = `Strapi request failed with ${response.status} ${response.statusText}`;
        return new StrapiHttpError(message, response.status, url, body || undefined);
    }
}
//# sourceMappingURL=errors.js.map