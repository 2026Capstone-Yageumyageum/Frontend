/**
 * [VideoTrimmerTimeline.tsx]
 * 카메라_프로_4: 영상 트리밍 화면의 하단 타임라인 컴포넌트
 *
 * 디자인 구성:
 * ┌─────────────────────────────────────────────────┐
 * │ | ████░░░░░█████░░░████░░░░█████░░░ |           │ ← 브랜드색 트랙 + 필름 프레임
 * │00:00:00                       00:00:01           │ ← 타임스탬프
 * └─────────────────────────────────────────────────┘
 *
 * 컴포넌트 구조:
 * - 브랜드 컬러 둥근 사각형 트랙 (전체 너비)
 * - 좌측/우측 핸들: 흰색 수직 바 (|)
 * - 중앙: 흰색 커서 라인 (현재 위치)
 * - 내부: 어두운 필름 프레임 세그먼트 표현
 *
 * 향후 개선 포인트:
 * - PanResponder 또는 react-native-gesture-handler로 핸들 드래그 구현
 * - 실제 영상 프레임 썸네일 표시 (expo-video-thumbnails 라이브러리)
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRACK_HEIGHT = 52;
const HANDLE_WIDTH = 4;

/** 초 → "HH:MM:SS" 포맷 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

interface VideoTrimmerTimelineProps {
  /** 영상 전체 길이 (초) */
  totalDuration: number;
  /** 트리밍 시작 시간 (초) — 핸들 위치 계산에 사용 */
  trimStart: number;
  /** 트리밍 끝 시간 (초) — 핸들 위치 계산에 사용 */
  trimEnd: number;
  /** 현재 재생 커서 위치 (초) */
  currentTime?: number;
}

// 필름 프레임 세그먼트 수 (시각적 효과용)
const FILM_SEGMENTS = 8;

export default function VideoTrimmerTimeline({
  totalDuration,
  trimStart,
  trimEnd,
  currentTime = 0,
}: VideoTrimmerTimelineProps) {
  // 커서 위치 비율 (0~1)
  const cursorRatio = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <View className="px-4">
      {/* ── 트림 트랙 ── */}
      <View
        style={{
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: '#3BC1A8',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── 필름 프레임 세그먼트 (어두운 구역) ── */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: HANDLE_WIDTH + 6,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: FILM_SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: TRACK_HEIGHT - 14,
                // 홀수/짝수 세그먼트 교대로 어두운 색 → 필름 프레임 느낌
                backgroundColor:
                  i % 2 === 0
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(0,0,0,0.25)',
                marginHorizontal: 1.5,
                borderRadius: 3,
              }}
            />
          ))}
        </View>

        {/* ── 좌측 핸들 (흰색 수직 바) ── */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 20,
            backgroundColor: '#3BC1A8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: HANDLE_WIDTH,
              height: TRACK_HEIGHT * 0.55,
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          />
        </View>

        {/* ── 우측 핸들 (흰색 수직 바) ── */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 20,
            backgroundColor: '#3BC1A8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: HANDLE_WIDTH,
              height: TRACK_HEIGHT * 0.55,
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          />
        </View>

        {/* ── 현재 재생 커서 (흰색 얇은 라인) ── */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            // 핸들 영역(20px) 제외한 트랙 너비 내에서 비율 적용
            left: 20 + cursorRatio * (SCREEN_WIDTH - 32 - 40),
            width: 2,
            backgroundColor: 'white',
          }}
        />
      </View>

      {/* ── 타임스탬프 ── */}
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(trimStart)}
        </Text>
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(trimEnd > 0 ? trimEnd : totalDuration)}
        </Text>
      </View>
    </View>
  );
}
