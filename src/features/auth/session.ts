/**
 * [session.ts]
 * 로그인 세션을 끝내는 단 하나의 경로.
 *
 * 세션이 끝나는 경우는 두 가지인데, 해야 할 일은 똑같습니다.
 *   ① 사용자가 로그아웃 버튼을 누름
 *   ② 토큰 갱신이 최종 실패함(리프레시 토큰 만료·위조)
 * 두 경로가 각자 뒷정리를 하면 한쪽만 고쳐지는 일이 생기므로 여기로 모읍니다.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { clearTokens, getRefreshToken } from '../../utils/token';
import { logout } from '../../api/authApi';
import { resetToLogin } from '../../navigation/navigationRef';
import { ensureGoogleSigninConfigured } from './googleSignin';

/** 동시에 여러 요청이 401을 받아도 뒷정리는 한 번만 하도록 막는 플래그. */
let ending = false;

/**
 * 저장된 토큰을 지우고 구글 세션을 끊은 뒤 로그인 화면으로 되돌립니다.
 *
 * 구글 signOut을 함께 호출하는 이유: 이걸 빼면 다음 로그인 때 계정 선택 없이
 * 직전 계정으로 곧장 다시 들어가서, 사용자 입장에서는 로그아웃이 안 된 것처럼 보입니다.
 *
 * 서버에도 알리는 이유: 우리 저장소에서 토큰을 지우는 것만으로는 서버가 그 리프레시
 * 토큰을 계속 유효하다고 봅니다. 값을 가진 누구든 갱신을 이어갈 수 있고, 갱신할 때마다
 * 기한이 연장되므로 한 번 유출되면 사실상 끝이 없습니다.
 *
 * 다만 서버 통보가 실패해도 로컬 로그아웃은 그대로 진행합니다.
 * 비행기 모드에서 로그아웃을 눌렀다고 로그아웃이 안 되면 안 되기 때문입니다.
 * (이 경우 서버의 토큰은 TTL 14일이 지나야 사라집니다.)
 */
export async function endSession(): Promise<void> {
  if (ending) return;
  ending = true;
  try {
    // 지우기 전에 읽어야 한다. clearTokens 이후에는 서버에 보낼 값이 사라진다.
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await logout(refreshToken).catch((error) => {
        // 실패해도 로그아웃 자체는 계속한다. 원인만 남긴다.
        console.warn('[로그아웃] 서버에 알리지 못했습니다.', error);
      });
    }

    // 자동 로그인으로 들어온 경우 Login 화면을 거치지 않아 SDK가 아직 설정되지 않았을 수 있다.
    ensureGoogleSigninConfigured();
    // 구글 세션 정리는 실패해도 우리 쪽 로그아웃을 막으면 안 된다(로그인 이력이 없을 수도 있다).
    await GoogleSignin.signOut().catch(() => {});
    await clearTokens();
  } finally {
    resetToLogin();
    ending = false;
  }
}
