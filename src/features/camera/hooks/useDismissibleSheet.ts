/**
 * [useDismissibleSheet.ts]
 * 바텀시트 "아래로 드래그해서 닫기" 공통 훅
 *
 * 동작 원리:
 *   1. PanResponder가 드래그 제스처를 감지합니다.
 *   2. 아래쪽 방향으로만 translateY를 추적합니다 (위로는 막음).
 *   3. 손가락을 뗄 때:
 *      - 드래그 거리 또는 속도가 임계값 이상이면 → 시트 슬라이드 다운 후 onClose()
 *      - 그렇지 않으면 → 원래 위치(0)로 스프링 복귀
 *
 * 왜 공통 훅으로 분리하나요?
 *   PitchSelectionSheet / BestPitchRegisterSheet / PastVideoSelectionSheet
 *   3개 컴포넌트에 동일 로직이 반복되므로 단일 소스로 관리합니다.
 */

import { useRef, useCallback } from 'react';
import { Animated, PanResponder } from 'react-native';

interface UseDismissibleSheetOptions {
  /** 슬라이드-업 애니메이션에 사용 중인 Animated.Value (translateY) */
  translateY: Animated.Value;
  /** 바텀시트 높이 — 닫을 때 이 값만큼 아래로 슬라이드 */
  sheetHeight: number;
  /** 드래그 거리 임계값 (px): 이 이상 내리면 닫힘. 기본 80px */
  dismissThreshold?: number;
  /** 드래그 속도 임계값 (px/s): 이 이상 빠르면 거리 무관하게 닫힘. 기본 500 */
  velocityThreshold?: number;
  /** 닫기 완료 후 호출할 콜백 */
  onClose: () => void;
}

export function useDismissibleSheet({
  translateY,
  sheetHeight,
  dismissThreshold = 80,
  velocityThreshold = 500,
  onClose,
}: UseDismissibleSheetOptions) {
  // 현재 드래그 오프셋을 JS 값으로 추적 (네이티브 스레드 값 접근 불가)
  const dragOffsetRef = useRef(0);

  /** 시트를 아래로 내리며 닫는 함수 */
  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: sheetHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [translateY, sheetHeight, onClose]);

  /** 드래그 취소 시 원래 위치로 복귀 */
  const snapBack = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      // 수직 방향 제스처만 처리
      onMoveShouldSetPanResponder: (_, gestureState) =>
        // 아래 방향 드래그이고, 수평보다 수직 움직임이 클 때만 캡처
        gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),

      onPanResponderMove: (_, gestureState) => {
        // 위로 드래그하는 건 막고, 아래로만 따라가도록
        const clampedDy = Math.max(0, gestureState.dy);
        dragOffsetRef.current = clampedDy;
        translateY.setValue(clampedDy);
      },

      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        // 거리 또는 속도가 임계값 초과 시 닫기
        const shouldDismiss = dy > dismissThreshold || vy > velocityThreshold / 1000;
        if (shouldDismiss) {
          dismiss();
        } else {
          snapBack();
        }
        dragOffsetRef.current = 0;
      },

      onPanResponderTerminate: () => {
        // 제스처가 다른 컴포넌트에 뺏겼을 때도 복귀
        snapBack();
        dragOffsetRef.current = 0;
      },
    })
  ).current;

  return {
    /** Animated.View의 {...panResponder.panHandlers} 에 spread */
    panHandlers: panResponder.panHandlers,
    /** 프로그래매틱 닫기 (버튼 탭 등에서 사용) */
    dismiss,
  };
}
