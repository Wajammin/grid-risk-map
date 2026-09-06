export type SourceItem = {
  title: string;
  org: string;
  date: string;
  url: string;
  usedFor: string;
  note?: string;
};

export const DATA_SOURCES: SourceItem[] = [
  {
    title: "주민등록 인구 및 세대 현황 (시군구)",
    org: "행정안전부",
    date: "2026년 7월",
    url: "https://jumin.mois.go.kr/",
    usedFor: "229개 시·군·구 인구, 1인당 전력 분모",
    note: "2026년 광주광역시와 전라남도가 통합되어 전남광주로 표기합니다. 2023년 7월 군위군은 대구광역시로 편입되어 대구 경계에 반영했습니다. 인천 중구·동구·서구는 제물포·영종·서해+검단 공표에 대응했습니다.",
  },
  {
    title: "주민등록인구현황 (KOSIS DT_1B040A3)",
    org: "통계청 · 행정안전부",
    date: "1992–2026.08",
    url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B040A3",
    usedFor: "인구 시계열 대조",
  },
  {
    title: "한국전력통계 제95호 (2025년)",
    org: "한국전력공사",
    date: "2025년 판매 · 2026년 공표",
    url: "https://www.kepco.co.kr/home/customer/library/electricity-statistics/kepco-stats/boardList.do",
    usedFor: "전국 판매량 549,417 GWh, 용도별 판매 구조의 광역 패턴",
    note: "시군구 판매 kWh는 한전이 월별 공개하나 용도(산업/주택) 세분은 광역 비중을 인구 비례로 배분한 추정치입니다.",
  },
  {
    title: "시군구별 전력판매량 (월보)",
    org: "한국전력공사",
    date: "2025–2026 (월간)",
    url: "https://www.kepco.co.kr/home/customer/library/electricity-statistics/sales-volume/boardList.do",
    usedFor: "시군구 총판매량 공개 채널. 본 프로토타입의 배분 근거",
  },
  {
    title: "시도별 용도별 판매전력량",
    org: "전력거래소 EPSIS",
    date: "연속 공표",
    url: "https://epsis.kpx.or.kr/epsisnew/selectEksaAscAsaChart.do?menuId=060405",
    usedFor: "산업용·주택용·일반용 광역 비중",
  },
  {
    title: "지역별 전력 소비 (경기 143.3 TWh, 서울 50.4 TWh)",
    org: "JTBC / 한국전력 판매량 인용",
    date: "2026-03-02",
    url: "https://news.jtbc.co.kr/article/NB12287610",
    usedFor: "서울·경기 1인당 전력(kWh) 고정값",
  },
];

export const METHOD_SOURCES: SourceItem[] = [
  {
    title: "Handbook on Constructing Composite Indicators",
    org: "OECD · JRC",
    date: "2008",
    url: "https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html",
    usedFor: "Min–Max 정규화, 가중 합산",
  },
  {
    title: "Multiple Attribute Decision Making: Methods and Applications",
    org: "Hwang, C.L. & Yoon, K.",
    date: "1981",
    url: "https://link.springer.com/book/10.1007/978-3-642-48318-9",
    usedFor: "TOPSIS 상대근접도. 이상해가 (1,1,1)이면 가중 합산과 동일",
  },
];

export const NEWS_SOURCES: SourceItem[] = [
  {
    title: "화재로 정전된 남양주 아파트, 무더위에 15시간째 불편",
    org: "연합뉴스",
    date: "2025-07-10",
    url: "https://www.yna.co.kr/view/AKR20250710053300060",
    usedFor: "경기 남양주시 대조 (화도읍 아파트 화재, 약 370가구)",
    note: "변압기 용량 부족이 아니라 화재로 인한 공급 중단입니다. 주거 밀집·폭염 취약의 참고 사례로만 씁니다.",
  },
  {
    title: "군포서 시내버스가 변압기 들이받아 아파트 2천여세대 한때 정전",
    org: "연합뉴스",
    date: "2025-08-12",
    url: "https://www.yna.co.kr/view/AKR20250812008600061",
    usedFor: "경기 군포시 대조 (당동, 변압기 충돌, 2,255세대)",
  },
  {
    title: "폭염경보 속 군포시 1000세대 아파트 정전…7시간 만에 복구",
    org: "KBS",
    date: "2025-07-10",
    url: "https://news.kbs.co.kr/news/view.do?ncd=8300193",
    usedFor: "군포시 폭염 정전 보조 보도 (당동, 약 1,000세대)",
  },
  {
    title: "인천 연수구 일대 1천900세대 정전…승강기에 갇힌 2명 구조",
    org: "연합뉴스",
    date: "2026-05-22",
    url: "https://www.yna.co.kr/view/AKR20260522007600065",
    usedFor: "인천 연수구 대조 (송도·동춘·연수, 약 1,900세대)",
  },
  {
    title: "인천 남동구 1천200가구 아파트서 정전…주민 2명 승강기 갇혀",
    org: "경기일보",
    date: "2025-07-06",
    url: "https://www.kyeonggi.com/article/20250706580017",
    usedFor: "인천 남동구 대조 (약 1,200가구)",
  },
  {
    title: "광주·전남 정전 사고 잇따라…산수동 아파트 950여 세대",
    org: "kbc 광주방송",
    date: "2023-06-23",
    url: "https://news.ikbc.co.kr/article/view/kbc202306230013",
    usedFor: "전남광주 동구 대조 (산수동, 약 950세대, 변압기 고장)",
  },
  {
    title: "대구서 피뢰기 파손으로 아파트 2천900여 세대 정전",
    org: "연합뉴스",
    date: "2025-08-08",
    url: "https://www.yna.co.kr/view/AKR20250808064800053",
    usedFor: "대구 달서구 대조 (도원동, 약 2,900세대)",
  },
];

export const TOOL_SOURCES: SourceItem[] = [
  {
    title: "카카오맵 JavaScript API",
    org: "카카오디벨로퍼스",
    date: "SDK 현재 문서",
    url: "https://developers.kakao.com/docs/ko/kakaomap/common",
    usedFor: "타일 지도. JavaScript 키는 사이트에 넣어 두었고, 도메인 등록이 필요합니다.",
  },
  {
    title: "카카오 디벨로퍼스 콘솔",
    org: "카카오",
    date: "앱 등록",
    url: "https://developers.kakao.com/console/app",
    usedFor: "Web 플랫폼 도메인 · 카카오맵 상품 활성화",
  },
];

export const LIMITS = [
  "2026년 광주광역시·전라남도 통합을 반영해 광역 단위는 전남광주 1곳으로 표기합니다. 시·군·구 229곳은 그대로입니다.",
  "시군구 변압기 용량·부하율 원자료는 한전이 시군구 단위로 공개하지 않아, 격차 G는 공개 패턴 기반 프로토타입입니다.",
  "주택용 지수 R(39–65)은 한전 주택용 판매 비중(전국 약 13–15%)과 스케일이 다릅니다. 지역 간 상대 비교용입니다.",
  "산업용 GWh는 광역 용도 비중 × 인구 비례 배분입니다. 여수·울산 등 실제 산업단지는 이 배분보다 클 수 있습니다.",
  "광역 판매량 합(약 517 TWh)은 한전 전국 판매 549 TWh보다 낮습니다. 서울·경기만 공표 TWh를 고정했기 때문입니다.",
  "정전 뉴스는 설비 과부하만이 아닙니다. 화재·추돌·피뢰기 파손 사례를 포함하며, 검증 탭에서 원인을 구분합니다.",
];
