/**
 * [FeedScreen.tsx]
 * 피드 탭 — 프로 비교 탭은 내 분석 목록(실데이터), 일관성 탭은 구종별 "최고의 1구" 카드.
 *
 * 일관성 탭:
 *  - 구종별 최고의 1구 카드(최대 4개)를 보여준다.
 *  - 카드를 터치하면 그 자리에서 펼쳐져, 그 최고의 1구와 비교된 내 기록 목록이 나온다.
 *  - 기록을 터치하면 리포트(내 폼 vs 최고의 1구 폼)로 진입한다.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';
import SegmentedToggle from '../components/SegmentedToggle';
import FilterChipList from '../components/FilterChipList';
import ProMatchingCard from '../components/ProMatchingCard';
import ConsistencyCard from '../components/ConsistencyCard';
import { useFeedFilter } from '../hooks/useFeedFilter';
import { ProFeedItem, ConsistencyFeedItem, PitchType } from '../types/feed.types';
import {
  getMyAnalyses,
  getBestPitches,
  getBestPitchComparisons,
  BestPitchCard,
  BestPitchComparisonItem,
} from '../../../api/userApi';

const TAB_LABELS = { pro: '프로 선수', consistency: '일관성' };
const TABS = [TAB_LABELS.pro, TAB_LABELS.consistency];

/** BestPitchCard(서버) → ConsistencyCard가 쓰는 형태로 변환 */
function toConsistencyItem(card: BestPitchCard): ConsistencyFeedItem {
  return {
    id: String(card.videoId),
    date: card.date,
    title: `${card.pitchType} 최고의 1구`,
    pitchType: card.pitchType as PitchType,
    bestConsistency: card.bestConsistency,
    sessionCount: card.sessionCount,
    avgConsistency: card.avgConsistency,
    duration: '',
    isBest: true,
    thumbnailUri: undefined,
  };
}

