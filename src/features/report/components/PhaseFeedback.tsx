import React from 'react';
import { View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { PhaseFeedback as PhaseFeedbackType } from '../types/report.types';

interface PhaseFeedbackProps {
  data: PhaseFeedbackType;
}

export default function PhaseFeedback({ data }: PhaseFeedbackProps) {
  const isGood = data.status === '양호';
  const badgeBg = isGood ? 'bg-[#E8F8F5]' : 'bg-[#FAF4EB]';
  const badgeTextColor = isGood ? '#3BC1A8' : '#D3735D';
  const dotColor = isGood ? '#A3C8BC' : '#DDBA82';

  return (
    <View 
      className="bg-white rounded-3xl mx-5 mt-5 px-5 py-5 mb-10" 
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, shadowOffset: { width: 0, height: 2 } }}
    >
      {/* 헤더 */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: dotColor }} />
          <AppText weight="bold" className="text-text-primary text-sm">
            {data.phaseName} · 현재 구간
          </AppText>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${badgeBg}`}>
          <AppText weight="bold" className="text-sm" style={{ color: badgeTextColor }}>
            {data.score} {data.status}
          </AppText>
        </View>
      </View>

      {/* 피드백 항목들 */}
      <View className="mb-4">
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-[#8EC5B6] mr-1 text-xs">✦</AppText>
          <AppText weight="bold" className="text-[#8EC5B6] text-sm">잘된 점</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.goodPoint}
        </AppText>
      </View>

      <View className="mb-4">
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-text-secondary mr-1 text-xs">•</AppText>
          <AppText weight="bold" className="text-text-secondary text-sm">피드백</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.feedback}
        </AppText>
      </View>

      <View>
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-[#8EC5B6] mr-1 text-xs">✦</AppText>
          <AppText weight="bold" className="text-[#8EC5B6] text-sm">개선안</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.improvement}
        </AppText>
      </View>
    </View>
  );
}
