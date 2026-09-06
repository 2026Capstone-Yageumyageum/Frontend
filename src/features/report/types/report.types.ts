/** 나 vs 선수 측정값 비교(그래프로 표시) */
export interface FeedbackMetric {
  userValue: number; // 나
  proValue: number; // 선수
}

export interface PhaseFeedback {
  phaseName: string; // e.g., "와인드업", "레그 리프트"
  score: number; // e.g., 76.9
  status: '양호' | '미흡';
  goodPoint: string;
  goodMetric?: FeedbackMetric; // 잘된 점에 딸린 측정값(있으면 그래프)
  feedback: string;
  improvement: string;
  improvementMetric?: FeedbackMetric; // 개선안에 딸린 측정값(있으면 그래프)
}

export interface ComparePlayer {
  id: string;
  name: string;
  initial: string;
  similarity: number;
}

export interface PhaseScore {
  phaseName: string; // "와인드업", "레그 리프트" 등
  score: number;
}

export interface ReleaseTiming {
  myTiming: number; // 87.2
  proTiming: number; // 96.6
  diff: number; // -9.4
  feedback: string; // "릴리즈 타이밍이 선수보다 빠릅니다."
}

export interface ReleasePoint {
  totalDiff: number; // 0.320
  heightDiff: number; // -0.142
  widthDiff: number; // 0.286
  feedback: string; // "릴리즈 포인트 차이가 크게 나타납니다."
}

export interface InsightData {
  phaseScores: PhaseScore[];
  releaseTiming: ReleaseTiming;
  releasePoint: ReleasePoint;
}

export interface ReportData {
  id: string;
  date: string;
  pitchType: string;
  isBestPitch?: boolean;
  overallSimilarity: number;
  comparePlayer: ComparePlayer;
  /**
   * 구간별 상세(phaseScores/feedback/release)를 받았는지 여부.
   *
   * 백엔드는 분석이 끝나도 detailJson이 비어 있을 수 있고, 그때도 200 OK로 응답한다.
   * 이 플래그가 false면 화면은 빈 카드를 그리는 대신 "상세를 불러오지 못했다"고 알린다.
   * (예전에는 이 경우 mock 상세로 채워서, 실제 점수 옆에 가짜 피드백이 붙어 나갔다.)
   */
  hasDetail: boolean;
  feedbacks: PhaseFeedback[];
  insight: InsightData;
}
