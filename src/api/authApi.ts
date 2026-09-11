/**
 * [authApi.ts]
 * 인증 관련 백엔드 API 통신을 담당하는 모듈입니다.
 *
 * 왜 별도 파일로 분리했나요?
 * - UI 로직(Login.tsx)과 서버 통신 로직을 분리해 각 파일의 역할을 명확히 합니다.
 * - API 엔드포인트나 DTO가 바뀌어도 이 파일만 수정하면 됩니다.
 */

import { toApiError, toNetworkError } from './apiError';

// ─────────────────────────────────────────────
//  상수 정의
// ─────────────────────────────────────────────

/**
 * 백엔드 서버 베이스 URL
 * 모바일 기기(Expo Go)에서 실행할 때 localhost는 모바일 기기 자신을 가리킵니다.
 * 따라서 PC의 IP 주소(예: 192.168.45.251)를 사용해야 합니다.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.45.251:8080';

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
  accessToken?: string; // 기존 유저만 포함
  refreshToken?: string; // 기존 유저만 포함
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
 * fetch 요청 시 일정 시간(ms)이 지나면 강제로 에러를 발생시키는 헬퍼 함수
 * 이를 통해 잘못된 IP나 서버 미응답 시 앱이 무한정 멈춰있는 현상을 방지합니다.
 */
async function fetchWithTimeout(resource: string, options: RequestInit = {}) {
  // 서버 콜드 스타트(구글 인증서 최초 fetch + Spring/DB/Redis 워밍업)로 첫 요청이 5초를 넘겨
  // 끊기던 문제 때문에 여유를 둔다. 첫 요청만 느리고 이후는 즉시 응답한다.
  const timeout = 15000; // 15초 타임아웃
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    // 타임아웃(AbortError)과 연결 실패를 모두 ApiError로 바꾼다.
    // 요청 URL이 담긴 원본 메시지는 화면에 노출하지 않는다(내부 주소 유출).
    throw toNetworkError(error);
  } finally {
    // 성공/실패와 무관하게 타이머를 정리해야 한다. 예전 코드는 두 갈래에 나눠 적혀 있어
    // 새 return 경로가 생기면 누락되기 쉬웠다.
    clearTimeout(id);
  }
}

/**
 * 구글 ID Token으로 로그인 요청
 * POST /api/auth/google
 *
 * @param idToken - 구글 로그인 후 발급받은 ID Token
 * @returns AuthResponse - isRegistered: false이면 신규 유저
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  // HTTP 에러 처리 (4xx, 5xx)
  if (!response.ok) throw await toApiError(response);

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
export async function signupWithNickname(email: string, nickname: string): Promise<AuthResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, nickname }),
  });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<AuthResponse>;
}

/**
 * Access Token 재발급
 * POST /api/auth/refresh
 *
 * @param refreshToken - 로컬에 저장된 Refresh Token
 * @returns TokenResponse - 새로운 accessToken, refreshToken
 */
/**
 * 로그아웃: 서버에 저장된 리프레시 토큰을 폐기합니다.
 * POST /api/auth/logout
 *
 * 왜 서버에도 알려야 하나요?
 * 앱에서 토큰을 지우는 것만으로는 서버가 그 토큰을 계속 유효하다고 봅니다.
 * 값을 가진 누구든 갱신을 이어갈 수 있고, 갱신할 때마다 기한이 연장됩니다.
 *
 * 서버는 이미 없는 토큰이어도 200으로 응답합니다(멱등).
 *
 * @param refreshToken 로컬에 저장돼 있던 Refresh Token
 */
export async function logout(refreshToken: string): Promise<void> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw await toApiError(response);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw await toApiError(response);

  return response.json() as Promise<TokenResponse>;
}
