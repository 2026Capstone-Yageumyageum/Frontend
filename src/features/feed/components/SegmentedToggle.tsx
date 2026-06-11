/**
 * [SegmentedToggle.tsx]
 * 피드 상단의 [프로 선수 | 일관성] 전환 탭 컴포넌트
 *
 * 왜 별도 컴포넌트인가요?
 * - 같은 UI 패턴이 다른 화면에서도 재사용될 수 있어 분리합니다.
 * - 활성 탭을 외부 상태로 관리(controlled component)하여 유연성을 높입니다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import AppText from '../../../components/common/AppText';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface SegmentedToggleProps {
  /** 탭 목록 (예: ['프로 선수', '일관성']) */
  tabs: string[];
  /** 현재 활성화된 탭 문자열 */
  activeTab: string;
  /** 탭 변경 시 호출되는 콜백 */
  onChange: (tab: string) => void;
}

export default function SegmentedToggle({
  tabs,
  activeTab,
  onChange,
}: SegmentedToggleProps) {
  return (
    // 탭 목록을 가로 배치, 하단 구분선은 container에서 처리
    <View className="flex-row bg-surface px-5 pt-4">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            // 각 탭은 컨텐츠 너비만큼만 차지하고, 오른쪽 여백으로 간격 확보 (간격 넓힘)
            className="mr-8"
          >
            {/* 탭 텍스트: 활성 탭은 강조 컬러 + 볼드 처리, 크기 확대(text-lg) */}
            <AppText
              weight={isActive ? 'bold' : 'medium'}
              className={`text-lg pb-3 ${
                isActive ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {tab}
            </AppText>

            {/* 활성 탭 하단 인디케이터 바 (두께 굵게 수정 h-1) */}
            <View
              className={`h-1 rounded-full ${
                isActive ? 'bg-brand' : 'bg-transparent'
              }`}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
