/**
 * [mapReport.ts]
 * 백엔드 분석 결과(AnalysisResultResponse)를 리포트 화면이 쓰는 형태(ReportData/ComparePlayer)로 변환합니다.
 *
 * 백엔드는 파이썬 player 원본(detailJson)을 그대로 내려주므로, 여기서 한글 라벨/상태/피드백 문구로 가공합니다.
 * detail이 없으면(=상세 미수신/파싱 실패) mock 상세로 폴백하되 점수·선수명 같은 실데이터는 유지합니다.
 */

import {
  AnalysisResultResponse,
  PitchingComparison,
  PlayerDetail,
} from '../../../api/analysisApi';
import {
  ComparePlayer,
  FeedbackMetric,
  PhaseFeedback,
  PhaseScore,
  ReleasePoint,
  ReleaseTiming,
  ReportData,
} from '../types/report.types';
import { MOCK_REPORT_DATA } from '../data/report.mockdata';

/** 파이썬 phase 코드 → 한글 라벨 (label이 비어있을 때의 폴백) */
const PHASE_KO: Record<string, string> = {
  windup: '와인드업',
  leg_lift: '레그 리프트',
  stride: '스트라이드',
  acceleration: '가속',
  follow_through: '팔로스루',
};

const round1 = (n: number | null | undefined): number =>
  n == null || Number.isNaN(n) ? 0 : Math.round(n * 10) / 10;

const round3 = (n: number | null | undefined): number =>
  n == null || Number.isNaN(n) ? 0 : Math.round(n * 1000) / 1000;

const phaseLabel = (p: { label?: string; phase: string }): string =>
  (p.label && p.label.trim()) || PHASE_KO[p.phase] || p.phase;

/** 구간별 '좋은 폼' 가이드라인 — 구체 지표가 없을 때 무엇을 점검할지 알려준다(백엔드와 동일). */
const PHASE_GUIDELINE_KO: Record<string, string> = {
  windup: '준비 동작에서는 중심을 안정적으로 모으고 일정한 리듬으로 시작하세요.',
  leg_lift: '디딤 무릎을 허리 높이까지 곧게 들어올리고, 축발에 체중을 실어 중심을 뒤에 두세요.',
  stride: '디딤발을 홈플레이트 방향으로 곧게 내딛고, 골반부터 상체 순으로 회전을 시작하세요.',
  acceleration: '팔꿈치를 어깨선 높이로 끌어올리고, 하체 회전력이 상체·팔로 순차 전달되게 하세요.',
  follow_through: '던진 뒤 팔이 반대쪽으로 자연스럽게 따라 내려오며 균형을 잡고 마무리하세요.',
};

// "측정값 나 0.38 vs 선수 0.35" 추출(그래프용) — 매칭된 문구는 본문에서 제거한다.
const MEASURE_RE = /\s*(?:[—–-]\s*)?측정값\s*나\s*(-?\d+(?:\.\d+)?)\s*vs\s*선수\s*(-?\d+(?:\.\d+)?)/;

/**
 * 피드백 문구에서 측정값(나/선수)을 분리해 그래프 데이터로 만들고,
 * 본문에서는 그 숫자와 (이미 뱃지에 있는) "유사도 N점" 표기를 제거한다.
 */
function splitMetric(message: string): { text: string; metric?: FeedbackMetric } {
  let metric: FeedbackMetric | undefined;
  let text = message;
  const m = message.match(MEASURE_RE);
  if (m) {
    metric = { userValue: Number(m[1]), proValue: Number(m[2]) };
    text = text.replace(MEASURE_RE, '');
  }
  text = text
    .replace(/\(?\s*유사도\s*[\d.]+\s*점\s*\)?/g, '') // "(유사도 87.7점)"
    .replace(/\s*자세\s*유사도\s*[\d.]+\s*점\s*/g, ' ') // "자세 유사도 55점"
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,)])/g, '$1')
    .trim();
  return { text, metric };
}

