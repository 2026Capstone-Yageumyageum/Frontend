import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    // SafeAreaView edges를 bottom만 지정해 상단 노치 영역도 #3BC1A8로 채워지게 함
    <SafeAreaView style={{ flex: 1, backgroundColor: '#3BC1A8' }} edges={['bottom']}>

      {/* ── 상단 영역: 브랜드 색상 배경 + 로고 ── */}
      {/* flex: 1로 하단 흰색 영역(flex: 0.8)과 비율을 나눔 → 약 55:45 비율 */}
      <View
        style={{ flex: 1, backgroundColor: '#3BC1A8', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* assets/icon.png 로고 이미지 */}
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 300, height: 150 }}
          resizeMode="contain"
        />

        {/* 서브 카피 문구 */}
        <Text
          style={{
            marginTop: 12,
            color: 'white',
            fontSize: 18,
            letterSpacing: 0.3,
            textAlign: 'center',
            alignSelf: 'stretch',
          }}
        >
          내 손안의 작은 AI 투수 코치
        </Text>
      </View>

      {/* ── 하단 영역: 흰색 배경 + 소셜 로그인 ── */}
      <View
        style={{
          flex: 0.3,
          backgroundColor: 'white',
          // 상단 모서리만 둥글게 처리해 카드처럼 올라오는 느낌
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 40,
          gap: 8,
        }}
      >
        {/* 섹션 타이틀 */}
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
          시작하기
        </Text>

        {/* 설명 문구 */}
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
          소셜 계정으로 간편하게 로그인하세요
        </Text>

        {/* Google 로그인 버튼 */}
        <Button
          size="long"
          variant="outlined"
          label="Google로 계속하기"
          onPress={handleGoogleLogin}
          icon={<GoogleIcon size={20} />}
        />
      </View>
    </SafeAreaView>
  );
}
