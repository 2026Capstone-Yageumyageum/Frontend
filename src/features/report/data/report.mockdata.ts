import { ReportData, ComparePlayer } from '../types/report.types';

export const MOCK_COMPARE_PLAYERS: ComparePlayer[] = [
  { id: 'p1', name: '원종현', initial: '원', similarity: 71.3 },
  { id: 'p2', name: '류현진', initial: '류', similarity: 55.2 },
  { id: 'p3', name: '김광현', initial: '김', similarity: 52.6 },
];

export const MOCK_REPORT_DATA: ReportData = {
  id: 'report-1',
  date: '2026.04.27',
  pitchType: '직구',
  isBestPitch: true,
  overallSimilarity: 71.3,
  comparePlayer: MOCK_COMPARE_PLAYERS[0],
  feedbacks: [
    {
      phaseName: '와인드업',
      score: 76.9,
      status: '양호',
      goodPoint: '와인드업 구간은 선수와 유사한 편입니다.',
      feedback: '와인드업 구간은 비교적 안정적이나 세부 동작 정밀도를 높이면 더욱 향상됩니다.',
      improvement: '뒷발에 체중을 실어 균형을 잡고, 글러브 무릎을 허리 높이까지 들어올리세요.'
    },
    {
      phaseName: '레그 리프트',
      score: 61.6,
      status: '미흡',
      goodPoint: '레그 리프트 구간의 전체 자세 흐름은 비교적 안정적입니다.',
      feedback: '레그 리프트 구간은 비교적 안정적이나 세부 동작 정밀도를 높이면 더욱 향상됩니다.',
      improvement: '앞무릎을 허리 높이 이상으로 들어올려 하체 에너지를 최대한 축적하세요.'
    }
  ],
  insight: {
    phaseScores: [
      { phaseName: '와인드업', score: 76.9 },
      { phaseName: '레그 리프트', score: 75.7 },
      { phaseName: '스트라이드', score: 68.5 },
      { phaseName: '가속', score: 67.7 },
      { phaseName: '팔로스루', score: 73.8 },
    ],
    releaseTiming: {
      myTiming: 87.2,
      proTiming: 96.6,
      diff: -9.4,
      feedback: '릴리즈 타이밍이 선수보다 빠릅니다.'
    },
    releasePoint: {
      totalDiff: 0.320,
      heightDiff: -0.142,
      widthDiff: 0.286,
      feedback: '릴리즈 포인트 차이가 크게 나타납니다.'
    }
  }
};
