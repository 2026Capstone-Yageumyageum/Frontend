import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../types/navigation';
import AppText from '../../../components/common/AppText';

export default function AnalysisLoadingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AnalysisLoading'>>();

  useEffect(() => {
    // 3초 대기 후 Report 화면으로 이동 (실제 백엔드 폴링 로직으로 교체될 예정)
    const timer = setTimeout(() => {
      // @ts-ignore
      navigation.replace('Report', route.params);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, route.params]);

  return (
    <View className="flex-1 bg-surface-page items-center justify-center">
      <ActivityIndicator size="large" color="#D9D9D9" className="mb-6" />
      
      <AppText weight="bold" className="text-text-primary text-xl mb-4">
        분석 중이에요
      </AppText>
      
      <AppText className="text-text-secondary text-sm mb-1">
        AI가 투구 자세를 분석하고 있어요
      </AppText>
      <AppText className="text-text-secondary text-sm">
        잠시만 기다려주세요
      </AppText>
    </View>
  );
}
