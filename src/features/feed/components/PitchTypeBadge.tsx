/**
 * [PitchTypeBadge.tsx]
 * 카드 내부 구종 태그 뱃지 컴포넌트
 *
 * 왜 별도 컴포넌트인가요?
 * - 두 종류의 카드(ProMatchingCard, ConsistencyCard) 모두에서 동일하게 사용됩니다.
 * - variant로 solid(채움)/outline(테두리) 스타일을 분기합니다.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { PitchType } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface PitchTypeBadgeProps {
  /** 표시할 구종 이름 */
  type: PitchType;
  /**
   * 뱃지 스타일 종류
   * - 'solid': 브랜드 컬러 채운 배경 (카드 영상 위 오버레이에 사용)
   * - 'outline': 테두리만 있는 스타일 (카드 텍스트 영역 내 세션명 옆에 사용)
   */
  variant?: 'solid' | 'outline';
}

export default function PitchTypeBadge({
  type,
  variant = 'solid',
}: PitchTypeBadgeProps) {
  const isSolid = variant === 'solid';

  return (
    <View
      className={`px-3 py-1 rounded-chip self-start ${
        isSolid
          ? 'bg-brand'                        // 채움: 브랜드 컬러 배경
          : 'border border-brand bg-brand-light' // 테두리: 연한 배경 + 브랜드 테두리
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          isSolid ? 'text-white' : 'text-brand'
        }`}
      >
        {type}
      </Text>
    </View>
  );
}
