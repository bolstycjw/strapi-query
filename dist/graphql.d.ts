export interface GenerateSchemaFromGraphQlOptions {
    importFrom?: string;
    schemaExportName?: string;
    header?: string;
    nullability?: GenerateSchemaNullability;
}
export type GenerateSchemaNullability = 'optimistic' | 'graphql';
export declare function generateSchemaFromGraphQl(introspection: unknown, options?: GenerateSchemaFromGraphQlOptions): string;
export declare function graphQlIntrospectionQuery(): string;
//# sourceMappingURL=graphql.d.ts.map