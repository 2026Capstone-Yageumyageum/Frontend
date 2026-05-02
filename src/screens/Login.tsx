import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import Button from '../components/common/Button';
import GoogleIcon from '../assets/GoogleIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
// 백엔드 API 통신 함수
import { loginWithGoogle } from '../api/authApi';
// 토큰 저장 유틸리티
import { saveTokens } from '../utils/token';

export default function Login() {
  // navigate 함수에 RootStackParamList 타입을 지정해 타입 안전성 확보
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    console.log('클라이언트 ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        const userInfo = response.data.user;

        console.log('구글 로그인 성공!');
        console.log('이름:', userInfo.name);
        console.log('이메일:', userInfo.email);
        console.log('획득한 idToken:', idToken);

        // idToken이 null인 경우 방어 처리
        // (구글이 idToken을 반환하지 않는 경우는 드물지만 안전하게 처리)
        if (!idToken) {
          console.error('[Google 로그인] idToken을 받지 못했습니다.');
          return;
        }

        // ─────────────────────────────────────────────
        //  백엔드에 idToken 전달
        //  응답에 따라 기존 유저 / 신규 유저 분기 처리
        // ─────────────────────────────────────────────
        const authResult = await loginWithGoogle(idToken);
        console.log('[서버 응답]', authResult);

        if (authResult.isRegistered) {
          // 기존 유저: 토큰 저장 후 메인 화면으로 이동
          if (authResult.accessToken && authResult.refreshToken) {
            await saveTokens(authResult.accessToken, authResult.refreshToken);
          }
          console.log('기존 유저 로그인 완료. 메인으로 이동합니다.');
          navigation.navigate('Home');
        } else {
          // 신규 유저: 닉네임 등록 화면으로 이동, 이메일 전달
          console.log('신규 유저 감지. 닉네임 등록 화면으로 이동합니다.');
          navigation.navigate('Signup', { email: authResult.email });
        }
      }
    } catch (error) {
      // isErrorWithCode: 라이브러리에서 제공하는 타입가드로, error.code 속성에 접근할 수 있게 해줌
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // 사용자가 직접 로그인 창을 닫은 경우
            console.warn('[Google 로그인] 사용자가 로그인을 취소했습니다.');
            break;
          case statusCodes.IN_PROGRESS:
            // 이미 로그인 진행 중인데 또 요청한 경우
            console.warn('[Google 로그인] 이미 로그인이 진행 중입니다.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Google Play Services가 기기에 없거나 버전이 낮은 경우
            console.error('[Google 로그인] Google Play Services를 사용할 수 없습니다.');
            break;
          default:
            // DEVELOPER_ERROR 등 설정 문제: SHA-1 미등록, 패키지명 불일치, 잘못된 clientId 등
            console.error('[Google 로그인] 알 수 없는 오류 발생');
            console.error('  → 에러 코드:', error.code);
            console.error('  → 에러 메시지:', error.message);
            console.error(
              '  → DEVELOPER_ERROR라면 Google Cloud Console의 SHA-1 지문 또는 패키지명을 확인하세요.',
            );
            break;
        }
      } else {
        // 라이브러리와 무관한 일반 JS 에러 (네트워크 오류, 백엔드 API 실패 등)
        console.error('[Google 로그인] 예기치 않은 에러:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* 1. 상단 유동적 여백 (하단과 동일하게 비율 1.5로 수정) */}
        <View style={{ flex: 1.5 }} />

        {/* 2. 중앙: 로고 및 문구 영역 */}
        <View className="items-center" style={{ gap: 12 }}>
          {/* 앱 로고 플레이스홀더 */}
          <View className="w-24 h-24 bg-gray-100 rounded-3xl items-center justify-center">
            <Text className="text-gray-400 font-bold text-center">로고 미정</Text>
          </View>

          {/* 서브 카피 문구 */}
          <Text className="text-gray-600 text-base font-medium text-center">
            쉽고 간편한 나만의 투구폼 코칭 서비스
          </Text>
        </View>

        {/* 3. 로고와 버튼 사이 유동적 여백 (전체 비율 7을 맞추기 위해 비율 4로 수정) */}
        <View style={{ flex: 4 }} />

        {/* 4. 하단: 소셜 로그인 버튼 영역 */}
        <View className="w-full">
          <Button
            size="long"
            variant="outlined"
            label="Google로 계속하기"
            onPress={handleGoogleLogin}
            // size={20}: 버튼 높이(h-14 = 56px)에서 텍스트와 시각적 균형을 맞춘 크기
            icon={<GoogleIcon size={20} />}
          />
        </View>

        {/* 5. 하단 유동적 여백 (마음에 드시는 기존 비율 1.5 유지) */}
        <View style={{ flex: 1.5 }} />
      </View>
    </SafeAreaView>
  );
}
