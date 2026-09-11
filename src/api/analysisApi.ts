/**
 * [analysisApi.ts]
 * 투구 영상 분석 관련 백엔드 API 통신 모듈입니다.
 *
 * 흐름:
 *   1. requestAnalysis(videoUri)  → POST /api/analysis (멀티파트 업로드) → videoId 즉시 반환(202)
 *   2. getAnalysisResult(videoId) → GET  /api/analysis/{videoId}/result  (status COMPLETED 될 때까지 폴링)
 *   3. getSkeleton(videoId)       → GET  /api/analysis/{videoId}/skeleton (오버레이용 골격 좌표)
 *
 * 인증: SecureStore의 accessToken을 Authorization 헤더에 싣고, 401이면 refreshToken으로 1회 재발급 후 재시도합니다.
 */

import { getAccessToken } from '../utils/token';
import { ApiError, isConnectionError, toApiError, toNetworkError, TIMEOUT_ERROR } from './apiError';
import { refreshTokens } from './tokenRefresher';
import { endSession } from '../features/auth/session';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.45.251:8080';

// ─────────────────────────────────────────────
//  응답 타입 (백엔드 DTO와 1:1)
// ─────────────────────────────────────────────

/** POST /api/analysis 응답 */
export interface UploadResponse {
  videoId: number;
  status: string; // "PENDING"
  message: string;
}

/** 파이썬 player 원본의 구간 점수 */
export interface PhaseScoreDetail {
  phase: string; // "windup" | "leg_lift" | ...
  label: string; // 표시용 라벨(한글일 수 있음)
  score: number;
  userStartFrame: number;
  userEndFrame: number;
  proStartFrame: number;
  proEndFrame: number;
}

export interface ReleaseTimingDetail {
  proPitchPercent: number | null;
  userPitchPercent: number | null;
  differencePercent: number | null;
  message: string;
}

export interface ReleasePointDetail {
  difference: number | null;
  heightDifference: number | null;
  sideDifference: number | null;
  message: string;
}

export interface ReleaseDetail {
  proFrame: number | null;
  userFrame: number | null;
  timing: ReleaseTimingDetail | null;
  point: ReleasePointDetail | null;
}

export interface FeedbackItemDetail {
  phase: string;
  message: string;
  evidence?: unknown;
}

export interface FeedbackDetail {
  good: FeedbackItemDetail[];
  bad: FeedbackItemDetail[];
}

/** 구간별 상세 지표 (분석 서버 phaseMetrics 원본) */
export interface PhaseMetricDetail {
  phase: string;
  key: string;
  label: string;
  /** "degree"면 도(°) 단위. null이면 단위 없는 body-frame 정규화 좌표. */
  unit?: string | null;
  /** 단위는 unit이 정한다. 각도가 아니면 정규화 좌표라 화면에서 단위를 붙이지 않는다. */
  userValue: number | null;
  proValue: number | null;
  /** userValue - proValue. 부호를 유지한다(evidence.difference는 절댓값이라 다름). */
  difference: number | null;
  threshold: number | null;
  status: 'good' | 'warn' | 'favorable' | 'unavailable';
  favorableDirection: 'positive' | 'negative' | null;
  why: string | null;
  /** 이 지표가 측정에 쓴 관절. 길이 1=강조만, 2=몸통축 대비 각, 3=가운데가 꼭짓점인 각. */
  userJoints?: string[] | null;
  proJoints?: string[] | null;
  /** 측정이 일어난 프레임. "이 순간 보기"가 쓴다. */
  userFrame: number | null;
  proFrame: number | null;
}

/** detailJson을 파싱한 파이썬 player 원본 */
export interface PlayerDetail {
  analysisId?: string;
  proId?: string;
  overallScore: number;
  phaseScores: PhaseScoreDetail[];
  release?: ReleaseDetail | null;
  feedback?: FeedbackDetail | null;
  /** 구버전 분석 서버는 보내지 않는다. 없으면 화면이 상세 패널을 그리지 않는다. */
  phaseMetrics?: PhaseMetricDetail[] | null;
}

/** GET /result results[] 항목 */
export interface PitchingComparison {
  proId: number;
  proName: string;
  pitchType: string;
  similarityScore: number;
  feedback: string | null;
  detailJson: string | null;
  detail?: PlayerDetail | null; // detailJson을 파싱한 결과(클라에서 채움)
}

