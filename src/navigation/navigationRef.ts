/**
 * [navigationRef.ts]
 * 화면 밖(= API 레이어)에서 네비게이션을 조작하기 위한 참조.
 *
 * 왜 필요한가요?
 * - `useNavigation()`은 컴포넌트 안에서만 쓸 수 있습니다. 그런데 "세션이 끝났으니
 *   로그인 화면으로 돌아가라"는 판단은 authFetch(=API 모듈) 안에서 내려집니다.
 * - 그 판단을 모든 화면에 중복으로 심는 대신, 여기 한 곳을 통해 이동시킵니다.
 *
 * 이 참조는 App.tsx의 NavigationContainer에 연결되어야 동작합니다.
 */

// RootStackParamList는 타입으로만 씁니다. `import type`으로 명시해 번들에서 완전히
// 제거되게 합니다(navigation.ts가 analysisApi를 참조하므로 순환 import를 피하려는 목적).
import type { RootStackParamList } from '../types/navigation';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * 스택을 비우고 로그인 화면으로 되돌립니다.
 *
 * navigate가 아니라 reset을 쓰는 이유: 세션이 끝난 뒤에는 뒤로 가기로 이전 화면
 * (내 분석 결과 등)에 돌아갈 수 있으면 안 됩니다. 히스토리를 통째로 교체합니다.
 */
export function resetToLogin() {
  // 앱 초기화 중에는 컨테이너가 아직 준비되지 않았을 수 있습니다.
  // 그 시점의 세션 종료는 App.tsx의 부트스트랩이 initialRouteName으로 처리합니다.
  if (!navigationRef.isReady()) return;
  navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
}
