/**
 * [PitchDistributionCard.tsx]
 * 구종 분포 카드: 도넛 차트 + 우측 범례(퍼센트 + 바)
 *
 * 구성:
 * ┌──────────────────────────────────────┐
 * │ 구종 분포              총 100세션     │
 * │  [도넛차트]  ● 직구    ──────  42%   │
 * │             ● 슬라이더 ────    26%   │
 * │             ● 커브     ───     20%   │
 * │             ● 체인지업  ─      12%   │
 * └──────────────────────────────────────┘
 *
 * 왜 react-native-gifted-charts를 쓰나요?
 * - Expo Go와 호환되며 SVG 기반으로 부드러운 애니메이션을 제공합니다.
 * - PieChart API가 간단하고 커스텀 레이블을 지원합니다.
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { PitchDistributionItem } from '../types/my.types';

interface PitchDistributionCardProps {
  data: PitchDistributionItem[];
  totalSessions: number;
}

export default function PitchDistributionCard({
  data,
  totalSessions,
}: PitchDistributionCardProps) {
  // gifted-charts PieChart가 요구하는 형식으로 변환
  const pieData = data.map((item) => ({
    value: item.percentage,
    color: item.color,
    // 호버/클릭 시 중앙에 표시할 텍스트 (선택)
    text: `${item.percentage}%`,
  }));

  return (
    <View
      className="bg-surface rounded-3xl mx-5 mb-4 p-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* 카드 헤더 */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-text-primary text-base font-bold">구종 분포</Text>
        <Text className="text-text-secondary text-xs">
          총 {totalSessions}세션
        </Text>
      </View>

      {/* 차트 + 범례 가로 배치 */}
      <View className="flex-row items-center">
        {/* ── 도넛 차트 ── */}
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={42}
          // 중앙 텍스트 없음 (디자인 기준 빈 공간)
          centerLabelComponent={() => null}
          // 애니메이션 비활성화 (Expo Go에서 간혹 깜빡임 발생)
          isAnimated={false}
        />

        {/* ── 우측 범례 ── */}
        <View className="flex-1 ml-6" style={{ gap: 10 }}>
          {data.map((item) => (
            <View key={item.type} className="flex-row items-center justify-between">
              {/* 구종명 + 색상 점 */}
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: item.color,
                  }}
                />
                <Text className="text-text-primary text-sm">{item.type}</Text>
              </View>

              {/* 퍼센트 수치: 브랜드 컬러로 강조 */}
              <Text className="text-brand text-sm font-bold">
                {item.percentage}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
