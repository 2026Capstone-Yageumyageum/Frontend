/**
 * [VideoThumbnail.tsx]
 * 영상 썸네일 + 우상단 재생 시간 표시 컴포넌트
 *
 * 구성:
 * - 썸네일 이미지 (없으면 회색 placeholder)
 * - 우상단: ▶ 아이콘 + 재생 시간 (예: '00:02:14')
 * - 좌하단: 구종 뱃지 (variant='solid')
 *
 * 왜 Image + View로 구성하나요?
 * - React Native는 CSS position:absolute가 가능하므로
 *   Image 위에 View를 겹쳐 오버레이 UI를 구현합니다.
 */

import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PitchTypeBadge from './PitchTypeBadge';
import { PitchType } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface VideoThumbnailProps {
  /** 썸네일 이미지 URI (없으면 회색 배경 표시) */
  uri?: string;
  /** 우상단에 표시할 영상 재생 시간 (예: '00:02:14') */
  duration: string;
  /** 좌하단에 표시할 구종 뱃지 */
  pitchType: PitchType;
  /** 썸네일 높이 (기본값: 180) */
  height?: number;
}

export default function VideoThumbnail({
  uri,
  duration,
  pitchType,
  height = 180,
}: VideoThumbnailProps) {
  return (
    // 썸네일 영역: 상대 위치로 자식 오버레이를 절대 위치로 배치
    <View
      className="w-full overflow-hidden rounded-t-card bg-gray-300"
      style={{ height }}
    >
      {/* 썸네일 이미지: URI가 없으면 회색 배경이 그대로 보임 */}
      {uri ? (
        <Image
          source={{ uri } as ImageSourcePropType}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : null}

      {/* ── 우상단 오버레이: 재생 시간 ── */}
      <View
        className="absolute top-3 right-3 flex-row items-center bg-black/50 px-2 py-1 rounded-full"
      >
        <Ionicons name="play" size={10} color="white" />
        <Text className="text-white text-xs ml-1 font-medium">{duration}</Text>
      </View>

      {/* ── 좌하단 오버레이: 구종 뱃지 ── */}
      <View className="absolute bottom-3 left-3">
        <PitchTypeBadge type={pitchType} variant="solid" />
      </View>
    </View>
  );
}
