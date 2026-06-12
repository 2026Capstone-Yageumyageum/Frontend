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

import { getAccessToken, getRefreshToken, saveTokens } from '../utils/token';
import { refreshAccessToken } from './authApi';

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

/** detailJson을 파싱한 파이썬 player 원본 */
export interface PlayerDetail {
  analysisId?: string;
  proId?: string;
  overallScore: number;
  phaseScores: PhaseScoreDetail[];
  release?: ReleaseDetail | null;
  feedback?: FeedbackDetail | null;
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

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 토큰 만료 → refresh 후 1회 재시도
  if (response.status === 401 && !isRetry) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await refreshAccessToken(refreshToken);
        await saveTokens(tokens.accessToken, tokens.refreshToken);
        return authFetch(path, options, true);
      } catch {
        // 재발급 실패 시 원래 401 응답을 그대로 반환
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

  const response = await authFetch('/api/analysis', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[분석 업로드 실패] ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<UploadResponse>;
}

/**
 * 분석 결과 조회. detailJson은 파싱해서 detail 필드로 채워준다.
 * status가 PENDING이면 아직 분석 중이다(폴링 필요).
 */
export async function getAnalysisResult(videoId: number): Promise<AnalysisResultResponse> {
  const response = await authFetch(`/api/analysis/${videoId}/result`, { method: 'GET' });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[분석 결과 조회 실패] ${response.status}: ${errorText}`);
  }

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[골격 데이터 조회 실패] ${response.status}: ${errorText}`);
  }

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[레퍼런스 데이터 조회 실패] ${response.status}: ${errorText}`);
  }

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
  // 첫 분석은 MediaPipe 모델 초기화 + 전체 프레임 포즈 추출로 느릴 수 있어 넉넉히 10분
  const timeoutMs = opts.timeoutMs ?? 600000;
  const deadline = Date.now() + timeoutMs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await getAnalysisResult(videoId);
    opts.onTick?.(result.status);

    if (result.status === 'COMPLETED') return result;
    if (result.status === 'FAILED') {
      throw new Error('[분석 실패] 서버에서 분석이 실패 상태로 종료되었습니다.');
    }
    if (Date.now() >= deadline) {
      throw new Error('[분석 시간 초과] 결과를 받지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
