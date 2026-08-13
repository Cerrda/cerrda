import { articleMeta } from "~/data/site";

export function getAllArticles() {
  return [...articleMeta];
}

export function getArticleMetaBySlug(slug: string) {
  return articleMeta.find((item) => item.slug === slug);
}
