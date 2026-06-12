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

function todayDot(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/** Top3 비교 선수 목록 (유사도 높은 순은 analysisApi에서 이미 정렬됨) */
export function buildComparePlayers(result: AnalysisResultResponse): ComparePlayer[] {
  return result.results.map((r) => ({
    id: String(r.proId),
    name: r.proName,
    initial: r.proName?.charAt(0) ?? '?',
    similarity: round1(r.similarityScore),
  }));
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
    return {
      phaseName: name,
      score,
      status: score >= 70 ? '양호' : '미흡',
      goodPoint: goodByPhase.get(p.phase) ?? `${name} 구간 분석 결과입니다.`,
      feedback:
        score >= 70
          ? `${name} 구간은 선수와 비교적 유사합니다.`
          : `${name} 구간은 선수와 차이가 있어 개선이 필요합니다.`,
      improvement: badByPhase.get(p.phase) ?? '추가 개선 포인트가 발견되지 않았습니다.',
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
