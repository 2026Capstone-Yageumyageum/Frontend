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
  feedbacks: PhaseFeedback[];
  insight: InsightData;
}
