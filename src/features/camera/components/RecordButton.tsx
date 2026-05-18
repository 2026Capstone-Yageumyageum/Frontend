/**
 * [RecordButton.tsx]
 * 녹화 시작/정지 버튼 컴포넌트 (상태에 따라 UI가 변합니다)
 *
 * IDLE 상태:
 *   ○ (흰색 큰 원) — 탭하면 녹화 시작
 *
 * RECORDING 상태:
 *   ● 빨간 테두리 링 + 내부 빨간 둥근 사각형 — 탭하면 녹화 중지
 *
 * 왜 상태를 Props로 받나요?
 * - 버튼이 자체 상태를 갖지 않아 CameraScreen에서 단일 소스로 관리됩니다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  /** 버튼 비활성화 여부 (터치 차단 + 시각적 흐림 처리) */
  disabled?: boolean;
}

export default function RecordButton({
  isRecording,
  onPress,
  disabled = false,
}: RecordButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      // disabled 상태에서는 터치 이벤트 자체를 차단
      disabled={disabled}
      // 불투명도로 비활성화 상태를 시각적으로 표현 (과거 영상 미선택 시 흐릿하게)
      style={{ opacity: disabled ? 0.35 : 1 }}
      accessibilityLabel={isRecording ? '녹화 중지' : '녹화 시작'}
      accessibilityRole="button"
    >
      {isRecording ? (
        // ── 녹화 중: 빨간 테두리 + 내부 정지 아이콘 ──
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ borderWidth: 2.5, borderColor: '#EF4444' }}
        >
          {/* 내부 빨간 둥근 사각형 (정지 아이콘) */}
          <View
            className="w-7 h-7 bg-red-500"
            style={{ borderRadius: 6 }}
          />
        </View>
      ) : (
        // ── 대기 중: 흰색 큰 원 ──
        <View
          className="w-16 h-16 rounded-full bg-white items-center justify-center"
          style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }}
        >
          {/* 내부 흰 채움 원 */}
          <View className="w-14 h-14 rounded-full bg-white" />
        </View>
      )}
    </TouchableOpacity>
  );
}
