/**
 * [PitchSelectionSheet.tsx]
 * 카메라_공통_3: 구종 선택 바텀시트
 *
 * 구성:
 * ┌─────────────────────────────────────┐
 * │            ─── (드래그 핸들)        │
 * │ 구종 선택                            │
 * │ 촬영한 투구의 구종을 선택해주세요    │
 * │                                     │
 * │  [직구 ✓]    [슬라이더]             │
 * │  [커브]      [체인지업]             │
 * │                                     │
 * │  [        다음 >         ]          │
 * └─────────────────────────────────────┘
 *
 * 왜 라이브러리 없이 Animated.View인가요?
 * - @gorhom/bottom-sheet는 별도 네이티브 빌드가 필요합니다.
 * - 간단한 slide-up 애니메이션은 Animated API로 충분하며
 *   의존성을 최소화할 수 있습니다.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PitchType } from '../types/camera.types';

// 바텀시트 높이
const SHEET_HEIGHT = 360;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── 구종 목록 ────────────────────────────────────────────────────────────────
const PITCH_TYPES: PitchType[] = ['직구', '슬라이더', '커브', '체인지업'];

interface PitchSelectionSheetProps {
  /** 현재 선택된 구종 */
  selectedPitch: PitchType | null;
  /** 구종 선택 콜백 */
  onSelectPitch: (pitch: PitchType) => void;
  /** "다음" 버튼 콜백 */
  onNext: () => void;
}

export default function PitchSelectionSheet({
  selectedPitch,
  onSelectPitch,
  onNext,
}: PitchSelectionSheetProps) {
  // 바텀시트 slide-up 애니메이션
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    // 마운트 시 위로 슬라이드
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [translateY]);

  return (
    // 전체 화면 오버레이 (반투명 배경)
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SHEET_HEIGHT,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          height: SHEET_HEIGHT,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        {/* ── 드래그 핸들 ── */}
        <View className="items-center mb-4">
          <View className="w-10 h-1 bg-gray-200 rounded-full" />
        </View>

        {/* ── 제목 + 부제목 ── */}
        <Text className="text-text-primary text-xl font-bold mb-1">
          구종 선택
        </Text>
        <Text className="text-text-secondary text-sm mb-5">
          촬영한 투구의 구종을 선택해주세요
        </Text>

        {/* ── 2×2 구종 그리드 ── */}
        <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
          {PITCH_TYPES.map((pitch) => {
            const isSelected = selectedPitch === pitch;
            return (
              <TouchableOpacity
                key={pitch}
                onPress={() => onSelectPitch(pitch)}
                activeOpacity={0.8}
                style={{
                  width: '47%', // 2열 그리드
                  borderRadius: 14,
                  backgroundColor: isSelected ? '#3BC1A8' : '#F2F4F6',
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isSelected ? 'white' : '#1A1C20',
                  }}
                >
                  {pitch}
                </Text>
                {/* 선택된 구종에만 체크마크 표시 */}
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 다음 버튼 ── */}
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.85}
          disabled={!selectedPitch} // 선택 전에는 비활성화
          style={{
            backgroundColor: selectedPitch ? '#3BC1A8' : '#A8EAE0',
            borderRadius: 16,
            paddingVertical: 17,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
            다음
          </Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
