/**
 * [feed.types.ts]
 * 피드(Feed) 도메인에서 사용하는 모든 타입을 정의합니다.
 *
 * 왜 분리했나요?
 * - 컴포넌트, Hook, API 레이어 모두에서 동일한 타입을 참조해야 하므로
 *   별도 파일로 분리하여 중앙 관리합니다.
 */

// ─── 구종 타입 ─────────────────────────────────────────────────────────────
// 앱에서 지원하는 구종 목록 (확장 시 여기에만 추가하면 됨)
export type PitchType = '전체' | '직구' | '슬라이더' | '커브' | '체인지업';

// ─── 피드 탭 전환 타입 ──────────────────────────────────────────────────────
// 상단 Segmented Toggle의 두 가지 탭 모드
export type FeedTab = 'pro' | 'consistency';

// ─── 프로 선수 피드 아이템 ───────────────────────────────────────────────────
// "나의 투구 기록" (프로 선수 탭)에 표시되는 개별 카드 데이터
export interface ProFeedItem {
  id: string;
  date: string;           // 영상 녹화 날짜 (예: '2025.04.28')
  playerName: string;     // 비교 대상 프로 선수 이름 (예: '류현진')
  pitchType: PitchType;   // 구종
  similarity: number;     // 유사도 0~100 (%)
  duration: string;       // 영상 길이 (예: '00:02:14')
  thumbnailUri?: string;  // 썸네일 이미지 URI (없으면 회색 placeholder)
}

// ─── 일관성 피드 아이템 ──────────────────────────────────────────────────────
// "구종별 일관성 기록" (일관성 탭)에 표시되는 개별 카드 데이터
export interface ConsistencyFeedItem {
  id: string;
  date: string;               // 세션 날짜
  title: string;              // 세션 제목 (예: '직구 세션 #1')
  pitchType: PitchType;       // 구종
  bestConsistency: number;    // 최고 일관성 점수 (%)
  sessionCount: number;       // 총 세션 횟수
  avgConsistency: number;     // 평균 일관성 점수 (%)
  duration: string;           // 영상 길이
  isBest?: boolean;           // "베스트" 뱃지 표시 여부
  thumbnailUri?: string;
}
