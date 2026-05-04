/**
 * [my.types.ts]
 * 마이(대시보드) 도메인에서 사용하는 모든 타입을 정의합니다.
 *
 * 왜 분리했나요?
 * - 컴포넌트, Hook, API 레이어 모두가 동일한 타입을 참조해
 *   중앙에서 관리하면 유지보수가 쉬워집니다.
 */

// ─── 성장 추이 탭 모드 ────────────────────────────────────────────────────────
// "성장 추이" 카드 내 Segmented Toggle의 두 가지 모드
export type GrowthTab = 'pro' | 'consistency';

// ─── 구종 타입 (Feed와 동일, 필요 시 공통 파일로 이동 가능) ──────────────────
export type PitchType = '직구' | '슬라이더' | '커브' | '체인지업';

// ─── 유저 정보 ────────────────────────────────────────────────────────────────
export interface UserProfile {
  nickname: string;           // 예: '박지성'
  totalSessions: number;      // 총 세션 수
  bestScore: number;          // 최고 점수 (%)
  thisMonthSessions: number;  // 이번 달 세션 수
  recentAnalysisCount: number; // 최근 한 달 분석 횟수
}

// ─── 구종 분포 아이템 ─────────────────────────────────────────────────────────
// 도넛 차트 + 범례 목록에서 사용
export interface PitchDistributionItem {
  type: PitchType;     // 구종 이름
  percentage: number;  // 비율 0~100
  color: string;       // 차트 색상 (예: '#3BC1A8')
}

// ─── 꺾은선 그래프 데이터 포인트 ──────────────────────────────────────────────
// react-native-gifted-charts의 LineChart가 요구하는 형식
export interface LineChartDataPoint {
  value: number;    // Y축 값 (점수 또는 일관성 %)
  label?: string;   // X축 레이블 (예: '3/20', '4/1')
  dataPointText?: string; // 데이터 포인트 위 텍스트 (선택)
}

// ─── 프로 선수 옵션 (드롭다운용) ──────────────────────────────────────────────
export interface ProPlayerOption {
  id: string;
  name: string;    // 예: '류현진'
  initial: string; // 프로필 원 내 첫 글자 (예: 'P')
}

// ─── 성장 추이 데이터 ─────────────────────────────────────────────────────────
// 프로 비교 + 일관성 각각의 꺾은선 데이터
export interface GrowthData {
  pro: {
    selectedPlayer: ProPlayerOption;
    chartData: LineChartDataPoint[];
  };
  consistency: {
    chartData: LineChartDataPoint[];
  };
}
