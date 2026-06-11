import React, { useState } from 'react';
import { View, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AppText from '../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Button from '../components/common/Button';
import { signupWithNickname } from '../api/authApi';
import { saveTokens } from '../utils/token';

type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;

export default function Signup() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SignupScreenRouteProp>();
  const { email } = route.params;

  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      Alert.alert('알림', '닉네임은 2~12자 사이로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupWithNickname(email, trimmedNickname);
      console.log('[닉네임 등록 성공]', result);

      if (result.accessToken && result.refreshToken) {
        await saveTokens(result.accessToken, result.refreshToken);
      }

      // 등록 완료 안내창 제거, 바로 네비게이션
      navigation.navigate('Home');
    } catch (error) {
      console.error('[닉네임 등록 실패]', error);
      Alert.alert('오류', '닉네임 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-12 pb-5">
          {/* 상단 텍스트 영역 */}
          <View className="mb-10">
            <AppText weight="bold" className="text-[28px] text-text-primary mb-3" style={{ lineHeight: 38, letterSpacing: -0.5 }}>
              Fitch에서{'\n'}사용할 닉네임을{'\n'}알려주세요
            </AppText>
            <AppText className="text-sm text-text-secondary">
              언제든지 프로필에서 변경할 수 있어요
            </AppText>
          </View>

          {/* 닉네임 입력 필드 */}
          <View className="flex-1">
            <AppText weight="bold" className="text-sm text-text-primary mb-2 ml-1">
              닉네임
            </AppText>
            <View className="flex-row items-center border border-border bg-white rounded-xl px-4 py-4">
              <TextInput
                className="flex-1 text-base text-text-primary font-pretendard"
                placeholder="닉네임 입력 (2~12자)"
                placeholderTextColor="#9CA3AF"
                value={nickname}
                onChangeText={setNickname}
                maxLength={12}
                autoFocus
              />
              <AppText className="text-sm text-[#9CA3AF] ml-2">
                {nickname.length}/12
              </AppText>
            </View>
          </View>

          {/* 시작하기 버튼 */}
          <Button
            size="long"
            variant="primary"
            label="시작하기"
            onPress={handleSignup}
            disabled={nickname.trim().length < 2 || isLoading}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
