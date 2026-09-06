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
 *
 * 인터랙션: 드래그 핸들을 아래로 당기면 시트가 닫힙니다.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDismissibleSheet } from '../hooks/useDismissibleSheet';
import { getBestPitches } from '../../../api/userApi';

const SHEET_HEIGHT = 400;

export interface PastVideo {
  id: string;
  pitchType: string;
  date: string;
  thumbnailUrl?: string; // 추후 썸네일 이미지 적용
}

interface PastVideoSelectionSheetProps {
  onClose: () => void;
  onNext: (selectedVideo: PastVideo) => void;
  /**
   * 등록된 최고의 1구가 하나도 없을 때 "프로 비교로 먼저 분석하기"를 누른 경우.
   *
   * 이 길이 없으면 신규 사용자는 이 시트에서 빠져나갈 수 없습니다.
   * 비교할 대상이 없으니 "다음"은 눌러도 아무 일이 없고, 닫아도 같은 상태로 돌아옵니다.
   */
  onSwitchToPro?: () => void;
}

export default function PastVideoSelectionSheet({
  onClose,
  onNext,
  onSwitchToPro,
}: PastVideoSelectionSheetProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  // 구종별 "최고의 1구"를 서버에서 받아 비교 대상 후보로 보여준다.
  const [pastVideos, setPastVideos] = useState<PastVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getBestPitches()
      .then((cards) => {
        if (!active) return;
        setPastVideos(
          cards.map((c) => ({
            id: String(c.videoId),
            pitchType: c.pitchType,
            date: c.date,
          })),
        );
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // 드래그-to-dismiss 훅 (닫기 버튼 탭, 드래그 모두 처리)
  const { panHandlers, dismiss } = useDismissibleSheet({
    translateY,
    sheetHeight: SHEET_HEIGHT,
    onClose,
  });

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [translateY]);

  const handleNext = () => {
    const selected = pastVideos.find((v) => v.id === selectedVideoId);
    if (selected) {
      onNext(selected);
    }
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
        {/* 드래그 핸들: 아래로 당기면 dismiss 호출 */}
        <View className="items-center mb-4" {...panHandlers}>
          <View className="w-10 h-1 bg-gray-200 rounded-full" />
        </View>

        {/* 닫기 버튼 (우측 상단) — dismiss로 애니메이션 닫기 */}
        <TouchableOpacity
          onPress={dismiss}
          style={{ position: 'absolute', top: 20, right: 20 }}
        >
          <Ionicons name="close" size={24} color="#8E949A" />
        </TouchableOpacity>

        {/*
          제목이 "과거 영상 선택"이었는데, 실제로 고르는 것은 구종별 최고의 1구입니다.
          구종당 하나뿐이므로 여기서 고르는 행위가 곧 "어느 구종과 비교할지"를 정하는 것이고,
          촬영 후 구종을 다시 묻지 않는 이유이기도 합니다.
        */}
        <Text className="text-text-primary text-xl font-bold mb-1">
          비교할 구종 선택
        </Text>
        <Text className="text-text-secondary text-sm mb-5">
          어느 구종의 최고의 1구와 비교할까요?
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
          {loading && (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3BC1A8" />
            </View>
          )}
          {!loading && pastVideos.length === 0 && (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              {error ? (
                <Text style={{ color: '#8E949A', fontSize: 13, textAlign: 'center' }}>
                  {error}
                </Text>
              ) : (
                <>
                  <Ionicons name="baseball-outline" size={36} color="#C4C9CF" />
                  <Text
                    style={{
                      color: '#1A1C20',
                      fontSize: 15,
                      fontWeight: '700',
                      marginTop: 12,
                      textAlign: 'center',
                    }}
                  >
                    아직 비교할 분석 기록이 없어요
                  </Text>
                  <Text
                    style={{
                      color: '#8E949A',
                      fontSize: 13,
                      lineHeight: 19,
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    투구를 분석하고 &apos;최고의 1구&apos;로 등록하면{'\n'}
                    그때부터 폼을 비교할 수 있어요.
                  </Text>

                  {/*
                    막다른 길을 만들지 않기 위한 출구.
                    비교할 대상이 없으면 이 모드에서는 할 수 있는 일이 없으므로,
                    지금 할 수 있는 일(프로 비교로 분석하기)로 데려다준다.
                  */}
                  {onSwitchToPro ? (
                    <TouchableOpacity
                      onPress={onSwitchToPro}
                      activeOpacity={0.85}
                      style={{
                        marginTop: 20,
                        backgroundColor: '#3BC1A8',
                        borderRadius: 14,
                        paddingVertical: 13,
                        paddingHorizontal: 22,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>
                        프로 비교로 먼저 분석하기
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          )}
          {pastVideos.map((video) => {
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

        {/*
          고를 대상이 하나도 없으면 "다음"은 눌러도 아무 일이 없다(handleNext가 그냥 반환).
          동작하지 않는 버튼을 남겨두면 사용자가 그걸 누르며 헤매게 되므로 아예 감춘다.
          이때의 출구는 위 빈 상태의 "프로 비교로 먼저 분석하기"다.
        */}
        {!loading && pastVideos.length === 0 ? null : (
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
        )}
      </Animated.View>
    </View>
  );
}
