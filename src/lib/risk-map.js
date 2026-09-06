// @ts-nocheck
/* 지도 그리기와 조작.
 *
 * app.js 는 이 파일의 내부(투영 함수, 포인터 상태, 뷰 행렬)를 알지 못한다.
 * 주고받는 것은 지역 키와 점수뿐이다.
 *
 * 그리는 층은 셋이다.
 *   ① 밑동  — 같은 폴리곤을 아래로 조금 내려 어두운 단색으로 깐다. 지도가
 *             종이가 아니라 두께가 있는 판처럼 보인다.
 *   ② 본판  — 등급 색으로 칠한 229개. 마우스와 손가락은 이 층만 만진다.
 *   ③ 팻말  — 고른 지역 위에 세우는 이름표. HTML 이라 확대해도 글자가 안 뭉갠다.
 */

'use strict';

(function (root) {
  const VIEW_W = 1000;
  /* 세로는 그리는 내용의 가로세로 비에서 뽑는다. 1000×1000 으로 못 박아 두면
   * 우리나라처럼 세로로 긴 모양에서는 위아래 여백만큼 지도가 작게 그려진다. */
  let VIEW_H = 1200;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* 밑동 두께와 고른 곳을 들어 올리는 높이. 배율로 나눠 써서 확대해도
   * 화면에서 늘 같은 두께로 보인다. 나누지 않으면 5배로 당겼을 때 두께가
   * 5배가 되어 지역 하나를 통째로 덮는다. */
  const DEPTH = 9;
  const LIFT = 11;

  /* 울릉군(울릉도·독도)은 본토에서 멀어 지도 상자를 크게 늘린다. 그대로 두면
   * 동쪽 끝이 129.6°가 아니라 131.9°가 되어, 본토가 왼쪽으로 밀리고 오른쪽에는
   * 점 하나만 남아 화면의 3할이 빈다. 그래서 서쪽으로 1.15° 당겨 그린다.
   * 동해 위 제자리 근처에 남되 본토와 겹치지는 않는 거리다.
   * 실제 거리는 아니다 — 화면 아래 '방법'에 그렇게 적어 두었다. */
  const PULLED_IN = { '경상북도|울릉군': { lon: -1.15, lat: 0 } };

  /* 6단계. 20 미만 0 … 100 이상 5. 초과는 새 색이 아니라 같은 난색의 가장 어두운 칸. */
  function gradeIndex(score) {
    if (score < 20) return 0;
    if (score < 40) return 1;
    if (score < 60) return 2;
    if (score < 80) return 3;
    if (score < 100) return 4;
    return 5;
  }

  /* 날씨앱 기온 막대: 파랑(낮음) → 초록 → 노랑 → 주황 → 빨강(높음). 칸은 단색. */
  const GRADE_COLORS = ['#4DA6FF', '#3DDC84', '#E8DE3C', '#F5A02A', '#E4453A', '#8B1520'];
  let colors = GRADE_COLORS.slice();

  const state = {
    group: null,
    base: null,           // 밑동 층
    baseInner: null,      // 밑동을 아래로 내리는 안쪽 묶음
    selected: null,       // 들어 올린 지역의 키
    paths: new Map(),     // key -> <path>
    centers: new Map(),   // key -> [x, y]  (viewBox 좌표, focus·팻말에서 쓴다)
    view: { x: 0, y: 0, scale: 1 },
    tooltipText: null,    // (key) => HTML
    onHover: () => {},    // (key|null) => void  — 판의 목록과 하이라이트를 맞춘다
    pin: null,            // 팻말 요소
    pinKey: null,
    onSelect: () => {},
  };

  let lastSelect = { key: null, at: 0 };
  /* 같은 지역이 300ms 안에 두 번 들어오면 한 번으로 본다.
   * 뒤 작업에서 click 리스너가 붙으면 포인터 tap 경로와 겹쳐 두 번 발화한다. */
  function notifySelect(key, onSelect) {
    const now = Date.now();
    if (key === lastSelect.key && now - lastSelect.at < 300) return;
    lastSelect = { key, at: now };
    onSelect(key);
  }

  // ------------------------------------------------------------------ 투영

  function boundsOf(features) {
    const b = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
    const visit = (coords) => {
      if (typeof coords[0] === 'number') {
        b.minLon = Math.min(b.minLon, coords[0]);
        b.maxLon = Math.max(b.maxLon, coords[0]);
        b.minLat = Math.min(b.minLat, coords[1]);
        b.maxLat = Math.max(b.maxLat, coords[1]);
        return;
      }
      coords.forEach(visit);
    };
    features.forEach((f) => visit(f.geometry.coordinates));
    return b;
  }

  /* 위경도를 화면 좌표로 옮긴다.
   *
   * 우리나라 정도의 좁은 범위에서는 위도에 따른 가로 축소만 반영해도
   * 눈에 띄는 왜곡이 없다. 지도 투영 라이브러리를 들일 이유가 없다.
   *
   * rect 안에 꽉 채우되 가로세로 비는 지킨다. */
  function makeProjection(bounds, rect) {
    const midLat = ((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180);
    const kx = Math.cos(midLat);

    const spanX = (bounds.maxLon - bounds.minLon) * kx || 1;
    const spanY = bounds.maxLat - bounds.minLat || 1;
    const scale = Math.min(rect.w / spanX, rect.h / spanY);

    const offsetX = rect.x + (rect.w - spanX * scale) / 2;
    const offsetY = rect.y + (rect.h - spanY * scale) / 2;

    return ([lon, lat]) => [
      offsetX + (lon - bounds.minLon) * kx * scale,
      offsetY + (bounds.maxLat - lat) * scale,
    ];
  }

  /* 좌표 묶음을 통째로 옮긴다. 원본은 건드리지 않는다. */
  function shiftCoords(node, shift) {
    if (typeof node[0] === 'number') return [node[0] + shift.lon, node[1] + shift.lat];
    return node.map((child) => shiftCoords(child, shift));
  }

  function ringToPath(ring, project) {
    let d = '';
    for (let i = 0; i < ring.length; i += 1) {
      const [x, y] = project(ring[i]);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return `${d}Z`;
  }

  function geometryToPath(geometry, project) {
    const polygons =
      geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons
      .map((rings) => rings.map((ring) => ringToPath(ring, project)).join(''))
      .join('');
  }

  /* 경로 문자열에서 경계 상자의 가운데를 구한다.
   *
   * 좌표 평균이 아니라 경계 상자 가운데를 쓴다. 섬이 많은 지역에서
   * 평균이 바다로 빠지는 것을 막는다. */
  function centerOfPath(d) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < nums.length; i += 2) {
      minX = Math.min(minX, nums[i]);      maxX = Math.max(maxX, nums[i]);
      minY = Math.min(minY, nums[i + 1]);  maxY = Math.max(maxY, nums[i + 1]);
    }
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  }

  // ------------------------------------------------------------------ 그리기·색칠

  const keyOf = (feature) => `${feature.properties.시도}|${feature.properties.시군구}`;

  function makePath(d, key) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    if (key) path.dataset.key = key;
    return path;
  }

  function draw(svg, geojson, { has, onSelect, onHover }) {
    state.onHover = typeof onHover === 'function' ? onHover : () => {};
    state.onSelect = typeof onSelect === 'function' ? onSelect : () => {};
    state.paths.clear();
    state.centers.clear();
    /* 이전 광역에서 확대해 둔 값을 그대로 두면 새 지역의 섬만 남는다. */
    introToken += 1;
    state.view = { x: 0, y: 0, scale: 1 };

    const wanted = geojson.features
      .filter((f) => has(keyOf(f)))
      .map((f) => {
        const shift = PULLED_IN[keyOf(f)];
        if (!shift) return f;
        return {
          properties: f.properties,
          geometry: {
            type: f.geometry.type,
            coordinates: shiftCoords(f.geometry.coordinates, shift),
          },
        };
      });

    // 상자 높이는 그리는 내용의 가로세로 비에서 뽑는다.
    const bounds = boundsOf(wanted);
    VIEW_H = viewHeightFromBounds(bounds);

    svg.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const pad = 36;
    const project = makeProjection(bounds, {
      x: pad,
      y: pad,
      w: VIEW_W - pad * 2,
      h: VIEW_H - pad * 2,
    });

    const group = document.createElementNS(SVG_NS, 'g');
    group.id = 'map-group';
    const base = document.createElementNS(SVG_NS, 'g');
    base.id = 'map-base';
    const baseInner = document.createElementNS(SVG_NS, 'g');
    base.appendChild(baseInner);

    const add = (feature, d) => {
      const key = keyOf(feature);
      const path = makePath(d, key);
      group.appendChild(path);
      baseInner.appendChild(makePath(d, null));
      state.paths.set(key, path);
      state.centers.set(key, centerOfPath(d));
    };

    wanted.forEach((feature) => add(feature, geometryToPath(feature.geometry, project)));

    svg.replaceChildren(base, group);
    state.group = group;
    state.base = base;
    state.baseInner = baseInner;
    state.pin = document.getElementById('map-pin');
    if (!svg.dataset.riskBound) {
      bindEvents(svg);
      svg.dataset.riskBound = '1';
    }
    applyView();
    return state.paths.size;
  }

  /* 등급 색을 바꾼다. 색만 갈아 두고, 다시 칠하는 일은 paint() 가 한다 —
   * 여기서는 어느 지역이 몇 점인지 모른다. */
  function setColors(list) {
    colors = list;
  }

  /* 판에서 마우스를 올린 지역을 지도에서도 강조한다. 상태는 안 바뀐다. */
  function setHover(key) {
    state.paths.forEach((path, id) => {
      path.classList.toggle('is-hover', id === key);
    });
  }

  /* 단색으로 칠한다. 그라디언트를 씌우면 한 등급의 어두운 끝이 다음 등급의
   * 밝은 끝과 겹쳐, 같은 등급인데 서로 달라 보인다. */
  function paint(scores, selectedKey) {
    if (state.selected && state.paths.has(state.selected)) {
      state.paths.get(state.selected).style.transform = '';
    }
    state.selected = selectedKey || null;

    state.paths.forEach((path, key) => {
      const score = scores.get(key) ?? 0;
      path.setAttribute('fill', colors[gradeIndex(score)]);
      path.classList.toggle('is-selected', key === selectedKey);
    });
    // 고른 지역을 맨 위로 올린다. 들어 올린 뒤 이웃에 가리면 안 된다.
    if (selectedKey && state.paths.has(selectedKey)) {
      state.group.appendChild(state.paths.get(selectedKey));
    }
    applyView();
  }

  // ------------------------------------------------------------------ 팻말

  /* 고른 지역 위에 세우는 이름표. SVG 안에 글자를 그리면 확대할 때 함께
   * 늘어나 뭉개진다. HTML 로 띄우고 자리만 지도에서 받아 온다. */
  function setPin(key, html) {
    if (!state.pin) state.pin = document.getElementById('map-pin');
    if (!state.pin) return;

    if (!key || !state.centers.has(key)) {
      state.pinKey = null;
      state.pin.hidden = true;
      return;
    }
    state.pinKey = key;
    const plate = state.pin.querySelector('.pin-plate');
    if (plate) plate.innerHTML = html;
    state.pin.hidden = false;
    // 다시 세울 때마다 솟아오르는 동작을 처음부터 준다.
    state.pin.classList.remove('is-up');
    void state.pin.offsetWidth;
    state.pin.classList.add('is-up');
    placePin();
  }

  /* viewBox 좌표를 지도 판 안의 화면 좌표로 옮긴다. */
  function viewToScreen([vx, vy]) {
    const svg = state.group && state.group.ownerSVGElement;
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return null;

    const s = Math.min(box.width / VIEW_W, box.height / VIEW_H);
    const left = (box.width - VIEW_W * s) / 2;
    const top = (box.height - VIEW_H * s) / 2;

    const gx = state.view.x + vx * state.view.scale;
    const gy = state.view.y + vy * state.view.scale;

    const parent = (state.pin && state.pin.offsetParent) || svg;
    const parentBox = parent.getBoundingClientRect();
    return [
      box.left - parentBox.left + left + gx * s,
      box.top - parentBox.top + top + gy * s,
    ];
  }

  function placePin() {
    if (!state.pin || state.pin.hidden || !state.pinKey) return;
    const point = viewToScreen(state.centers.get(state.pinKey));
    if (!point) return;
    state.pin.style.left = `${point[0].toFixed(1)}px`;
    state.pin.style.top = `${point[1].toFixed(1)}px`;
  }

  // ------------------------------------------------------------------ 조작

  /* 확대한 지도가 뷰포트 밖으로 완전히 빠져나가지 못하게 자른다.
   *
   * 배율 s 로 키우면 내용의 크기는 VIEW × s 가 된다. 왼쪽 위 모서리가 0보다
   * 오른쪽/아래로 가면 반대편에 빈 자리가 생기고, (s-1)×VIEW 보다 더 밀면
   * 지도가 화면에서 사라진다. 그 사이로 가둔다. */
  function clampView() {
    const { scale } = state.view;
    if (scale <= 1) {
      state.view.x = 0;
      state.view.y = 0;
      return;
    }
    const limitX = (scale - 1) * VIEW_W;
    const limitY = (scale - 1) * VIEW_H;
    state.view.x = Math.min(0, Math.max(-limitX, state.view.x));
    state.view.y = Math.min(0, Math.max(-limitY, state.view.y));
  }

  function applyView() {
    if (!state.group) return;
    clampView();
    const { x, y, scale } = state.view;
    const transform = `translate(${x} ${y}) scale(${scale})`;
    state.group.setAttribute('transform', transform);
    if (state.base) state.base.setAttribute('transform', transform);
    // 두께와 높이는 배율로 나눠, 확대해도 화면에서 같은 크기로 보이게 한다.
    if (state.baseInner) {
      state.baseInner.setAttribute('transform', `translate(0 ${(DEPTH / scale).toFixed(2)})`);
    }
    if (state.selected && state.paths.has(state.selected)) {
      state.paths.get(state.selected).style.transform =
        `translate(0px, ${(-LIFT / scale).toFixed(2)}px)`;
    }
    placePin();
  }

  function zoomBy(factor, originX = VIEW_W / 2, originY = VIEW_H / 2) {
    const next = Math.max(1, Math.min(12, state.view.scale * factor));
    const applied = next / state.view.scale;
    state.view.x = originX - (originX - state.view.x) * applied;
    state.view.y = originY - (originY - state.view.y) * applied;
    state.view.scale = next;
    applyView();
  }

  /* 처음 크기로. animate 를 주면 확대해 둔 자리에서 부드럽게 물러난다 —
   * 팝업을 닫을 때 화면이 툭 튀지 않게 하려고 쓴다. */
  function reset({ animate = false } = {}) {
    const target = { x: 0, y: 0, scale: 1 };
    introToken += 1;
    if (!animate) {
      state.view = target;
      applyView();
      return Promise.resolve();
    }
    return animateView(target, FOCUS_MS, introToken);
  }

  const GRADE_DELAY = 320;   // 등급 하나 칠하는 간격 (ms)
  const FOCUS_MS = 900;      // 확대에 쓰는 시간 (ms)
  const INTRO_MS = 2000;     // 인트로에서 지도가 물러나는 시간 (ms)

  let introToken = 0;        // 세대 번호. 새로 시작하거나 멈추면 올라간다.

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  /* 뷰를 목표 값까지 부드럽게 옮긴다. token 이 바뀌면 즉시 목표에 도달시킨다. */
  function animateView(target, ms, token) {
    return new Promise((resolve) => {
      const from = { ...state.view };
      const start = Date.now();

      const svg = state.group.ownerSVGElement;
      if (svg) svg.classList.add('is-tweening');

      const finish = () => {
        state.view = { ...target };
        applyView();
        if (svg) svg.classList.remove('is-tweening');
        resolve();
      };

      if (ms <= 0 || typeof requestAnimationFrame !== 'function') { finish(); return; }

      const tick = () => {
        if (token !== introToken) { finish(); return; }
        const t = Math.min(1, (Date.now() - start) / ms);
        const e = easeOutCubic(t);
        state.view = {
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          scale: from.scale + (target.scale - from.scale) * e,
        };
        applyView();
        if (t >= 1) { resolve(); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* key 지역이 화면의 (biasX, 0.5) 자리에 오도록 하는 뷰 값.
   * 상세 팝업이 오른쪽을 가리므로 기본값보다 왼쪽으로 당겨 쓸 수 있다. */
  function viewFor(key, scale, biasX = 0.5) {
    const center = state.centers.get(key);
    if (!center) return { ...state.view };
    return {
      x: VIEW_W * biasX - center[0] * scale,
      y: VIEW_H / 2 - center[1] * scale,
      scale,
    };
  }

  function focus(key, { scale = 4, animate = true, biasX = 0.5 } = {}) {
    const clamped = Math.max(1, Math.min(12, scale));
    const target = viewFor(key, clamped, biasX);
    introToken += 1;
    return animateView(target, animate ? FOCUS_MS : 0, introToken);
  }

  /* 인트로. 살짝 확대된 자리에서 지도가 물러나는 동안 등급이 낮은 묶음부터
   * 차례로 칠해진다. 끝나면 전국 화면 그대로 — 특정 지역을 고르지 않는다.
   *
   * 실패해도 화면은 정상 상태로 떨어져야 한다. 어떤 예외가 나든
   * finalize() 가 모든 폴리곤을 보이게 만들고 끝낸다. */
  async function intro(orderedKeys) {
    const token = (introToken += 1);

    const finalize = () => {
      state.paths.forEach((path) => { path.style.fillOpacity = ''; });
    };

    try {
      state.paths.forEach((path) => { path.style.fillOpacity = '0'; });

      // 1.28배로 당겨 둔 자리에서 시작해 전국 화면까지 천천히 물러난다.
      const zoom = 1.28;
      state.view = {
        x: (VIEW_W / 2) * (1 - zoom),
        y: (VIEW_H / 2) * (1 - zoom),
        scale: zoom,
      };
      applyView();

      const pullBack = animateView({ x: 0, y: 0, scale: 1 }, INTRO_MS, token);

      for (let grade = 0; grade < orderedKeys.length; grade += 1) {
        if (token !== introToken) { finalize(); return; }
        orderedKeys[grade].forEach((key) => {
          const path = state.paths.get(key);
          if (path) path.style.fillOpacity = '1';
        });
        await wait(GRADE_DELAY, token);
      }

      finalize();
      await pullBack;
    } catch (error) {
      console.warn('인트로를 건너뜁니다.', error);
    } finally {
      finalize();
    }
  }

  /* token 이 바뀌면 기다리지 않고 바로 돌아온다. */
  function wait(ms, token) {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      const check = setInterval(() => {
        if (token !== introToken) { clearTimeout(timer); clearInterval(check); resolve(); }
      }, 30);
      setTimeout(() => clearInterval(check), ms + 10);
    });
  }

  function stopIntro() {
    introToken += 1;
    state.paths.forEach((path) => { path.style.fillOpacity = ''; });
  }

  function setTooltip(fn) {
    state.tooltipText = fn;
  }

  function svgPoint(svg, event) {
    const box = svg.getBoundingClientRect();
    // preserveAspectRatio="meet" 때문에 실제 그려지는 영역은 여백을 뺀 부분이다.
    const scale = Math.min(box.width / VIEW_W, box.height / VIEW_H);
    const drawnWidth = VIEW_W * scale;
    const drawnHeight = VIEW_H * scale;
    const left = box.left + (box.width - drawnWidth) / 2;
    const top = box.top + (box.height - drawnHeight) / 2;
    return [(event.clientX - left) / scale, (event.clientY - top) / scale];
  }

  /* 커서 오른쪽·아래에 두되, 공간이 모자라면 반대편으로 뒤집는다.
   * 화면 오른쪽·아래 가장자리에서 말풍선이 뷰포트 밖으로 잘리는 것을 막는다. */
  function placeTooltip(tooltip, svg, event) {
    // 말풍선의 좌표 기준은 자기 부모다. 지도가 안쪽으로 들어가 있는
    // 상태에서는 svg 기준으로 재면 그 여백만큼 어긋난다.
    const box = (tooltip.offsetParent || svg).getBoundingClientRect();
    const size = tooltip.getBoundingClientRect();
    const margin = 12;

    let x = event.clientX - box.left + margin;
    let y = event.clientY - box.top + margin;

    if (x + size.width > box.width - margin) x = event.clientX - box.left - size.width - margin;
    if (y + size.height > box.height - margin) y = event.clientY - box.top - size.height - margin;

    tooltip.style.left = `${Math.max(margin, x)}px`;
    tooltip.style.top = `${Math.max(margin, y)}px`;
  }

  function bindEvents(svg) {
    const tooltip = document.getElementById('tooltip');

    // 손가락으로 쓰는 화면에서는 말풍선을 띄우지 않는다. 손가락이 가린 자리에
    // 나타났다가 손을 떼면 그대로 남아 버리기 때문이다. 대신 누르면 바로 선택된다.
    // matchMedia 가 없는 환경에서는 마우스가 있다고 본다.
    const hasHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;

    function showTooltip(event, path) {
      if (!tooltip || !state.tooltipText) return;
      const html = state.tooltipText(path.dataset.key);
      if (!html) return;
      tooltip.innerHTML = html;
      tooltip.hidden = false;
      // 크기를 재려면 이미 화면에 있어야 하므로 내용을 먼저 넣은 뒤에 위치를 잡는다.
      placeTooltip(tooltip, svg, event);
    }

    if (hasHover) {
      svg.addEventListener('mousemove', (event) => {
        const path = event.target.closest('path');
        if (!path || !path.dataset.key) {
          if (tooltip) tooltip.hidden = true;
          state.onHover(null);
          return;
        }
        showTooltip(event, path);
        state.onHover(path.dataset.key);
      });
      svg.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.hidden = true;
        state.onHover(null);
      });
    }

    svg.addEventListener('wheel', (event) => {
      stopIntro();
      event.preventDefault();
      const [x, y] = svgPoint(svg, event);
      zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2, x, y);
    }, { passive: false });

    // 손가락과 마우스를 한 갈래로 다룬다. 포인터가 둘이면 확대, 하나면 이동이다.
    const pointers = new Map();
    let gesture = null;

    const centerOf = () => {
      const points = [...pointers.values()];
      const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / points.length, y: sum.y / points.length };
    };

    const spreadOf = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    function startGesture() {
      const center = centerOf();
      gesture = {
        x: center.x,
        y: center.y,
        viewX: state.view.x,
        viewY: state.view.y,
        scale: state.view.scale,
        spread: pointers.size === 2 ? spreadOf() : 0,
        moved: 0,
      };
    }

    svg.addEventListener('pointerdown', (event) => {
      stopIntro();
      const [x, y] = svgPoint(svg, event);
      pointers.set(event.pointerId, { x, y });
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('is-panning');
      startGesture();
    });

    svg.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      const [x, y] = svgPoint(svg, event);
      pointers.set(event.pointerId, { x, y });
      if (!gesture) return;

      const center = centerOf();
      gesture.moved = Math.max(
        gesture.moved,
        Math.hypot(center.x - gesture.x, center.y - gesture.y)
      );

      if (pointers.size === 2 && gesture.spread > 0) {
        const ratio = spreadOf() / gesture.spread;
        const next = Math.max(1, Math.min(12, gesture.scale * ratio));
        state.view.scale = next;
        state.view.x = center.x - (gesture.x - gesture.viewX) * (next / gesture.scale);
        state.view.y = center.y - (gesture.y - gesture.viewY) * (next / gesture.scale);
      } else {
        state.view.x = gesture.viewX + (center.x - gesture.x);
        state.view.y = gesture.viewY + (center.y - gesture.y);
      }
      applyView();
    });

    function endPointer(event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);

      // 거의 움직이지 않았으면 누른 것으로 본다. 지도를 끌고 다닌 뒤에
      // 손을 뗄 때 엉뚱한 지역이 선택되지 않도록 한다.
      if (pointers.size === 0) {
        const tapped = gesture && gesture.moved < 6;
        if (tapped) {
          const path = document.elementFromPoint(event.clientX, event.clientY);
          if (path && path.tagName === 'path' && path.dataset.key) {
            notifySelect(path.dataset.key, state.onSelect);
            if (!hasHover && tooltip) tooltip.hidden = true;
          }
        }
        gesture = null;
        svg.classList.remove('is-panning');
      } else {
        startGesture();
      }
    }

    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);

    // 마우스 클릭 경로. 포인터 제스처가 이미 처리했으면 gesture 가 남아 있지 않다.
    svg.addEventListener('click', (event) => {
      const path = event.target.closest('path');
      if (path && path.dataset.key && !gesture) notifySelect(path.dataset.key, state.onSelect);
    });

    window.addEventListener('resize', placePin);
  }

  function clampViewState(view, viewW, viewH) {
    if (view.scale <= 1) return { x: 0, y: 0, scale: view.scale };
    const limitX = (view.scale - 1) * viewW;
    const limitY = (view.scale - 1) * viewH;
    return {
      scale: view.scale,
      x: Math.min(0, Math.max(-limitX, view.x)),
      y: Math.min(0, Math.max(-limitY, view.y)),
    };
  }

  function viewHeightFromBounds(bounds) {
    const kx = Math.cos(((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180));
    const ratio = (bounds.maxLat - bounds.minLat) / ((bounds.maxLon - bounds.minLon) * kx || 1);
    return Math.round(Math.max(700, Math.min(1800, VIEW_W * ratio)));
  }

  root.RiskMap = {
    draw,
    paint,
    setColors,
    setHover,
    setPin,
    zoomBy,
    reset,
    focus,
    setTooltip,
    intro,
    stopIntro,
    viewBox: () => [VIEW_W, VIEW_H],
    GRADE_COLORS,
    gradeIndex,
    _test: {
      gradeIndex,
      GRADE_COLORS,
      boundsOf,
      makeProjection,
      centerOfPath,
      geometryToPath,
      keyOf,
      shiftCoords,
      clampViewState,
      viewHeightFromBounds,
      VIEW_W,
      DEPTH,
      LIFT,
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

export const RiskMap = globalThis.RiskMap;
