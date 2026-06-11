import React from 'react';
import { View } from 'react-native';
import AppText from '../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <AppText weight="bold" className="text-2xl text-gray-900">메인 화면</AppText>
        <AppText className="text-gray-500 mt-2">로그인에 성공했습니다!</AppText>
      </View>
    </SafeAreaView>
  );
}
