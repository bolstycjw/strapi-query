import { StrapiHttpError } from './errors.js';
import { stringifyQuery } from './query-string.js';
import type {
	AnyCollectionResource,
	AnyResource,
	AnySingleResource,
  CollectionResource,
  CreateStrapiClientOptions,
  ManyRelation,
  OneRelation,
  Query,
  RelationDefinitions,
  SchemaDefinition,
  SingleResource,
  StrapiClient,
  StrapiCollectionResponse,
	StrapiSingleResponse
} from './types.js';

export function one<const Target extends string>(target: Target): OneRelation<Target> {
  return { kind: 'relation', cardinality: 'one', target };
}

export function many<const Target extends string>(target: Target): ManyRelation<Target> {
	return { kind: 'relation', cardinality: 'many', target };
}

export function entity<Entity>(): Entity {
	return undefined as Entity;
}

export function collection<Entity>(
	path: string
): CollectionResource<Entity, {}>;
export function collection<Entity, const Relations extends RelationDefinitions = {}>(
	path: string,
	options: { entity: Entity; relations?: Relations }
): CollectionResource<Entity, Relations>;
export function collection<Entity, const Relations extends RelationDefinitions = {}>(
	path: string,
	options?: { entity?: Entity; relations?: Relations }
): CollectionResource<Entity, Relations> {
	return {
		kind: 'collection',
		path,
    relations: (options?.relations ?? {}) as Relations
	};
}

export function single<Entity>(path: string): SingleResource<Entity, {}>;
export function single<Entity, const Relations extends RelationDefinitions = {}>(
	path: string,
	options: { entity: Entity; relations?: Relations }
): SingleResource<Entity, Relations>;
export function single<Entity, const Relations extends RelationDefinitions = {}>(
	path: string,
	options?: { entity?: Entity; relations?: Relations }
): SingleResource<Entity, Relations> {
	return {
		kind: 'single',
		path,
    relations: (options?.relations ?? {}) as Relations
  };
}

export function defineSchema<const Schema extends SchemaDefinition>(schema: Schema): Schema {
  return schema;
}

export function createStrapiClient<const Schema extends SchemaDefinition>(
	options: CreateStrapiClientOptions<Schema>
): StrapiClient<Schema> {
  const endpoint = normalizeEndpoint(options.endpoint);
  const fetcher = options.fetch ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error('No fetch implementation is available. Pass `fetch` to createStrapiClient().');
  }

  async function requestJson<Response>(resource: AnyResource, query?: Query<Schema, never, never>) {
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

    return response.json() as Promise<Response>;
  }

	const client: StrapiClient<Schema> = {
		collection(key) {
			const resource = options.schema[key] as AnyCollectionResource | undefined;
			assertResource(key, resource, 'collection');

			return {
				findMany(query?: unknown) {
					return requestJson(resource, query as Query<Schema, never, never>);
				},
				async findFirst(query?: unknown) {
					const response = await requestJson<StrapiCollectionResponse<unknown>>(
						resource,
						query as Query<Schema, never, never>
					);
					return response.data[0] ?? null;
				}
			} as never;
		},
		single(key) {
			const resource = options.schema[key] as AnySingleResource | undefined;
			assertResource(key, resource, 'single');

			return {
				find(query?: unknown) {
					return requestJson(resource, query as Query<Schema, never, never>);
				}
			} as never;
		}
	};

	return client;
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
}

function buildUrl(endpoint: string, path: string, query?: Query<SchemaDefinition, never, never>) {
	const queryString = query ? stringifyQuery(query as Record<string, unknown>) : '';
	return `${endpoint}/${path.replace(/^\/+/, '')}${queryString ? `?${queryString}` : ''}`;
}

function assertResource(
  key: PropertyKey,
  resource: AnyResource | undefined,
  kind: AnyResource['kind']
): asserts resource is AnyResource {
  if (!resource) {
    throw new Error(`Unknown Strapi resource: ${String(key)}`);
  }

  if (resource.kind !== kind) {
    throw new Error(`Strapi resource ${String(key)} is a ${resource.kind}, not a ${kind}.`);
  }
}
