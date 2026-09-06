# 클라우드플레어에 배전망 위험 지도 올리기

끝나면 주소는 보통 이렇게 됩니다.

`https://grid-risk-map.pages.dev`

카카오맵·챗봇까지 켜려면 아래 **3. 카카오** 와 **4. 환경 변수** 를 꼭 합니다.

---

## 0. 이 저장소에 이미 있는 파일

클라우드플레어가 읽는 파일입니다. 지우지 마세요.

| 파일 | 하는 일 |
| --- | --- |
| [wrangler.toml](wrangler.toml) | 프로젝트 이름 `grid-risk-map`, 결과 폴더 `dist`, Node 호환 |
| [.node-version](.node-version) | 빌드할 때 Node 22 사용 |
| [.nvmrc](.nvmrc) | 위와 같음 (일부 도구가 이 파일만 봄) |
| [.npmrc](.npmrc) | 불필요한 브라우저 엔진 다운로드를 막음 (빌드 실패 방지) |
| [public/_headers](public/_headers) | 보안 헤더, 정적 파일 캐시 |
| [package.json](package.json) 의 `build:cf` | 클라우드플레어용 빌드 명령 |
| [package.json](package.json) 의 `deploy:cf` | 빌드 후 바로 올리기 |
| [vite.config.ts](vite.config.ts) | `NITRO_PRESET=cloudflare_pages` 이면 페이지스용으로 묶음 |
| [.dev.vars.example](.dev.vars.example) | 챗봇 키 이름만 적어 둔 보기 파일 |

올리면 **안 되는** 것: `node_modules`, `dist`, `.output`, `.wrangler`, `.dev.vars`(실제 비밀키).

---

## 방법 1. 깃허브에 올리고 클라우드플레어가 자동 빌드 (추천)

한 번만 연결하면, 코드를 올릴 때마다 사이트가 다시 만들어집니다.

### 1) 깃허브 저장소

1. [https://github.com/new](https://github.com/new) 에서 저장소를 만듭니다.
2. 이름: `grid-risk-map`
3. Public, README 없이 Create repository.
4. 이 프로젝트 폴더에서:

```bash
git init
git add .
git commit -m "배전망 위험 지도"
git branch -M main
git remote add origin https://github.com/여기아이디/grid-risk-map.git
git push -u origin main
```

`여기아이디` 만 본인 깃허브 아이디로 바꿉니다.

깃 명령이 어려우면 깃허브 저장소 페이지의 **Add file → Upload files** 로
`src`, `public`, `server`, `scripts`, `migrations`, `package.json`,
`package-lock.json`, `vite.config.ts`, `tsconfig.json`, `wrangler.toml`,
`.node-version`, `.nvmrc`, `.npmrc`, `.gitignore` 를 올립니다.

### 2) 클라우드플레어 페이지스 연결

1. [https://dash.cloudflare.com](https://dash.cloudflare.com) 로그인 (없으면 무료 가입)
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. GitHub 권한을 허용하고 `grid-risk-map` 저장소를 고릅니다.
4. 빌드 설정:

| 항목 | 값 |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build:cf` |
| Build output directory | `dist` |
| Root directory | (비움) |
| Environment variables | 아래 표 |

5. **Save and Deploy**
6. 2~5분 뒤 Production 주소가 나옵니다. `https://grid-risk-map.pages.dev`

프로젝트 이름을 다르게 정하면 주소도 `https://그이름.pages.dev` 입니다.

---

## 방법 2. 컴퓨터에서 바로 올리기

깃허브 없이 Wrangler 로 올립니다.

```bash
npm install
npm run build:cf
npx wrangler login
npx wrangler pages project create grid-risk-map
npx wrangler pages deploy dist --project-name=grid-risk-map
```

한 줄:

```bash
npm run deploy:cf
```

브라우저가 열리면 클라우드플레어 로그인을 허용합니다.
끝나면 터미널에 `*.pages.dev` 주소가 나옵니다.

---

## 방법 3. 대시보드에 폴더만 올리기

1. 컴퓨터에서 `npm run build:cf` 를 실행합니다.
2. 생긴 `dist` 폴더를 압축합니다.
3. 클라우드플레어 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
4. 프로젝트 이름 `grid-risk-map`, `dist` 안의 파일을 올립니다.

이 방법은 코드를 바꿀 때마다 다시 빌드해서 올려야 합니다. 대회 전에 한 번 올리는 용도에 맞습니다.

---

## 3. 카카오맵 도메인 등록 (안 하면 카카오 지도가 하얗습니다)

1. [https://developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션
2. **앱 설정 → 플랫폼 → Web**
3. 사이트 도메인에 아래를 **둘 다** 넣습니다.

```
https://grid-risk-map.pages.dev
http://localhost
```

미리보기 주소가 `https://abcd.grid-risk-map.pages.dev` 이면 그 주소도 추가합니다.
저장한 뒤 사이트를 새로고침합니다.

컬러맵은 카카오 키 없이 보입니다. 카카오맵만 도메인이 필요합니다.

---

## 4. 환경 변수

클라우드플레어 프로젝트 → **Settings → Variables and Secrets**

| 이름 | 종류 | 값 | 언제 쓰이나 |
| --- | --- | --- | --- |
| `VITE_AUTH_ENABLED` | 빌드 | `false` | 로그인 끄기. 대회 공개용 |
| `NITRO_PRESET` | 빌드 | `cloudflare_pages` | 페이지스 형식으로 묶기 |
| `NODE_VERSION` | 빌드 | `22` | `.node-version` 이 있으면 생략 가능 |
| `XAI_API_KEY` | 비밀(런타임) | xAI 키 | 상세 페이지 챗봇. 없으면 챗봇만 안내 문구 |

`XAI_API_KEY` 는 브라우저에 노출되면 안 됩니다. **Encrypt / Secret** 으로 넣습니다.
넣은 뒤 **Redeploy** 한 번 해야 챗봇이 켜집니다.

카카오 JavaScript 키는 이미 사이트 코드에 들어 있습니다. 환경 변수로 또 넣을 필요 없습니다.

---

## 5. 자주 막히는 곳

빌드가 빨간색으로 실패한다

- Build command 가 `npm run build:cf` 인지
- Output directory 가 `dist` 인지
- Node 가 22 인지 (Variables 에 `NODE_VERSION=22`)
- `package-lock.json` 을 깃허브에 같이 올렸는지

페이지는 뜨는데 `/map` 이 404 이다

- 출력 폴더를 `dist` 가 아니라 `public` 으로 적은 경우가 많습니다.
- 첫 배포가 끝났는지 Production 탭을 확인합니다.

카카오 지도가 하얗다

- 디벨로퍼스 Web 도메인에 `https://grid-risk-map.pages.dev` 가 있는지
- 컬러맵으로 바꾸면 지도가 보이면, 카카오 도메인 문제입니다.

챗봇이 "지금은 쓸 수 없다"고 한다

- `XAI_API_KEY` 를 Secret 으로 넣고 다시 배포했는지 확인합니다.
- 컬러맵·점수 계산은 키 없이 동작합니다.

---

## 6. 배포 후 확인할 것

1. `https://grid-risk-map.pages.dev` 소개 페이지
2. `/map` 전국 컬러맵, 대구를 누르면 군위가 북쪽에 붙어 있는지
3. 카카오맵 스위치
4. 수요 증가 슬라이더
5. 방법·출처 탭
