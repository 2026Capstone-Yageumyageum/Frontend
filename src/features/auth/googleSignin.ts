/**
 * [googleSignin.ts]
 * 구글 로그인 SDK 설정을 한 곳에서 담당합니다.
 *
 * 왜 분리했나요?
 * 예전에는 Login 화면의 useEffect에서만 configure()를 불렀습니다. 로그인 화면을
 * 반드시 거쳐야 앱을 쓸 수 있었으니 그때는 문제가 없었지만, 자동 로그인이 생기면서
 * Login을 한 번도 지나지 않고 곧장 홈으로 들어가는 경로가 생겼습니다.
 * 그 상태에서 로그아웃하면 SDK가 설정되지 않아 구글 세션 해제가 조용히 실패하고,
 * 다음 로그인에서 계정 선택 없이 직전 계정으로 다시 들어가게 됩니다.
 *
 * 그래서 "필요한 쪽이 호출하면 최초 한 번만 실제로 설정되는" 형태로 모읍니다.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';

let configured = false;

/** 구글 로그인 SDK를 설정합니다. 여러 번 불러도 실제 설정은 한 번만 일어납니다. */
export function ensureGoogleSigninConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
  configured = true;
}
