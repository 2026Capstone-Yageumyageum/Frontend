import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Alert } from 'react-native';
import Button from '../components/common/Button';
import GoogleIcon from '../assets/GoogleIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
    // navigate 함수에 RootStackParamList 타입을 지정해 타입 안전성 확보
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // 2. Google OAuth 설정
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '340855020974-oqq6gi6kg9ljt839t0fk6elgg6r2ea5k.apps.googleusercontent.com',
    });

    // 3. 인증 응답 처리
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // TODO: 서버에 인증 정보 전달 및 토큰 저장 로직 추가
            navigation.navigate('Test');
        } else if (response?.type === 'error') {
            Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
        }
    }, [response]);

    const handleGoogleLogin = async () => {
        await promptAsync();
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
                        // size={20}: 버튼 높이(h-14 = 56px)에서 텍스트와 시각적 균형을 맞춘 크기
                        icon={<GoogleIcon size={20} />}
                    />
                </View>

                {/* 5. 하단 유동적 여백 */}
                <View style={{ flex: 1.5 }} />

            </View>
        </SafeAreaView>
    );
}