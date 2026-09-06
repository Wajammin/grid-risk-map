import { useEffect, useRef } from "react";
import {
  ALL_SGG,
  SIDO_LIST,
  applyGrowth,
  findUnit,
  gradeColor,
  passesFilter,
} from "@/lib/scoring";
import { useMapStore } from "@/lib/store";
import { loadKakaoSdk, type KakaoMap, type KakaoOverlay, type KakaoPolygon } from "@/lib/kakao-sdk";
import { loadSigungu } from "@/lib/sigungu-geo";
import { RegionPop } from "@/components/region-pop";

function fit(
  map: KakaoMap,
  maps: NonNullable<Window["kakao"]>["maps"],
  pts: { lat: number; lng: number }[],
  minSpan = 0.32,
) {
  if (!pts.length) return;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of pts) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const dLat = Math.max(minSpan, maxLat - minLat);
  const dLng = Math.max(minSpan, maxLng - minLng);
  const cy = (minLat + maxLat) / 2;
  const cx = (minLng + maxLng) / 2;
  const bounds = new maps.LatLngBounds(
    new maps.LatLng(cy - dLat / 2, cx - dLng / 2),
    new maps.LatLng(cy + dLat / 2, cx + dLng / 2),
  );
  map.setBounds(bounds, 48, 48, 48, 48);
}

export function KakaoRiskMap() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoOverlay[]>([]);
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const kakaoKey = useMapStore((s) => s.kakaoKey);
  const setKakaoStatus = useMapStore((s) => s.setKakaoStatus);
  const growth = useMapStore((s) => s.growth);
  const filter = useMapStore((s) => s.filter);
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectSgg = useMapStore((s) => s.selectSgg);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !kakaoKey) return;
    let cancelled = false;
    setKakaoStatus("loading", "");
    loadKakaoSdk(kakaoKey)
      .then((maps) => {
        if (cancelled || !hostRef.current) return;
        const map = new maps.Map(hostRef.current, {
          center: new maps.LatLng(36.2, 127.8),
          level: 13,
        });
        mapRef.current = map;
        maps.event.addListener(map, "zoom_changed", () => {
          useMapStore.getState().bumpMap();
        });
        maps.event.addListener(map, "idle", () => {
          useMapStore.getState().bumpMap();
        });
        const st = useMapStore.getState();
        if (st.sggName) {
          const g = ALL_SGG.find((x) => x.sidoId === st.sidoId && x.name === st.sggName);
          if (g) fit(map, maps, [g], 0.12);
        } else if (st.sidoId) {
          const kids = ALL_SGG.filter((x) => x.sidoId === st.sidoId);
          fit(map, maps, kids, 0.22);
        } else {
          fit(map, maps, ALL_SGG, 3.2);
        }
        setKakaoStatus("on", "");
        useMapStore.getState().bumpMap();
        requestAnimationFrame(() => {
          try {
            map.relayout();
          } catch {
            /* empty */
          }
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        mapRef.current = null;
        setKakaoStatus("error", err.message || "카카오맵 연결 실패");
      });
    return () => {
      cancelled = true;
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
      mapRef.current = null;
    };
  }, [kakaoKey, setKakaoStatus]);

  const tick = useMapStore((s) => s.mapTick);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    const showSgg = Boolean(sidoId);

    if (!showSgg) {
      for (const s of SIDO_LIST) {
        const grown = applyGrowth(findUnit(s.id)!, growth);
        if (!passesFilter(grown.score, filter)) continue;
        const lb = document.createElement("button");
        lb.type = "button";
        lb.className = "k-lbl";
        lb.textContent = s.short === "전남광주" ? "전남·광주" : s.short;
        lb.title = s.name;
        lb.onclick = () => selectSido(s.id);
        const ov = new maps.CustomOverlay({
          position: new maps.LatLng(s.lat, s.lng),
          content: lb,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 2,
        });
        ov.setMap(map);
        overlaysRef.current.push(ov);
      }
      return;
    }

    const visible = ALL_SGG.filter((d) => {
      if (sidoId && d.sidoId !== sidoId) return false;
      const grown = applyGrowth(d, growth);
      return passesFilter(grown.score, filter);
    });

    void loadSigungu().then((features) => {
      if (mapRef.current !== map) return;
      const want = new Set(visible.map((d) => `${d.sidoId}|${d.name}`));
      for (const f of features) {
        if (!want.has(`${f.sido}|${f.name}`)) continue;
        const d = visible.find((x) => x.sidoId === f.sido && x.name === f.name);
        if (!d) continue;
        const grown = applyGrowth(d, growth);
        const on = d.name === sggName && d.sidoId === sidoId;
        for (const poly of f.polygons) {
          const path = poly.map((ring) =>
            ring.map(([lng, lat]) => new maps.LatLng(lat, lng)),
          );
          const polygon = new maps.Polygon({
            path: path.length === 1 ? path[0] : path,
            strokeWeight: on ? 2.4 : 1,
            strokeColor: on ? "#0f172a" : "#ffffff",
            fillColor: gradeColor(grown.score),
            fillOpacity: sggName && !on ? 0.38 : 0.78,
            zIndex: on ? 4 : 1,
          });
          polygon.setMap(map);
          maps.event.addListener(polygon, "click", () => selectSgg(f.sido, f.name));
          polygonsRef.current.push(polygon);
        }
      }
    });
  }, [growth, filter, sidoId, sggName, selectSido, selectSgg, tick, kakaoKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    if (sidoId) {
      fit(map, maps, ALL_SGG.filter((x) => x.sidoId === sidoId), 0.22);
    } else {
      fit(map, maps, ALL_SGG, 3.2);
    }
    try {
      map.relayout();
    } catch {
      /* empty */
    }
  }, [sidoId, sggName]);

  useEffect(() => {
    const onResize = () => {
      try {
        mapRef.current?.relayout();
      } catch {
        /* empty */
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0 bg-[#d7e3ee]" aria-label="카카오 배전망 위험 지도" />
      <RegionPop />
    </div>
  );
}