/** GET /api/analysis/{videoId}/result 응답 */
export interface AnalysisResultResponse {
  videoId: number;
  status: string; // "PENDING" | "COMPLETED" | "FAILED"
  results: PitchingComparison[];
}

/** GET /api/analysis/{videoId}/skeleton 응답 */
export interface SkeletonResponse {
  skeletonData: string;
  frameCount: number;
}

// ─────────────────────────────────────────────
//  내부 헬퍼
// ─────────────────────────────────────────────

/**
 * accessToken을 실어 요청하고, 401이면 refreshToken으로 1회 재발급 후 재시도합니다.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 통신 자체가 실패하면(서버 미기동·네트워크 단절) fetch가 TypeError를 던진다.
  // 그대로 두면 화면이 "Network request failed" 같은 내부 문구를 보게 되므로 ApiError로 바꾼다.
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw toNetworkError(error);
  }

  // 토큰 만료 → refresh 후 1회 재시도.
  // refreshTokens()는 동시에 여러 요청이 401을 받아도 갱신 요청을 하나로 합쳐준다.
  // (리프레시 토큰이 일회용이라, 각자 갱신하면 나중 요청이 반드시 실패한다.)
  if (response.status === 401 && !isRetry) {
    try {
      await refreshTokens();
      return authFetch(path, options, true);
    } catch (error) {
      // 네트워크 문제로 갱신하지 못한 것뿐이라면 세션은 아직 유효하다.
      // 로그인 정보를 지우지 않고, 원래의 401을 호출부에 그대로 돌려준다.
      if (!isConnectionError(error)) {
        // 리프레시 토큰이 만료·위조된 경우다. 회복할 방법이 없으므로 세션을 끝내고
        // 로그인 화면으로 되돌린다. 이 처리가 없으면 사용자는 401 화면에 갇힌다.
        await endSession();
      }
    }
  }

  return response;
}

/** uri에서 파일명을 뽑되, 파이썬이 허용하는 확장자(.mp4/.mov/.avi/.m4v)를 보장합니다. */
function fileNameFromUri(uri: string): string {
  const raw = uri.split('?')[0].split('/').pop() || 'pitch_video';
  const lower = raw.toLowerCase();
  const ok =
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.m4v');
  return ok ? raw : `${raw}.mp4`;
}

