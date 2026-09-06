export const RiskMap: {
  draw: (
    svg: SVGSVGElement,
    geojson: unknown,
    opts: {
      has: (key: string) => boolean;
      onSelect: (key: string) => void;
      onHover?: (key: string | null) => void;
    },
  ) => number;
  paint: (scores: Map<string, number>, selectedKey: string | null) => void;
  setColors: (list: string[]) => void;
  setHover: (key: string | null) => void;
  setPin: (key: string | null, html: string) => void;
  zoomBy: (factor: number, ox?: number, oy?: number) => void;
  reset: (opts?: { animate?: boolean }) => Promise<void>;
  focus: (key: string, opts?: { scale?: number; animate?: boolean; biasX?: number }) => Promise<void>;
  setTooltip: (fn: (key: string) => string) => void;
  intro: (orderedKeys: string[][]) => Promise<void>;
  stopIntro: () => void;
  viewBox: () => [number, number];
  GRADE_COLORS: string[];
  gradeIndex: (score: number) => number;
  _test: Record<string, unknown>;
};
