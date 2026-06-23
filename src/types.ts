export interface OneRelation<Target extends string = string> {
  kind: 'relation';
  cardinality: 'one';
  target: Target;
}

export interface ManyRelation<Target extends string = string> {
  kind: 'relation';
  cardinality: 'many';
  target: Target;
}

export type RelationDefinition = OneRelation | ManyRelation;
export type RelationDefinitions = Record<string, RelationDefinition>;

export interface ResourceDefinition<
  Entity,
  Relations extends RelationDefinitions,
  Kind extends 'collection' | 'single'
> {
  kind: Kind;
  path: string;
  relations: Relations;
  readonly __entity?: Entity;
}

export type CollectionResource<Entity, Relations extends RelationDefinitions = {}> =
  ResourceDefinition<Entity, Relations, 'collection'>;

export type SingleResource<Entity, Relations extends RelationDefinitions = {}> = ResourceDefinition<
  Entity,
  Relations,
  'single'
>;

export type AnyCollectionResource = CollectionResource<unknown, RelationDefinitions>;
export type AnySingleResource = SingleResource<unknown, RelationDefinitions>;
export type AnyResource = AnyCollectionResource | AnySingleResource;
export type SchemaDefinition = Record<string, AnyResource>;

export type CollectionKey<Schema extends SchemaDefinition> = {
  [Key in keyof Schema]: Schema[Key] extends ResourceDefinition<unknown, RelationDefinitions, 'collection'>
    ? Key
    : never;
}[keyof Schema];

export type SingleKey<Schema extends SchemaDefinition> = {
  [Key in keyof Schema]: Schema[Key] extends ResourceDefinition<unknown, RelationDefinitions, 'single'>
    ? Key
    : never;
}[keyof Schema];

export type Entity<
	Schema extends SchemaDefinition,
	Key extends keyof Schema
> = Schema[Key] extends ResourceDefinition<
	infer ResourceEntity,
	RelationDefinitions,
	'collection' | 'single'
>
	? ResourceEntity
	: never;

export type Relations<
	Schema extends SchemaDefinition,
	Key extends keyof Schema
> = Schema[Key] extends ResourceDefinition<
	unknown,
	infer ResourceRelations,
	'collection' | 'single'
>
	? ResourceRelations
	: never;

type StringKeyOf<T> = Extract<keyof T, string>;

type TargetKey<
	Schema extends SchemaDefinition,
	Relation extends RelationDefinition
> = Relation extends OneRelation<infer Target>
	? Extract<Target, keyof Schema>
	: Relation extends ManyRelation<infer Target>
		? Extract<Target, keyof Schema>
		: never;

type RelationValue<
  Schema extends SchemaDefinition,
  Relation extends RelationDefinition,
  PopulateValue
> =
  Relation extends OneRelation
    ? Populated<Schema, TargetKey<Schema, Relation>, NestedPopulate<PopulateValue>> | null
    : Relation extends ManyRelation
      ? Populated<Schema, TargetKey<Schema, Relation>, NestedPopulate<PopulateValue>>[]
      : never;

type NestedPopulate<PopulateValue> = PopulateValue extends { populate: infer Nested }
  ? Nested
  : never;

export type Populated<
	Schema extends SchemaDefinition,
	Key extends keyof Schema,
	PopulateShape = never
> = Entity<Schema, Key> &
	([PopulateShape] extends [object]
		? {
				[RelationKey in Extract<keyof PopulateShape, keyof Relations<Schema, Key>>]: RelationValue<
					Schema,
          Relations<Schema, Key>[RelationKey],
          PopulateShape[RelationKey]
        >;
      }
    : {});

export type FieldSelection<Schema extends SchemaDefinition, Key extends keyof Schema> = readonly StringKeyOf<
  Entity<Schema, Key>
>[];

export type Sort<Schema extends SchemaDefinition, Key extends keyof Schema> =
  | StringKeyOf<Entity<Schema, Key>>
  | `${StringKeyOf<Entity<Schema, Key>>}:asc`
  | `${StringKeyOf<Entity<Schema, Key>>}:desc`;

type Primitive = string | number | boolean | null | Date;

type FieldOperators<Value> = {
  $eq?: Value;
  $eqi?: Value extends string ? string : never;
  $ne?: Value;
  $lt?: Value;
  $lte?: Value;
  $gt?: Value;
  $gte?: Value;
  $in?: Value[];
  $notIn?: Value[];
  $contains?: Value extends string ? string : never;
  $notContains?: Value extends string ? string : never;
  $containsi?: Value extends string ? string : never;
  $notContainsi?: Value extends string ? string : never;
  $startsWith?: Value extends string ? string : never;
  $endsWith?: Value extends string ? string : never;
  $null?: boolean;
  $notNull?: boolean;
  $between?: [Value, Value];
};

