import { publicUrl } from "./public-url";

export type SggFeature = {
  sido: string;
  name: string;
  polygons: number[][][][]; // polygon -> ring -> [lng, lat]
};

let cache: Promise<SggFeature[]> | null = null;

export function loadSigungu(): Promise<SggFeature[]> {
  if (!cache) {
    cache = fetch(publicUrl("/data/sigungu.geojson"))
      .then((r) => {
        if (!r.ok) throw new Error("경계를 읽지 못했습니다.");
        return r.json() as Promise<{
          features: {
            properties: { 시도: string; 시군구: string };
            geometry: { type: string; coordinates: number[][][] | number[][][][] };
          }[];
        }>;
      })
      .then((geo) =>
        geo.features.map((f) => ({
          sido: f.properties.시도,
          name: f.properties.시군구,
          polygons:
            f.geometry.type === "Polygon"
              ? [f.geometry.coordinates as number[][][]]
              : (f.geometry.coordinates as number[][][][]),
        })),
      );
  }
  return cache;
}
