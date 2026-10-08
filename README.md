# 허브스튜디오4 — Vercel용 전체 소스

테마 선택 → AI 주제 추천 → 글 번호 선발급 → 이미지허브 공개 이미지 2~5개 선택 → AI 본문 생성 → 저장과 공개발행. 검수는 발행 후 내 글 관리에서 선택합니다. 공개 상세 페이지에는 글 관리 버튼이 없습니다.

Next.js 16 App Router / React 19 / Firebase 이메일·비밀번호 인증 / Firestore REST / Gemini. Sites·Cloudflare·D1·Vinext 의존성이 없습니다. 서비스 계정과 Firebase Admin SDK를 사용하지 않습니다. 기존 운영 중인 Sites 사이트는 이 소스를 올려도 자동 변경되지 않습니다.

## 1. GitHub 및 Vercel

압축을 풀고 `package.json`이 있는 폴더의 **내용 전체**를 GitHub 저장소 루트에 올리세요. 폴더 바깥에 또 폴더가 생기면 Vercel Root Directory를 해당 폴더로 설정해야 합니다. `.env.example`, `.gitignore`, `package-lock.json`도 포함하세요.

Vercel에서 저장소 Import → Framework Preset **Next.js** → Node.js **22.x 또는 24.x** → Install `npm ci` → Build `npm run build`. Output Directory는 기본값으로 둡니다. SPA용 전체 경로 rewrite, `output: export`, Vite 설정을 추가하지 마세요. 새 GitHub 저장소를 권장합니다. 기존 SPA 저장소에 넣을 때는 기존 vercel.json, Vite 설정·잠금파일 대신 이 패키지의 파일을 사용하세요.

이 소스는 빌드와 로컬 검증을 완료한 배포 준비본이며, 사용자의 Vercel 프로젝트에 실제 배포한 결과는 아닙니다.

## 2. 환경변수

Vercel → Project → Settings → Environment Variables에서 아래 값을 등록하고 **재배포**하세요. Gemini 키는 소스에 넣지 않았습니다. 이전에 제공한 키를 Vercel 서버 환경변수에 직접 입력하세요.

| 이름 | 값 | 필수 |
|---|---|---|
| `GEMINI_API_KEY` | 사용하는 Gemini 키 | AI 생성·검수에 필요 |
| `SITE_URL` | 실제 운영 주소. 예: `https://hubstudio4.vercel.app` 또는 커스텀 도메인 | 올바른 canonical·사이트맵에 필요 |
| `FIREBASE_API_KEY` | 기존 Firebase Web API Key | 기존 프로젝트 값이 소스 기본값에 있으므로 선택 |
| `FIREBASE_PROJECT_ID` | `studio-9240700230-1dd9a` | 기존 프로젝트 사용 시 선택 |
| `GEMINI_MODEL` | `gemini-2.5-flash` | 선택 |

`SITE_URL`에는 경로나 끝 `/`를 넣지 마세요. 도메인을 바꾸면 이 값도 수정하고 재배포하세요. Firebase 프로젝트를 바꾸면 해당 프로젝트의 Web API Key도 함께 바꿔야 합니다. `NEXT_PUBLIC_GEMINI_API_KEY`나 서비스 계정 JSON은 만들지 않습니다.

AI 실행 경로에 Node.js 런타임과 `maxDuration=300`을 설정했습니다. 실제 최대 실행 시간은 Vercel 프로젝트·플랜·Fluid Compute 설정의 허용 범위에 따릅니다.

## 3. Firestore 권한과 색인 — 첫 배포 전 필수

이 Vercel용 소스는 **글을 Firestore에 저장**합니다. 기존 Sites 글은 D1에 있으므로 자동 조회되지 않습니다.

새 컬렉션은 `hub4Posts`, `hub4Counters`입니다. 기존 이미지허브 데이터는 `images`에서 그대로 읽습니다. 이미지허브가 사용하던 공개 읽기 규칙은 유지하세요.

