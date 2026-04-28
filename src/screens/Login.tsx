import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
// screens/ 폴더에서 components/common/ 폴더로 가려면 한 단계 위로('../') 올라가야 합니다.
import Button from '../components/common/Button';
// 구글 공식 로고 SVG 컴포넌트 (react-native-svg 기반)
import GoogleIcon from '../assets/GoogleIcon';
// 화면 전환을 위한 네비게이션 훅 - NavigationContainer 안에서만 사용 가능
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { GoogleSignin, statusCodes, isErrorWithCode, isSuccessResponse } from '@react-native-google-signin/google-signin'

export default function Login() {
    // navigate 함수에 RootStackParamList 타입을 지정해 타입 안전성 확보
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            offlineAccess: true,
        });
    }, [])

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
            }

            // 일단 라우팅 테스트를 위해 Test 화면으로 이동
            navigation.navigate('Test');

        } catch (error) {
            console.log('GoogleSignin.hasPlayServices() error', error);
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