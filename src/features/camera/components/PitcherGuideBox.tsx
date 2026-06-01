/**
 * [PitcherGuideBox.tsx]
 * 카메라 뷰파인더 위에 오버레이되는 투수 포지셔닝 가이드 박스
 *
 * 목적:
 *   촬영 전(IDLE) 및 촬영 중(RECORDING) 모두에서 투수가 올바른 위치에
 *   서도록 빨간 테두리 가이드 박스를 화면에 표시한다.
 *
 * 디자인 기준 (참고 이미지):
 *   - 화면 좌측 영역에 세로로 긴 라운드 사각형
 *   - 투수 전신이 들어갈 수 있는 크기 (화면 너비 약 40%, 높이 약 60%)
 *   - 테두리: 빨간색, 두께 2px
 *   - 코너: 둥근 모서리 (borderRadius 20)
 *   - 박스 내부: 완전 투명 (카메라 화면이 그대로 보임)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';

interface PitcherGuideBoxProps {
  /** 현재 녹화 중인지 여부 */
  isRecording: boolean;
}

export default function PitcherGuideBox({ isRecording }: PitcherGuideBoxProps) {
  const { width, height } = useWindowDimensions();

  // ── 페이드인 애니메이션 (컴포넌트 마운트 시 부드럽게 등장) ──────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ── 박스 크기 및 위치 계산 ──────────────────────────────────────────────
  // 왼변·오른변·아랫변 기준은 그대로 유지, 윗변만 아래로 내림
  const BOX_WIDTH = width * 0.42; // 화면 너비의 42% (좌우 고정)
  const BOX_LEFT = width * 0.08;  // 좌측에서 8% (좌변 고정)

  // 아랫변 위치 고정
  // 기존: BOX_TOP(height*0.16) + BOX_HEIGHT(height*0.60) = height*0.76
  const BOX_BOTTOM_EDGE = height * 0.76;

  // 윗변: 기존 gap(≈0~10px)의 5배 이상인 ~50px 간격으로 아래로 내림
  // 토글 버튼 하단(≈ height*0.19) 기준 + height*0.06(약 50px) 여백
  const BOX_TOP = height * 0.25;

  // 높이는 고정된 아랫변과 새 윗변 사이 거리로 자동 산출 (아랫변 고정 유지)
  const BOX_HEIGHT = BOX_BOTTOM_EDGE - BOX_TOP; // ≈ height * 0.51

  // ── 녹화 상태에 따른 테두리 색상 ────────────────────────────────────────
  // 녹화 전: 반투명 빨간색 / 녹화 중: 선명한 빨간색
  const borderColor = isRecording
    ? 'rgba(255, 55, 55, 1.0)'
    : 'rgba(255, 55, 55, 0.88)';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          left: BOX_LEFT,
          top: BOX_TOP,
          borderColor,
        },
      ]}
      // 터치 이벤트를 통과시켜 카메라 인터랙션 방해 방지
      pointerEvents="none"
    >
      {/* ── 상단 코너 레이블 ────────────────────────────────────────────── */}
      {/* 녹화 전에만 안내 텍스트 표시 */}
      {!isRecording && (
        <View style={styles.topLabel}>
          <Text style={styles.topLabelText}>투수를 박스 안에</Text>
          <Text style={styles.topLabelText}>위치시켜 주세요</Text>
        </View>
      )}

      {/* ── 하단 발 위치 마커 ────────────────────────────────────────────── */}
      {/* 투수가 서야 할 하단 기준선을 시각적으로 표시 */}
      <View style={styles.footMarker} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 카메라 뷰 위에 절대 위치로 오버레이
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 20,
    // 박스 내부는 완전 투명 (카메라 화면이 보여야 함)
    backgroundColor: 'transparent',
  },

  // 박스 내부 상단에 표시되는 안내 텍스트
  topLabel: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  topLabelText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 16,
    // 텍스트 가독성을 위해 약한 그림자
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 박스 하단 발 위치 마커 (투수가 서야 할 기준)
  footMarker: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: 'rgba(255, 55, 55, 0.6)',
    borderRadius: 2,
  },
});
