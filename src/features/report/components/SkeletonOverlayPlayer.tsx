/**
 * [SkeletonOverlayPlayer.tsx]
 * 왼쪽: 내 영상(expo-av) 위에 스켈레톤을 오버레이한다.
 * 오른쪽: 프로 영상은 없으므로 어두운 배경 위에 프로 스켈레톤만 표시한다.
 *
 * 동기화:
 *  - 내 영상은 재생 위치(초)를 기준으로 skeleton time_sec에 가장 가까운 프레임을 그린다.
 *  - 프로는 영상이 없어 재생 진행률(0~1)에 비례해 프로 프레임을 스캔한다.
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Svg, { Line, Circle } from 'react-native-svg';
import AppText from '../../../components/common/AppText';
import {
  SkeletonFrame,
  SKELETON_EDGES,
  SKELETON_JOINTS,
  frameIndexAtTime,
} from '../utils/skeleton';

interface SkeletonOverlayPlayerProps {
  score: number;
  /** 내 로컬 영상 uri (분석 직후에만 존재). 없으면 영상 없이 스켈레톤만. */
  userVideoUri?: string;
  userFrames: SkeletonFrame[];
  proFrames: SkeletonFrame[];
  /** insight 탭처럼 단일(내 영상) 표시만 할지 */
  isSingleVideo?: boolean;
}

interface NaturalSize {
  width: number;
  height: number;
}

const CONFIDENCE_THRESHOLD = 0.1;

/** 정규화 좌표 → 박스 픽셀 좌표 변환 함수 */
type PointMapper = (x: number, y: number) => { px: number; py: number };

/**
 * 영상 위 오버레이용 매퍼.
 * 파이썬 좌표는 x·y 모두 max(width,height)로 나눈 값(pose_coordinates.normalize_frame_point).
 * 즉 정규화 좌표에 maxDim을 곱하면 원본 프레임 픽셀이 되고, 거기에 COVER 변환을 적용해 영상에 정렬한다.
 */
function buildVideoMapper(boxW: number, boxH: number, natural: NaturalSize | null): PointMapper {
  // 해상도 미수신 시 세로(≈9:16) 영상으로 가정해 maxDim=boxH로 근사
  const vidW = natural && natural.width > 0 ? natural.width : boxW;
  const vidH = natural && natural.height > 0 ? natural.height : boxH;
  const maxDim = Math.max(vidW, vidH);
  const coverScale = Math.max(boxW / vidW, boxH / vidH);
  const offsetX = (boxW - vidW * coverScale) / 2;
  const offsetY = (boxH - vidH * coverScale) / 2;
  return (x, y) => ({
    px: offsetX + x * maxDim * coverScale,
    py: offsetY + y * maxDim * coverScale,
  });
}

/**
 * 영상이 없는 스켈레톤(프로)용 매퍼.
 * 전체 프레임에서 관절 bounding box를 구해 박스 중앙에 배치하고, 종횡비를 유지한 채 박스의 85%에 맞춘다.
 * → 프로가 원본 프레임 어디에 있었든 항상 중앙에 통일되어 보인다(투구 동작은 그대로 유지).
 */
