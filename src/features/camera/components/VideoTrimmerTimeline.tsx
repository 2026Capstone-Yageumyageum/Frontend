/**
 * [VideoTrimmerTimeline.tsx]
 * 영상 트리밍 타임라인 — 드래그 가능한 핸들로 실제 편집 지원
 *
 * ── 핵심 기능 ─────────────────────────────────────────────────────────────
 *  ① 좌측 핸들 드래그 → trimStart 변경 + 비디오 해당 시간으로 탐색
 *  ② 우측 핸들 드래그 → trimEnd 변경 + 비디오 해당 시간으로 탐색
 *  ③ 트림 선택 영역 하이라이트 (브랜드 컬러 테두리 + 반투명 배경)
 *  ④ 현재 재생 커서 (흰색 얇은 바)
 *  ⑤ 하단 타임스탬프 (시작 / 선택 구간 / 끝)
 *
 * ── 구현 방식 ─────────────────────────────────────────────────────────────
 *  - PanResponder: React Native 내장 제스처 핸들러 (추가 라이브러리 불필요)
 *  - 클로저 최신값 보장: 모든 동적 값은 useRef로 관리 (stale closure 방지)
 *  - seek 쓰로틀링: 100ms마다 최대 1회 탐색 (과도한 seek 콜 방지)
 *  - 최소 트림 구간: 1초 (trimStart ≥ trimEnd 방지)
 */

import React, { useRef } from 'react';
import { View, Text, PanResponder, useWindowDimensions } from 'react-native';

// ── 상수 ────────────────────────────────────────────────────────────────────
const TRACK_HEIGHT = 56;       // 트랙 높이 (px)
const HANDLE_WIDTH = 22;       // 핸들 너비 (px)
const HANDLE_TOUCH_EXTRA = 16; // 핸들 터치 영역 확장 (px, 좌우 각각)
const FILM_SEGMENTS = 10;      // 필름 프레임 세그먼트 수 (시각 효과)
const MIN_TRIM_SEC = 1;        // 최소 트리밍 구간 (초)
const SEEK_THROTTLE_MS = 100;  // seek 쓰로틀링 간격 (ms)

/** 초 → "HH:MM:SS" 포맷 변환 */
function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ── Props 타입 ──────────────────────────────────────────────────────────────
interface VideoTrimmerTimelineProps {
  /** 영상 전체 길이 (초) */
  totalDuration: number;
  /** 현재 트리밍 시작 시간 (초) */
  trimStart: number;
  /** 현재 트리밍 끝 시간 (초) */
  trimEnd: number;
  /** 현재 재생 커서 위치 (초) */
  currentTime?: number;
  /** 핸들 드래그 시 트림 범위 변경 콜백 */
  onTrimChange?: (startSec: number, endSec: number) => void;
  /** 특정 시간으로 비디오 탐색 요청 콜백 */
  onSeekRequest?: (seconds: number) => void;
}

