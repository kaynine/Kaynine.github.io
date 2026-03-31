/**
 * 빌드 후 dist/ 내 HTML 파일에서 Notion S3 이미지 URL을 찾아
 * 로컬에 다운로드하고 URL을 교체합니다.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';

const DIST_DIR = './dist';
const IMG_DIR = join(DIST_DIR, 'notion-images');
const MAX_RETRIES = 3;
const CONCURRENCY = 5;

// S3 URL 패턴 - &amp; 인코딩된 버전과 raw & 버전 모두 매칭
// HTML 속성 안에서는 &amp;로, 일부 컨텍스트에서는 &로 나타남
const S3_URL_PATTERN = /https:\/\/prod-files-secure\.s3[^"'\s<>)}\]]+/g;

mkdirSync(IMG_DIR, { recursive: true });

const htmlFiles = await glob(`${DIST_DIR}/**/*.html`);
console.log(`[1/4] HTML 파일 ${htmlFiles.length}개 스캔 중...`);

if (htmlFiles.length === 0) {
  console.error('ERROR: dist/ 에 HTML 파일이 없습니다. astro build가 실패했을 수 있습니다.');
  process.exit(1);
}

// 1단계: 모든 HTML에서 이미지 URL 수집
const urlMap = new Map(); // html상의 원본 URL → { fetchUrl, localPath }

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = content.match(S3_URL_PATTERN) ?? [];
  for (const rawUrl of matches) {
    if (!urlMap.has(rawUrl)) {
      urlMap.set(rawUrl, null);
    }
  }
}

console.log(`[2/4] 고유 이미지 URL ${urlMap.size}개 발견`);

if (urlMap.size === 0) {
  console.log('교체할 S3 URL이 없습니다. (이미 Astro가 처리했을 수 있음)');
  process.exit(0);
}

// HTML 엔티티 디코딩: &amp; → &, &#x26; → &, 등
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/g, '&')
    .replace(/&#38;/g, '&');
}

// URL 해시로 안정적 파일명 생성 (중복 방지)
function urlToFilename(url, ext) {
  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  return `img-${hash}.${ext}`;
}

// Content-Type → 확장자
function extFromContentType(ct) {
  if (!ct) return 'png';
  const sub = ct.split('/')[1]?.split(';')[0]?.trim();
  if (!sub) return 'png';
  const map = { jpeg: 'jpg', 'svg+xml': 'svg', 'x-icon': 'ico' };
  return map[sub] ?? sub;
}

// 재시도 가능한 fetch
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        // 4xx (429 제외)는 재시도해도 의미 없음
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt === retries) throw e;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 2단계: 동시성 제한하며 다운로드
let downloaded = 0;
let failed = 0;
const entries = [...urlMap.keys()];

async function downloadOne(rawUrl) {
  const fetchUrl = decodeHtmlEntities(rawUrl);
  try {
    const res = await fetchWithRetry(fetchUrl);
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const ext = extFromContentType(contentType);
    const filename = urlToFilename(fetchUrl, ext);
    const localPath = join(IMG_DIR, filename);

    const buffer = await res.arrayBuffer();
    writeFileSync(localPath, Buffer.from(buffer));
    urlMap.set(rawUrl, `/notion-images/${filename}`);
    downloaded++;
    process.stdout.write('.');
  } catch (e) {
    failed++;
    console.warn(`\n  FAIL: ${fetchUrl.slice(0, 80)}... → ${e.message}`);
  }
}

// concurrency-limited parallel download
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(downloadOne));
}

console.log(`\n[3/4] 다운로드 완료: ${downloaded} 성공, ${failed} 실패 (총 ${urlMap.size})`);

if (downloaded === 0) {
  console.error('ERROR: 이미지를 하나도 다운로드하지 못했습니다!');
  // 실패해도 빌드를 중단하지는 않음 (이미지 없어도 텍스트는 보여야 하므로)
}

// 3단계: HTML URL 교체
let replacedFiles = 0;
let replacedUrls = 0;

for (const file of htmlFiles) {
  let content = readFileSync(file, 'utf-8');
  let changed = false;

  for (const [original, localPath] of urlMap) {
    if (localPath && content.includes(original)) {
      content = content.split(original).join(localPath);
      changed = true;
      replacedUrls++;
    }
  }

  if (changed) {
    writeFileSync(file, content, 'utf-8');
    replacedFiles++;
  }
}

console.log(`[4/4] ${replacedFiles}개 파일에서 ${replacedUrls}건 URL 교체 완료`);

// 결과 검증: 아직 S3 URL이 남아있는지 확인
let remaining = 0;
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = content.match(S3_URL_PATTERN) ?? [];
  remaining += matches.length;
}

if (remaining > 0) {
  console.warn(`WARNING: 아직 ${remaining}개의 S3 URL이 HTML에 남아있습니다!`);
} else {
  console.log('OK: 모든 S3 URL이 로컬 경로로 교체되었습니다.');
}
