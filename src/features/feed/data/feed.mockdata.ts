/**
 * [feed.mockdata.ts]
 * 피드 화면 개발 및 UI 테스트용 더미 데이터입니다.
 *
 * 왜 필요한가요?
 * - API 연동 전에 UI 렌더링을 바로 테스트할 수 있습니다.
 * - 실제 API 연동 시 이 파일만 제거하고 API 응답 타입을 동일하게 맞추면 됩니다.
 */

import { ProFeedItem, ConsistencyFeedItem } from '../types/feed.types';

// ─── 프로 선수 탭 Mock Data ─────────────────────────────────────────────────
export const MOCK_PRO_FEEDS: ProFeedItem[] = [
  {
    id: 'pro-1',
    date: '2025.04.28',
    playerName: '류현진',
    pitchType: '직구',
    similarity: 87,
    duration: '00:02:14',
    thumbnailUri: undefined, // 실제 영상 URI로 교체
  },
  {
    id: 'pro-2',
    date: '2025.04.25',
    playerName: '오승환',
    pitchType: '슬라이더',
    similarity: 73,
    duration: '00:01:48',
    thumbnailUri: undefined,
  },
  {
    id: 'pro-3',
    date: '2025.04.20',
    playerName: '류현진',
    pitchType: '커브',
    similarity: 65,
    duration: '00:03:02',
    thumbnailUri: undefined,
  },
  {
    id: 'pro-4',
    date: '2025.04.15',
    playerName: '고우석',
    pitchType: '체인지업',
    similarity: 58,
    duration: '00:01:30',
    thumbnailUri: undefined,
  },
];

// ─── 일관성 탭 Mock Data ────────────────────────────────────────────────────
export const MOCK_CONSISTENCY_FEEDS: ConsistencyFeedItem[] = [
  {
    id: 'con-1',
    date: '2025.04.28',
    title: '직구 세션 #1',
    pitchType: '직구',
    bestConsistency: 91,
    sessionCount: 3,
    avgConsistency: 84,
    duration: '00:02:14',
    isBest: true,          // 베스트 카드 (상단에 노출)
    thumbnailUri: undefined,
  },
  {
    id: 'con-2',
    date: '2025.04.25',
    title: '직구 세션 #2',
    pitchType: '직구',
    bestConsistency: 78,
    sessionCount: 2,
    avgConsistency: 72,
    duration: '00:02:30',
    isBest: false,
    thumbnailUri: undefined,
  },
  {
    id: 'con-3',
    date: '2025.04.20',
    title: '슬라이더 세션 #1',
    pitchType: '슬라이더',
    bestConsistency: 82,
    sessionCount: 4,
    avgConsistency: 76,
    duration: '00:03:10',
    isBest: false,
    thumbnailUri: undefined,
  },
];
