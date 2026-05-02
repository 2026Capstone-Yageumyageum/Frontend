/**
 * [useRecordingTimer.ts]
 * 녹화 중 경과 시간을 관리하는 커스텀 훅
 *
 * 왜 별도 Hook인가요?
 * - 타이머 로직(setInterval 시작/정지/리셋)을 CameraScreen에서 분리해
 *   테스트와 재사용이 쉬워집니다.
 * - 1초마다 elapsed를 갱신하여 "● HH:MM:SS" 형식으로 변환합니다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRecordingTimerReturn {
  /** 경과 시간 (초) */
  elapsed: number;
  /** "00:00:01" 형식의 포맷된 문자열 */
  formattedTime: string;
  /** 타이머 시작 */
  startTimer: () => void;
  /** 타이머 정지 */
  stopTimer: () => void;
  /** 타이머 리셋 (0으로 초기화) */
  resetTimer: () => void;
}

/** 초 → "HH:MM:SS" 문자열 변환 */
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function useRecordingTimer(): UseRecordingTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  // intervalRef로 클리어 시점을 정확히 관리합니다.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return; // 이미 실행 중이면 중복 시작 방지
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsed(0);
  }, [stopTimer]);

  // 컴포넌트 언마운트 시 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    elapsed,
    formattedTime: formatElapsed(elapsed),
    startTimer,
    stopTimer,
    resetTimer,
  };
}