function safeParse<T>(text: string | null | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//  API 함수
// ─────────────────────────────────────────────

/**
 * 영상 업로드 → 분석 시작.
 * 백엔드가 UserVideo를 만들고 videoId를 즉시 반환(202)한 뒤 백그라운드로 분석한다.
 */
export async function requestAnalysis(
  videoUri: string,
  pitchType?: string,
  trimStartSec?: number,
  trimEndSec?: number,
): Promise<UploadResponse> {
  const normalizedUri = videoUri.startsWith('file://') || videoUri.startsWith('content://')
    ? videoUri
    : `file://${videoUri}`;

  const form = new FormData();
  // RN multipart 파일 파트: { uri, name, type }
  form.append('file', {
    uri: normalizedUri,
    name: fileNameFromUri(normalizedUri),
    type: 'video/mp4',
  } as any);
  if (pitchType) form.append('pitchType', pitchType);
  // 앱 트리머로 선택한 구간(초). 유효한 구간일 때만 전송 → 백엔드/Python이 그 구간만 분석.
  if (
    typeof trimStartSec === 'number' &&
    typeof trimEndSec === 'number' &&
    trimEndSec > trimStartSec
  ) {
    form.append('startSec', String(trimStartSec));
    form.append('endSec', String(trimEndSec));
  }

  const response = await authFetch('/api/analysis', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<UploadResponse>;
}

/**
 * 최고의 1구 비교 분석 시작.
 * 프로 대신 내 "최고의 1구"(bestPitchVideoId) 골격과 비교한다. videoId를 즉시 반환(202).
 */
export async function requestBestPitchAnalysis(
  videoUri: string,
  bestPitchVideoId: number,
  pitchType?: string,
  trimStartSec?: number,
  trimEndSec?: number,
): Promise<UploadResponse> {
  const normalizedUri =
    videoUri.startsWith('file://') || videoUri.startsWith('content://')
      ? videoUri
      : `file://${videoUri}`;

  const form = new FormData();
  form.append('file', {
    uri: normalizedUri,
    name: fileNameFromUri(normalizedUri),
    type: 'video/mp4',
  } as any);
  form.append('bestPitchVideoId', String(bestPitchVideoId));
  if (pitchType) form.append('pitchType', pitchType);
  if (
    typeof trimStartSec === 'number' &&
    typeof trimEndSec === 'number' &&
    trimEndSec > trimStartSec
  ) {
    form.append('startSec', String(trimStartSec));
    form.append('endSec', String(trimEndSec));
  }

  const response = await authFetch('/api/analysis/best-pitch', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<UploadResponse>;
}

/** 영상을 "최고의 1구"로 등록(구종당 1개). */
export async function registerBestPitch(videoId: number): Promise<void> {
  const response = await authFetch(`/api/analysis/${videoId}/best-pitch`, { method: 'POST' });
  if (!response.ok) throw await toApiError(response);
}

/**
 * 분석 결과 조회. detailJson은 파싱해서 detail 필드로 채워준다.
 * status가 PENDING이면 아직 분석 중이다(폴링 필요).
 */
export async function getAnalysisResult(videoId: number): Promise<AnalysisResultResponse> {
  const response = await authFetch(`/api/analysis/${videoId}/result`, { method: 'GET' });

  if (!response.ok) throw await toApiError(response);

  const data = (await response.json()) as AnalysisResultResponse;
  data.results = (data.results ?? [])
    .map((r) => ({ ...r, detail: safeParse<PlayerDetail>(r.detailJson) }))
    // 유사도 높은 순으로 정렬
    .sort((a, b) => b.similarityScore - a.similarityScore);
  return data;
}

/** 오버레이용 골격 좌표 조회 */
export async function getSkeleton(videoId: number): Promise<SkeletonResponse> {
  const response = await authFetch(`/api/analysis/${videoId}/skeleton`, { method: 'GET' });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<SkeletonResponse>;
}

/** GET /api/analysis/reference-data 응답 항목 (프로 레퍼런스 스켈레톤) */
export interface ReferenceData {
  proId: number;
  pitcherName: string;
  pitchType: string;
  skeleton_data: string; // 백엔드가 snake_case로 내려줌(@JsonProperty)
}

/** 프로 레퍼런스 스켈레톤 전체 조회 (proId로 매칭해 사용) */
export async function getReferenceData(): Promise<ReferenceData[]> {
  const response = await authFetch('/api/analysis/reference-data', { method: 'GET' });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<ReferenceData[]>;
}

/**
 * status가 COMPLETED 또는 FAILED가 될 때까지 /result를 폴링한다.
 * @param videoId 대상 영상 id
 * @param opts.intervalMs 폴링 간격(기본 2초), opts.timeoutMs 최대 대기(기본 120초)
 */
export async function pollAnalysisResult(
  videoId: number,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (status: string) => void } = {},
): Promise<AnalysisResultResponse> {
  const intervalMs = opts.intervalMs ?? 2000;
  // 첫 분석은 MediaPipe 모델 초기화 + 포즈 추출로 느릴 수 있어 넉넉히 15분
  const timeoutMs = opts.timeoutMs ?? 900000;
  const deadline = Date.now() + timeoutMs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await getAnalysisResult(videoId);
    opts.onTick?.(result.status);

    if (result.status === 'COMPLETED') return result;
    // 아래 두 실패는 HTTP 에러가 아니라(응답은 200) 폴링 결과로 판정한 것이지만,
    // 호출부가 다른 API 실패와 똑같이 다룰 수 있도록 ApiError로 통일한다.
    if (result.status === 'FAILED') {
      throw new ApiError({
        status: 0,
        code: 'ANALYSIS_FAILED',
        message: '분석에 실패했어요. 영상 구도를 확인하고 다시 시도해 주세요.',
      });
    }
    if (Date.now() >= deadline) {
      throw new ApiError({
        status: 0,
        code: TIMEOUT_ERROR,
        message: '분석이 예상보다 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
      });
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
