/**
 * [EditTooltip.tsx]
 * 카메라_공통_2-1: "편집 버튼으로 영상을 자유롭게 수정할 수 있어요!" 툴팁 버블
 *
 * 디자인 포인트:
 * - 브랜드 그린 배경 + 흰색 텍스트
 * - 말풍선 꼬리가 우측 상단(편집 버튼 방향)을 향합니다.
 * - 일정 시간 후 자동으로 사라지거나, 탭하면 즉시 닫힙니다.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EditTooltipProps {
  /** 툴팁 닫기 콜백 (탭 시 또는 자동 닫힘 시 호출) */
  onDismiss: () => void;
  /** 자동으로 닫힐 시간 (ms). 기본값: 3000ms */
  autoDismissMs?: number;
}

export default function EditTooltip({
  onDismiss,
  autoDismissMs = 3000,
}: EditTooltipProps) {
  // 지정 시간 후 자동으로 툴팁을 닫습니다.
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer); // 언마운트 시 타이머 정리
  }, [onDismiss, autoDismissMs]);

  return (
    <TouchableOpacity
      onPress={onDismiss}
      activeOpacity={0.9}
      // 우측 상단에 절대 위치로 고정 (부모에서 relative 필요)
      className="absolute top-16 right-4"
    >
      <View
        className="bg-brand px-4 py-3 max-w-52"
        style={{ borderRadius: 14 }}
      >
        <Text className="text-white text-sm font-medium leading-5">
          편집 버튼으로 영상을{'\n'}자유롭게 수정할 수 있어요!
        </Text>

        {/* 말풍선 꼬리 (우측 상단 방향) */}
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: 16,
            width: 0,
            height: 0,
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderBottomWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#3BC1A8',
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