export default function VideoTrimmerTimeline({
  totalDuration,
  trimStart,
  trimEnd,
  currentTime = 0,
  onTrimChange,
  onSeekRequest,
}: VideoTrimmerTimelineProps) {
  const { width } = useWindowDimensions();

  // 화면 양쪽 px-4 패딩을 제외한 실제 트랙 너비
  const TRACK_WIDTH = width - 32;

  // ── PanResponder 클로저 안에서 항상 최신값 참조하기 위한 ref ──────────────
  // (useRef 값은 렌더와 무관하게 최신 상태 유지)
  const trimStartRef = useRef(trimStart);
  const trimEndRef = useRef(trimEnd);
  const totalDurationRef = useRef(totalDuration);
  const onTrimChangeRef = useRef(onTrimChange);
  const onSeekRequestRef = useRef(onSeekRequest);

  // 렌더마다 ref를 최신 prop 값으로 동기화
  trimStartRef.current = trimStart;
  trimEndRef.current = trimEnd;
  totalDurationRef.current = totalDuration;
  onTrimChangeRef.current = onTrimChange;
  onSeekRequestRef.current = onSeekRequest;

  // 드래그 시작 시점의 값 저장 (드래그 delta 계산에 사용)
  const leftDragStartSec = useRef(trimStart);
  const rightDragStartSec = useRef(trimEnd);

  // seek 쓰로틀링용 타임스탬프 ref
  const lastSeekTimeRef = useRef(0);

  // ── 픽셀 ↔ 초 변환 헬퍼 ─────────────────────────────────────────────────
  // dx(픽셀 이동량) → 시간 변화량(초)
  const dxToSec = (dx: number) =>
    totalDurationRef.current > 0
      ? (dx / TRACK_WIDTH) * totalDurationRef.current
      : 0;

  // 초 → 트랙 내 픽셀 위치
  const secToX = (sec: number) =>
    totalDurationRef.current > 0
      ? (sec / totalDurationRef.current) * TRACK_WIDTH
      : 0;

  // 쓰로틀링된 seek 호출
  const throttledSeek = (seconds: number) => {
    const now = Date.now();
    if (now - lastSeekTimeRef.current >= SEEK_THROTTLE_MS) {
      lastSeekTimeRef.current = now;
      onSeekRequestRef.current?.(seconds);
    }
  };

  // ── 좌측 핸들 PanResponder ─────────────────────────────────────────────────
  // trimStart를 드래그로 조절 (0 ~ trimEnd - MIN_TRIM_SEC 범위)
  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // 드래그 시작 시점의 trimStart 스냅샷
        leftDragStartSec.current = trimStartRef.current;
      },
      onPanResponderMove: (_, { dx }) => {
        const newStart = leftDragStartSec.current + dxToSec(dx);
        // 범위 클램핑: 0 이상, trimEnd - 최소구간 이하
        const clamped = Math.max(
          0,
          Math.min(newStart, trimEndRef.current - MIN_TRIM_SEC)
        );
        onTrimChangeRef.current?.(clamped, trimEndRef.current);
        throttledSeek(clamped);
      },
      onPanResponderRelease: (_, { dx }) => {
        // 릴리즈 시 최종값으로 정확한 seek 실행
        const newStart = leftDragStartSec.current + dxToSec(dx);
        const clamped = Math.max(
          0,
          Math.min(newStart, trimEndRef.current - MIN_TRIM_SEC)
        );
        onSeekRequestRef.current?.(clamped);
      },
    })
  ).current;

  // ── 우측 핸들 PanResponder ─────────────────────────────────────────────────
  // trimEnd를 드래그로 조절 (trimStart + MIN_TRIM_SEC ~ totalDuration 범위)
  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // 드래그 시작 시점의 trimEnd 스냅샷
        rightDragStartSec.current = trimEndRef.current;
      },
      onPanResponderMove: (_, { dx }) => {
        const newEnd = rightDragStartSec.current + dxToSec(dx);
        // 범위 클램핑: trimStart + 최소구간 이상, totalDuration 이하
        const clamped = Math.min(
          totalDurationRef.current,
          Math.max(newEnd, trimStartRef.current + MIN_TRIM_SEC)
        );
        onTrimChangeRef.current?.(trimStartRef.current, clamped);
        throttledSeek(clamped);
      },
      onPanResponderRelease: (_, { dx }) => {
        const newEnd = rightDragStartSec.current + dxToSec(dx);
        const clamped = Math.min(
          totalDurationRef.current,
          Math.max(newEnd, trimStartRef.current + MIN_TRIM_SEC)
        );
        onSeekRequestRef.current?.(clamped);
      },
    })
  ).current;

  // ── 렌더링 위치 계산 ────────────────────────────────────────────────────────
  const leftX = secToX(trimStart);                    // 좌측 핸들 x 좌표
  const rightX = secToX(trimEnd);                     // 우측 핸들 x 좌표
  const cursorX = secToX(currentTime);                // 재생 커서 x 좌표
  const selectedDuration = Math.max(0, trimEnd - trimStart); // 선택된 구간 길이

  return (
    <View style={{ paddingHorizontal: 16 }}>

      {/* ── 트랙 컨테이너 ──────────────────────────────────────────────────── */}
      <View
        style={{
          height: TRACK_HEIGHT,
          position: 'relative',
          // overflow: 'visible' → 핸들이 트랙 위아래로 살짝 돌출될 수 있도록
        }}
      >

        {/* ① 트랙 배경 + 필름 프레임 세그먼트 */}
        <View
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 0,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              paddingHorizontal: 4,
              alignItems: 'center',
            }}
          >
            {Array.from({ length: FILM_SEGMENTS }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: TRACK_HEIGHT - 12,
                  // 홀수/짝수 교대로 어두운 색 → 필름 프레임 시각 효과
                  backgroundColor:
                    i % 2 === 0 ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)',
                  marginHorizontal: 1.5,
                  borderRadius: 3,
                }}
              />
            ))}
          </View>
        </View>

        {/* ② 트림 선택 영역 하이라이트 (브랜드 컬러 테두리) */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: leftX,
            width: Math.max(0, rightX - leftX),
            borderTopWidth: 2.5,
            borderBottomWidth: 2.5,
            borderColor: '#3BC1A8',
            backgroundColor: 'rgba(59, 193, 168, 0.18)',
          }}
          pointerEvents="none"
        />

        {/* ③ 현재 재생 커서 (흰색 라인, 트랙 위아래 살짝 돌출) */}
        <View
          style={{
            position: 'absolute',
            top: -5,
            bottom: -5,
            left: cursorX - 1,
            width: 2.5,
            backgroundColor: 'white',
            borderRadius: 2,
          }}
          pointerEvents="none"
        />

        {/* ④ 좌측 핸들 (드래그 가능) */}
        <View
          {...leftPanResponder.panHandlers}
          style={{
            position: 'absolute',
            top: -6,
            bottom: -6,
            // 터치 영역: 핸들 너비 + 양쪽 확장 영역
            left: leftX - HANDLE_WIDTH / 2 - HANDLE_TOUCH_EXTRA / 2,
            width: HANDLE_WIDTH + HANDLE_TOUCH_EXTRA,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          {/* 시각적 핸들 바 */}
          <View
            style={{
              width: HANDLE_WIDTH,
              height: TRACK_HEIGHT + 12,
              backgroundColor: '#3BC1A8',
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 핸들 내부 그립 라인 */}
            <View
              style={{
                width: 3,
                height: '45%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* ⑤ 우측 핸들 (드래그 가능) */}
        <View
          {...rightPanResponder.panHandlers}
          style={{
            position: 'absolute',
            top: -6,
            bottom: -6,
            left: rightX - HANDLE_WIDTH / 2 - HANDLE_TOUCH_EXTRA / 2,
            width: HANDLE_WIDTH + HANDLE_TOUCH_EXTRA,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <View
            style={{
              width: HANDLE_WIDTH,
              height: TRACK_HEIGHT + 12,
              backgroundColor: '#3BC1A8',
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 3,
                height: '45%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
              }}
            />
          </View>
        </View>

      </View>
      {/* ── 트랙 컨테이너 끝 ── */}

      {/* ── 하단 타임스탬프 ──────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
          paddingHorizontal: 2,
        }}
      >
        {/* 트리밍 시작 시간 */}
        <Text
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: '500',
          }}
        >
          {formatTime(trimStart)}
        </Text>

        {/* 선택된 구간 길이 (중앙, 브랜드 컬러 강조) */}
        <Text
          style={{
            color: '#3BC1A8',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.3,
          }}
        >
          {formatTime(selectedDuration)} 선택됨
        </Text>

        {/* 트리밍 끝 시간 */}
        <Text
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: '500',
          }}
        >
          {formatTime(trimEnd > 0 ? trimEnd : totalDuration)}
        </Text>
      </View>

    </View>
  );
}
