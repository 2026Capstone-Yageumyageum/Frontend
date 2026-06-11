import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { ReportData } from '../types/report.types';

interface ReportSummaryCardProps {
  data: ReportData;
  onPressPlayer: () => void;
}

export default function ReportSummaryCard({ data, onPressPlayer }: ReportSummaryCardProps) {
  const isGoodScore = data.overallSimilarity >= 70;
  const scoreColor = isGoodScore ? '#A3C8BC' : '#D3735D'; // 이미지 기준 색상
  const dotColor = isGoodScore ? '#A3C8BC' : '#D3735D';

  return (
    <View 
      className="bg-white rounded-3xl mx-5 mt-4 px-5 py-4"
      style={{ 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 3 
      }}
    >
      {/* 상단: 날짜, 구종, 베스트 피칭 */}
      <View className="flex-row items-center mb-4">
        <AppText weight="bold" className="text-text-primary text-xl mr-2">
          {data.date}
        </AppText>
        <View className="bg-surface-page px-2.5 py-1 rounded-full mr-2">
          <AppText className="text-text-secondary text-xs">{data.pitchType}</AppText>
        </View>
        {data.isBestPitch && (
          <View className="bg-[#E8F8F5] px-2.5 py-1 rounded-full flex-row items-center">
            <AppText weight="semibold" className="text-brand text-xs mr-0.5">베스트 피칭</AppText>
            <Ionicons name="checkmark" size={12} color="#3BC1A8" />
          </View>
        )}
      </View>

      {/* 하단: 비교 선수 선택 버튼, 우측 유사도 점수 */}
      <View className="flex-row items-center justify-between">
        {/* 비교 선수 버튼 */}
        <TouchableOpacity 
          className="flex-row items-center bg-surface-page px-3 py-1.5 rounded-full border border-border/50"
          onPress={onPressPlayer}
          activeOpacity={0.7}
        >
          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: dotColor }} />
          <AppText weight="bold" className="text-text-primary text-sm mr-1">
            {data.comparePlayer.name}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color="#8E949A" />
        </TouchableOpacity>

        {/* 유사도 점수 */}
        <View className="flex-row items-baseline">
          <AppText className="text-text-secondary text-xs mr-1">유사도</AppText>
          <AppText weight="bold" className="text-4xl" style={{ color: scoreColor }}>
            {data.overallSimilarity}
          </AppText>
          <AppText weight="bold" className="text-sm ml-0.5" style={{ color: scoreColor }}>
            점
          </AppText>
        </View>
      </View>
    </View>
  );
}
