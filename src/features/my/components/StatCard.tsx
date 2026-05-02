/**
 * [StatCard.tsx]
 * 통계 수치 카드 (총 세션 / 최고 점수 / 이번 달)
 *
 * 구성:
 *   [아이콘]
 *     24       ← value (숫자 또는 문자열)
 *   총 세션     ← label
 *
 * 3개가 가로 배치됩니다. 부모에서 flex-row로 배치할 것.
 */

import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  /** 카드 중앙에 표시할 수치 (예: '24', '91%', '8') */
  value: string;
  /** 카드 하단 레이블 (예: '총 세션', '최고 점수', '이번 달') */
  label: string;
  /** 아이콘 컴포넌트 (Ionicons 등 직접 전달) */
  icon: React.ReactNode;
}

export default function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <View
      className="flex-1 bg-surface rounded-2xl items-center justify-center py-4"
      style={{
        // 카드 사이 그림자
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* 아이콘 영역 */}
      <View className="mb-2">{icon}</View>

      {/* 수치: 크고 굵게 */}
      <Text className="text-text-primary text-2xl font-bold">{value}</Text>

      {/* 레이블: 보조 텍스트 */}
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}
