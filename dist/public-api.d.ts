import type { CollectionResource, CreateStrapiClientOptions, ManyRelation, OneRelation, RelationDefinitions, SchemaDefinition, SingleResource, StrapiClient } from './types.js';
export declare function one<const Target extends string>(target: Target): OneRelation<Target>;
export declare function many<const Target extends string>(target: Target): ManyRelation<Target>;
export declare function entity<Entity>(): Entity;
export declare function collection<Entity>(path: string): CollectionResource<Entity, {}>;
export declare function collection<Entity, const Relations extends RelationDefinitions = {}>(path: string, options: {
    entity: Entity;
    relations?: Relations;
}): CollectionResource<Entity, Relations>;
export declare function single<Entity>(path: string): SingleResource<Entity, {}>;
export declare function single<Entity, const Relations extends RelationDefinitions = {}>(path: string, options: {
    entity: Entity;
    relations?: Relations;
}): SingleResource<Entity, Relations>;
export declare function defineSchema<const Schema extends SchemaDefinition>(schema: Schema): Schema;
export declare function createStrapiClient<const Schema extends SchemaDefinition>(options: CreateStrapiClientOptions<Schema>): StrapiClient<Schema>;
//# sourceMappingURL=public-api.d.ts.map