function buildFitMapper(boxW: number, boxH: number, frames: SkeletonFrame[]): PointMapper {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const frame of frames) {
    for (const joint of SKELETON_JOINTS) {
      const p = frame.points[joint];
      if (!p || p.confidence < CONFIDENCE_THRESHOLD) continue;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return (x, y) => ({ px: x * boxW, py: y * boxH });
  }
  const bboxW = Math.max(maxX - minX, 1e-6);
  const bboxH = Math.max(maxY - minY, 1e-6);
  const pad = 0.85;
  const scale = Math.min((boxW * pad) / bboxW, (boxH * pad) / bboxH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return (x, y) => ({
    px: boxW / 2 + (x - cx) * scale,
    py: boxH / 2 + (y - cy) * scale,
  });
}

/** 한 프레임의 스켈레톤을 SVG로 그린다. */
function SkeletonSvg({
  frame,
  boxW,
  boxH,
  mapPoint,
  color,
}: {
  frame: SkeletonFrame | null;
  boxW: number;
  boxH: number;
  mapPoint: PointMapper;
  color: string;
}) {
  if (!frame || boxW <= 0 || boxH <= 0) return null;

  const map = (jx: number, jy: number) => mapPoint(jx, jy);
  const isVisible = (joint: string): boolean => {
    const p = frame.points[joint];
    return !!p && p.confidence >= CONFIDENCE_THRESHOLD;
  };

  return (
    <Svg
      width={boxW}
      height={boxH}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {SKELETON_EDGES.map(([a, b], i) => {
        if (!isVisible(a) || !isVisible(b)) return null;
        const pa = map(frame.points[a].x, frame.points[a].y);
        const pb = map(frame.points[b].x, frame.points[b].y);
        return (
          <Line
            key={`e${i}`}
            x1={pa.px}
            y1={pa.py}
            x2={pb.px}
            y2={pb.py}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}
      {SKELETON_JOINTS.map((joint) => {
        if (!isVisible(joint)) return null;
        const p = map(frame.points[joint].x, frame.points[joint].y);
        return (
          <Circle key={joint} cx={p.px} cy={p.py} r={joint === 'nose' ? 4.5 : 3} fill={color} />
        );
      })}
    </Svg>
  );
}

export default function SkeletonOverlayPlayer({
  score,
  userVideoUri,
  userFrames,
  proFrames,
  isSingleVideo,
}: SkeletonOverlayPlayerProps) {
  const isGoodScore = score >= 70;
  const timelineColor = isGoodScore ? '#A3C8BC' : '#DCA876';

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [natural, setNatural] = useState<NaturalSize | null>(null);

  const [leftBox, setLeftBox] = useState({ w: 0, h: 0 });
  const [rightBox, setRightBox] = useState({ w: 0, h: 0 });

  const onLeftLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLeftBox({ w: width, h: height });
  };
  const onRightLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setRightBox({ w: width, h: height });
  };

  const handleStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionSec((status.positionMillis ?? 0) / 1000);
    if (status.durationMillis) setDurationSec(status.durationMillis / 1000);
    setIsPlaying(status.isPlaying ?? false);
  };

  // 영상 실제 해상도는 onReadyForDisplay로 전달된다(expo-av). COVER 좌표 매핑에 사용.
  const handleReadyForDisplay = (event: { naturalSize?: NaturalSize }) => {
    const ns = event?.naturalSize;
    if (ns?.width && ns?.height) {
      setNatural((prev) =>
        prev && prev.width === ns.width && prev.height === ns.height
          ? prev
          : { width: ns.width, height: ns.height },
      );
    }
  };

  const togglePlay = async () => {
    const ref = videoRef.current;
    if (!ref) return;
    if (isPlaying) await ref.pauseAsync();
    else await ref.playAsync();
  };

  // 내 스켈레톤: 재생 시간 기준 최근접 프레임
  const userFrame = useMemo<SkeletonFrame | null>(() => {
    if (userFrames.length === 0) return null;
    const i = frameIndexAtTime(userFrames, positionSec);
    return i >= 0 ? userFrames[i] : null;
  }, [userFrames, positionSec]);

  // 프로 스켈레톤: 진행률(0~1)에 비례해 프로 프레임 스캔(프로 영상 없음)
  const proFrame = useMemo<SkeletonFrame | null>(() => {
    if (proFrames.length === 0) return null;
    const progress = durationSec > 0 ? Math.min(1, positionSec / durationSec) : 0;
    const i = Math.round(progress * (proFrames.length - 1));
    return proFrames[i] ?? null;
  }, [proFrames, positionSec, durationSec]);

  // 내 스켈레톤: 영상에 정렬(COVER + maxDim 정규화)
  const userMapper = useMemo<PointMapper>(
    () => buildVideoMapper(leftBox.w, leftBox.h, userVideoUri ? natural : null),
    [leftBox.w, leftBox.h, natural, userVideoUri],
  );
  // 프로 스켈레톤: 전체 동작 bbox를 박스 중앙에 맞춤
  const proMapper = useMemo<PointMapper>(
    () => buildFitMapper(rightBox.w, rightBox.h, proFrames),
    [rightBox.w, rightBox.h, proFrames],
  );

  return (
    <View className="px-5 mt-4">
      <View className="flex-row justify-center mb-4">
        {/* 내 영상 + 스켈레톤 (왼쪽) */}
        <View
          onLayout={onLeftLayout}
          className={`${isSingleVideo ? 'w-[60%]' : 'flex-1 mr-2'} rounded-2xl bg-[#1A2421] overflow-hidden`}
          style={{ aspectRatio: 9 / 16 }}
        >
          {userVideoUri ? (
            <Video
              ref={videoRef}
              source={{ uri: userVideoUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted
              onPlaybackStatusUpdate={handleStatus}
              onReadyForDisplay={handleReadyForDisplay}
              progressUpdateIntervalMillis={100}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <AppText className="text-text-secondary text-xs">영상 없음</AppText>
            </View>
          )}
          <SkeletonSvg
            frame={userFrame}
            boxW={leftBox.w}
            boxH={leftBox.h}
            mapPoint={userMapper}
            color="#3BC1A8"
          />
        </View>

        {/* 프로 스켈레톤 (오른쪽) — insight 단일 표시일 땐 숨김 */}
        {!isSingleVideo && (
          <View
            onLayout={onRightLayout}
            className="flex-1 ml-2 rounded-2xl bg-[#191825] overflow-hidden"
            style={{ aspectRatio: 9 / 16 }}
          >
            <SkeletonSvg
              frame={proFrame}
              boxW={rightBox.w}
              boxH={rightBox.h}
              mapPoint={proMapper}
              color="#C9A8FF"
            />
            <View className="absolute bottom-1 left-0 right-0 items-center">
              <AppText className="text-text-secondary text-[10px]">프로 스켈레톤</AppText>
            </View>
          </View>
        )}
      </View>

      {/* 컨트롤 및 타임라인 */}
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={togglePlay}
          disabled={!userVideoUri}
          className="w-10 h-10 rounded-full bg-[#A3C8BC] items-center justify-center mr-3 border-2 border-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            opacity: userVideoUri ? 1 : 0.4,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color="white"
            style={{ marginLeft: isPlaying ? 0 : 3 }}
          />
        </TouchableOpacity>

        {/* 진행 바 */}
        <View className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: timelineColor,
              width: durationSec > 0 ? `${Math.min(100, (positionSec / durationSec) * 100)}%` : '0%',
            }}
          />
        </View>
      </View>
    </View>
  );
}
