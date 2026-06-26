import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { readStrapiSchemaFiles } from './strapi-schema-files.js';
import { generateSchemaFromStrapiSchemas } from './strapi-schema.js';

describe('generateSchemaFromStrapiSchemas', () => {
  it('generates schema definitions from Strapi schema files', () => {
    const output = generateSchemaFromStrapiSchemas(strapiSchemas());

    expect(output).toContain('export interface Article {');
    expect(output).toContain('id: number;');
    expect(output).toContain('documentId: string;');
    expect(output).toContain('title: string;');
    expect(output).toContain('rating?: number | null;');
    expect(output).toContain('accessTier: "free" | "pro";');
    expect(output).toContain('seo?: ComponentSharedSeo | null;');
    expect(output).toContain(
      'blocks?: (ComponentSharedCta & { __component: "shared.cta" } | ComponentSharedHero & { __component: "shared.hero" })[];'
    );
    expect(output).not.toContain('title?:');
    expect(output).not.toContain('accessTier?:');
    expect(output).not.toContain('internalNotes');
    expect(output).not.toContain('themes: Theme[];');
    expect(output).toContain('export interface ComponentSharedCta {');
    expect(output).toContain('icon?: UploadFile | null;');
    expect(output).toContain("article: collection('articles', {");
    expect(output).toContain("cover: one('uploadFile'),");
    expect(output).toContain("themes: many('theme'),");
    expect(output).toContain("author: one('author')");
    expect(output).toContain("homePage: single('home-page', {");
    expect(output).toContain("featuredArticle: one('article')");
    expect(output).toContain("uploadFile: collection('upload/files', {");
  });
});

describe('readStrapiSchemaFiles', () => {
  it('reads Strapi content type and component schema files from a directory', async () => {
    const root = join(tmpdir(), `strapi-query-${Date.now()}`);
    await mkdir(join(root, 'src/api/article/content-types/article'), { recursive: true });
    await mkdir(join(root, 'src/components/shared'), { recursive: true });
    await writeFile(
      join(root, 'src/api/article/content-types/article/schema.json'),
      JSON.stringify(contentTypeSchema('collectionType', 'article', 'articles'))
    );
    await writeFile(
      join(root, 'src/components/shared/seo.json'),
      JSON.stringify(componentSchema({ title: stringAttribute() }))
    );
    await writeFile(join(root, 'src/package.json'), JSON.stringify({ ignored: true }));

    const files = await readStrapiSchemaFiles([join(root, 'src')]);

    expect(files).toHaveLength(2);
    expect(files.map((file) => file.path)).toEqual([
      join(root, 'src/api/article/content-types/article/schema.json'),
      join(root, 'src/components/shared/seo.json')
    ]);
  });
});

function strapiSchemas() {
  return [
    {
      path: 'src/api/article/content-types/article/schema.json',
      schema: contentTypeSchema('collectionType', 'article', 'articles', {
        title: stringAttribute({ required: true }),
        rating: { type: 'integer' },
        accessTier: {
          type: 'enumeration',
          required: true,
          enum: ['free', 'pro']
        },
        cover: {
          type: 'media'
        },
        themes: {
          type: 'relation',
          relation: 'manyToMany',
          target: 'api::theme.theme'
        },
        author: {
          type: 'relation',
          relation: 'manyToOne',
          target: 'api::author.author'
        },
        seo: {
          type: 'component',
          component: 'shared.seo'
        },
        blocks: {
          type: 'dynamiczone',
          components: ['shared.cta', 'shared.hero']
        },
        internalNotes: {
          type: 'text',
          private: true
        }
      })
    },
    {
      path: 'src/api/author/content-types/author/schema.json',
      schema: contentTypeSchema('collectionType', 'author', 'authors', {
        name: stringAttribute({ required: true })
      })
    },
    {
      path: 'src/api/theme/content-types/theme/schema.json',
      schema: contentTypeSchema('collectionType', 'theme', 'themes', {
        uid: {
          type: 'uid',
          required: true
        }
      })
    },
    {
      path: 'src/api/home-page/content-types/home-page/schema.json',
      schema: contentTypeSchema('singleType', 'home-page', 'home-pages', {
        featuredArticle: {
          type: 'relation',
          relation: 'oneToOne',
          target: 'api::article.article'
        }
      })
    },
    {
      path: 'src/components/shared/seo.json',
      schema: componentSchema({
        metaTitle: stringAttribute({ required: true })
      })
    },
    {
      path: 'src/components/shared/cta.json',
      schema: componentSchema({
        label: stringAttribute({ required: true }),
        icon: {
          type: 'media'
        }
      })
    },
    {
      path: 'src/components/shared/hero.json',
      schema: componentSchema({
        headline: stringAttribute({ required: true })
      })
    }
  ];
}

function contentTypeSchema(
  kind: 'collectionType' | 'singleType',
  singularName: string,
  pluralName: string,
  attributes: Record<string, unknown> = {}
) {
  return {
    kind,
    collectionName: pluralName.replace(/-/g, '_'),
    info: {
      singularName,
      pluralName,
      displayName: singularName
    },
    attributes
  };
}

function componentSchema(attributes: Record<string, unknown> = {}) {
  return {
    collectionName: 'components_shared_items',
    info: {
      displayName: 'Shared item'
    },
    attributes
  };
}

function stringAttribute(options: Record<string, unknown> = {}) {
  return {
    type: 'string',
    ...options
  };
}
