/**
 * [ConsistencyCard.tsx]
 * 일관성 탭의 구종별 "최고의 1구" 카드. 누르면 아래로 펼쳐져 비교 기록이 나온다.
 *
 * 구성:
 * ┌────────────────────────────────────────┐
 * │ 🏆 직구 최고의 1구      2025.04.28  ⌄  │
 * ├──────────────────┬─────────────────────┤
 * │ 최고 일관성       │ 직구 세션            │
 * │ 91%              │ 3회                 │
 * │ ▓▓▓▓▓▓▓▓▓░░      │ ★ 평균 84%          │
 * └──────────────────┴─────────────────────┘
 *
 * 왜 썸네일이 없나요?
 * 서버는 영상도 썸네일도 저장하지 않습니다(UserVideo.videoUrl은 파일명 문자열일 뿐).
 * 예전에는 이 자리에 220px 회색 사각형이 들어가 카드 높이의 절반을 차지하면서
 * 아무 정보도 주지 못했습니다. 채울 수 없는 자리는 비워두기보다 없앴습니다.
 *
 * 대신 통계 블록이 카드의 본문이 됩니다. 구종별로 훑어보는 화면이라
 * 카드가 짧아진 만큼 한 화면에 더 많이 들어오는 편이 목적에 맞습니다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { ConsistencyFeedItem } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface ConsistencyCardProps {
  /** 카드에 표시할 일관성 데이터 */
  item: ConsistencyFeedItem;
  /**
   * 현재 펼쳐져 있는지 여부. 화살표 방향으로 상태를 알린다.
   * 예전에는 눌러서 펼쳐진다는 신호가 카드 어디에도 없었다.
   */
  expanded?: boolean;
  /** 카드 클릭 시 펼침/접힘 콜백 */
  onPress?: (item: ConsistencyFeedItem) => void;
}

export default function ConsistencyCard({ item, expanded = false, onPress }: ConsistencyCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${item.pitchType} 최고의 1구. 최고 일관성 ${item.bestConsistency}퍼센트, ${item.sessionCount}회 비교. 눌러서 기록 ${expanded ? '접기' : '펼치기'}`}
      className="bg-surface rounded-card mb-4 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* ── 헤더: 구종 뱃지 + 날짜 + 펼침 화살표 ── */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View className="flex-row items-center bg-brand/10 px-3 py-1.5 rounded-chip">
          <AppText weight="bold" className="text-brand text-sm">
            🏆 {item.pitchType} 최고의 1구
          </AppText>
        </View>

        <View className="flex-row items-center">
          <AppText className="text-text-secondary text-xs mr-1.5">{item.date}</AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8E949A" />
        </View>
      </View>

      {/* ── 구분선 ── */}
      <View className="h-px bg-border mx-4" />

      {/* ── 통계: 좌 최고 일관성 / 우 세션 횟수 ── */}
      <View className="flex-row px-4 py-4">
        {/* 왼쪽: 최고 일관성 */}
        <View className="flex-1 mr-4">
          <AppText className="text-text-secondary text-xs mb-1">최고 일관성</AppText>
          <View className="flex-row items-baseline mb-2">
            <AppText weight="bold" className="text-brand text-3xl">
              {item.bestConsistency}
            </AppText>
            <AppText weight="bold" className="text-brand text-base ml-0.5">
              %
            </AppText>
          </View>
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand rounded-full"
              // 0~100 밖의 값이 들어와도 바가 카드를 넘지 않게 가둔다.
              style={{ width: `${Math.min(Math.max(item.bestConsistency, 0), 100)}%` }}
            />
          </View>
        </View>

        {/* 세로 구분선 */}
        <View className="w-px bg-border" />

        {/* 오른쪽: 비교 횟수 + 평균 */}
        <View className="flex-1 ml-4">
          <AppText className="text-text-secondary text-xs mb-1">{item.pitchType} 세션</AppText>
          <View className="flex-row items-baseline mb-2">
            <AppText weight="bold" className="text-text-primary text-3xl">
              {item.sessionCount}
            </AppText>
            <AppText className="text-text-secondary text-sm ml-1">회</AppText>
          </View>
          <View className="flex-row items-center">
            <AppText className="text-yellow-500 text-xs mr-1">★</AppText>
            <AppText className="text-text-secondary text-xs">평균 {item.avgConsistency}%</AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
