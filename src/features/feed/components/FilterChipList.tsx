/**
 * [FilterChipList.tsx]
 * 가로 스크롤 가능한 구종 필터 칩 목록 컴포넌트
 *
 * 왜 ScrollView를 쓰나요?
 * - 구종 목록이 많아져도 화면을 넘치지 않고 가로로 스크롤할 수 있습니다.
 * - showsHorizontalScrollIndicator={false}로 스크롤바를 숨겨 깔끔하게 보입니다.
 */

import React from 'react';
import { ScrollView, View } from 'react-native';
import FilterChip from './FilterChip';
import { PitchType } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface FilterChipListProps {
  /** 표시할 구종 필터 목록 */
  filters: PitchType[];
  /** 현재 선택된 구종 */
  selectedFilter: PitchType;
  /** 구종 선택 시 호출되는 콜백 */
  onSelect: (filter: PitchType) => void;
}

export default function FilterChipList({
  filters,
  selectedFilter,
  onSelect,
}: FilterChipListProps) {
  return (
    // contentContainerStyle로 좌우 패딩 적용 (NativeWind가 ScrollView contentContainer에 미작동하므로 inline style 사용)
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
    >
      {filters.map((filter) => (
        <FilterChip
          key={filter}
          label={filter}
          isSelected={selectedFilter === filter}
          onPress={() => onSelect(filter)}
        />
      ))}
    </ScrollView>
  );
}
