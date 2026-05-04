import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Button from '../components/common/Button';
import { signupWithNickname } from '../api/authApi';
import { saveTokens } from '../utils/token';

// 이 화면은 Login → Signup으로 이동할 때 { email } 파라미터를 받습니다.
type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;

export default function Signup() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // useRoute로 이전 화면(Login)에서 넘겨준 email 파라미터를 읽습니다.
  const route = useRoute<SignupScreenRouteProp>();
  const { email } = route.params;

  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // 닉네임 입력값 검증
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
      Alert.alert('알림', '닉네임은 2~10자 사이로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 백엔드에 이메일 + 닉네임 전달
      const result = await signupWithNickname(email, trimmedNickname);
      console.log('[닉네임 등록 성공]', result);

      // 토큰 저장
      if (result.accessToken && result.refreshToken) {
        await saveTokens(result.accessToken, result.refreshToken);
      }

      Alert.alert('가입 완료', `${trimmedNickname}님, 환영합니다!`, [
        { text: '확인', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('[닉네임 등록 실패]', error);
      Alert.alert('오류', '닉네임 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center" style={{ gap: 24 }}>
        {/* 제목 영역 */}
        <View style={{ gap: 8 }}>
          <Text className="text-2xl font-bold text-gray-900">닉네임을 설정해주세요</Text>
          <Text className="text-sm text-gray-500">가입 계정: {email}</Text>
        </View>

        {/* 닉네임 입력 필드 */}
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
          placeholder="닉네임 (2~10자)"
          placeholderTextColor="#9CA3AF"
          value={nickname}
          onChangeText={setNickname}
          maxLength={10}
          autoFocus
        />

        {/* 확인 버튼 */}
        <Button
          size="long"
          variant="primary"
          label={isLoading ? '등록 중...' : '시작하기'}
          onPress={handleSignup}
        />
      </View>
    </SafeAreaView>
  );
}
