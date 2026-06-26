export interface GenerateSchemaFromStrapiSchemasOptions {
    importFrom?: string;
    schemaExportName?: string;
    header?: string;
}
export interface StrapiSchemaDocument {
    path?: string;
    schema: unknown;
}
export declare function generateSchemaFromStrapiSchemas(documents: readonly StrapiSchemaDocument[], options?: GenerateSchemaFromStrapiSchemasOptions): string;
//# sourceMappingURL=strapi-schema.d.ts.map