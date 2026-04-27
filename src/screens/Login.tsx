import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Alert } from 'react-native';
import Button from '../components/common/Button';
import GoogleIcon from '../assets/GoogleIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';

// ─────────────────────────────────────────────
//  Google Sign-In 초기 설정
//  - webClientId: Google Cloud Console의 "웹" OAuth 클라이언트 ID
//  - Android 네이티브 로그인에도 webClientId를 사용하는 것이 표준
// ─────────────────────────────────────────────
GoogleSignin.configure({
    webClientId: 'process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    // 서버에서 사용자 정보를 검증하는 데 필요한 토큰도 요청
    offlineAccess: true,
});

export default function Login() {
    // navigate 함수에 RootStackParamList 타입을 지정해 타입 안전성 확보
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Google Sign-In 실행 함수
    const handleGoogleLogin = async () => {
        try {
            console.log('[Auth] 로그인 버튼 클릭됨');

            // Google Play Services가 기기에 설치되어 있는지 먼저 확인
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // 네이티브 구글 계정 선택 팝업 호출
            const userInfo = await GoogleSignin.signIn();
            console.log('[Auth] 로그인 성공!');
            console.log('[Auth] User Info:', JSON.stringify(userInfo, null, 2));

            // TODO: 서버에 idToken 전달 및 자체 토큰 발급 로직 추가
            // userInfo.data.idToken 을 백엔드에 전송하면 됩니다.

            navigation.navigate('Test');

        } catch (error: any) {
            // Google Sign-In 에러 코드에 따라 분기 처리
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // 사용자가 직접 취소한 경우 — 알림 불필요
                console.log('[Auth] 사용자가 로그인을 취소했습니다.');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // 이미 로그인 진행 중일 때 중복 호출된 경우
                console.warn('[Auth] 로그인이 이미 진행 중입니다.');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // 구글 플레이 서비스가 없거나 구버전일 때
                Alert.alert('오류', 'Google Play 서비스를 사용할 수 없습니다. 업데이트 후 다시 시도해 주세요.');
                console.error('[Auth] Google Play Services 없음:', error);
            } else {
                // 그 외 알 수 없는 에러
                Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
                console.error('[Auth] 알 수 없는 에러:', error);
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6">

                {/* 1. 상단 유동적 여백 */}
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

                {/* 3. 로고와 버튼 사이 유동적 여백 */}
                <View style={{ flex: 4 }} />

                {/* 4. 하단: 소셜 로그인 버튼 영역 */}
                <View className="w-full">
                    <Button
                        size="long"
                        variant="outlined"
                        label="Google로 계속하기"
                        onPress={handleGoogleLogin}
                        icon={<GoogleIcon size={20} />}
                    />
                </View>

                {/* 5. 하단 유동적 여백 */}
                <View style={{ flex: 1.5 }} />

            </View>
        </SafeAreaView>
    );
}