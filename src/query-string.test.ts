import { describe, expect, it } from 'vitest';
import { stringifyQuery } from './query-string.js';

describe('stringifyQuery', () => {
  it('serializes Strapi-style nested filters and populate objects', () => {
    const query = stringifyQuery({
      filters: {
        slug: { $eq: 'best-reits' },
        themes: { uid: { $in: ['reits', 'etfs'] } }
      },
      populate: {
        cover: true,
        themes: {
          fields: ['name', 'uid']
        }
      },
      sort: ['publishedAt:desc'],
      pagination: { page: 1, pageSize: 10 }
    });

    expect(decodeURIComponent(query)).toContain('filters[slug][$eq]=best-reits');
    expect(decodeURIComponent(query)).toContain('filters[themes][uid][$in][0]=reits');
    expect(decodeURIComponent(query)).toContain('populate[cover]=true');
    expect(decodeURIComponent(query)).toContain('populate[themes][fields][0]=name');
    expect(decodeURIComponent(query)).toContain('sort[0]=publishedAt:desc');
    expect(decodeURIComponent(query)).toContain('pagination[page]=1');
  });
});
