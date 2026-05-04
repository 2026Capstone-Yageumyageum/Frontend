/**
 * [PastVideoSelectionSheet.tsx]
 * 카메라_나_2, 2-1: 과거 영상 선택 바텀시트
 *
 * 구성:
 * ┌─────────────────────────────────────┐
 * │            ─── (드래그 핸들)        │
 * │ 과거 영상 선택                       │
 * │ 비교할 내 베스트 투구를 선택해주세요 │
 * │                                     │
 * │  [썸네일] 직구 최고의 1구 (24.04.28) │
 * │  [썸네일] 커브 최고의 1구 (24.04.20) │
 * │                                     │
 * │  [        다음 >         ]          │
 * └─────────────────────────────────────┘
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SHEET_HEIGHT = 400;

export interface PastVideo {
  id: string;
  pitchType: string;
  date: string;
  thumbnailUrl?: string; // 추후 썸네일 이미지 적용
}

const MOCK_PAST_VIDEOS: PastVideo[] = [
  { id: '1', pitchType: '직구', date: '24.04.28' },
  { id: '2', pitchType: '슬라이더', date: '24.04.20' },
  { id: '3', pitchType: '커브', date: '24.04.15' },
];

interface PastVideoSelectionSheetProps {
  onClose: () => void;
  onNext: (selectedVideo: PastVideo) => void;
}

export default function PastVideoSelectionSheet({
  onClose,
  onNext,
}: PastVideoSelectionSheetProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [translateY]);

  const handleNext = () => {
    const selected = MOCK_PAST_VIDEOS.find((v) => v.id === selectedVideoId);
    if (selected) {
      onNext(selected);
    }
  };

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

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
        {/* 드래그 핸들 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleClose}
          className="items-center mb-4"
        >
          <View className="w-10 h-1 bg-gray-200 rounded-full" />
        </TouchableOpacity>

        {/* 닫기 버튼 (우측 상단) */}
        <TouchableOpacity
          onPress={handleClose}
          style={{ position: 'absolute', top: 20, right: 20 }}
        >
          <Ionicons name="close" size={24} color="#8E949A" />
        </TouchableOpacity>

        <Text className="text-text-primary text-xl font-bold mb-1">
          과거 영상 선택
        </Text>
        <Text className="text-text-secondary text-sm mb-5">
          비교할 내 베스트 투구를 선택해주세요
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
          {MOCK_PAST_VIDEOS.map((video) => {
            const isSelected = selectedVideoId === video.id;
            return (
              <TouchableOpacity
                key={video.id}
                onPress={() => setSelectedVideoId(video.id)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: isSelected ? '#E6F7F4' : '#F8F9FA',
                  borderWidth: 1,
                  borderColor: isSelected ? '#3BC1A8' : 'transparent',
                  marginBottom: 10,
                }}
              >
                {/* 썸네일 플레이스홀더 */}
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    backgroundColor: '#E8EAEC',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="videocam-outline" size={24} color="#A0A5AA" />
                </View>

                {/* 영상 정보 */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#1A1C20',
                      marginBottom: 4,
                    }}
                  >
                    {video.pitchType} 최고의 1구
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E949A' }}>
                    {video.date}
                  </Text>
                </View>

                {/* 체크마크 */}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#3BC1A8" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={!selectedVideoId}
          style={{
            backgroundColor: selectedVideoId ? '#3BC1A8' : '#A8EAE0',
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
