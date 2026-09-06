import { SIDO_LIST } from "@/lib/scoring";
import { validationTable } from "@/lib/validation";
import { useMapStore } from "@/lib/store";

export function ContestBrief() {
  const growth = useMapStore((s) => s.growth);
  const v = validationTable(growth);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <h2 className="text-base font-semibold text-foreground">심사 한 장</h2>
      <p className="text-xs">
        2026 빛가람 AI·ICT 경진대회 고등부. 점수는 고장 확률이 아니라{" "}
        <strong className="text-foreground">변압기·배전 우선점검 순서</strong>입니다.
      </p>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">문제</h3>
        <p className="mt-1 text-xs">
          전기 사용량이 많은 곳이 아니라, 설비가 수요 증가를 못 따라가는 곳이
          먼저 꺼집니다. 남양주·군포·연수 등 실제 정전 보도가 이를 보여 줍니다.
        </p>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">방법 (한 줄)</h3>
        <p className="mt-1 font-mono text-xs text-foreground">
          점수 = 100 × (0.45 nG + 0.35 nP + 0.20 nR)
        </p>
        <ol className="mt-2 space-y-1 text-xs">
          <li>1. 공개 지표 G(격차) · P(여름피크) · R(주택 지수)</li>
          <li>2. OECD Min–Max 정규화</li>
          <li>3. TOPSIS 이상해 (1,1,1) = 가중합</li>
          <li>4. 수요 +g% → G×0.85g, P×0.45g</li>
          <li>5. 로지스틱으로 위협 지수%(점검 긴급도, 고장확률 아님)</li>
        </ol>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">데이터</h3>
        <ul className="mt-1 space-y-1 text-xs">
          <li>· 인구: 행안부 주민등록 2026.07, {SIDO_LIST.length}개 광역 · 229 시군구</li>
          <li>· 전력 판매 구조: 한전 통계·EPSIS 광역 용도 비중, 인구 비례 배분</li>
          <li>· G·P·R: 시군구 변압기 원자료 비공개 → 공개 패턴 프로토타입</li>
        </ul>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">검증 (원인 분리)</h3>
        <p className="mt-1 text-xs">
          설비 관련 {v.equipHits}/{v.equipN}곳이 상위 20%. 화재·추돌 {v.extN}건은
          점수와 인과가 없어 참고만 합니다. Spearman {v.spearman.toFixed(2)}는
          n=6이라 확증이 아닙니다.
        </p>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">AI</h3>
        <p className="mt-1 text-xs">
          학습된 정전 예측기가 아닙니다. 같은 산출식의 설명 가능한 규칙 + 로지스틱
          위협 지수입니다. 챗봇은 이 숫자만 근거로 답하고, 없으면 로컬 규칙이
          대신합니다.
        </p>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">에너지 · 한전KDN</h3>
        <p className="mt-1 text-xs">
          배전 운영의 핵심인 변압기 과부하 순번을 시군구 화면에 올립니다. 수요
          시나리오로 설비 보강 우선순위를 미리 볼 수 있습니다.
        </p>
      </section>

      <section className="glass-soft rounded-xl p-3">
        <h3 className="font-semibold text-foreground">사용 설명서</h3>
        <ol className="mt-1 space-y-1 text-xs">
          <li>1. 전국 상황판 — 점검 순서</li>
          <li>2. 한 곳 열기 — 예: 남양주</li>
          <li>3. 상세 — 점수와 한글 이유</li>
          <li>4. 수요 증가 — 가정일 뿐</li>
          <li>5. 방법·출처 — 식과 한계</li>
        </ol>
        <p className="mt-2 text-[11px]">
          위쪽 <span className="text-foreground">설명서</span>를 누르면 한 장씩 따라갑니다. 자동으로 넘어가지 않습니다.
        </p>
      </section>
    </div>
  );
}
