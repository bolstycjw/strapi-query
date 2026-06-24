# strapi-query

Schema-first typed query client for Strapi REST APIs.

`strapi-query` keeps runtime entity types clean while deriving relation-aware filters,
populate options, and response types from a schema registry.

## Install

```sh
pnpm add strapi-query
```

## Define a Schema

```ts
import { collection, defineSchema, entity, many, one, single } from 'strapi-query';

interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
}

interface Theme {
  id: number;
  documentId: string;
  name: string;
  uid: string;
}

interface UploadFile {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
}

interface HomePage {
  id: number;
  documentId: string;
}

export const schema = defineSchema({
  article: collection('articles', {
    entity: entity<Article>(),
    relations: {
      cover: one('uploadFile'),
      themes: many('theme')
    }
  }),
  theme: collection('themes', { entity: entity<Theme>() }),
  uploadFile: collection('upload-files', { entity: entity<UploadFile>() }),
  homePage: single('home-page', {
    entity: entity<HomePage>(),
    relations: {
      featuredArticle: one('article'),
      trendingArticles: many('article')
    }
  })
});
```

## Query Strapi

```ts
import { createStrapiClient } from 'strapi-query';
import { schema } from './schema';

const strapi = createStrapiClient({
  endpoint: 'https://cms.example.com',
  token: process.env.STRAPI_API_TOKEN,
  schema
});

const articles = await strapi.collection('article').findMany({
  filters: {
    slug: { $eq: 'best-reits-singapore' },
    themes: { uid: 'reits' }
  },
  fields: ['title', 'slug', 'publishedAt'],
  populate: {
    cover: true,
    themes: true
  },
  sort: ['publishedAt:desc'],
  pagination: { page: 1, pageSize: 10 },
  publicationFilter: 'has-published-version'
});
```

The response type is inferred from the schema and `populate` object. Runtime records
do not contain fake relation metadata.

## Type Helpers

```ts
import type { Entity, Populated } from 'strapi-query';
import { schema } from './schema';

type PlainArticle = Entity<typeof schema, 'article'>;
type ArticleCard = Populated<typeof schema, 'article', { cover: true; themes: true }>;
```

## Scope

This is intentionally not an ORM. It does not model persistence, lazy loading,
transactions, or identity maps. It is a typed REST query boundary for Strapi.
