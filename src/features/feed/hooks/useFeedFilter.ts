/**
 * [useFeedFilter.ts]
 * 피드 화면의 탭 전환 + 구종 필터 상태를 관리하는 커스텀 훅
 *
 * 왜 Hook으로 분리했나요?
 * - 화면 컴포넌트(FeedScreen)에 로직이 섞이면 가독성이 떨어집니다.
 * - 테스트가 용이하고, 로직을 다른 화면에서 재사용할 수 있습니다.
 */

import { useState, useMemo } from 'react';
import { FeedTab, PitchType, ProFeedItem, ConsistencyFeedItem } from '../types/feed.types';
import { MOCK_PRO_FEEDS, MOCK_CONSISTENCY_FEEDS } from '../data/feed.mockdata';

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
  filteredProFeeds: ProFeedItem[];
  filteredConsistencyFeeds: ConsistencyFeedItem[];
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

  // 프로 피드: 선택된 구종으로 필터링 (useMemo로 불필요한 재계산 방지)
  const filteredProFeeds = useMemo(() => {
    if (selectedFilter === '전체') return MOCK_PRO_FEEDS;
    return MOCK_PRO_FEEDS.filter((item) => item.pitchType === selectedFilter);
  }, [selectedFilter]);

  // 일관성 피드: 선택된 구종으로 필터링
  const filteredConsistencyFeeds = useMemo(() => {
    if (selectedFilter === '전체') return MOCK_CONSISTENCY_FEEDS;
    return MOCK_CONSISTENCY_FEEDS.filter(
      (item) => item.pitchType === selectedFilter,
    );
  }, [selectedFilter]);

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    selectedFilter,
    setSelectedFilter,
    currentFilters,
    filteredProFeeds,
    filteredConsistencyFeeds,
  };
}
