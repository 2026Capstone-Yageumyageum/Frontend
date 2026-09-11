import React, { useEffect, useState } from 'react';
import { View, Image, Alert } from 'react-native';
import AppText from '../components/common/AppText';
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
import { getErrorMessage } from '../api/apiError';
import { ensureGoogleSigninConfigured } from '../features/auth/googleSignin';
// 토큰 저장 유틸리티
import { saveTokens } from '../utils/token';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  // navigate 함수에 RootStackParamList 타입을 지정해 타입 안전성 확보
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    ensureGoogleSigninConfigured();
  }, []);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;

        // 로그 주의: idToken/accessToken/refreshToken과 이름·이메일은 절대 출력하지 않는다.
        // 토큰은 그 자체로 계정 접근 수단이고, Metro 콘솔·기기 로그·화면 공유로 새어나간다.

        // idToken이 null인 경우 방어 처리
        // (구글이 idToken을 반환하지 않는 경우는 드물지만 안전하게 처리)
        if (!idToken) {
          console.error('[Google 로그인] idToken을 받지 못했습니다.');
          Alert.alert('로그인 실패', '구글 인증 정보를 받지 못했어요. 다시 시도해 주세요.');
          return;
        }

        // ─────────────────────────────────────────────
        //  백엔드에 idToken 전달
        //  응답에 따라 기존 유저 / 신규 유저 분기 처리
        // ─────────────────────────────────────────────
        // authResult에는 accessToken/refreshToken이 담겨 있으므로 로깅하지 않는다.
        const authResult = await loginWithGoogle(idToken);

        if (authResult.isRegistered) {
          // 기존 유저: 토큰 저장 후 메인 화면으로 이동
          if (authResult.accessToken && authResult.refreshToken) {
            await saveTokens(authResult.accessToken, authResult.refreshToken);
          }
          navigation.navigate('Home');
        } else {
          // 신규 유저: 닉네임 등록 화면으로 이동, 이메일 전달
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
            Alert.alert(
              '로그인 실패',
              'Google Play 서비스를 사용할 수 없어요. 업데이트 후 다시 시도해 주세요.',
            );
            break;
          default:
            // DEVELOPER_ERROR 등 설정 문제: SHA-1 미등록, 패키지명 불일치, 잘못된 clientId 등
            console.error('[Google 로그인] 알 수 없는 오류 발생');
            console.error('  → 에러 코드:', error.code);
            console.error(
              '  → DEVELOPER_ERROR라면 Google Cloud Console의 SHA-1 지문 또는 패키지명을 확인하세요.',
            );
            Alert.alert('로그인 실패', '구글 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.');
            break;
        }
      } else {
        // 백엔드 API 실패(ApiError) 또는 네트워크 오류.
        // 백엔드가 내려준 message는 사용자에게 보여줘도 되도록 작성돼 있으므로 그대로 쓰고,
        // 그 밖의 예외는 내부 정보가 담길 수 있어 기본 문구로 대체한다.
        console.error('[Google 로그인] 예기치 않은 에러:', error);
        Alert.alert('로그인 실패', getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
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
        {/*
          [수정 이유]
          - alignItems / justifyContent 는 View 전용 속성 → Text에 적용 시 작동 안 함
          - 부모 View에 alignItems:'center'에 의해 Text 너비가 콘텐츠만큼 수축됨
          - 해결: alignSelf:'stretch'로 부모 너비 100% 확보 + textAlign:'center'로 가운데 정렬
        */}
        <AppText
          weight="medium"
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
        </AppText>
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
        <AppText weight="bold" style={{ fontSize: 24, color: '#111827', textAlign: 'center' }}>
          시작하기
        </AppText>

        {/* 설명 문구 */}
        <AppText style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
          소셜 계정으로 간편하게 로그인하세요
        </AppText>

        {/* Google 로그인 버튼 */}
        {/* accentColor: 이 버튼만 테두리·텍스트를 검정(#000000)으로 표시, 다른 버튼엔 영향 없음 */}
        <Button
          size="long"
          variant="outlined"
          label="Google로 계속하기"
          onPress={handleGoogleLogin}
          icon={<GoogleIcon size={20} />}
          accentColor="#000000"
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}
