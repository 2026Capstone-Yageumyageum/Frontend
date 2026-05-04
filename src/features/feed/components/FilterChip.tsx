/**
 * [FilterChip.tsx]
 * 구종 필터 선택 칩 컴포넌트 (단일 칩)
 *
 * 왜 단일 칩을 별도 컴포넌트로?
 * - FilterChipList에서 map()으로 렌더링되므로 칩 UI만 분리합니다.
 * - 활성/비활성 상태에 따라 배경색과 텍스트 색이 반전됩니다.
 *   활성: 브랜드 컬러 배경 + 흰색 텍스트
 *   비활성: 다크 배경 + 흰색 텍스트 (디자인 이미지 기준)
 */

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface FilterChipProps {
  /** 칩에 표시할 구종 이름 (예: '직구', '슬라이더') */
  label: string;
  /** 현재 선택된 칩인지 여부 */
  isSelected: boolean;
  /** 칩 선택 시 호출되는 콜백 */
  onPress: () => void;
}

export default function FilterChip({
  label,
  isSelected,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      // 선택 상태에 따라 배경색 변경
      className={`px-4 py-2 rounded-chip mr-2 ${
        isSelected ? 'bg-brand' : 'bg-surface-overlay'
      }`}
    >
      <Text
        className="text-white text-sm font-medium"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
