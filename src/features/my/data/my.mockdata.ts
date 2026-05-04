/**
 * [my.mockdata.ts]
 * 마이(대시보드) 화면 개발 및 UI 테스트용 더미 데이터
 *
 * 실제 API 연동 시 동일한 타입을 맞추고 이 파일만 제거하면 됩니다.
 */

import {
  UserProfile,
  PitchDistributionItem,
  LineChartDataPoint,
  ProPlayerOption,
  GrowthData,
} from '../types/my.types';

// ─── 유저 프로필 ──────────────────────────────────────────────────────────────
export const MOCK_USER_PROFILE: UserProfile = {
  nickname: '박지성',
  totalSessions: 24,
  bestScore: 91,
  thisMonthSessions: 8,
  recentAnalysisCount: 8,
};

// ─── 구종 분포 ────────────────────────────────────────────────────────────────
// 도넛 차트 색상은 브랜드 컬러 팔레트에서 선택
export const MOCK_PITCH_DISTRIBUTION: PitchDistributionItem[] = [
  { type: '직구', percentage: 42, color: '#3BC1A8' },    // 브랜드 메인
  { type: '슬라이더', percentage: 26, color: '#6ED8C8' }, // 브랜드 라이트
  { type: '커브', percentage: 20, color: '#A8EAE0' },    // 브랜드 페일
  { type: '체인지업', percentage: 12, color: '#D4F5EF' }, // 브랜드 최연
];

// ─── 프로 선수 목록 (드롭다운) ───────────────────────────────────────────────
export const MOCK_PRO_PLAYERS: ProPlayerOption[] = [
  { id: 'ryu', name: '류현진', initial: 'P' },
  { id: 'oh', name: '오승환', initial: 'P' },
  { id: 'ko', name: '고우석', initial: 'P' },
];

// ─── 성장 추이 데이터 (프로 비교 탭) ─────────────────────────────────────────
// X축: 날짜, Y축: 유사도 (%)
const PRO_CHART_DATA: LineChartDataPoint[] = [
  { value: 69, label: '3/20' },
  { value: 69, label: '4/1' },
  { value: 72, label: '4/8' },
  { value: 75, label: '4/15' },
  { value: 78, label: '4/22' },
  { value: 91, label: '4/28' },
];

// ─── 성장 추이 데이터 (일관성 탭) ────────────────────────────────────────────
const CONSISTENCY_CHART_DATA: LineChartDataPoint[] = [
  { value: 60, label: '3/20' },
  { value: 65, label: '4/1' },
  { value: 68, label: '4/8' },
  { value: 72, label: '4/15' },
  { value: 80, label: '4/22' },
  { value: 85, label: '4/28' },
];

export const MOCK_GROWTH_DATA: GrowthData = {
  pro: {
    selectedPlayer: MOCK_PRO_PLAYERS[0],
    chartData: PRO_CHART_DATA,
  },
  consistency: {
    chartData: CONSISTENCY_CHART_DATA,
  },
};