export default function FeedScreen() {
  useDoubleBackExit();

  const { activeTab, setActiveTab, selectedFilter, setSelectedFilter, currentFilters } =
    useFeedFilter();
  const navigation = useNavigation();

  // ── 프로 탭 상태 ──
  const [proItems, setProItems] = useState<ProFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── 일관성 탭 상태 ──
  const [bestCards, setBestCards] = useState<BestPitchCard[]>([]);
  const [bestLoading, setBestLoading] = useState(true);
  const [bestError, setBestError] = useState<string | null>(null);
  // 현재 펼쳐진 카드의 구종(한 번에 하나만 펼침). null이면 모두 접힘.
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);
  // 구종별 비교 기록 캐시 + 로딩 상태
  const [comparisons, setComparisons] = useState<Record<string, BestPitchComparisonItem[]>>({});
  const [comparisonLoading, setComparisonLoading] = useState<Record<string, boolean>>({});

  // 화면 포커스 시 프로 목록 + 최고의 1구 목록 갱신
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

      setBestLoading(true);
      setBestError(null);
      getBestPitches()
        .then((cards) => {
          if (active) setBestCards(cards);
        })
        .catch((e) => {
          if (active) setBestError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
        })
        .finally(() => {
          if (active) setBestLoading(false);
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

  const filteredBest =
    selectedFilter === '전체'
      ? bestCards
      : bestCards.filter((c) => c.pitchType === selectedFilter);

  // 카드 펼치기/접기. 펼칠 때 해당 구종 비교 기록을 (캐시에 없으면) 불러온다.
  const toggleExpand = useCallback(
    (pitchType: string) => {
      setExpandedPitch((prev) => (prev === pitchType ? null : pitchType));
      if (comparisons[pitchType] || comparisonLoading[pitchType]) return;
      setComparisonLoading((m) => ({ ...m, [pitchType]: true }));
      getBestPitchComparisons(pitchType)
        .then((items) => setComparisons((m) => ({ ...m, [pitchType]: items })))
        .catch(() => setComparisons((m) => ({ ...m, [pitchType]: [] })))
        .finally(() => setComparisonLoading((m) => ({ ...m, [pitchType]: false })));
    },
    [comparisons, comparisonLoading],
  );

  const ProListHeader = (
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

  const BestListHeader = (
    <View>
      <View className="px-2 pt-5 pb-2">
        <Text className="text-text-primary text-xl font-semibold">
          구종별 최고의 1구 {filteredBest.length}
        </Text>
        <Text className="text-text-secondary text-xs mt-1">
          카드를 누르면 최고의 1구와 비교한 기록을 볼 수 있어요.
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

  const ProEmpty = (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-text-secondary text-sm text-center">
        {error ?? '아직 분석 기록이 없어요.\n카메라 탭에서 투구를 촬영해보세요.'}
      </Text>
    </View>
  );

  const BestEmpty = (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-text-secondary text-sm text-center">
        {bestError ??
          '등록된 최고의 1구가 없어요.\n투구를 분석한 뒤 "최고의 1구"로 등록해보세요.'}
      </Text>
    </View>
  );

  const renderProItem: ListRenderItem<ProFeedItem> = ({ item }) => (
    <ProMatchingCard
      item={item}
      onPress={() => {
        // @ts-ignore - Report 화면은 RootStack에 정의됨.
        navigation.navigate('Report', { videoId: Number(item.id) });
      }}
    />
  );

  // 일관성 카드 + (펼쳐졌으면) 비교 기록 목록
  const renderBestItem: ListRenderItem<BestPitchCard> = ({ item }) => {
    const expanded = expandedPitch === item.pitchType;
    const rows = comparisons[item.pitchType] ?? [];
    const rowsLoading = comparisonLoading[item.pitchType];
    return (
      <View>
        <ConsistencyCard item={toConsistencyItem(item)} onPress={() => toggleExpand(item.pitchType)} />
        {expanded && (
          <View className="bg-surface rounded-card -mt-2 mb-4 px-4 pt-3 pb-2 border-t border-border">
            <Text className="text-text-secondary text-xs mb-2">
              최고의 1구와 비교한 기록
            </Text>
            {rowsLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3BC1A8" />
              </View>
            ) : rows.length === 0 ? (
              <Text className="text-text-secondary text-xs py-4 text-center">
                아직 이 최고의 1구와 비교한 기록이 없어요.{'\n'}
                카메라 "내 베스트 투구" 모드에서 비교해보세요.
              </Text>
            ) : (
              rows.map((row) => {
                const good = row.consistency >= 70;
                return (
                  <TouchableOpacity
                    key={row.videoId}
                    activeOpacity={0.7}
                    onPress={() => {
                      // @ts-ignore - Report 화면은 RootStack에 정의됨.
                      navigation.navigate('Report', {
                        videoId: row.videoId,
                        reportType: 'me',
                        bestPitchVideoId: row.bestPitchVideoId,
                      });
                    }}
                    className="flex-row items-center justify-between py-3 border-b border-border/50"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="videocam-outline" size={16} color="#8E949A" />
                      <Text className="text-text-primary text-sm ml-2">{row.date}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text
                        className="text-base font-bold mr-1"
                        style={{ color: good ? '#3BC1A8' : '#DCA876' }}
                      >
                        {row.consistency}%
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#8E949A" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top', 'left', 'right']}>
      <View className="bg-surface border-b border-border">
        <SegmentedToggle
          tabs={TABS}
          activeTab={isProTab ? TAB_LABELS.pro : TAB_LABELS.consistency}
          onChange={(tab) => setActiveTab(tab === TAB_LABELS.pro ? 'pro' : 'consistency')}
        />
      </View>

      {isProTab ? (
        loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3BC1A8" />
          </View>
        ) : (
          <FlatList
            data={filteredPro}
            keyExtractor={(item) => item.id}
            renderItem={renderProItem}
            ListHeaderComponent={ProListHeader}
            ListEmptyComponent={ProEmpty}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : bestLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3BC1A8" />
        </View>
      ) : (
        <FlatList
          data={filteredBest}
          keyExtractor={(item) => String(item.videoId)}
          renderItem={renderBestItem}
          ListHeaderComponent={BestListHeader}
          ListEmptyComponent={BestEmpty}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          extraData={{ expandedPitch, comparisons, comparisonLoading }}
        />
      )}
    </SafeAreaView>
  );
}
