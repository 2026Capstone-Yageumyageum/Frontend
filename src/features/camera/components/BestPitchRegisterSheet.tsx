/**
 * [BestPitchRegisterSheet.tsx]
 * 카메라_공통_5 / 5-1: "최고의 1구 등록" 바텀시트
 *
 * 구성:
 * ┌─────────────────────────────────────────┐
 * │          ─── (드래그 핸들)              │
 * │ 🏆 최고의 1구 등록                      │
 * │ 이 영상을 [직구] 최고의 1구로 등록할까요?│
 * │                                         │
 * │ ┌─────────────────────────────────────┐ │
 * │ │ 등록하기              직구 최고의.. >│ │ ← 미선택 (회색 bg)
 * │ └─────────────────────────────────────┘ │
 * │ ┌─────────────────────────────────────┐ │
 * │ │ 등록하기                          ✓ │ │ ← 선택됨 (브랜드 bg)
 * │ └─────────────────────────────────────┘ │
 * │ [            완료            ]          │
 * └─────────────────────────────────────────┘
 *
 * 상태 전환: 5 (미선택) → 5-1 (선택됨) — 로컬 state로 관리
 * 인터랙션: 드래그 핸들을 아래로 당기면 시트가 닫힙니다.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import AppText from '../../../components/common/AppText';
import { Ionicons } from '@expo/vector-icons'
import { PitchType } from '../types/camera.types';
import { useDismissibleSheet } from '../hooks/useDismissibleSheet';

const SHEET_HEIGHT = 300;

interface BestPitchRegisterSheetProps {
  /** 분석된/선택된 구종 */
  pitchType: PitchType;
  /** "완료" 버튼 콜백 */
  onComplete: () => void;
  /** 시트 닫기 콜백 (아래로 드래그 시) */
  onClose?: () => void;
}

export default function BestPitchRegisterSheet({
  pitchType,
  onComplete,
  onClose,
}: BestPitchRegisterSheetProps) {
  // 5-1 상태: 등록하기 선택 여부
  const [isRegistered, setIsRegistered] = useState(false);

  // slide-up 애니메이션
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // 드래그-to-dismiss 훅
  const { panHandlers } = useDismissibleSheet({
    translateY,
    sheetHeight: SHEET_HEIGHT,
    onClose: onClose ?? (() => {}),
  });

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [translateY]);

  const toggleRegister = () => setIsRegistered((prev) => !prev);

  return (
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
        {/* ── 드래그 핸들: 아래로 당기면 시트 닫힘 ── */}
        <View className="items-center mb-4" {...panHandlers}>
          <View className="w-10 h-1 bg-gray-200 rounded-full" />
        </View>

        {/* ── 헤더: 트로피 아이콘 + 제목 ── */}
        <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
          <Ionicons name="trophy-outline" size={20} color="#3BC1A8" />
          <AppText weight="bold" className="text-text-primary text-lg">
            최고의 1구 등록
          </AppText>
        </View>

        {/* ── 부제목 (구종명은 브랜드 컬러로 강조) ── */}
        <AppText className="text-text-secondary text-sm mb-5">
          {'이 영상을 '}
          <AppText weight="semibold" className="text-brand">{pitchType}</AppText>
          {' 최고의 1구로 등록할까요?'}
        </AppText>

        {/* ── 등록하기 토글 행 ── */}
        <TouchableOpacity
          onPress={toggleRegister}
          activeOpacity={0.85}
          style={{
            borderRadius: 14,
            backgroundColor: isRegistered ? '#3BC1A8' : '#F2F4F6',
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          {/* 텍스트 영역 */}
          <View>
            <AppText
              weight="semibold"
              style={{
                fontSize: 15,
                color: isRegistered ? 'white' : '#1A1C20',
                marginBottom: 2,
              }}
            >
              등록하기
            </AppText>
            <AppText
              style={{
                fontSize: 12,
                color: isRegistered ? 'rgba(255,255,255,0.75)' : '#8E949A',
              }}
            >
              {pitchType} 최고의 1구로 저장
            </AppText>
          </View>

          {/* 아이콘: 선택 전 → ">" / 선택 후 → 체크마크 */}
          {isRegistered ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#8E949A" />
          )}
        </TouchableOpacity>

        {/* ── 완료 버튼 ── */}
        <TouchableOpacity
          onPress={onComplete}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#3BC1A8',
            borderRadius: 16,
            paddingVertical: 17,
            alignItems: 'center',
          }}
        >
          <AppText weight="bold" style={{ color: 'white', fontSize: 16 }}>
            완료
          </AppText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