1. Firebase Console → Firestore → Rules에서 **기존 규칙을 백업**합니다.
2. `firestore.rules`의 `hub4SignedIn`, `hub4Owner`, `hub4ValidPost` 함수와 `hub4Counters`, `hub4Posts` match 블록을 기존 `match /databases/{database}/documents` 안에 추가하고 Publish합니다. 파일 전체로 기존 규칙을 덮어쓰면 이미지허브 등 다른 서비스가 막힐 수 있습니다.
3. 기존 규칙에 모든 문서 쓰기를 허용하는 `match /{document=**}` 블록이 있다면 새 컬렉션의 작성자 제한을 우회하지 않도록 그 범위를 조정해야 합니다. Firestore 규칙은 일치하는 허용 조건 중 하나만 참이어도 요청을 허용합니다.
4. `firestore.indexes.json`의 복합 색인 3개를 Firebase Console에서 추가합니다: `status ASC + id DESC`, `owner ASC + id DESC`, `status ASC + theme ASC + id DESC` (컬렉션 `hub4Posts`). 생성 완료 후 테스트하세요.
5. CLI를 사용하는 경우 로그인 후 `firebase deploy --only firestore:indexes --project studio-9240700230-1dd9a`. 다른 앱의 색인이 이미 있으면 기존 색인 정의와 먼저 병합하고, 기존 색인 삭제 제안에는 동의하지 마세요. 이 패키지의 firebase.json은 **규칙 자동 덮어쓰기를 설정하지 않았습니다**.

공개 문서는 `status=published`일 때 익명 get/list가 허용됩니다. 예약·생성 중·실패·비공개·삭제 글은 작성자만 조회합니다. 검수 결과는 `hub4Posts/{id}/private/review`, 수정 이력은 `hub4Posts/{id}/revisions/{version}`에 저장되며 작성자만 접근합니다. 공개 글 문서에는 Gemini 키·비밀번호·로그인 토큰을 저장하지 않습니다.

글 번호는 카운터와 예약 문서를 원자적 commit으로 함께 생성하며 충돌 시 재시도합니다. 생성·수정에는 updateTime 조건을 사용해 동시 요청이 내용을 덮어쓰지 않게 합니다. 삭제는 복구 가능한 상태값 변경 방식으로 주소를 숨깁니다.

## 4. 로그인 설정

Firebase Console → Authentication → Sign-in method에서 **Email/Password 활성화**. 기존 이미지허브 계정을 그대로 사용할 수 있습니다. 새 사이트에서 회원가입과 비밀번호 재설정도 제공합니다. ID/refresh 토큰은 Secure HttpOnly SameSite 쿠키로 관리하고 서버가 Firebase 계정 조회로 UID를 확인합니다.

Firebase Web API Key에 API 또는 웹사이트 제한을 걸었다면 Identity Toolkit, Secure Token, Firestore REST의 서버 호출이 허용되는지 확인하세요. 웹사이트 referrer 전용 키는 Vercel 서버 호출에 사용할 수 없습니다. 실제 API 키 제한은 프로젝트 정책에 맞춰 설정해야 합니다.

## 5. 기존 공개 글 가져오기 (선택)

`migration/public-posts.json`에는 패키지 작성 시점의 기존 공개 글을 백업했습니다. 공개 HTML의 제목·본문·사진 순서·태그와 실제 글 번호·작성자 UID·발행일을 사용했습니다. 비공개 검수 결과나 과거 수정 이력은 포함하지 않았습니다.

기존 글을 가져오려면 먼저 위 Firestore 규칙·색인을 적용합니다. 새 `hub4Posts` 컬렉션이 비어 있는 상태에서 로컬 실행:

```sh
npm ci
# .env.example을 .env.local로 복사한 후 자신의 서버 환경값 설정
npm run import:posts
```

프롬프트에 **기존 작성자의 Firebase 이메일과 비밀번호**를 입력합니다. 비밀번호는 화면에 표시하거나 저장하지 않습니다. 다른 작성자 UID로 이전하지 않으며 기존 내용이 다른 문서를 덮어쓰지 않습니다. 이미 동일한 글이 이전된 경우 건너뜁니다. 로컬 데이터 이전은 Firestore 실제 쓰기이며, Vercel 사이트 배포와 별도 작업입니다. 이전 후 다음 신규 글은 이어지는 번호를 사용합니다.

## 6. 로컬 실행과 확인

```sh
npm ci
npm run typecheck
npm run build
npm run dev
```

실제 Firebase 로그인은 HTTPS Secure 쿠키를 사용하므로 로컬 로그인 테스트는 HTTPS 주소에서 수행하세요. 공개 목록·본문·robots·sitemap은 로그인 없이 확인할 수 있습니다.

검증: Next.js webpack 프로덕션 빌드, TypeScript, Firestore 에뮬레이터 규칙 테스트와 공개·소유권·번호 예약·발행/수정 이력 경계를 확인합니다. 실제 Vercel 배포 후 `/blog`, `/blog/{id}`, `/robots.txt`, `/sitemap.xml`, 존재하지 않는 글 404를 다시 확인하고 Search Console에 실제 운영 도메인의 사이트맵을 등록하세요.

서버 HTML 본문 및 링크, 글별 title/description/canonical/BlogPosting, 실제 공개 글을 조회하는 사이트맵, 없는 글 404를 유지했습니다. 구글 색인과 검색 순위 자체는 보장하지 않습니다.