function todayDot(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/** 비교 선수 목록 — 유사도 높은 순으로 정렬(전 선수, 선택해 비교 가능). 기본 선택은 1위. */
export function buildComparePlayers(result: AnalysisResultResponse): ComparePlayer[] {
  return result.results
    .map((r) => ({
      id: String(r.proId),
      name: r.proName,
      initial: r.proName?.charAt(0) ?? '?',
      similarity: round1(r.similarityScore),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/** 선택된 선수 기준 리포트 데이터 생성 */
export function buildReportData(
  result: AnalysisResultResponse,
  player: ComparePlayer,
): ReportData {
  const match: PitchingComparison | undefined = result.results.find(
    (r) => String(r.proId) === player.id,
  );
  const detail: PlayerDetail | null | undefined = match?.detail;

  // 상세 데이터가 없으면 mock 상세로 폴백 (점수/선수는 실데이터 유지)
  if (!detail || !detail.phaseScores?.length) {
    return {
      ...MOCK_REPORT_DATA,
      id: `report-${result.videoId}`,
      date: todayDot(),
      pitchType: match?.pitchType ?? MOCK_REPORT_DATA.pitchType,
      overallSimilarity: player.similarity,
      comparePlayer: player,
    };
  }

  // 구간별 good/bad 피드백을 phase 키로 인덱싱
  const goodByPhase = new Map<string, string>();
  const badByPhase = new Map<string, string>();
  detail.feedback?.good?.forEach((f) => f.phase && goodByPhase.set(f.phase, f.message));
  detail.feedback?.bad?.forEach((f) => f.phase && badByPhase.set(f.phase, f.message));

  const feedbacks: PhaseFeedback[] = detail.phaseScores.map((p) => {
    const score = round1(p.score);
    const name = phaseLabel(p);
    // 백엔드가 측정 근거까지 담아 보낸 상세 피드백을 우선 사용하고,
    // 해당 구간에 항목이 없을 때만 점수로 정량화한 폴백을 쓴다.
    const realGood = goodByPhase.get(p.phase); // 백엔드가 실제로 칭찬한 구간인가
    const realBad = badByPhase.get(p.phase); // 백엔드가 실제로 지적한 구간인가
    // 이 구간이 약점으로 지적됐거나 점수가 낮으면, '유사하다'는 칭찬으로 개선안과
    // 앞뒤가 안 맞지 않도록 잘된 점 폴백을 과장 없는 문구로 둔다.
    const flagged = !!realBad || score < 70;
    const goodRaw =
      realGood ??
      (flagged
        ? `${name} 구간의 기본 동작 골격은 유지되고 있습니다.`
        : `${name} 구간은 전체 자세 흐름이 선수와 비교적 안정적으로 유사합니다.`);
    const badRaw =
      realBad ??
      (score >= 70
        ? '두드러진 개선 포인트는 없습니다. 세부 정밀도를 높이면 더 향상됩니다.'
        : `${name} 구간은 선수와 차이가 있습니다. ${
            PHASE_GUIDELINE_KO[p.phase] ?? '선수의 같은 구간과 프레임 단위로 비교해 보세요.'
          }`);
    const goodParsed = splitMetric(goodRaw);
    const badParsed = splitMetric(badRaw);
    return {
      phaseName: name,
      score,
      status: score >= 70 ? '양호' : '미흡',
      goodPoint: goodParsed.text,
      goodMetric: goodParsed.metric,
      // 점수는 상단 뱃지에 이미 있으므로 본문엔 정성적 요약만.
      feedback:
        score >= 80
          ? '선수와 매우 유사한 구간입니다.'
          : score >= 70
            ? '대체로 유사하나 세부 동작에서 일부 차이가 있습니다.'
            : '선수와 자세 차이가 있어 개선이 필요합니다.',
      improvement: badParsed.text,
      improvementMetric: badParsed.metric,
    };
  });

  const phaseScores: PhaseScore[] = detail.phaseScores.map((p) => ({
    phaseName: phaseLabel(p),
    score: round1(p.score),
  }));

  const timing = detail.release?.timing;
  const releaseTiming: ReleaseTiming = {
    myTiming: round1(timing?.userPitchPercent),
    proTiming: round1(timing?.proPitchPercent),
    diff: round1(timing?.differencePercent),
    feedback: timing?.message ?? '릴리즈 타이밍 정보를 계산하지 못했습니다.',
  };

  const point = detail.release?.point;
  const releasePoint: ReleasePoint = {
    totalDiff: round3(point?.difference),
    heightDiff: round3(point?.heightDifference),
    widthDiff: round3(point?.sideDifference),
    feedback: point?.message ?? '릴리즈 포인트 정보를 계산하지 못했습니다.',
  };

  return {
    id: `report-${result.videoId}`,
    date: todayDot(),
    pitchType: match?.pitchType ?? '직구',
    overallSimilarity: player.similarity,
    comparePlayer: player,
    feedbacks,
    insight: { phaseScores, releaseTiming, releasePoint },
  };
}
