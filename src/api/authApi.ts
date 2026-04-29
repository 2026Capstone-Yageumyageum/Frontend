/**
 * [authApi.ts]
 * 인증 관련 백엔드 API 통신을 담당하는 모듈입니다.
 *
 * 왜 별도 파일로 분리했나요?
 * - UI 로직(Login.tsx)과 서버 통신 로직을 분리해 각 파일의 역할을 명확히 합니다.
 * - API 엔드포인트나 DTO가 바뀌어도 이 파일만 수정하면 됩니다.
 */

// ─────────────────────────────────────────────
//  상수 정의
// ─────────────────────────────────────────────

/** 백엔드 서버 베이스 URL */
const BASE_URL = 'http://localhost:8080';

// ─────────────────────────────────────────────
//  응답 DTO 타입 정의
// ─────────────────────────────────────────────

/**
 * /api/auth/google, /api/auth/signup 공통 응답
 * isRegistered가 false이면 신규 유저 → Signup 화면으로 이동
 */
export interface AuthResponse {
  email: string;
  isRegistered: boolean;
  message: string;
  accessToken?: string;   // 기존 유저만 포함
  refreshToken?: string;  // 기존 유저만 포함
}

/** /api/auth/refresh 응답 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────
//  API 함수
// ─────────────────────────────────────────────

/**
 * 구글 ID Token으로 로그인 요청
 * POST /api/auth/google
 *
 * @param idToken - 구글 로그인 후 발급받은 ID Token
 * @returns AuthResponse - isRegistered: false이면 신규 유저
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  // HTTP 에러 처리 (4xx, 5xx)
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Google 로그인 API 실패] ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<AuthResponse>;
}

/**
 * 신규 유저 닉네임 등록
 * POST /api/auth/signup
 *
 * @param email - 구글 계정 이메일
 * @param nickname - 사용자가 입력한 닉네임
 * @returns AuthResponse - accessToken, refreshToken 포함
 */
export async function signupWithNickname(
  email: string,
  nickname: string,
): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, nickname }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[닉네임 등록 API 실패] ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<AuthResponse>;
}

/**
 * Access Token 재발급
 * POST /api/auth/refresh
 *
 * @param refreshToken - 로컬에 저장된 Refresh Token
 * @returns TokenResponse - 새로운 accessToken, refreshToken
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[토큰 재발급 API 실패] ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<TokenResponse>;
}
