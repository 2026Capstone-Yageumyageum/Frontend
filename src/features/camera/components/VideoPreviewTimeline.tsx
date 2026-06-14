/**
 * [VideoPreviewTimeline.tsx]
 * 영상 프리뷰 하단 타임라인 컴포넌트
 *
 * 구성:
 *   [──────브랜드색 진행바──────]
 *   00:22               01:21
 *
 * 부드러운 진행바 구현 원리:
 *   onPlaybackStatusUpdate는 약 250ms 간격으로 호출되므로
 *   그대로 쓰면 진행바가 뚝뚝 끊겨 보입니다.
 *
 *   해결책: currentTime prop이 바뀔 때마다 Animated.timing으로
 *   이전 값 → 새 값까지 250ms 동안 선형 보간(lerp)합니다.
 *   덕분에 업데이트 사이사이도 연속적으로 채워집니다.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

/** 초 → "MM:SS" 포맷 함수 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** onPlaybackStatusUpdate 호출 주기와 맞춘 보간 시간 (ms)
 *  expo-av 기본 업데이트 간격이 ~250ms이므로 동일하게 설정 */
const INTERPOLATION_DURATION_MS = 250;

interface VideoPreviewTimelineProps {
  /** 현재 재생 위치 (초) — onPlaybackStatusUpdate에서 전달 */
  currentTime: number;
  /** 영상 전체 길이 (초) */
  totalDuration: number;
}

export default function VideoPreviewTimeline({
  currentTime,
  totalDuration,
}: VideoPreviewTimelineProps) {
  // 0~1 사이의 진행 비율을 Animated.Value로 관리
  // 직접 width에 보간해 네이티브 드라이버 없이도 부드럽게 동작
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // totalDuration이 0이면 나누기 오류 방지
    if (totalDuration <= 0) return;

    const targetRatio = Math.min(currentTime / totalDuration, 1);

    // currentTime이 바뀔 때마다 목표값까지 선형 보간
    // duration을 업데이트 간격과 동일하게 설정해 딱 맞게 채워지도록 함
    Animated.timing(progressAnim, {
      toValue: targetRatio,
      duration: INTERPOLATION_DURATION_MS,
      useNativeDriver: false, // width(레이아웃 속성)는 네이티브 드라이버 미지원
    }).start();
  }, [currentTime, totalDuration, progressAnim]);

  // progressAnim(0~1)을 퍼센트 문자열로 변환
  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View className="px-4 pt-2 pb-1">
      {/* ── 진행 바 트랙 ── */}
      <View className="h-1 bg-white/20 rounded-full mb-2 overflow-hidden">
        <Animated.View
          className="h-full bg-brand rounded-full"
          style={{ width: widthInterpolated }}
        />
      </View>

      {/* ── 현재 재생 위치(동적) / 총 길이(고정) ── */}
      <View className="flex-row justify-between">
        {/* 좌측: 현재 재생 시간(00:00 → 현재)이 실시간 업데이트 */}
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(currentTime)}
        </Text>
        {/* 우측: 영상 총 길이 */}
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(totalDuration)}
        </Text>
      </View>
    </View>
  );
}
