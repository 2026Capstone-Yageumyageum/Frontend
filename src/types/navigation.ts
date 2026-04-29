/**
 * [navigation.ts]
 * 앱 전체에서 사용하는 네비게이션 타입을 한 곳에서 관리합니다.
 *
 * 왜 분리했나요?
 * - App.tsx에서 직접 import하면 TypeScript가 순환 의존성 문제를 일으킬 수 있고,
 *   경로가 화면마다 달라져 유지보수가 어렵습니다.
 * - 타입은 src/types/ 에서 중앙 관리하는 것이 React Native 프로젝트 관례입니다.
 */

export type RootStackParamList = {
  Login: undefined;    // 파라미터 없음
  Signup: {            // 신규 유저: 구글 로그인 후 닉네임 등록 화면으로 이동할 때 이메일 전달
    email: string;
  };
  Home: undefined;     // 로그인 완료 후 메인 화면 (추후 구현)
};
