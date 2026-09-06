const SCRIPT_ID = "kakao-maps-sdk";

export type KakaoMaps = NonNullable<Window["kakao"]>["maps"];

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void;
        Map: new (
          el: HTMLElement,
          opts: { center: KakaoLatLng; level: number },
        ) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new (sw?: KakaoLatLng, ne?: KakaoLatLng) => KakaoLatLngBounds;
        CustomOverlay: new (opts: {
          position: KakaoLatLng;
          content: HTMLElement;
          yAnchor?: number;
          xAnchor?: number;
          zIndex?: number;
        }) => KakaoOverlay;
        Polygon: new (opts: {
          path: KakaoLatLng[] | KakaoLatLng[][];
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          fillColor?: string;
          fillOpacity?: number;
          zIndex?: number;
        }) => KakaoPolygon;
        event: {
          addListener: (
            target: KakaoMap | KakaoPolygon,
            type: string,
            handler: () => void,
          ) => void;
        };
      };
    };
  }
}

export type KakaoLatLng = { getLat: () => number; getLng: () => number };
export type KakaoLatLngBounds = {
  extend: (p: KakaoLatLng) => void;
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
};
export type KakaoOverlay = { setMap: (map: KakaoMap | null) => void };
export type KakaoPolygon = {
  setMap: (map: KakaoMap | null) => void;
  setOptions: (opts: { fillColor?: string; fillOpacity?: number; strokeColor?: string }) => void;
};
export type KakaoMap = {
  setCenter: (p: KakaoLatLng) => void;
  panTo: (p: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  getLevel: () => number;
  getBounds: () => KakaoLatLngBounds;
  getNode: () => HTMLElement;
  relayout: () => void;
  setBounds: (
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
};

export function loadKakaoSdk(appkey: string): Promise<KakaoMaps> {
  return new Promise((resolve, reject) => {
    const key = appkey.trim();
    if (!key) {
      reject(new Error("JavaScript 키가 없습니다."));
      return;
    }

    const finish = () => {
      const k = window.kakao;
      if (!k?.maps?.load) {
        reject(new Error("SDK는 불러왔지만 kakao.maps가 없습니다. JavaScript 키를 확인하세요."));
        return;
      }
      k.maps.load(() => resolve(k.maps));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.src.includes(`appkey=${encodeURIComponent(key)}`) && window.kakao?.maps) {
        finish();
        return;
      }
      existing.remove();
      delete window.kakao;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    s.onload = finish;
    s.onerror = () => reject(new Error("카카오 스크립트를 불러오지 못했습니다. 키·도메인을 확인하세요."));
    document.head.appendChild(s);
  });
}

export const KAKAO_KEY_STORAGE = "kakao_js_key";
