/**
 * [CameraToggle.tsx]
 * 카메라 화면 상단의 [프로와 비교 | 내 베스트 투구] 탭 전환 컴포넌트
 *
 * 디자인 포인트:
 * - 어두운 카메라 배경 위에서도 잘 보이도록 반투명 배경 처리
 * - 활성 탭: 흰 배경 + 진한 텍스트
 * - 비활성 탭: 투명 배경 + 연한 텍스트
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CameraMode } from '../types/camera.types';

interface CameraToggleProps {
  activeMode: CameraMode;
  onChange: (mode: CameraMode) => void;
}

const TABS: { mode: CameraMode; label: string }[] = [
  { mode: 'pro', label: '프로와 비교' },
  { mode: 'my', label: '내 베스트 투구' },
];

export default function CameraToggle({
  activeMode,
  onChange,
}: CameraToggleProps) {
  return (
    // bg-black/30: 어두운 카메라 배경에서 구분되도록 반투명 컨테이너
    <View className="flex-row bg-black/30 rounded-full p-1 self-center">
      {TABS.map(({ mode, label }) => {
        const isActive = mode === activeMode;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => onChange(mode)}
            activeOpacity={0.8}
            className={`px-6 py-2 rounded-full ${
              isActive ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-gray-900' : 'text-white/70'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
