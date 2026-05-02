/**
 * [SaveVideoModal.tsx]
 * 카메라_공통_2-2: "영상 저장" 확인 모달
 *
 * 구성:
 *   ↓ 아이콘 (연한 원 배경)
 *   영상 저장
 *   촬영한 영상을 갤러리에 저장하시겠어요?
 *   [취소] [↓ 저장]
 *
 * 왜 Modal 컴포넌트를 쓰나요?
 * - RN의 Modal은 부모 뷰 위에 네이티브 레이어로 렌더링돼
 *   z-index 충돌 없이 안정적으로 오버레이할 수 있습니다.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SaveVideoModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function SaveVideoModal({
  visible,
  onCancel,
  onSave,
}: SaveVideoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent // Android에서 상태바 위까지 모달 적용
      onRequestClose={onCancel} // 뒤로가기 버튼 처리
    >
      {/* 반투명 배경 오버레이 */}
      <View className="flex-1 justify-center items-center bg-black/60 px-8">
        {/* 흰색 모달 카드 */}
        <View
          className="bg-white w-full rounded-3xl p-6 items-center"
          style={{ gap: 12 }}
        >
          {/* 아이콘 원형 배경 */}
          <View className="w-14 h-14 rounded-full bg-brand-light items-center justify-center mb-1">
            <Ionicons name="download-outline" size={26} color="#3BC1A8" />
          </View>

          {/* 제목 */}
          <Text className="text-text-primary text-xl font-bold">
            영상 저장
          </Text>

          {/* 설명 문구 */}
          <Text className="text-text-secondary text-sm text-center leading-5">
            촬영한 영상을{'\n'}갤러리에 저장하시겠어요?
          </Text>

          {/* 버튼 영역 */}
          <View className="flex-row w-full mt-2" style={{ gap: 10 }}>
            {/* 취소 버튼 */}
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
            >
              <Text className="text-text-primary text-sm font-semibold">
                취소
              </Text>
            </TouchableOpacity>

            {/* 저장 버튼 (브랜드 컬러) */}
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.8}
              className="flex-1 bg-brand rounded-2xl py-4 flex-row items-center justify-center"
              style={{ gap: 6 }}
            >
              <Ionicons name="download-outline" size={16} color="white" />
              <Text className="text-white text-sm font-semibold">저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
