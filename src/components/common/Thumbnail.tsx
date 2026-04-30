import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ─────────────────────────────────────────────
//  타입 정의
// ─────────────────────────────────────────────

type ThumbnailProps = {
  /** 썸네일 이미지 URI */
  imageUri: string;
  /** 영상 길이 (초 단위) */
  durationSeconds: number;
  /** 구종 레이블 (예: '직구', '커브볼', '슬라이더') */
  pitchType: string;
  width?: number;
  height?: number;
};

// ─────────────────────────────────────────────
//  유틸 함수
// ─────────────────────────────────────────────

/** 초 → "M:SS" 형식 변환 (예: 125 → "2:05") */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
//  컴포넌트
// ─────────────────────────────────────────────

export default function Thumbnail({
  imageUri,
  durationSeconds,
  pitchType,
  width = 220,
  height = 130,
}: ThumbnailProps) {
  return (
    // overflow hidden으로 이미지가 rounded 경계를 넘지 않도록
    <View className="rounded-2xl overflow-hidden" style={{ width, height }}>
      {/* 배경 썸네일 이미지 */}
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {/* 이미지가 로드 안 될 경우를 대비한 회색 폴백 배경 */}
      <View style={[StyleSheet.absoluteFillObject, styles.fallbackBg]} />

      {/* ── 우측 상단: 영상 길이 배지 ── */}
      <View style={styles.topRight}>
        <Badge label={formatDuration(durationSeconds)} />
      </View>

      {/* ── 좌측 하단: 구종 배지 ── */}
      <View style={styles.bottomLeft}>
        <Badge label={pitchType} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
//  Badge 서브 컴포넌트
//  → 어두운 반투명 배경 + 텍스트 그림자로 가독성 확보
// ─────────────────────────────────────────────

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
//  스타일 (절대 위치 등 Tailwind로 표현 어려운 것만 StyleSheet 사용)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  // 이미지 폴백: z-index -1로 이미지 뒤에 위치
  fallbackBg: {
    backgroundColor: '#D1D5DB',
    zIndex: -1,
  },
  topRight: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  badge: {
    // 핵심: 어두운 반투명 배경으로 흰 텍스트 가독성 확보
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    // 추가 가독성: 텍스트 그림자로 밝은 배경에서도 글자가 보이도록
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
