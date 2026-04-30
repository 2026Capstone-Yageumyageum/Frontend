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
  const timeout = 5000; // 5초 타임아웃
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`[API 타임아웃] 서버가 응답하지 않습니다. IP 주소나 서버 상태를 확인하세요. (요청 URL: ${resource})`);
    }
    throw error;
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
export async function signupWithNickname(email: string, nickname: string): Promise<AuthResponse> {
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
