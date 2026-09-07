/**
 * [SkeletonOverlayPlayer.tsx]
 * 왼쪽: 내 영상(expo-av) 위에 스켈레톤을 오버레이한다.
 * 오른쪽: 프로 영상은 없으므로 어두운 배경 위에 프로 스켈레톤만 표시한다.
 *
 * 동기화:
 *  - 내 영상은 재생 위치(초)를 기준으로 skeleton time_sec에 가장 가까운 프레임을 그린다.
 *  - 프로는 영상이 없어 재생 진행률(0~1)에 비례해 프로 프레임을 스캔한다.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  frameNearestFrameIndex,
  timeAtFrameIndex,
} from '../utils/skeleton';
import { PhaseSpan, alignToCompareFrame } from '../utils/motionAlign';

/** 재생 배속 옵션 — 사용자 영상·프로 스켈레톤에 동일 적용(같은 속도끼리 비교). */
const SPEED_OPTIONS = [1, 0.5, 0.25] as const;

/** 재생 바를 색으로 나누고, 프로 스켈레톤을 사용자 동작에 맞춰 워프하기 위한 단계 구간 */
export interface PhaseSegment {
  phase: string;
  label: string;
  /** 내 영상 기준 프레임 구간 */
  startFrame: number;
  endFrame: number;
  /** 프로 영상 기준 대응 프레임 구간(리샘플링용) */
  proStartFrame: number;
  proEndFrame: number;
}

/** 단계별 색상 (파이썬 phase 코드 기준) */
const PHASE_COLORS: Record<string, string> = {
  windup: '#94A3B8',
  leg_lift: '#38BDF8',
  stride: '#34D399',
  acceleration: '#FBBF24',
  follow_through: '#F472B6',
};
const PHASE_FALLBACK_COLOR = '#64748B';

interface SkeletonOverlayPlayerProps {
  score: number;
  /** 내 로컬 영상 uri (분석 직후에만 존재). 없으면 영상 없이 스켈레톤만. */
  userVideoUri?: string;
  userFrames: SkeletonFrame[];
  proFrames: SkeletonFrame[];
  /** 투구 단계 구간 — 재생 바를 단계별 색으로 나눈다 */
  phases?: PhaseSegment[];
  /** insight 탭처럼 단일(내 영상) 표시만 할지 */
  isSingleVideo?: boolean;
  /** 선택된 비교 프로 id — 바뀌면 영상을 처음으로 되감고 정지한다 */
  comparePlayerId?: string;
  /** 오른쪽(비교 대상) 박스 라벨. 프로 비교="프로 스켈레톤", 최고의 1구 비교="최고의 1구" */
  compareLabel?: string;
  /** 페이즈 바의 짧은 라벨(24px). 프로="프로", 최고의 1구="베스트" */
  compareShortLabel?: string;
  /**
   * 외부에서 특정 프레임으로 이동을 요청할 때 쓴다.
   * 같은 프레임을 다시 눌러도 동작해야 하므로 nonce로 변화를 알린다.
   */
  seekRequest?: { frame: number; nonce: number };
  /** 구간별 사용자↔비교 프레임 대응. 비면 실시간 정렬로 폴백한다. */
  alignmentSpans?: PhaseSpan[];
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
  const pad = 0.92; // 박스를 거의 꽉 채우도록
  const scale = Math.min((boxW * pad) / bboxW, (boxH * pad) / bboxH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return (x, y) => ({
    px: boxW / 2 + (x - cx) * scale,
    py: boxH / 2 + (y - cy) * scale,
  });
}

interface PhaseBand {
  phase: string;
  label: string;
  start: number;
  end: number;
  color: string;
}

/** 라벨 + 단계 색 구간 + 현재 위치 인디케이터로 구성된 페이즈 바 한 줄. */
function PhaseBar({
  label,
  bands,
  progressPct,
  fallbackColor,
}: {
  label: string;
  bands: PhaseBand[];
  progressPct: number;
  fallbackColor: string;
}) {
  return (
    <View className="flex-row items-center mb-1.5">
      <AppText className="text-text-secondary" style={{ width: 24, fontSize: 9 }}>
        {label}
      </AppText>
      <View className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden relative">
        {bands.length > 0 ? (
          <>
            {bands.map((b, i) => (
              <View
                key={`${b.phase}-${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${b.start * 100}%`,
                  width: `${(b.end - b.start) * 100}%`,
                  backgroundColor: b.color,
                  opacity: 0.9,
                }}
              />
            ))}
            <View
              style={{
                position: 'absolute',
                top: -2,
                bottom: -2,
                left: `${progressPct}%`,
                width: 2.5,
                backgroundColor: '#FFFFFF',
              }}
            />
          </>
        ) : (
          <View
            className="h-full rounded-full"
            style={{ backgroundColor: fallbackColor, width: `${progressPct}%` }}
          />
        )}
      </View>
    </View>
  );
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
  phases = [],
  isSingleVideo,
  comparePlayerId,
  compareLabel = '프로 스켈레톤',
  compareShortLabel = '프로',
  seekRequest,
  alignmentSpans,
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

