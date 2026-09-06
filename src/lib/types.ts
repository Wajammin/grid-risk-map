export type Grade = "안전" | "관심" | "주의" | "경계" | "위험" | "초과";

export type Indicators = {
  name: string;
  lat: number;
  lng: number;
  gap: number;
  peak: number;
  res: number;
  score: number;
  nG: number;
  nP: number;
  nR: number;
};

export type Sgg = Indicators;

export type Sido = Indicators & {
  id: string;
  short: string;
  children: Sgg[];
};

export type Unit = {
  kind: "sido" | "sgg";
  sidoId: string;
  sidoName: string;
  name: string;
  short?: string;
  lat: number;
  lng: number;
  gap: number;
  peak: number;
  res: number;
  score: number;
  nG: number;
  nP: number;
  nR: number;
};

export type Filter = "all" | "high" | "mid" | "low";
