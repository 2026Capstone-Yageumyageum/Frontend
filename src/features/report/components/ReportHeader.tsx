import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../../components/common/AppText';

export default function ReportHeader() {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-surface-page">
      <TouchableOpacity 
        className="flex-row items-center" 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color="#1A1C20" />
        <AppText weight="medium" className="text-text-primary text-base ml-1">뒤로가기</AppText>
      </TouchableOpacity>

      <TouchableOpacity 
        className="flex-row items-center" 
        onPress={() => navigation.navigate('Home' as never)}
        activeOpacity={0.7}
      >
        <Ionicons name="home-outline" size={18} color="#1A1C20" />
        <AppText weight="medium" className="text-text-primary text-sm ml-1">홈으로</AppText>
      </TouchableOpacity>
    </View>
  );
}
