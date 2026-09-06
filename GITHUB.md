# GitHub에 올리기

이 ZIP은 `node_modules`, `dist`, `.git`을 뺀 **소스만** 들어 있습니다. GitHub에 그대로 올리면 됩니다.

## 1. 압축 풀기

```bash
unzip grid-risk-map-github.zip
cd grid-risk-map
```

## 2. 새 저장소로 올리기

1. GitHub에서 빈 저장소를 만듭니다. README는 넣지 않습니다.
2. 터미널에서:

```bash
git init
git add .
git commit -m "배전망 위험 지도"
git branch -M main
git remote add origin https://github.com/계정/저장소이름.git
git push -u origin main
```

이미 `https://github.com/Wajammin/grid-risk-map` 가 있으면:

```bash
git init
git add .
git commit -m "배전망 위험 지도 최신"
git branch -M main
git remote add origin https://github.com/Wajammin/grid-risk-map.git
git push -u origin main
```

## 3. 받은 뒤 실행

```bash
npm install
npm run dev
```

카카오맵 키는 코드에 기본값이 들어 있습니다. 바꾸려면 헤더에서 다시 넣으면 됩니다.

## ZIP에 넣지 않은 것

- `node_modules` — `npm install`로 다시 받습니다
- `dist` — 빌드하면 생깁니다
- `.git` — 위 명령으로 새로 만듭니다
- 작업용 스크린샷·캐시
