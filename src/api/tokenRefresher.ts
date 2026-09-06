/**
 * [tokenRefresher.ts]
 * 액세스 토큰 갱신을 앱 전체에서 "한 번에 하나만" 수행하도록 묶는 모듈.
 *
 * 왜 이게 필요한가요? (이 파일의 존재 이유)
 * 백엔드의 리프레시 토큰은 일회용입니다. /api/auth/refresh 는 받은 토큰을 Redis에서
 * 지우고(delete) 새 토큰을 발급합니다. 따라서 같은 리프레시 토큰으로 두 번 요청하면
 * 두 번째는 반드시 INVALID_REFRESH_TOKEN으로 실패합니다.
 *
 * 그런데 화면들은 데이터를 동시에 부릅니다. 예를 들어 피드 화면은 포커스될 때
 * getMyAnalyses()와 getBestPitches()를 나란히 호출합니다. 액세스 토큰이 만료된 상태라면
 * 둘 다 401을 받고 각자 갱신을 시도하는데, 먼저 도착한 쪽이 토큰을 소모해 버리므로
 * 나중 쪽은 이미 사라진 토큰을 들고 가 실패하고, 멀쩡한 세션이 끊깁니다.
 *
 * 그래서 갱신 요청을 하나로 합칩니다(single-flight). 이미 진행 중인 갱신이 있으면
 * 새로 요청하지 않고 그 결과를 함께 기다립니다.
 */

import { getRefreshToken, saveTokens } from '../utils/token';
import { refreshAccessToken } from './authApi';
import { ApiError } from './apiError';

/** 진행 중인 갱신. 없으면 null. */
let inFlight: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    // 저장된 토큰이 아예 없으면 갱신할 대상이 없다. 네트워크를 태우지 않고 즉시 실패시킨다.
    throw new ApiError({
      status: 401,
      code: 'LOGIN_REQUIRED',
      message: '로그인이 필요합니다.',
    });
  }

  const tokens = await refreshAccessToken(refreshToken);
  // 서버가 리프레시 토큰도 새로 발급하므로 둘 다 저장해야 다음 갱신이 가능하다.
  await saveTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

/**
 * 토큰을 갱신하고 새 액세스 토큰을 돌려줍니다.
 * 동시에 여러 번 호출해도 실제 네트워크 요청은 한 번만 나갑니다.
 *
 * @throws ApiError 갱신 실패(리프레시 토큰 만료·위조, 네트워크 오류 등)
 */
export function refreshTokens(): Promise<string> {
  if (!inFlight) {
    // finally로 만든 체인을 그대로 보관·반환한다. 호출자가 이 프로미스를 받아
    // 거부를 처리하므로 처리되지 않은 rejection이 남지 않는다.
    inFlight = runRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
