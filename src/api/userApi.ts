/**
 * [userApi.ts]
 * "내 데이터"(프로필/통계/분석목록) 백엔드 API 통신 모듈.
 * 전부 JWT 인증이 필요하며 authFetch가 토큰을 싣고 401 시 자동 재발급한다.
 */

import { authFetch } from './analysisApi';

// ─── 백엔드 DTO와 1:1 타입 ───────────────────────────────
export interface UserProfile {
  nickname: string;
  email: string;
  recentAnalysisCount: number;
}

export interface GrowthPoint {
  label: string; // "4/28"
  value: number; // Top 유사도
}

export interface PitchDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface UserStats {
  nickname: string;
  totalSessions: number;
  bestScore: number;
  thisMonthSessions: number;
  recentAnalysisCount: number;
  growth: GrowthPoint[];
  pitchDistribution: PitchDistribution[];
}

export interface MyAnalysisItem {
  videoId: number;
  date: string; // "2025.04.28"
  playerName: string;
  pitchType: string;
  similarity: number;
}

// ─── API ─────────────────────────────────────────────────
export async function getMyProfile(): Promise<UserProfile> {
  const res = await authFetch('/api/users/me', { method: 'GET' });
  if (!res.ok) throw new Error(`[프로필 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<UserProfile>;
}

export async function getMyStats(): Promise<UserStats> {
  const res = await authFetch('/api/users/me/stats', { method: 'GET' });
  if (!res.ok) throw new Error(`[통계 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<UserStats>;
}

export async function getMyAnalyses(): Promise<MyAnalysisItem[]> {
  const res = await authFetch('/api/users/me/analyses', { method: 'GET' });
  if (!res.ok) throw new Error(`[분석목록 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<MyAnalysisItem[]>;
}

/** 내가 비교당한 프로 목록 (마이페이지 그래프 드롭다운). */
export interface ProSummary {
  proId: number;
  pitcherName: string;
}
export async function getComparedPros(): Promise<ProSummary[]> {
  const res = await authFetch('/api/users/me/pros', { method: 'GET' });
  if (!res.ok) throw new Error(`[비교 프로 목록 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<ProSummary[]>;
}

/** 특정 프로에 대한 내 점수 변화 추이 (날짜 오름차순). 마이페이지 프로별 그래프용. */
export async function getProGrowth(proId: number): Promise<GrowthPoint[]> {
  const res = await authFetch(`/api/users/me/growth?proId=${proId}`, { method: 'GET' });
  if (!res.ok) throw new Error(`[프로별 추이 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<GrowthPoint[]>;
}

// ─── 최고의 1구(일관성 탭) ─────────────────────────────────────
/** 일관성 탭 구종별 "최고의 1구" 카드 */
export interface BestPitchCard {
  videoId: number; // 최고의 1구 영상 id (비교 대상)
  pitchType: string;
  date: string;
  bestConsistency: number; // 최고 일관성(없으면 0)
  sessionCount: number; // 비교 횟수
  avgConsistency: number; // 평균 일관성(없으면 0)
}

/** 최고의 1구와 비교된 내 기록 한 줄 (카드 펼침 목록) */
export interface BestPitchComparisonItem {
  videoId: number; // 비교한 내 영상 id (리포트 진입용)
  bestPitchVideoId: number; // 비교 대상 최고의 1구 id
  date: string;
  pitchType: string;
  consistency: number; // 0~100
}

/** 구종별 최고의 1구 카드 목록 */
export async function getBestPitches(): Promise<BestPitchCard[]> {
  const res = await authFetch('/api/users/me/best-pitches', { method: 'GET' });
  if (!res.ok) throw new Error(`[최고의 1구 목록 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BestPitchCard[]>;
}

/** 특정 구종 최고의 1구와 비교된 기록 목록 */
export async function getBestPitchComparisons(
  pitchType: string,
): Promise<BestPitchComparisonItem[]> {
  const res = await authFetch(
    `/api/users/me/best-pitches/${encodeURIComponent(pitchType)}/comparisons`,
    { method: 'GET' },
  );
  if (!res.ok) throw new Error(`[비교 기록 조회 실패] ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BestPitchComparisonItem[]>;
}
