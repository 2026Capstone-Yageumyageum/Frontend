/**
 * [FeedScreen.tsx]
 * 피드 탭 — 프로 비교 탭은 내 분석 목록(실데이터), 일관성 탭은 구종별 "최고의 1구" 카드.
 *
 * 일관성 탭:
 *  - 구종별 최고의 1구 카드(최대 4개)를 보여준다.
 *  - 카드를 터치하면 그 자리에서 펼쳐져, 그 최고의 1구와 비교된 내 기록 목록이 나온다.
 *  - 기록을 터치하면 리포트(내 폼 vs 최고의 1구 폼)로 진입한다.
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, FlatList, ListRenderItem, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';
import SegmentedToggle from '../components/SegmentedToggle';
import FilterChipList from '../components/FilterChipList';
import ProMatchingCard from '../components/ProMatchingCard';
import ConsistencyCard from '../components/ConsistencyCard';
import ComparisonRecordCard from '../components/ComparisonRecordCard';
import AppText from '../../../components/common/AppText';
import { useFeedFilter } from '../hooks/useFeedFilter';
import { ProFeedItem, ConsistencyFeedItem, PitchType } from '../types/feed.types';
import {
  getMyAnalyses,
  getBestPitches,
  getBestPitchComparisons,
  BestPitchCard,
  BestPitchComparisonItem,
} from '../../../api/userApi';
import { getErrorMessage } from '../../../api/apiError';

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
    isBest: true,
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
  // 예외 객체를 그대로 보관하고, 화면에 뿌릴 때 getErrorMessage로 사용자용 문구만 꺼낸다.
  const [error, setError] = useState<unknown>(null);

  // ── 일관성 탭 상태 ──
  const [bestCards, setBestCards] = useState<BestPitchCard[]>([]);
  const [bestLoading, setBestLoading] = useState(true);
  const [bestError, setBestError] = useState<unknown>(null);
  // 현재 펼쳐진 카드의 구종(한 번에 하나만 펼침). null이면 모두 접힘.
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);
  // 구종별 비교 기록 캐시 + 로딩 상태
  const [comparisons, setComparisons] = useState<Record<string, BestPitchComparisonItem[]>>({});
  const [comparisonLoading, setComparisonLoading] = useState<Record<string, boolean>>({});

  /**
   * 목록 두 개(프로 비교 / 최고의 1구)를 불러온다.
   * 화면 포커스와 '다시 시도' 버튼이 같은 함수를 쓰므로, 재조회 경로가 하나로 유지된다.
   *
   * requestIdRef: 응답이 도착했을 때 이미 더 최신 요청이 시작됐다면 그 결과는 버린다.
   * (탭을 빠르게 오가거나 재시도를 연타할 때 오래된 응답이 새 데이터를 덮는 것을 막는다.)
   */
  const requestIdRef = useRef(0);

  const loadFeed = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    setLoading(true);
    setError(null);
    getMyAnalyses()
      .then((items) => {
        if (isStale()) return;
        setProItems(
          items.map((it) => ({
            id: String(it.videoId),
            date: it.date,
            playerName: it.playerName,
            pitchType: it.pitchType as PitchType,
            similarity: it.similarity,
          })),
        );
      })
      .catch((e) => {
        if (!isStale()) setError(e);
      })
      .finally(() => {
        if (!isStale()) setLoading(false);
      });

    setBestLoading(true);
    setBestError(null);
    getBestPitches()
      .then((cards) => {
        if (!isStale()) setBestCards(cards);
      })
      .catch((e) => {
        if (!isStale()) setBestError(e);
      })
      .finally(() => {
        if (!isStale()) setBestLoading(false);
      });
  }, []);

  // 화면 포커스 시 프로 목록 + 최고의 1구 목록 갱신
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
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
        <AppText weight="semibold" className="text-text-primary text-xl">
          나의 투구 기록 {filteredPro.length}
        </AppText>
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
        <AppText weight="semibold" className="text-text-primary text-xl">
          구종별 최고의 1구 {filteredBest.length}
        </AppText>
        <AppText className="text-text-secondary text-xs mt-1">
          카드를 누르면 최고의 1구와 비교한 기록을 볼 수 있어요.
        </AppText>
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

  /**
   * 목록이 비었을 때 보여줄 영역.
   *
   * "조회 실패"와 "기록이 없음"은 사용자가 해야 할 일이 다르므로 분리한다.
   * 실패했을 때는 백엔드가 내려준 message를 그대로 쓰고, 다시 시도할 길을 준다.
   */
  const renderEmpty = (failure: unknown, emptyMessage: string) => (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Ionicons
        name={failure ? 'cloud-offline-outline' : 'baseball-outline'}
        size={36}
        color="#C4C9CF"
      />
      <AppText className="text-text-secondary text-sm text-center mt-4">
        {failure ? getErrorMessage(failure) : emptyMessage}
      </AppText>
      {failure ? (
        <TouchableOpacity
          onPress={loadFeed}
          activeOpacity={0.8}
          className="mt-5 px-6 py-2.5 rounded-full bg-brand"
        >
          <AppText weight="bold" className="text-white text-sm">
            다시 시도
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const ProEmpty = renderEmpty(
    error,
    '아직 분석 기록이 없어요.\n카메라 탭에서 투구를 촬영해보세요.',
  );

  const BestEmpty = renderEmpty(
    bestError,
    '등록된 최고의 1구가 없어요.\n투구를 분석한 뒤 "최고의 1구"로 등록해보세요.',
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

  // 일관성 카드 + (펼쳐졌으면) 비교 기록 카드 목록
  const renderBestItem: ListRenderItem<BestPitchCard> = ({ item }) => {
    const expanded = expandedPitch === item.pitchType;
    const records = comparisons[item.pitchType] ?? [];
    const recordsLoading = comparisonLoading[item.pitchType];
    return (
      <View>
        <ConsistencyCard
          item={toConsistencyItem(item)}
          expanded={expanded}
          onPress={() => toggleExpand(item.pitchType)}
        />
        {expanded && (
          <View className="-mt-2 mb-4 px-1">
            <AppText weight="medium" className="text-text-secondary text-xs mb-2.5 px-1">
              최고의 1구와 비교한 기록 {records.length > 0 ? records.length : ''}
            </AppText>
            {recordsLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3BC1A8" />
              </View>
            ) : records.length === 0 ? (
              <View className="py-4">
                <AppText className="text-text-secondary text-xs text-center">
                  아직 이 최고의 1구와 비교한 기록이 없어요.
                </AppText>
                <AppText className="text-text-secondary text-xs text-center mt-1">
                  카메라 &quot;내 베스트 투구&quot; 모드에서 비교해보세요.
                </AppText>
              </View>
            ) : (
              records.map((record, index) => (
                <ComparisonRecordCard
                  key={record.videoId}
                  date={record.date}
                  pitchType={record.pitchType as PitchType}
                  consistency={record.consistency}
                  // 목록은 최신순이므로 "직전 기록"은 한 칸 뒤(더 오래된 것)에 있다.
                  // 가장 오래된 기록에는 비교 대상이 없어 증감을 표시하지 않는다.
                  delta={
                    index + 1 < records.length
                      ? record.consistency - records[index + 1].consistency
                      : undefined
                  }
                  onPress={() => {
                    // @ts-ignore - Report 화면은 RootStack에 정의됨.
                    navigation.navigate('Report', {
                      videoId: record.videoId,
                      reportType: 'me',
                      bestPitchVideoId: record.bestPitchVideoId,
                    });
                  }}
                />
              ))
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
