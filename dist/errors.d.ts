export declare class StrapiHttpError extends Error {
    readonly status: number;
    readonly url: string;
    readonly body?: string | undefined;
    readonly name = "StrapiHttpError";
    constructor(message: string, status: number, url: string, body?: string | undefined);
    static fromResponse(response: Response, url: string): Promise<StrapiHttpError>;
}
//# sourceMappingURL=errors.d.ts.map