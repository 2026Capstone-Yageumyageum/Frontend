/**
 * [camera.types.ts]
 * 카메라 도메인의 모든 상태 타입과 데이터 타입을 정의합니다.
 *
 * ── 완성된 상태 머신 흐름 ────────────────────────────────────────────────────
 *
 * [Flow A - 프로와 비교]
 *   IDLE → RECORDING → PREVIEW_EDIT_TIP → PREVIEW
 *                          → PREVIEW_SAVE_MODAL (저장 아이콘)
 *                          → PITCH_SELECTION (다음 버튼)  ← 공통_3
 *                              → EDITING (트리밍)          ← 프로_4
 *                                  → SUCCESS               ← 공통_5/5-1
 *
 * [Flow B - 내 베스트 투구]
 *   IDLE → SELECTING_PITCH → RECORDING → ... (Flow A와 동일)
 */

// ─── 카메라 모드 (상단 Toggle) ────────────────────────────────────────────────
export type CameraMode = 'pro' | 'my'; // 프로와 비교 | 내 베스트 투구

// ─── 구종 타입 ────────────────────────────────────────────────────────────────
export type PitchType = '직구' | '슬라이더' | '커브' | '체인지업';

// ─── 카메라 플로우 상태 머신 ─────────────────────────────────────────────────
export type CameraFlowState =
  | 'IDLE'               // 카메라_프로_1: 대기 중, 뷰파인더 표시
  | 'SELECTING_PITCH'    // 카메라_나_2: 과거 영상 선택 (Flow B 전용)
  | 'RECORDING'          // 카메라_공통_1: 녹화 진행 중
  | 'PREVIEW'            // 카메라_공통_2: 녹화 완료, 영상 프리뷰
  | 'PREVIEW_EDIT_TIP'   // 카메라_공통_2-1: 프리뷰 + 편집 툴팁
  | 'PREVIEW_SAVE_MODAL' // 카메라_공통_2-2: 프리뷰 + 저장 확인 모달
  | 'PITCH_SELECTION'    // 카메라_공통_3: 구종 선택 바텀시트
  | 'EDITING'            // 카메라_프로_4: 영상 트리밍/편집
  | 'SUCCESS';           // 카메라_공통_5/5-1: 최고의 1구 등록 결과

// ─── 녹화 완료 후 영상 정보 ──────────────────────────────────────────────────
export interface RecordedVideo {
  /** 로컬 파일 URI (react-native-vision-camera RecordVideoOptions 반환값) */
  uri: string;
  /** 영상 길이 (초) */
  duration: number;
}

// ─── 트리밍 범위 ──────────────────────────────────────────────────────────────
export interface TrimRange {
  /** 트리밍 시작 시간 (초) */
  startSec: number;
  /** 트리밍 끝 시간 (초) */
  endSec: number;
}

// ─── 타임라인 스크러버 상태 ───────────────────────────────────────────────────
export interface TimelineState {
  /** 전체 영상 길이 (초) */
  totalDuration: number;
  /** 현재 재생/트리밍 시작 시간 (초) */
  startTime: number;
  /** 트리밍 끝 시간 (초) */
  endTime: number;
}

