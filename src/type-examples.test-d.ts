import { collection, defineSchema, entity, many, one, single } from './index.js';
import type { Entity, Populated } from './index.js';
import type { Relations } from './types.js';

interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
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
type ArticleRelations = Relations<typeof schema, 'article'>;

declare const plainArticle: PlainArticle;
declare const plainUpload: PlainUpload;
declare const articleCard: ArticleCard;
declare const coverRelation: ArticleRelations['cover'];

plainArticle.slug satisfies string;
plainUpload.url satisfies string;
coverRelation.target satisfies 'uploadFile';
articleCard.cover?.url satisfies string | undefined;
articleCard.themes[0]?.uid satisfies string | undefined;
