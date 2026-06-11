import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';

interface VideoCompareAreaProps {
  score: number;
  isSingleVideo?: boolean;
}

export default function VideoCompareArea({ score, isSingleVideo }: VideoCompareAreaProps) {
  const isGoodScore = score >= 70;
  // 타임라인 색상 (이미지 참고)
  const timelineColor = isGoodScore ? '#A3C8BC' : '#DCA876';

  return (
    <View className="px-5 mt-4">
      {/* 영상 영역 */}
      <View className="flex-row justify-center mb-4">
        {isSingleVideo ? (
          <View className="w-[60%] rounded-2xl bg-[#1A2421]" style={{ aspectRatio: 3/4 }} />
        ) : (
          <>
            {/* 내 영상 (왼쪽) */}
            <View className="flex-1 mr-2 rounded-2xl bg-[#1A2421]" style={{ aspectRatio: 3/4 }} />
            {/* 프로 선수 영상 (오른쪽) */}
            <View className="flex-1 ml-2 rounded-2xl bg-[#191825]" style={{ aspectRatio: 3/4 }} />
          </>
        )}
      </View>

      {/* 컨트롤 및 타임라인 */}
      <View className="flex-row items-center">
        {/* 재생 버튼 */}
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-[#A3C8BC] items-center justify-center mr-3 border-2 border-white"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
          activeOpacity={0.7}
        >
          <Ionicons name="play" size={20} color="white" style={{ marginLeft: 3 }} />
        </TouchableOpacity>

        {/* 타임라인 바 */}
        <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
          {/* 구간 블록 (비율 예시) */}
          <View className="h-2.5 rounded-full flex-[1]" style={{ backgroundColor: timelineColor }} />
          <View className="h-2.5 rounded-full flex-[4]" style={{ backgroundColor: timelineColor, opacity: 0.4 }} />
          <View className="h-2.5 rounded-full flex-[1]" style={{ backgroundColor: timelineColor, opacity: 0.4 }} />
          <View className="h-2.5 rounded-full flex-[1]" style={{ backgroundColor: timelineColor, opacity: 0.4 }} />
        </View>
      </View>
    </View>
  );
}
