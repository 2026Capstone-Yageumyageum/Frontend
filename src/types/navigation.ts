/**
 * [navigation.ts]
 * 앱 전체에서 사용하는 네비게이션 타입을 한 곳에서 관리합니다.
 *
 * 왜 분리했나요?
 * - App.tsx에서 직접 import하면 TypeScript가 순환 의존성 문제를 일으킬 수 있고,
 *   경로가 화면마다 달라져 유지보수가 어렵습니다.
 * - 타입은 src/types/ 에서 중앙 관리하는 것이 React Native 프로젝트 관례입니다.
 */

import { AnalysisResultResponse } from '../api/analysisApi';

export type RootStackParamList = {
  Login: undefined; // 파라미터 없음
  Signup: {
    // 신규 유저: 구글 로그인 후 닉네임 등록 화면으로 이동할 때 이메일 전달
    email: string;
  };
  Home: undefined; // 로그인 완료 후 메인 화면 (추후 구현)
  // 분석 대기 화면: 로컬 영상 uri를 받아 업로드 → 폴링까지 이 화면에서 처리한다
  AnalysisLoading:
    | {
        videoUri?: string;
        pitchType?: string;
        // 앱 트리머로 선택한 분석 구간(초). 분석 요청 시 함께 전달된다.
        trimStartSec?: number;
        trimEndSec?: number;
        isBestPitch?: boolean;
        reportType?: 'pro' | 'me';
      }
    | undefined;
  // AI 분석 결과 리포트 화면: 폴링 완료된 결과를 그대로 받는다
  Report:
    | {
        videoId?: number;
        result?: AnalysisResultResponse;
        // 분석 직후 진입 시 내 로컬 영상 uri (스켈레톤 오버레이용). 피드 진입 시엔 없음.
        videoUri?: string;
        isBestPitch?: boolean;
        reportType?: 'pro' | 'me';
      }
    | undefined;
};
