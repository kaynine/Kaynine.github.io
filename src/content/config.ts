import { defineCollection } from 'astro:content';
import { notionLoader } from 'notion-astro-loader';

const NOTION_TIMEOUT_MS = 120_000;

const blog = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID,
    timeoutMs: NOTION_TIMEOUT_MS,
  }),
});

const customizing = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_CUSTOMIZING,
    timeoutMs: NOTION_TIMEOUT_MS,
  }),
});

const codenode = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_CODENODE,
    timeoutMs: NOTION_TIMEOUT_MS,
  }),
});

const debugging = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_API_SECRET,
    database_id: import.meta.env.DATABASE_ID_DEBUGGING,
    timeoutMs: NOTION_TIMEOUT_MS,
  }),
});

export const collections = { blog, customizing, codenode, debugging };
