import { collection, createStrapiClient, defineSchema, entity, many, one, single } from './index.js';
import type { Entity, Populate, Populated, Query } from './index.js';
import type { Relations } from './types.js';

interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  cta: ComponentContentCta | null;
}

interface Theme {
  id: number;
  documentId: string;
  uid: string;
  name: string;
}

interface UploadFile {
  id: number;
  documentId: string;
  url: string;
}

interface HomePage {
  id: number;
  documentId: string;
}

interface ComponentContentCta {
  label: string;
  icon: UploadFile | null;
  buttons: ComponentSharedButton[];
}

interface ComponentSharedButton {
  label: string;
  url: string;
}

const schema = defineSchema({
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
			featuredArticle: one('article')
		}
  })
});

type PlainArticle = Entity<typeof schema, 'article'>;
type PlainUpload = Entity<typeof schema, 'uploadFile'>;
type ArticleCard = Populated<typeof schema, 'article', { cover: true; themes: true }>;
type ArticleWithCta = Populated<
  typeof schema,
  'article',
  { cta: { populate: { icon: true; buttons: true } } }
>;
type ArticleRelations = Relations<typeof schema, 'article'>;
type ArticleQuery = Query<typeof schema, 'article'>;
type ArticlePopulate = Populate<typeof schema, 'article'>;

declare const plainArticle: PlainArticle;
declare const plainUpload: PlainUpload;
declare const articleCard: ArticleCard;
declare const articleWithCta: ArticleWithCta;
declare const coverRelation: ArticleRelations['cover'];

plainArticle.slug satisfies string;
plainUpload.url satisfies string;
coverRelation.target satisfies 'uploadFile';
articleCard.cover?.url satisfies string | undefined;
articleCard.themes[0]?.uid satisfies string | undefined;
articleWithCta.cta?.icon?.url satisfies string | undefined;
articleWithCta.cta?.buttons[0]?.label satisfies string | undefined;

const publicationFilterQuery = {
  publicationFilter: 'has-published-version'
} satisfies ArticleQuery;

publicationFilterQuery.publicationFilter satisfies 'has-published-version';

const componentPopulate = {
  cta: {
    populate: {
      icon: {
        fields: ['url']
      },
      buttons: true
    }
  }
} satisfies ArticlePopulate;

componentPopulate.cta.populate.icon.fields[0] satisfies 'url';

const strapi = createStrapiClient({
  endpoint: 'https://cms.example.com',
  fetch: undefined as never,
  schema
});

strapi.collection('article').findMany({
  populate: {
    cta: {
      populate: {
        icon: true
      }
    }
  }
});
