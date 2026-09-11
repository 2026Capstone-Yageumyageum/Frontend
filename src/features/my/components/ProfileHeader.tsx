/**
 * [ProfileHeader.tsx]
 * 마이 화면 상단: 유저 이름 인사 + 최근 분석 요약 문구
 *
 * 예시:
 *   "나의 피칭 리포트"       [로그아웃]
 *   박지성님,
 *   최근 한 달간 8회 투구 분석을 했어요
 *   얼마나 성장했는지 확인해볼까요?
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import AppText from '../../../components/common/AppText';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  nickname: string;
  recentAnalysisCount: number;
  /** 우측 상단 아이콘 동작. 현재 이 자리의 유일한 기능은 로그아웃입니다. */
  onLogoutPress?: () => void;
}

export default function ProfileHeader({
  nickname,
  recentAnalysisCount,
  onLogoutPress,
}: ProfileHeaderProps) {
  return (
    <View className="px-5 pt-4 pb-3 bg-surface-page">
      {/* 상단 타이틀 + 설정 아이콘 */}
      <View className="flex-row justify-between items-center mb-3">
        <AppText weight="medium" className="text-text-secondary text-sm">
          나의 피칭 리포트
        </AppText>
        {/*
          아이콘이 톱니바퀴(설정)였는데, 눌렀을 때 나오는 것이 로그아웃 하나뿐이라
          기대와 어긋났습니다. 하는 일을 그대로 드러내는 아이콘으로 바꿉니다.
        */}
        <TouchableOpacity
          onPress={onLogoutPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="로그아웃"
          // 아이콘이 작아 손가락으로 누르기 어려우므로 터치 영역을 넓힙니다.
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={22} color="#8E949A" />
        </TouchableOpacity>
      </View>

      {/* 유저 이름 인사 */}
      <AppText weight="bold" className="text-3xl text-brand mb-1">
        {nickname}님,
      </AppText>

      {/* 분석 횟수 강조 문구 */}
      <AppText weight="medium" className="text-text-primary text-sm mb-0.5">
        {'최근 한 달간 '}
        <AppText weight="bold" className="text-brand">
          {recentAnalysisCount}회
        </AppText>
        {' 투구 분석을 했어요'}
      </AppText>
      <AppText className="text-text-secondary text-xs">얼마나 성장했는지 확인해볼까요?</AppText>
    </View>
  );
}
