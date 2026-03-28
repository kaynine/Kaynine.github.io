import { defineCollection } from 'astro:content';
import { notionLoader } from 'notion-astro-loader';

const blog = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID,
  }),
});

export const collections = { blog };
