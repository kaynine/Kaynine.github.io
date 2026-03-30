import { defineCollection } from 'astro:content';
import { notionLoader } from 'notion-astro-loader';

const blog = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID,
  }),
});

const customizing = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_CUSTOMIZING,
  }),
});

const codenode = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_CODENODE,
  }),
});

const debugging = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_DEBUGGING,
  }),
});

export const collections = { blog, customizing, codenode, debugging };
