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
 * 인터랙션:
 *   - 드래그 핸들을 아래로 당기면 시트가 닫힙니다.
 *   - 빠른 스와이프(속도 기준) 또는 80px 이상 드래그 시 닫힘.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PitchType } from '../types/camera.types';
import { useDismissibleSheet } from '../hooks/useDismissibleSheet';

// 바텀시트 높이
const SHEET_HEIGHT = 360;

// ─── 구종 목록 ────────────────────────────────────────────────────────────────
const PITCH_TYPES: PitchType[] = ['직구', '슬라이더', '커브', '체인지업'];

interface PitchSelectionSheetProps {
  /** 현재 선택된 구종 */
  selectedPitch: PitchType | null;
  /** 구종 선택 콜백 */
  onSelectPitch: (pitch: PitchType) => void;
  /** "다음" 버튼 콜백 */
  onNext: () => void;
  /** 시트 닫기 콜백 (아래로 드래그 또는 외부에서 닫을 때) */
  onClose?: () => void;
}

export default function PitchSelectionSheet({
  selectedPitch,
  onSelectPitch,
  onNext,
  onClose,
}: PitchSelectionSheetProps) {
  // 바텀시트 slide-up 애니메이션
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // 드래그-to-dismiss 훅
  const { panHandlers, dismiss } = useDismissibleSheet({
    translateY,
    sheetHeight: SHEET_HEIGHT,
    // 닫기 콜백이 없으면 아무 동작 안 함
    onClose: onClose ?? (() => {}),
  });

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
        {/* ── 드래그 핸들: 터치하면 dismiss, 드래그하면 panHandlers가 처리 ── */}
        <View className="items-center mb-4" {...panHandlers}>
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
