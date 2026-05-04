/**
 * [ConsistencyCard.tsx]
 * "구종별 일관성 기록" (일관성 탭)에서 표시되는 개별 피드 카드
 *
 * 구성:
 * ┌──────────────────────────────────────┐
 * │  🏆 직구 베스트        ▶ 00:02:14    │ (isBest === true일 때)
 * │  [회색 썸네일 영역]                   │
 * │  2025.04.28                          │
 * │  직구   [세션 #1]                    │
 * ├─────────────────┬────────────────────┤
 * │ 최고 일관성      │ 직구 세션           │
 * │ 91%             │ 3회                │
 * │ [progress bar]  │ ★ 평균 84%         │
 * └─────────────────┴────────────────────┘
 *
 * 디자인 포인트:
 * - isBest === true: 좌상단에 "🏆 직구 베스트" 뱃지 노출
 * - 최고 일관성 숫자는 브랜드 컬러로 강조
 * - Progress bar: 최고 일관성 수치를 시각화
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import VideoThumbnail from './VideoThumbnail';
import PitchTypeBadge from './PitchTypeBadge';
import { ConsistencyFeedItem } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface ConsistencyCardProps {
  /** 카드에 표시할 일관성 데이터 */
  item: ConsistencyFeedItem;
  /** 카드 클릭 시 상세 화면 이동 콜백 */
  onPress?: (item: ConsistencyFeedItem) => void;
}

export default function ConsistencyCard({
  item,
  onPress,
}: ConsistencyCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      className="bg-surface rounded-card mb-4 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* ── 베스트 뱃지 (조건부 렌더링) ── */}
      {item.isBest && (
        // 썸네일 위에 겹쳐야 하므로 절대 위치 대신 썸네일 전에 배치하고 z-index 처리
        <View className="absolute top-3 left-3 z-10 flex-row items-center bg-brand/90 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">🏆 {item.pitchType} 베스트</Text>
        </View>
      )}

      {/* 상단: 영상 썸네일 */}
      <VideoThumbnail
        uri={item.thumbnailUri}
        duration={item.duration}
        pitchType={item.pitchType}
        // 베스트 카드는 더 큰 썸네일로 강조
        height={item.isBest ? 220 : 180}
      />

      {/* 중단: 날짜 + 세션 정보 */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-text-secondary text-xs mb-1">{item.date}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-text-primary text-base font-bold mr-2">
            {item.pitchType}
          </Text>
          {/* 세션 번호 뱃지 (outline 스타일) */}
          <View className="border border-gray-300 rounded-full px-2 py-0.5">
            <Text className="text-text-secondary text-xs">
              {item.title.replace(item.pitchType, '').trim()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 구분선 ── */}
      <View className="h-px bg-border mx-4" />

      {/* 하단: 통계 영역 (좌: 일관성, 우: 세션 횟수) */}
      <View className="flex-row px-4 py-3">
        {/* 왼쪽: 최고 일관성 */}
        <View className="flex-1 mr-4">
          <Text className="text-text-secondary text-xs mb-1">최고 일관성</Text>
          {/* 수치: 브랜드 컬러 강조 */}
          <View className="flex-row items-baseline mb-2">
            <Text className="text-brand text-3xl font-bold">
              {item.bestConsistency}
            </Text>
            <Text className="text-brand text-base font-bold ml-0.5">%</Text>
          </View>
          {/* 진행률 바 */}
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand rounded-full"
              style={{ width: `${item.bestConsistency}%` }}
            />
          </View>
        </View>

        {/* 세로 구분선 */}
        <View className="w-px bg-border" />

        {/* 오른쪽: 세션 횟수 + 평균 */}
        <View className="flex-1 ml-4">
          <Text className="text-text-secondary text-xs mb-1">
            {item.pitchType} 세션
          </Text>
          <View className="flex-row items-baseline mb-2">
            <Text className="text-text-primary text-3xl font-bold">
              {item.sessionCount}
            </Text>
            <Text className="text-text-secondary text-sm ml-1">회</Text>
          </View>
          {/* 평균 점수 */}
          <View className="flex-row items-center">
            <Text className="text-yellow-500 text-xs mr-1">★</Text>
            <Text className="text-text-secondary text-xs">
              평균 {item.avgConsistency}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
