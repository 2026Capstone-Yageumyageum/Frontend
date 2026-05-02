/**
 * [RecordingTimer.tsx]
 * 녹화 중 화면 상단 중앙에 표시되는 "● 00:00:01" 타이머 컴포넌트
 *
 * 디자인 포인트:
 * - 빨간 점(●) + 흰색 시간 텍스트
 * - 어두운 반투명 배경 Pill 형태
 * - RECORDING 상태에서만 렌더링됩니다 (부모가 조건부 렌더링)
 */

import React from 'react';
import { View, Text } from 'react-native';

interface RecordingTimerProps {
  /** "00:00:01" 형식의 포맷된 시간 문자열 */
  formattedTime: string;
}

export default function RecordingTimer({ formattedTime }: RecordingTimerProps) {
  return (
    // bg-black/50: 카메라 배경에서 텍스트 가독성 확보
    <View className="flex-row items-center bg-black/50 px-4 py-1.5 rounded-full self-center">
      {/* 빨간 녹화 표시 점 */}
      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
      <Text className="text-white text-sm font-semibold tracking-wider">
        {formattedTime}
      </Text>
    </View>
  );
}
