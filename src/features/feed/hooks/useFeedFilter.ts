/**
 * [useFeedFilter.ts]
 * 피드 화면의 탭 전환 + 구종 필터 상태를 관리하는 커스텀 훅
 *
 * 왜 Hook으로 분리했나요?
 * - 화면 컴포넌트(FeedScreen)에 로직이 섞이면 가독성이 떨어집니다.
 * - 테스트가 용이하고, 로직을 다른 화면에서 재사용할 수 있습니다.
 *
 * 이 훅은 "무엇을 보여줄지"(필터 상태)만 관리하고, 목록 데이터는 다루지 않습니다.
 * 실제 목록은 FeedScreen이 서버에서 받아 이 상태로 걸러냅니다.
 */

import { useState } from 'react';
import { FeedTab, PitchType } from '../types/feed.types';

// ─── 상수 ───────────────────────────────────────────────────────────────────
/** 프로 선수 탭의 구종 필터 목록 ('전체' 포함) */
const PRO_FILTERS: PitchType[] = ['전체', '직구', '슬라이더', '커브', '체인지업'];

/** 일관성 탭의 구종 필터 목록 ('전체' 포함) */
const CONSISTENCY_FILTERS: PitchType[] = ['전체', '직구', '슬라이더', '커브', '체인지업'];

// ─── 훅 반환 타입 ────────────────────────────────────────────────────────────
interface UseFeedFilterReturn {
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  selectedFilter: PitchType;
  setSelectedFilter: (filter: PitchType) => void;
  currentFilters: PitchType[];
}

export function useFeedFilter(): UseFeedFilterReturn {
  // 현재 활성 탭 (기본값: 프로 선수 탭)
  const [activeTab, setActiveTab] = useState<FeedTab>('pro');
  // 현재 선택된 구종 필터 (탭 변경 시 '전체'로 초기화)
  const [selectedFilter, setSelectedFilter] = useState<PitchType>('전체');

  // 탭 변경 시 필터를 '전체'로 초기화
  const handleSetActiveTab = (tab: FeedTab) => {
    setActiveTab(tab);
    setSelectedFilter('전체'); // 탭이 바뀌면 필터 리셋
  };

  // 탭에 따른 필터 목록
  const currentFilters = activeTab === 'pro' ? PRO_FILTERS : CONSISTENCY_FILTERS;

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    selectedFilter,
    setSelectedFilter,
    currentFilters,
  };
}
