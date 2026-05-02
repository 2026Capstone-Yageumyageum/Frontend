/**
 * [FeedScreen.tsx]
 * 피드 탭 메인 화면
 *
 * 구조:
 * ┌──────────────────────────────┐
 * │ [SegmentedToggle: 프로/일관성] │ ← 고정
 * ├──────────────────────────────┤
 * │ [FilterChipList: 구종 필터]   │ ← 고정
 * ├──────────────────────────────┤
 * │ "나의 투구 기록 N" / "구종별 일관성 기록 N"  │
 * │ [ProMatchingCard] × N        │ ← 스크롤
 * │    또는                       │
 * │ [ConsistencyCard] × N        │
 * └──────────────────────────────┘
 *
 * 설계 포인트:
 * - FlatList를 사용해 길어지는 카드 목록을 효율적으로 렌더링합니다.
 * - ListHeaderComponent로 필터/제목 영역을 고정하면
 *   카드 목록과 함께 스크롤되는 자연스러운 UX를 제공합니다.
 */

import React from 'react';
import { View, Text, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SegmentedToggle from '../components/SegmentedToggle';
import FilterChipList from '../components/FilterChipList';
import ProMatchingCard from '../components/ProMatchingCard';
import ConsistencyCard from '../components/ConsistencyCard';
import { useFeedFilter } from '../hooks/useFeedFilter';
import { ProFeedItem, ConsistencyFeedItem } from '../types/feed.types';

// ─── 탭 레이블 상수 ──────────────────────────────────────────────────────────
const TAB_LABELS = { pro: '프로 선수', consistency: '일관성' };
const TABS = [TAB_LABELS.pro, TAB_LABELS.consistency];

export default function FeedScreen() {
  const {
    activeTab,
    setActiveTab,
    selectedFilter,
    setSelectedFilter,
    currentFilters,
    filteredProFeeds,
    filteredConsistencyFeeds,
  } = useFeedFilter();

  // 현재 탭에 맞는 피드 데이터와 제목 텍스트
  const isProTab = activeTab === 'pro';
  const feedData = isProTab ? filteredProFeeds : filteredConsistencyFeeds;
  const sectionTitle = isProTab
    ? `나의 투구 기록 ${filteredProFeeds.length}`
    : `구종별 일관성 기록 ${filteredConsistencyFeeds.length}`;

  // ── 리스트 헤더: 필터 + 섹션 제목 ──────────────────────────────────────────
  // FlatList의 ListHeaderComponent로 사용해 카드와 함께 스크롤됩니다.
  const ListHeader = (
    <View>
      {/* 구종 필터 칩 목록 */}
      <FilterChipList
        filters={currentFilters}
        selectedFilter={selectedFilter}
        onSelect={setSelectedFilter}
      />

      {/* 섹션 제목 (예: "나의 투구 기록 11") */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-text-primary text-lg font-bold">
          {sectionTitle}
        </Text>
      </View>
    </View>
  );

  // ── 빈 상태 컴포넌트 ─────────────────────────────────────────────────────
  const EmptyState = (
    <View className="flex-1 items-center justify-center py-16">
      <Text className="text-text-secondary text-sm">
        해당 구종의 기록이 없습니다.
      </Text>
    </View>
  );

  // ── 프로 선수 탭 렌더러 ───────────────────────────────────────────────────
  const renderProItem: ListRenderItem<ProFeedItem> = ({ item }) => (
    <ProMatchingCard
      item={item}
      onPress={(selected) => {
        // TODO: 상세 화면 네비게이션 연결
        console.log('선택된 피드:', selected.id);
      }}
    />
  );

  // ── 일관성 탭 렌더러 ──────────────────────────────────────────────────────
  const renderConsistencyItem: ListRenderItem<ConsistencyFeedItem> = ({ item }) => (
    <ConsistencyCard
      item={item}
      onPress={(selected) => {
        // TODO: 상세 화면 네비게이션 연결
        console.log('선택된 일관성 기록:', selected.id);
      }}
    />
  );

  return (
    // SafeAreaView: 노치/홈 인디케이터 영역 자동 처리
    <SafeAreaView className="flex-1 bg-surface-page">
      {/* ── 상단 탭 토글 (스크롤에 고정) ── */}
      <View className="bg-surface border-b border-border">
        <SegmentedToggle
          tabs={TABS}
          activeTab={isProTab ? TAB_LABELS.pro : TAB_LABELS.consistency}
          onChange={(tab) =>
            setActiveTab(tab === TAB_LABELS.pro ? 'pro' : 'consistency')
          }
        />
      </View>

      {/* ── 카드 목록 ── */}
      {isProTab ? (
        <FlatList
          data={filteredProFeeds}
          keyExtractor={(item) => item.id}
          renderItem={renderProItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredConsistencyFeeds}
          keyExtractor={(item) => item.id}
          renderItem={renderConsistencyItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
