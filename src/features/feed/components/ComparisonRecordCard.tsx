/**
 * [ComparisonRecordCard.tsx]
 * 일관성 탭에서 최고의 1구 카드를 펼쳤을 때 나오는 "비교 기록" 한 건.
 *
 * 구성:
 * ┌──────────────────────────────────────┐
 * │ 2025.05.02                  ▲ 3%  › │
 * │ [직구]                    일관성 87% │
 * │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░               │
 * └──────────────────────────────────────┘
 *
 * 왜 한 줄짜리 행이 아니라 카드인가요?
 * - 이 목록에서 고르는 행위는 "결과를 흘려본다"가 아니라 "어떤 투구를 최고의 1구와
 *   나란히 놓고 볼지 고른다"입니다. 고를 만한 무게를 가진 형태여야 합니다.
 * - 서버가 주는 정보가 날짜와 일관성 점수뿐이므로, 숫자를 주인공으로 세웁니다.
 *
 * delta(이전 기록 대비 증감)를 왜 보여주나요?
 * - 이 탭의 질문은 "내 폼이 최고의 1구에 가깝게 유지되고 있는가"입니다.
 *   점수 하나만으로는 답이 안 되고, 직전 기록과의 차이가 있어야 흐름이 읽힙니다.
 * - 목록이 최신순으로 오므로 화면 쪽에서 계산할 수 있습니다(백엔드 변경 불필요).
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import PitchTypeBadge from './PitchTypeBadge';
import { PitchType } from '../types/feed.types';

/** 일관성 점수를 "양호"로 볼 기준. 리포트 화면의 판정선과 맞춘다. */
const GOOD_CONSISTENCY = 70;

const GOOD_COLOR = '#3BC1A8';
const WARN_COLOR = '#DCA876';
const DOWN_COLOR = '#D3735D';

interface ComparisonRecordCardProps {
  date: string;
  pitchType: PitchType;
  /** 최고의 1구와의 일관성 0~100 (%) */
  consistency: number;
  /**
   * 직전(더 오래된) 기록 대비 증감. 가장 오래된 기록에는 비교 대상이 없으므로 undefined.
   */
  delta?: number;
  onPress?: () => void;
}

export default function ComparisonRecordCard({
  date,
  pitchType,
  consistency,
  delta,
  onPress,
}: ComparisonRecordCardProps) {
  const scoreColor = consistency >= GOOD_CONSISTENCY ? GOOD_COLOR : WARN_COLOR;
  // 진행바가 카드 밖으로 나가지 않도록 0~100으로 가둔다.
  const barWidth = Math.min(Math.max(consistency, 0), 100);

  const hasDelta = typeof delta === 'number' && delta !== 0;
  const isUp = (delta ?? 0) > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${date} ${pitchType} 기록, 일관성 ${consistency}퍼센트. 최고의 1구와 비교해 보기`}
      className="bg-surface rounded-2xl px-4 py-3 mb-2.5 border border-border"
    >
      {/* 상단: 날짜 + 증감 + 진입 표시 */}
      <View className="flex-row items-center justify-between mb-2">
        <AppText weight="medium" className="text-text-primary text-sm">
          {date}
        </AppText>

        <View className="flex-row items-center">
          {hasDelta ? (
            <View className="flex-row items-center mr-1.5">
              <Ionicons
                name={isUp ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={isUp ? GOOD_COLOR : DOWN_COLOR}
              />
              <AppText
                weight="bold"
                className="text-xs ml-0.5"
                style={{ color: isUp ? GOOD_COLOR : DOWN_COLOR }}
              >
                {Math.abs(delta as number)}%
              </AppText>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color="#8E949A" />
        </View>
      </View>

      {/* 중단: 구종 배지 + 일관성 점수 */}
      <View className="flex-row items-end justify-between mb-2">
        <PitchTypeBadge type={pitchType} variant="outline" />

        <View className="flex-row items-baseline">
          <AppText className="text-text-secondary text-xs mr-1.5">일관성</AppText>
          <AppText weight="bold" className="text-2xl" style={{ color: scoreColor }}>
            {consistency}
          </AppText>
          <AppText weight="bold" className="text-sm ml-0.5" style={{ color: scoreColor }}>
            %
          </AppText>
        </View>
      </View>

      {/* 하단: 진행바 — 카드마다 길이가 달라 목록을 훑을 때 편차가 한눈에 들어온다 */}
      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${barWidth}%`, backgroundColor: scoreColor }}
        />
      </View>
    </TouchableOpacity>
  );
}
