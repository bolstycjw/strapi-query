import { StrapiHttpError } from './errors.js';
import { stringifyQuery } from './query-string.js';
export function one(target) {
    return { kind: 'relation', cardinality: 'one', target };
}
export function many(target) {
    return { kind: 'relation', cardinality: 'many', target };
}
export function entity() {
    return undefined;
}
export function collection(path, options) {
    return {
        kind: 'collection',
        path,
        relations: (options?.relations ?? {})
    };
}
export function single(path, options) {
    return {
        kind: 'single',
        path,
        relations: (options?.relations ?? {})
    };
}
export function defineSchema(schema) {
    return schema;
}
export function createStrapiClient(options) {
    const endpoint = normalizeEndpoint(options.endpoint);
    const fetcher = options.fetch ?? globalThis.fetch;
    if (!fetcher) {
        throw new Error('No fetch implementation is available. Pass `fetch` to createStrapiClient().');
    }
    async function requestJson(resource, query) {
        const url = buildUrl(endpoint, resource.path, query);
        const headers = new Headers(options.headers);
        if (options.token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${options.token}`);
        }
        const response = await fetcher(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            throw await StrapiHttpError.fromResponse(response, url);
        }
        return response.json();
    }
    const client = {
        collection(key) {
            const resource = options.schema[key];
            assertResource(key, resource, 'collection');
            return {
                findMany(query) {
                    return requestJson(resource, query);
                },
                async findFirst(query) {
                    const response = await requestJson(resource, query);
                    return response.data[0] ?? null;
                }
            };
        },
        single(key) {
            const resource = options.schema[key];
            assertResource(key, resource, 'single');
            return {
                find(query) {
                    return requestJson(resource, query);
                }
            };
        }
    };
    return client;
}
function normalizeEndpoint(endpoint) {
    return endpoint.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
}
function buildUrl(endpoint, path, query) {
    const queryString = query ? stringifyQuery(query) : '';
    return `${endpoint}/${path.replace(/^\/+/, '')}${queryString ? `?${queryString}` : ''}`;
}
function assertResource(key, resource, kind) {
    if (!resource) {
        throw new Error(`Unknown Strapi resource: ${String(key)}`);
    }
    if (resource.kind !== kind) {
        throw new Error(`Strapi resource ${String(key)} is a ${resource.kind}, not a ${kind}.`);
    }
}
//# sourceMappingURL=public-api.js.map