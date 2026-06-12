/**
 * [FeedScreen.tsx]
 * 피드 탭 — 프로 비교 탭은 내 분석 목록(실데이터), 일관성 탭은 준비중 안내.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';
import SegmentedToggle from '../components/SegmentedToggle';
import FilterChipList from '../components/FilterChipList';
import ProMatchingCard from '../components/ProMatchingCard';
import { useFeedFilter } from '../hooks/useFeedFilter';
import { ProFeedItem, PitchType } from '../types/feed.types';
import { getMyAnalyses } from '../../../api/userApi';

const TAB_LABELS = { pro: '프로 선수', consistency: '일관성' };
const TABS = [TAB_LABELS.pro, TAB_LABELS.consistency];

export default function FeedScreen() {
  useDoubleBackExit();

  // 탭/필터 상태는 기존 훅을 재사용하되, 데이터는 실서버에서 받아 직접 필터링한다.
  const { activeTab, setActiveTab, selectedFilter, setSelectedFilter, currentFilters } =
    useFeedFilter();
  const navigation = useNavigation();

  const [proItems, setProItems] = useState<ProFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 화면 포커스 시 내 분석 목록 갱신
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      getMyAnalyses()
        .then((items) => {
          if (!active) return;
          setProItems(
            items.map((it) => ({
              id: String(it.videoId),
              date: it.date,
              playerName: it.playerName,
              pitchType: it.pitchType as PitchType,
              similarity: it.similarity,
              duration: '',
              thumbnailUri: undefined,
            })),
          );
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const isProTab = activeTab === 'pro';
  const filteredPro =
    selectedFilter === '전체'
      ? proItems
      : proItems.filter((item) => item.pitchType === selectedFilter);

  const ListHeader = (
    <View>
      <View className="px-2 pt-5 pb-2">
        <Text className="text-text-primary text-xl font-semibold">
          나의 투구 기록 {filteredPro.length}
        </Text>
      </View>
      <View style={{ marginHorizontal: -20, marginBottom: 12 }}>
        <FilterChipList
          filters={currentFilters}
          selectedFilter={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>
    </View>
  );

  const EmptyState = (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-text-secondary text-sm text-center">
        {error ?? '아직 분석 기록이 없어요.\n카메라 탭에서 투구를 촬영해보세요.'}
      </Text>
    </View>
  );

  const renderProItem: ListRenderItem<ProFeedItem> = ({ item }) => (
    <ProMatchingCard
      item={item}
      onPress={() => {
        // @ts-ignore - Report 화면은 RootStack에 정의됨. videoId만 넘기면 ReportScreen이 결과를 조회한다.
        navigation.navigate('Report', { videoId: Number(item.id) });
      }}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top', 'left', 'right']}>
      <View className="bg-surface border-b border-border">
        <SegmentedToggle
          tabs={TABS}
          activeTab={isProTab ? TAB_LABELS.pro : TAB_LABELS.consistency}
          onChange={(tab) => setActiveTab(tab === TAB_LABELS.pro ? 'pro' : 'consistency')}
        />
      </View>

      {!isProTab ? (
        // 일관성(내 투구끼리 비교) 기능은 아직 미지원
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-sm text-center">
            구종별 일관성 분석은 준비 중이에요.
          </Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3BC1A8" />
        </View>
      ) : (
        <FlatList
          data={filteredPro}
          keyExtractor={(item) => item.id}
          renderItem={renderProItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
