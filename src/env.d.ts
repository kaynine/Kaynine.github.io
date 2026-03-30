/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NOTION_API_SECRET: string;
  readonly DATABASE_ID: string;
  readonly DATABASE_ID_CUSTOMIZING: string;
  readonly DATABASE_ID_CODENODE: string;
  readonly DATABASE_ID_DEBUGGING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
