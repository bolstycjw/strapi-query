export interface GenerateSchemaFromGraphQlOptions {
    importFrom?: string;
    schemaExportName?: string;
    header?: string;
}
export declare function generateSchemaFromGraphQl(introspection: unknown, options?: GenerateSchemaFromGraphQlOptions): string;
export declare function graphQlIntrospectionQuery(): string;
//# sourceMappingURL=graphql.d.ts.map