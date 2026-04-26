import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// ─────────────────────────────────────────────
//  타입 정의
// ─────────────────────────────────────────────

type DialogProps = {
  visible: boolean;
  /** 상단 굵은 제목 */
  title: string;
  /** 제목 아래 세부 설명 텍스트 */
  description?: string;
  /** 확인 버튼 레이블 (기본: '확인') */
  confirmLabel?: string;
  /** 취소 버튼 레이블 (기본: '취소') */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * 위험한 행동(삭제, 탈퇴 등)일 경우 true로 설정.
   * true → 확인 버튼이 빨간색으로 변해 경고를 시각적으로 전달.
   */
  isDangerous?: boolean;
};

// ─────────────────────────────────────────────
//  컴포넌트
// ─────────────────────────────────────────────

export default function Dialog({
  visible,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  isDangerous = false,
}: DialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      // 안드로이드 백 버튼 누를 때 취소 동작
      onRequestClose={onCancel}
    >
      {/* 딤 배경: 반투명 검정으로 포커스 유도 */}
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        {/* 다이얼로그 카드 */}
        <View className="bg-white rounded-3xl p-6 w-full">
          {/* ① 굵은 제목 */}
          <Text className="text-lg font-bold text-gray-900 text-center mb-2">
            {title}
          </Text>

          {/* ② 세부 설명 (옵션) */}
          {description ? (
            <Text className="text-sm text-gray-500 text-center leading-5 mb-6">
              {description}
            </Text>
          ) : (
            // 설명 없을 때도 버튼 위 여백 확보
            <View className="mb-4" />
          )}

          {/* ③ 버튼 영역: 좌(취소) - 우(확인) 동일 크기로 배치 */}
          <View className="flex-row" style={{ gap: 12 }}>
            {/* 취소 버튼: 덜 강조 (outlined) → 실수로 누르기 어렵게 */}
            <TouchableOpacity
              className="flex-1 h-12 rounded-2xl border-2 border-gray-200 items-center justify-center"
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-gray-400">
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            {/* 확인 버튼: 강조 (filled) → 핵심 행동임을 명확히 전달 */}
            {/* isDangerous=true이면 빨간색으로 위험 행동 경고 */}
            <TouchableOpacity
              className={`flex-1 h-12 rounded-2xl items-center justify-center ${
                isDangerous ? 'bg-red-500' : 'bg-blue-600'
              }`}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-white">
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