  // 재생 배속(1x/0.5x/0.25x). 사용자·프로 모두 같은 positionSec 시계로 구동되므로
  // 배속을 바꾸면 두 쪽이 동일하게 느려지거나 실시간으로 재생된다.
  const [speedIdx, setSpeedIdx] = useState(0);
  const speed = SPEED_OPTIONS[speedIdx];
  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEED_OPTIONS.length);

  // 동작 정렬이 기본이다. 점수가 구간 진행률로 비교하므로 화면도 같은 기준을 써야
  // 사용자가 보는 것과 점수가 말하는 것이 일치한다. 실시간은 템포 차이를 보는 용도로 남긴다.
  const [alignMotion, setAlignMotion] = useState(true);

  const hasVideo = !!userVideoUri;
  // 스켈레톤 자체의 재생 길이(초). 영상이 없을 때(피드)나 영상 로드 전 타임축 기준으로 쓴다.
  const skeletonDuration = useMemo(
    () => (userFrames.length > 0 ? userFrames[userFrames.length - 1].timeSec : 0),
    [userFrames],
  );
  // 페이즈 바·동기화의 공통 타임축: 영상이 있으면 영상 길이, 없으면 스켈레톤 길이.
  const totalSec = hasVideo && durationSec > 0 ? durationSec : skeletonDuration;

  // 분석된(트림 반영된) 스켈레톤의 실제 시간 구간. 영상도 이 구간만 재생/반복한다.
  // (트림했는데 영상은 끝까지 나오던 문제 수정 — 스켈레톤이 있는 구간만 보여줌)
  const playRange = useMemo(() => {
    if (userFrames.length === 0) return null;
    const start = userFrames[0].timeSec;
    const end = userFrames[userFrames.length - 1].timeSec;
    return end > start ? { start, end } : null;
  }, [userFrames]);
  const didSeekStartRef = useRef(false);
  useEffect(() => {
    // 영상/구간이 바뀌거나, 모드 전환으로 영상이 리마운트되면 시작점 시킹을 다시 수행
    didSeekStartRef.current = false;
  }, [userVideoUri, playRange?.start, playRange?.end, isSingleVideo]);

  // 비교 선수를 바꾸면 사용자 영상을 처음으로 되감고 정지한다.
  // (재생 중 선수를 바꾸면 두 동작이 어긋난 채로 진행되던 문제 → 같은 출발선에서 다시 시작 준비)
  useEffect(() => {
    const startSec = playRange ? playRange.start : 0;
    setIsPlaying(false);
    setPositionSec(startSec);
    didSeekStartRef.current = true; // 방금 시작점으로 맞췄으니 handleStatus의 중복 시킹 방지
    if (hasVideo && videoRef.current) {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setPositionAsync(startSec * 1000).catch(() => {});
    }
    // 선수 변경에만 반응(playRange·hasVideo는 현재값을 읽기만 함)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparePlayerId]);

  // 영상이 없으면(피드 등) 가상 클럭으로 재생 위치를 진행시켜 스켈레톤을 애니메이션한다.
  useEffect(() => {
    if (hasVideo) return; // 영상이 있으면 영상 재생 상태가 위치를 구동
    if (!isPlaying || skeletonDuration <= 0) return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const step = ((now - last) / 1000) * speed; // 배속 반영
      last = now;
      setPositionSec((p) => (p + step >= skeletonDuration ? 0 : p + step)); // 끝에서 루프
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasVideo, isPlaying, skeletonDuration, speed]);

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
    const posSec = (status.positionMillis ?? 0) / 1000;
    const startMs = (playRange ? playRange.start : 0) * 1000;

    // 최초 1회: 분석 구간 시작으로 이동(트림 시 앞쪽 idle 건너뜀)
    if (playRange && !didSeekStartRef.current) {
      didSeekStartRef.current = true;
      videoRef.current?.setPositionAsync(startMs);
    }

    // 끝 도달 시 시작으로 되감아 무한 반복:
    //  ① 분석 구간 끝(트림) 도달  ② 영상 진짜 끝(didJustFinish)에서 멈춘 경우 재생 재개
    const hitRangeEnd = playRange != null && (status.isPlaying ?? false) && posSec >= playRange.end;
    if (status.didJustFinish || hitRangeEnd) {
      videoRef.current?.setPositionAsync(startMs);
      if (status.didJustFinish) videoRef.current?.playAsync();
      setPositionSec(playRange ? playRange.start : 0);
      setIsPlaying(true);
      return;
    }

    setPositionSec(posSec);
    if (status.durationMillis) setDurationSec(status.durationMillis / 1000);
    // 버퍼링이나 되감기(setPositionAsync) 중에는 expo-av가 일시적으로 isPlaying=false를
    // 보고한다. 그대로 반영하면 재생은 계속되는데 버튼 아이콘만 재생↔일시정지로 깜빡인다.
    // 이 컴포넌트는 playRange 끝에서 매번 되감으므로 특히 자주 걸린다.
    // 그래서 "재생 의도"(shouldPlay)도 함께 본다. 진짜 정지는 위 didJustFinish 분기와
    // 사용자의 일시정지(pauseAsync → shouldPlay=false)로만 일어난다.
    setIsPlaying((status.isPlaying ?? false) || (status.shouldPlay ?? false));
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
    if (hasVideo) {
      const ref = videoRef.current;
      if (!ref) return;
      if (isPlaying) await ref.pauseAsync();
      else await ref.playAsync();
    } else {
      // 영상 없음: 가상 클럭 토글(스켈레톤만 재생)
      setIsPlaying((p) => !p);
    }
  };

  // 단계 텍스트 탭 → 그 단계의 내 시작 프레임 시각으로 이동.
  // (내 영상은 그 시점으로, 프로는 같은 동작 진행도 f로 리샘플되어 함께 점프)
  const seekToPhase = async (startFrame: number) => {
    const t = timeAtFrameIndex(userFrames, startFrame);
    if (t == null) return;
    if (hasVideo && videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(t * 1000);
      } catch {
        /* seek 실패는 무시 */
      }
    }
    setPositionSec(t);
  };

  // 외부(구간 지표의 "이 순간 보기")에서 온 이동 요청 처리.
  // seekToPhase는 이미 프레임 → 시간 변환과 영상 seek를 담당하므로 그대로 재사용한다.
  useEffect(() => {
    if (!seekRequest) return;
    void seekToPhase(seekRequest.frame);
    // nonce가 바뀔 때만 반응한다. frame이 같아도 다시 눌렀다면 이동해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekRequest?.nonce]);

  // 내 스켈레톤: 재생 시간 기준 최근접 프레임
  const userFrame = useMemo<SkeletonFrame | null>(() => {
    if (userFrames.length === 0) return null;
    const i = frameIndexAtTime(userFrames, positionSec);
    return i >= 0 ? userFrames[i] : null;
  }, [userFrames, positionSec]);

  // 유효한 단계들(동작 구간 정규화의 기준). 편집/idle 여부와 무관하게 "동작 구간"만 사용.
  const phaseFrames = useMemo(
    () =>
      phases
        .filter((p) => p.endFrame > p.startFrame)
        .sort((a, b) => a.startFrame - b.startFrame),
    [phases],
  );
  // 내 동작 구간(첫 단계 시작 ~ 마지막 단계 끝, 내 프레임 기준)
  const userMotion = useMemo(() => {
    if (phaseFrames.length === 0) return null;
    const start = Math.min(...phaseFrames.map((p) => p.startFrame));
    const end = Math.max(...phaseFrames.map((p) => p.endFrame));
    return end > start ? { start, end } : null;
  }, [phaseFrames]);
  // 프로 동작 구간(프로 프레임 기준)
  const proMotion = useMemo(() => {
    if (phaseFrames.length === 0) return null;
    const start = Math.min(...phaseFrames.map((p) => p.proStartFrame));
    const end = Math.max(...phaseFrames.map((p) => p.proEndFrame));
    return end > start ? { start, end } : null;
  }, [phaseFrames]);

  // 동작 구간을 '시간(초)'으로 환산 — 프로를 사용자 진행도에 워프하지 않고
  // 실제 타이밍으로 재생하기 위함(슬로우모션처럼 늘어나던 문제 해소).
  const userMotionTime = useMemo(() => {
    if (!userMotion) return null;
    const start = timeAtFrameIndex(userFrames, userMotion.start);
    const end = timeAtFrameIndex(userFrames, userMotion.end);
    return start != null && end != null && end > start ? { start, end } : null;
  }, [userMotion, userFrames]);
  const proMotionTime = useMemo(() => {
    if (!proMotion) return null;
    const start = timeAtFrameIndex(proFrames, proMotion.start);
    const end = timeAtFrameIndex(proFrames, proMotion.end);
    return start != null && end != null && end > start ? { start, end } : null;
  }, [proMotion, proFrames]);

  // 공통 동작 진행도 f(0~1): 내 영상 현재 프레임을 내 동작 구간으로 정규화.
  // (idle 구간에서는 0 또는 1로 클램프 → 동작이 끝나면 양쪽 바·프로가 끝에서 정지)
  const motionF = useMemo(() => {
    if (!userMotion || !userFrame) return 0;
    return Math.max(
      0,
      Math.min(1, (userFrame.frameIndex - userMotion.start) / (userMotion.end - userMotion.start)),
    );
  }, [userMotion, userFrame]);

  // 프로 스켈레톤: 사용자 동작 진행도에 워프하지 않고, 사용자 동작이 시작되는 시점에
  // 맞춰 프로의 '실제 타이밍'으로 재생한다. positionSec(배속이 반영된 영상 시계)을
  // 그대로 쓰므로 배속을 바꾸면 사용자·프로가 동일하게 느려지거나 실시간으로 재생된다.
  const proFrame = useMemo<SkeletonFrame | null>(() => {
    if (proFrames.length === 0) return null;

    // 동작 정렬: 점수와 같은 구간 진행률 대응을 쓴다.
    if (alignMotion && alignmentSpans && alignmentSpans.length > 0 && userFrames.length > 0) {
      const ui = frameIndexAtTime(userFrames, positionSec);
      if (ui >= 0) {
        const aligned = alignToCompareFrame(userFrames[ui].frameIndex, alignmentSpans);
        if (aligned != null) {
          return frameNearestFrameIndex(proFrames, aligned);
        }
      }
    }

    if (proMotionTime && userMotionTime) {
      const elapsed = Math.max(0, positionSec - userMotionTime.start);
      const proT = Math.min(proMotionTime.start + elapsed, proMotionTime.end);
      const i = frameIndexAtTime(proFrames, proT);
      return i >= 0 ? proFrames[i] : null;
    }
    // 동작 구간 정보가 없으면 재생 시간에 가장 가까운 프로 프레임(자연 속도)
    const i = frameIndexAtTime(proFrames, positionSec);
    return i >= 0 ? proFrames[i] : null;
  }, [
    proFrames,
    proMotionTime,
    userMotionTime,
    positionSec,
    alignMotion,
    alignmentSpans,
    userFrames,
  ]);

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

  // 내 영상+스켈레톤 확대: 사용자 스켈레톤 bbox가 박스를 거의 채우도록 줌 배율/이동을 계산.
  // 영상과 오버레이를 같은 wrapper에 묶어 같은 transform을 적용하므로 둘의 정렬은 항상 유지된다.
  const userZoom = useMemo(() => {
    if (leftBox.w <= 0 || leftBox.h <= 0 || userFrames.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const f of userFrames) {
      for (const j of SKELETON_JOINTS) {
        const p = f.points[j];
        if (!p || p.confidence < CONFIDENCE_THRESHOLD) continue;
        const { px, py } = userMapper(p.x, p.y);
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
    if (!Number.isFinite(minX)) return null;
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const fit = Math.min((leftBox.w * 0.72) / bw, (leftBox.h * 0.72) / bh);
    const scale = Math.max(1, Math.min(fit, 2)); // 확대만, 원래보단 크게/지금보단 작게(최대 2배)
    // 이동량을 "확대로 생긴 여유" 안으로 제한 → 영상이 박스를 항상 덮어 검은 여백이 안 생김.
    // (transform 합성 순서와 무관하게 안전하도록 보수적으로 /scale 까지 적용)
    const maxTx = scale > 1 ? ((scale - 1) * leftBox.w) / (2 * scale) : 0;
    const maxTy = scale > 1 ? ((scale - 1) * leftBox.h) / (2 * scale) : 0;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    return {
      scale,
      tx: clamp(leftBox.w / 2 - cx, maxTx),
      ty: clamp(leftBox.h / 2 - cy, maxTy),
    };
  }, [userFrames, userMapper, leftBox.w, leftBox.h]);

  // 각 단계 구간을 "동작 구간" 기준 0~1로 정규화한 바 데이터(나 / 프로 따로).
  const userBands = useMemo(() => {
    if (!userMotion) return [];
    const len = userMotion.end - userMotion.start;
    return phaseFrames.map((p) => ({
      phase: p.phase,
      label: p.label || p.phase,
      start: Math.max(0, Math.min(1, (p.startFrame - userMotion.start) / len)),
      end: Math.max(0, Math.min(1, (p.endFrame - userMotion.start) / len)),
      color: PHASE_COLORS[p.phase] ?? PHASE_FALLBACK_COLOR,
    }));
  }, [phaseFrames, userMotion]);
  const proBands = useMemo(() => {
    if (!proMotion) return [];
    const len = proMotion.end - proMotion.start;
    return phaseFrames.map((p) => ({
      phase: p.phase,
      label: p.label || p.phase,
      start: Math.max(0, Math.min(1, (p.proStartFrame - proMotion.start) / len)),
      end: Math.max(0, Math.min(1, (p.proEndFrame - proMotion.start) / len)),
      color: PHASE_COLORS[p.phase] ?? PHASE_FALLBACK_COLOR,
    }));
  }, [phaseFrames, proMotion]);

  // 진행 인디케이터 위치(%): 동작 구간이 있으면 f, 없으면 재생 진행률 폴백.
  const progressPct = userMotion
    ? Math.min(100, motionF * 100)
    : totalSec > 0
      ? Math.min(100, (positionSec / totalSec) * 100)
      : 0;

  // 프로 진행 바: 프로의 실제 타이밍 기준 진행도(사용자와 길이가 달라 따로 계산).
  const proProgressPct = useMemo(() => {
    if (proMotionTime && userMotionTime) {
      const elapsed = Math.max(0, positionSec - userMotionTime.start);
      const dp = proMotionTime.end - proMotionTime.start;
      return dp > 0 ? Math.min(100, (elapsed / dp) * 100) : 0;
    }
    return progressPct;
  }, [proMotionTime, userMotionTime, positionSec, progressPct]);

  return (
    <View className="px-5 mt-4">
      {/* 모드(단일/비교)가 바뀌면 좌우 박스 크기가 달라진다. key로 리마운트시켜
          onLayout이 현재 모드 크기로 다시 측정되게 한다(이전 모드 크기 잔류 방지). */}
      <View key={isSingleVideo ? 'single' : 'double'} className="flex-row justify-center mb-4">
        {/* 내 영상 + 스켈레톤 (왼쪽) */}
        <View
          onLayout={onLeftLayout}
          className={`${isSingleVideo ? 'w-[60%]' : 'flex-1 mr-2'} rounded-2xl bg-[#1A2421] overflow-hidden`}
          style={{ aspectRatio: 9 / 16 }}
        >
          {/* 영상 + 오버레이를 한 wrapper에 묶어 같은 줌 transform 적용(정렬 유지) */}
          <View
            style={{
              width: '100%',
              height: '100%',
              transform: userZoom
                ? [
                    { translateX: userZoom.tx },
                    { translateY: userZoom.ty },
                    { scale: userZoom.scale },
                  ]
                : undefined,
            }}
          >
            {userVideoUri ? (
              <Video
                ref={videoRef}
                source={{ uri: userVideoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.COVER}
                isLooping={false}
                isMuted
                shouldPlay={isPlaying}
                rate={speed}
                shouldCorrectPitch={false}
                onPlaybackStatusUpdate={handleStatus}
                onReadyForDisplay={handleReadyForDisplay}
                progressUpdateIntervalMillis={100}
              />
            ) : null}
            <SkeletonSvg
              frame={userFrame}
              boxW={leftBox.w}
              boxH={leftBox.h}
              mapPoint={userMapper}
              color="#3BC1A8"
            />
          </View>
          {/* 로컬 영상이 없으면(피드 진입 등) 스켈레톤만 어두운 배경에 표시하고,
              프로 박스처럼 하단 라벨을 단다(중앙의 '영상 없음' 텍스트 제거). */}
          {!userVideoUri && (
            <View className="absolute bottom-1 left-0 right-0 items-center">
              <AppText className="text-text-secondary text-[10px]">내 스켈레톤</AppText>
            </View>
          )}
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
              <AppText className="text-text-secondary text-[10px]">{compareLabel}</AppText>
            </View>
          </View>
        )}
      </View>

      {/* 컨트롤 및 타임라인 */}
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={togglePlay}
          disabled={!hasVideo && userFrames.length === 0}
          className="w-10 h-10 rounded-full bg-[#A3C8BC] items-center justify-center mr-3 border-2 border-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            opacity: hasVideo || userFrames.length > 0 ? 1 : 0.4,
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

        {/* 두 개의 페이즈 바: 나/프로 단계를 각자 동작 구간·실제 타이밍으로 정규화해 따로 표시 */}
        <View className="flex-1">
          <PhaseBar label="나" bands={userBands} progressPct={progressPct} fallbackColor={timelineColor} />
          {!isSingleVideo && (
            <PhaseBar label={compareShortLabel} bands={proBands} progressPct={proProgressPct} fallbackColor="#C9A8FF" />
          )}
        </View>

        {/* 정렬 모드 토글: 비교 대상이 있을 때만(정렬할 상대가 없으면 숨김) */}
        {!isSingleVideo && (
          <TouchableOpacity
            onPress={() => setAlignMotion((on) => !on)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={alignMotion ? '실시간 재생으로 전환' : '동작 정렬 재생으로 전환'}
            className="ml-3 px-3 py-1.5 rounded-full bg-surface-page border border-border/50"
          >
            <AppText weight="bold" className="text-text-secondary text-xs">
              {alignMotion ? '동작 정렬' : '실시간'}
            </AppText>
          </TouchableOpacity>
        )}

        {/* 배속 토글: 사용자·프로에 동일 적용(같은 속도끼리 비교) */}
        <TouchableOpacity
          onPress={cycleSpeed}
          className="ml-3 px-2.5 py-1 rounded-full bg-white/10 items-center justify-center"
          activeOpacity={0.7}
        >
          <AppText className="text-text-secondary" style={{ fontSize: 12 }}>
            {speed}x
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 단계 범례: 탭하면 해당 단계로 이동(내·프로 동시). 5개를 항상 한 줄에 균등 배치 */}
      {userBands.length > 0 && (
        <View className="flex-row mt-2" style={{ marginLeft: 52 }}>
          {phaseFrames.map((p, i) => (
            <TouchableOpacity
              key={`legend-${p.phase}-${i}`}
              style={{ flex: 1 }}
              activeOpacity={0.6}
              onPress={() => seekToPhase(p.startFrame)}
            >
              <AppText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ textAlign: 'center', color: PHASE_COLORS[p.phase] ?? PHASE_FALLBACK_COLOR, fontSize: 10 }}
              >
                {p.label || p.phase}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