type FilterValue<Value> =
  Value extends Primitive
    ? Value | Value[] | FieldOperators<NonNullable<Value>>
    : Value extends Array<infer Item>
      ? Item | Item[] | FieldOperators<Item>
      : Value | FieldOperators<Value>;

type FieldFilters<Schema extends SchemaDefinition, Key extends keyof Schema> = {
  [Field in StringKeyOf<Entity<Schema, Key>>]?: FilterValue<Entity<Schema, Key>[Field]>;
};

type RelationFilters<Schema extends SchemaDefinition, Key extends keyof Schema> = {
  [RelationKey in StringKeyOf<Relations<Schema, Key>>]?: Filters<
    Schema,
    TargetKey<Schema, Relations<Schema, Key>[RelationKey]>
  >;
};

export type Filters<Schema extends SchemaDefinition, Key extends keyof Schema> = (
  | (FieldFilters<Schema, Key> & RelationFilters<Schema, Key>)
  | {
      $and?: Filters<Schema, Key>[];
      $or?: Filters<Schema, Key>[];
      $not?: Filters<Schema, Key>;
    }
) & {};

type PopulateRelationValue<Schema extends SchemaDefinition, Relation extends RelationDefinition> =
  | true
  | {
      fields?: FieldSelection<Schema, TargetKey<Schema, Relation>>;
      filters?: Filters<Schema, TargetKey<Schema, Relation>>;
      populate?: Populate<Schema, TargetKey<Schema, Relation>>;
      sort?: Sort<Schema, TargetKey<Schema, Relation>>[];
    };

export type Populate<Schema extends SchemaDefinition, Key extends keyof Schema> = {
  [RelationKey in StringKeyOf<Relations<Schema, Key>>]?: PopulateRelationValue<
    Schema,
    Relations<Schema, Key>[RelationKey]
  >;
};

export interface Pagination {
  page?: number;
  pageSize?: number;
  withCount?: boolean;
  limit?: number;
  start?: number;
}

export interface Query<
  Schema extends SchemaDefinition,
  Key extends keyof Schema,
  PopulateShape extends Populate<Schema, Key> | undefined = undefined
> {
  filters?: Filters<Schema, Key>;
  fields?: FieldSelection<Schema, Key>;
  populate?: PopulateShape;
  sort?: Sort<Schema, Key>[];
  pagination?: Pagination;
  status?: 'draft' | 'published';
  publicationState?: 'live' | 'preview';
  locale?: string | string[];
}

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  [key: string]: unknown;
}

export interface StrapiCollectionResponse<Data> {
  data: Data[];
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<Data> {
  data: Data;
  meta: StrapiMeta;
}

export interface CreateStrapiClientOptions<Schema extends SchemaDefinition> {
  endpoint: string;
  token?: string;
  headers?: HeadersInit;
  fetch?: typeof fetch;
  schema: Schema;
}

export interface StrapiCollectionClient<
  Schema extends SchemaDefinition,
  Key extends CollectionKey<Schema>
> {
  findMany<const PopulateShape extends Populate<Schema, Key> | undefined = undefined>(
    query?: Query<Schema, Key, PopulateShape>
  ): Promise<StrapiCollectionResponse<Populated<Schema, Key, NonNullable<PopulateShape>>>>;

  findFirst<const PopulateShape extends Populate<Schema, Key> | undefined = undefined>(
    query?: Query<Schema, Key, PopulateShape>
  ): Promise<Populated<Schema, Key, NonNullable<PopulateShape>> | null>;
}

export interface StrapiSingleClient<
  Schema extends SchemaDefinition,
  Key extends SingleKey<Schema>
> {
  find<const PopulateShape extends Populate<Schema, Key> | undefined = undefined>(
    query?: Query<Schema, Key, PopulateShape>
  ): Promise<StrapiSingleResponse<Populated<Schema, Key, NonNullable<PopulateShape>>>>;
}

export interface StrapiClient<Schema extends SchemaDefinition> {
  collection<Key extends CollectionKey<Schema>>(key: Key): StrapiCollectionClient<Schema, Key>;
  single<Key extends SingleKey<Schema>>(key: Key): StrapiSingleClient<Schema, Key>;
}
