/**
 * [VideoPreviewTimeline.tsx]
 * 영상 프리뷰 하단 타임라인 스크러버 컴포넌트
 *
 * 구성:
 *   [──────브랜드색 진행바──────]
 *   00:00:22               00:01:21
 *
 * 현재는 정적 UI입니다. 다음 회차(EDITING 화면)에서
 * 드래그 트리밍 핸들을 추가할 예정입니다.
 */

import React from 'react';
import { View, Text } from 'react-native';

/** 초 → "HH:MM:SS" 포맷 함수 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

interface VideoPreviewTimelineProps {
  /** 현재 재생 시작점 (초) */
  startTime: number;
  /** 영상 전체 길이 (초) */
  totalDuration: number;
  /**
   * 진행 비율 0~1 (현재 재생 위치 / 전체 길이)
   * 정적 상태에서는 startTime/totalDuration으로 계산됩니다.
   */
  progress?: number;
}

export default function VideoPreviewTimeline({
  startTime,
  totalDuration,
  progress,
}: VideoPreviewTimelineProps) {
  // progress가 없으면 startTime 기준으로 계산
  const progressRatio = progress ?? (totalDuration > 0 ? startTime / totalDuration : 0);

  return (
    <View className="px-4 pt-2 pb-1">
      {/* ── 진행 바 트랙 ── */}
      <View className="h-1 bg-white/20 rounded-full mb-2 overflow-hidden">
        <View
          className="h-full bg-brand rounded-full"
          style={{ width: `${Math.min(progressRatio * 100, 100)}%` }}
        />
      </View>

      {/* ── 시작/끝 타임스탬프 ── */}
      <View className="flex-row justify-between">
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(startTime)}
        </Text>
        <Text className="text-white/60 text-xs font-medium">
          {formatTime(totalDuration)}
        </Text>
      </View>
    </View>
  );
}
