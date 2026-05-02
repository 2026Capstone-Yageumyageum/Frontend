/**
 * [ProfileHeader.tsx]
 * 마이 화면 상단: 유저 이름 인사 + 최근 분석 요약 문구
 *
 * 예시:
 *   "나의 피칭 리포트"       [⚙]
 *   박지성님,
 *   최근 한 달간 8회 투구 분석을 했어요
 *   얼마나 성장했는지 확인해볼까요?
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  nickname: string;
  recentAnalysisCount: number;
  onSettingsPress?: () => void;
}

export default function ProfileHeader({
  nickname,
  recentAnalysisCount,
  onSettingsPress,
}: ProfileHeaderProps) {
  return (
    <View className="px-5 pt-4 pb-3 bg-surface-page">
      {/* 상단 타이틀 + 설정 아이콘 */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-text-secondary text-sm font-medium">
          나의 피칭 리포트
        </Text>
        <TouchableOpacity onPress={onSettingsPress} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={20} color="#8E949A" />
        </TouchableOpacity>
      </View>

      {/* 유저 이름 인사 */}
      <Text className="text-3xl font-bold text-brand mb-1">
        {nickname}님,
      </Text>

      {/* 분석 횟수 강조 문구 */}
      <Text className="text-text-primary text-sm font-medium mb-0.5">
        {'최근 한 달간 '}
        <Text className="text-brand font-bold">{recentAnalysisCount}회</Text>
        {' 투구 분석을 했어요'}
      </Text>
      <Text className="text-text-secondary text-xs">
        얼마나 성장했는지 확인해볼까요?
      </Text>
    </View>
  );
}
