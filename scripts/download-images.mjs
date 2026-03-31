/**
 * 빌드 후 dist/ 내 HTML 파일에서 Notion S3 이미지 URL을 찾아
 * 로컬에 다운로드하고 URL을 교체합니다.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const DIST_DIR = './dist';
const IMG_DIR = join(DIST_DIR, 'notion-images');
const NOTION_IMG_PATTERN = /https:\/\/prod-files-secure\.s3[^"'\s)]+/g;

mkdirSync(IMG_DIR, { recursive: true });

const htmlFiles = await glob(`${DIST_DIR}/**/*.html`);
console.log(`📄 HTML 파일 ${htmlFiles.length}개 처리 중...`);

const urlMap = new Map(); // original url → local path

// 1단계: 모든 HTML에서 이미지 URL 수집
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = content.match(NOTION_IMG_PATTERN) ?? [];
  for (const url of matches) {
    if (!urlMap.has(url)) urlMap.set(url, null);
  }
}

console.log(`🖼️  이미지 ${urlMap.size}개 다운로드 중...`);

// 2단계: 다운로드
let count = 0;
for (const [url] of urlMap) {
  try {
    // HTML 속성 안의 &amp; → & 디코딩 후 fetch
    const fetchUrl = url.replace(/&amp;/g, '&');
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') ?? 'image/png';
    const ext = contentType.split('/')[1]?.split(';')[0] ?? 'png';
    const filename = `img-${++count}.${ext}`;
    const localPath = join(IMG_DIR, filename);

    const buffer = await res.arrayBuffer();
    writeFileSync(localPath, Buffer.from(buffer));
    urlMap.set(url, `/notion-images/${filename}`);
    process.stdout.write('.');
  } catch (e) {
    console.warn(`\n⚠️  다운로드 실패: ${url.slice(0, 60)}...`);
  }
}
console.log('\n');

// 3단계: HTML URL 교체
for (const file of htmlFiles) {
  let content = readFileSync(file, 'utf-8');
  let changed = false;
  for (const [original, local] of urlMap) {
    if (local && content.includes(original)) {
      content = content.split(original).join(local);
      changed = true;
    }
  }
  if (changed) writeFileSync(file, content, 'utf-8');
}

console.log('✅ 이미지 교체 완료');
