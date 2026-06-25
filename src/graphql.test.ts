import { describe, expect, it } from 'vitest';
import { generateSchemaFromGraphQl } from './graphql.js';

describe('generateSchemaFromGraphQl', () => {
  it('generates schema definitions from Strapi GraphQL introspection', () => {
    const output = generateSchemaFromGraphQl({
      data: {
        __schema: {
          queryType: { name: 'Query' },
          types: [
            objectType('Query', [
              field('article', named('Article')),
              field('articles', list(named('Article'))),
              field('author', named('Author')),
              field('authors', list(named('Author'))),
              field('homePage', named('HomePage')),
              field('mutualFunds', list(named('MutualFund'))),
              field('themes', list(named('Theme'))),
              field('uploadFiles', list(named('UploadFile'))),
              field('usersPermissionsUsers', list(named('UsersPermissionsUser')))
            ]),
            objectType('Article', [
              field('documentId', nonNull(named('ID'))),
              field('title', nonNull(named('String'))),
              field('accessTier', nonNull(named('ENUM_ARTICLE_ACCESSTIER'))),
              field('cover', named('UploadFile')),
              field('themes_connection', named('ThemeRelationResponseCollection')),
              field('themes', nonNull(list(named('Theme')))),
              field('author', named('Author')),
              field('cta', named('ComponentContentCta')),
              field('listedMutualFunds', list(named('MutualFund'))),
              field('publishedAt', named('DateTime'))
            ]),
            objectType('Author', [
              field('documentId', nonNull(named('ID'))),
              field('name', nonNull(named('String')))
            ]),
            objectType('Theme', [
              field('documentId', nonNull(named('ID'))),
              field('uid', nonNull(named('String'))),
              field('articles', list(named('Article')))
            ]),
            objectType('MutualFund', [
              field('documentId', nonNull(named('ID'))),
              field('name', named('String'))
            ]),
            objectType('UploadFile', [
              field('documentId', nonNull(named('ID'))),
              field('url', nonNull(named('String'))),
              field('alternativeText', named('String'))
            ]),
            objectType('HomePage', [
              field('documentId', nonNull(named('ID'))),
              field('featuredArticle', named('Article'))
            ]),
            objectType('ComponentContentCta', [
              field('label', named('String')),
              field('url', named('String')),
              field('icon', named('UploadFile'))
            ]),
            objectType('ThemeRelationResponseCollection', []),
            objectType('UsersPermissionsUser', [
              field('id', named('ID')),
              field('username', named('String'))
            ]),
            enumType('ENUM_ARTICLE_ACCESSTIER', ['free', 'pro_tier'])
          ]
        }
      }
    });

    expect(output).toContain('export interface Article {');
    expect(output).toContain('title: string;');
    expect(output).toContain('accessTier: "free" | "pro tier";');
    expect(output).toContain('cta?: ComponentContentCta | null;');
    expect(output).toContain('publishedAt?: string | null;');
    expect(output).not.toContain('cover?:');
    expect(output).not.toContain('themes_connection');
    expect(output).not.toContain('listedMutualFunds?:');
    expect(output).toContain("article: collection('articles', {");
    expect(output).toContain("cover: one('uploadFile')");
    expect(output).toContain("cover: one('uploadFile'),");
    expect(output).toContain("themes: many('theme'),");
    expect(output).toContain("author: one('author')");
    expect(output).toContain("listedMutualFunds: many('mutualFund')");
    expect(output).toContain("homePage: single('home-page', {");
    expect(output).toContain("featuredArticle: one('article')");
    expect(output).toContain("uploadFile: collection('upload/files', {");
    expect(output).not.toContain('usersPermissionsUser');
  });
});

function objectType(name: string, fields: ReturnType<typeof field>[]) {
  return {
    kind: 'OBJECT',
    name,
    fields
  };
}

function enumType(name: string, values: string[]) {
  return {
    kind: 'ENUM',
    name,
    enumValues: values.map((value) => ({ name: value }))
  };
}

function field(name: string, type: unknown) {
  return { name, type };
}

function named(name: string, kind = 'OBJECT') {
  const scalarNames = new Set(['ID', 'String', 'DateTime']);
  return {
    kind: scalarNames.has(name) ? 'SCALAR' : kind,
    name
  };
}

function nonNull(ofType: unknown) {
  return {
    kind: 'NON_NULL',
    ofType
  };
}

function list(ofType: unknown) {
  return {
    kind: 'LIST',
    ofType
  };
}
