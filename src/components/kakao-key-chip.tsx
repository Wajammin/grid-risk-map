import { useMapStore } from "@/lib/store";
import { DEFAULT_KAKAO_JS_KEY } from "@/lib/kakao-key";

export function KakaoKeyChip() {
  const status = useMapStore((s) => s.kakaoStatus);
  const error = useMapStore((s) => s.kakaoError);
  const setKakaoKey = useMapStore((s) => s.setKakaoKey);

  if (status === "on" || status === "loading") return null;

  return (
    <div className="absolute top-12 right-2 z-10 max-w-[min(280px,70%)] sm:top-3 sm:right-3">
      {status === "error" && (
        <div className="glass-float rounded-xl px-2.5 py-2 text-[11px] text-red-800">
          <p>{error || "카카오맵을 불러오지 못했습니다."}</p>
          <p className="mt-1 text-muted-foreground">
            카카오 디벨로퍼스에서 이 사이트 도메인을 등록했는지 확인하세요.
          </p>
          <button
            type="button"
            className="mt-1.5 rounded-lg bg-foreground px-2 py-1 text-[11px] font-semibold text-background"
            onClick={() => setKakaoKey(DEFAULT_KAKAO_JS_KEY)}
          >
            다시 연결
          </button>
        </div>
      )}
    </div>
  );
}
