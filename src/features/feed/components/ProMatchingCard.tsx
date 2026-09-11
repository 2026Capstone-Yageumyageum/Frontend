/**
 * [ProMatchingCard.tsx]
 * "나의 투구 기록" (프로 선수 탭)에서 표시되는 개별 피드 카드
 *
 * 구성:
 * ┌────────────────────────────────────────┐
 * │ [직구]  2025.04.28                  ›  │
 * │                                        │
 * │ 류현진                     유사도  87% │
 * │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░                 │
 * └────────────────────────────────────────┘
 *
 * 왜 썸네일이 없나요?
 * 서버는 영상도 썸네일도 저장하지 않아 thumbnailUri가 항상 비어 있었고,
 * 그 자리에는 200px 회색 사각형만 그려졌습니다. 카드 높이의 절반을 쓰면서
 * 아무것도 알려주지 않는 자리라 없앴습니다. 일관성 탭 카드와 같은 결정입니다.
 *
 * 그 대신 유사도 진행바가 카드의 시각적 무게를 맡습니다.
 * 목록을 훑을 때 숫자를 읽지 않아도 편차가 눈에 들어옵니다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import PitchTypeBadge from './PitchTypeBadge';
import { ProFeedItem } from '../types/feed.types';

/** 유사도를 "양호"로 볼 기준. 리포트 화면의 판정선과 맞춘다. */
const GOOD_SIMILARITY = 70;

const GOOD_COLOR = '#3BC1A8';
const WARN_COLOR = '#DCA876';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface ProMatchingCardProps {
  /** 카드에 표시할 피드 데이터 */
  item: ProFeedItem;
  /** 카드 클릭 시 상세 화면으로 이동하는 콜백 */
  onPress?: (item: ProFeedItem) => void;
}

export default function ProMatchingCard({ item, onPress }: ProMatchingCardProps) {
  const scoreColor = item.similarity >= GOOD_SIMILARITY ? GOOD_COLOR : WARN_COLOR;
  // 0~100 밖의 값이 들어와도 바가 카드를 넘지 않게 가둔다.
  const barWidth = Math.min(Math.max(item.similarity, 0), 100);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.date} ${item.pitchType}, ${item.playerName}와 유사도 ${item.similarity}퍼센트. 분석 리포트 열기`}
      // rounded-card로 큰 모서리 곡률, 그림자로 카드 깊이감 표현
      className="bg-surface rounded-card mb-4 px-4 py-4"
      style={{
        // NativeWind v2가 shadow-* 클래스를 완전 지원하지 않아 inline으로 처리
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3, // Android용 그림자
      }}
    >
      {/* ── 상단: 구종 뱃지 + 날짜 + 진입 표시 ── */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <PitchTypeBadge type={item.pitchType} variant="outline" />
          <AppText className="text-text-secondary text-xs ml-2">{item.date}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#8E949A" />
      </View>

      {/* ── 중단: 비교 선수 + 유사도 ── */}
      <View className="flex-row items-end justify-between mb-2.5">
        <AppText weight="bold" className="text-text-primary text-lg">
          {item.playerName}
        </AppText>

        <View className="flex-row items-baseline">
          <AppText className="text-text-secondary text-xs mr-1.5">유사도</AppText>
          <AppText weight="bold" className="text-2xl" style={{ color: scoreColor }}>
            {item.similarity}
          </AppText>
          <AppText weight="bold" className="text-sm ml-0.5" style={{ color: scoreColor }}>
            %
          </AppText>
        </View>
      </View>

      {/* ── 하단: 유사도 진행바 ── */}
      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${barWidth}%`, backgroundColor: scoreColor }}
        />
      </View>
    </TouchableOpacity>
  );
}
