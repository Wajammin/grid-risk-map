import { create } from "zustand";
import { SIDO_LIST } from "./scoring";
import type { Filter } from "./types";
import { KAKAO_KEY_STORAGE } from "./kakao-sdk";
import { DEFAULT_KAKAO_JS_KEY } from "./kakao-key";

type Tab = "board" | "region" | "detail" | "method" | "sources";
type KakaoStatus = "off" | "loading" | "on" | "error";
type MapMode = "color" | "kakao";

type State = {
  tab: Tab;
  filter: Filter;
  growth: number;
  sidoId: string | null;
  sggName: string | null;
  focus: { lat: number; lng: number; zoom: number };
  kakaoKey: string | null;
  kakaoStatus: KakaoStatus;
  kakaoError: string;
  mapTick: number;
  mapMode: MapMode;
  chatOpen: boolean;
  chatSeed: string | null;
  sheet: "rank" | null;
  hover: { sidoId: string; name: string } | null;
  mobileSnap: "peek" | "half" | "tall";
  setTab: (tab: Tab) => void;
  setFilter: (filter: Filter) => void;
  setGrowth: (growth: number) => void;
  selectNation: () => void;
  selectSido: (sidoId: string) => void;
  selectSgg: (sidoId: string, name: string) => void;
  setKakaoKey: (key: string | null) => void;
  setKakaoStatus: (status: KakaoStatus, error?: string) => void;
  bumpMap: () => void;
  setMapMode: (mode: MapMode) => void;
  openChat: (seed?: string) => void;
  closeChat: () => void;
  setSheet: (sheet: "rank" | null) => void;
  setHover: (hover: { sidoId: string; name: string } | null) => void;
  cycleSnap: () => void;
};

const ALIAS: Record<string, string> = {
  광주광역시: "전남광주",
  전라남도: "전남광주",
  광주: "전남광주",
  전남: "전남광주",
};

function resolveSido(id: string) {
  return ALIAS[id] ?? id;
}

function readSavedKakaoKey() {
  try {
    const saved = localStorage.getItem(KAKAO_KEY_STORAGE)?.trim();
    if (saved) return saved;
  } catch {
    /* empty */
  }
  return DEFAULT_KAKAO_JS_KEY;
}

export const useMapStore = create<State>((set) => ({
  tab: "board",
  filter: "all",
  growth: 0,
  sidoId: null,
  sggName: null,
  focus: { lat: 36.2, lng: 127.8, zoom: 1 },
  kakaoKey: typeof window === "undefined" ? DEFAULT_KAKAO_JS_KEY : readSavedKakaoKey(),
  kakaoStatus: "off",
  kakaoError: "",
  mapTick: 0,
  mapMode: "color",
  chatOpen: false,
  chatSeed: null,
  sheet: null,
  hover: null,
  mobileSnap: "half",
  setTab: (tab) => set({ tab }),
  setFilter: (filter) => set({ filter }),
  setGrowth: (growth) => set({ growth: Math.min(500, Math.max(0, Math.round(growth))) }),
  selectNation: () =>
    set({
      sidoId: null,
      sggName: null,
      tab: "board",
      focus: { lat: 36.2, lng: 127.8, zoom: 1 },
    }),
  selectSido: (sidoId) => {
    const id = resolveSido(sidoId);
    const s = SIDO_LIST.find((x) => x.id === id);
    set({
      sidoId: id,
      sggName: null,
      tab: "detail",
      focus: s
        ? { lat: s.lat, lng: s.lng, zoom: 2.15 }
        : { lat: 36.2, lng: 127.8, zoom: 1 },
    });
  },
  selectSgg: (sidoId, name) => {
    const id = resolveSido(sidoId);
    const s = SIDO_LIST.find((x) => x.id === id);
    const c = s?.children.find((x) => x.name === name);
    set((state) => ({
      sidoId: id,
      sggName: name,
      tab: "detail",
      sheet: null,
      mobileSnap:
        typeof window !== "undefined" && window.innerWidth < 768 ? "tall" : state.mobileSnap,
      focus: c
        ? { lat: c.lat, lng: c.lng, zoom: 3.2 }
        : s
          ? { lat: s.lat, lng: s.lng, zoom: 2.15 }
          : { lat: 36.2, lng: 127.8, zoom: 1 },
    }));
  },
  setKakaoKey: (key) => {
    const next = key?.trim() || null;
    try {
      if (next) localStorage.setItem(KAKAO_KEY_STORAGE, next);
      else localStorage.removeItem(KAKAO_KEY_STORAGE);
    } catch {
      /* empty */
    }
    set((s) => ({
      kakaoKey: next,
      kakaoStatus: next && s.mapMode === "kakao" ? "loading" : next ? "off" : "off",
      kakaoError: "",
    }));
  },
  setKakaoStatus: (status, error = "") => set({ kakaoStatus: status, kakaoError: error }),
  bumpMap: () => set((s) => ({ mapTick: s.mapTick + 1 })),
  setMapMode: (mode) =>
    set((s) => ({
      mapMode: mode,
      kakaoStatus:
        mode === "kakao" && s.kakaoKey
          ? "loading"
          : mode === "color" && s.kakaoStatus === "loading"
            ? "off"
            : s.kakaoStatus,
      kakaoError: mode === "kakao" ? s.kakaoError : "",
    })),
  openChat: (seed) => set({ chatOpen: true, chatSeed: seed?.trim() || null }),
  closeChat: () => set({ chatOpen: false, chatSeed: null }),
  setSheet: (sheet) => set({ sheet }),
  setHover: (hover) => set({ hover }),
  cycleSnap: () =>
    set((s) => ({
      mobileSnap: s.mobileSnap === "half" ? "tall" : s.mobileSnap === "tall" ? "peek" : "half",
    })),
}));
