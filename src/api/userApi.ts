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
