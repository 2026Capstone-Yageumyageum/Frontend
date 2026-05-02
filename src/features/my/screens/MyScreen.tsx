/**
 * [MyScreen.tsx]
 * 마이 탭 메인 화면 (대시보드)
 *
 * 구조:
 * ┌──────────────────────────────────┐
 * │ [ProfileHeader]                  │ ← 스크롤과 함께 올라감
 * ├──────────────────────────────────┤
 * │ [StatCard × 3] (가로 3열)        │
 * ├──────────────────────────────────┤
 * │ [PitchDistributionCard]          │
 * ├──────────────────────────────────┤
 * │ [GrowthChartCard]                │
 * └──────────────────────────────────┘
 *
 * 설계 포인트:
 * - ScrollView로 전체를 스크롤 가능하게 합니다.
 * - SafeAreaView는 react-native-safe-area-context에서 가져와
 *   Android 상태바 영역도 정확히 처리합니다.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ProfileHeader from '../components/ProfileHeader';
import StatCard from '../components/StatCard';
import PitchDistributionCard from '../components/PitchDistributionCard';
import GrowthChartCard from '../components/GrowthChartCard';

import {
  MOCK_USER_PROFILE,
  MOCK_PITCH_DISTRIBUTION,
  MOCK_GROWTH_DATA,
} from '../data/my.mockdata';

// ─── 통계 카드 아이콘 (Ionicons 기반 이모지 대체) ────────────────────────────
// 디자인 이미지의 컬러 아이콘을 최대한 유사하게 구현합니다.
function SessionIcon() {
  return (
    <View className="w-9 h-9 rounded-full bg-brand-light items-center justify-center">
      <Ionicons name="reload-circle-outline" size={20} color="#3BC1A8" />
    </View>
  );
}
function ScoreIcon() {
  return (
    <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
      <Ionicons name="ribbon-outline" size={20} color="#6366F1" />
    </View>
  );
}
function MonthIcon() {
  return (
    <View className="w-9 h-9 rounded-full bg-yellow-50 items-center justify-center">
      <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
    </View>
  );
}

export default function MyScreen() {
  const profile = MOCK_USER_PROFILE;

  return (
    // edges: 상단만 Safe Area 적용 (하단은 TabNavigator가 처리)
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── 프로필 헤더 ── */}
        <ProfileHeader
          nickname={profile.nickname}
          recentAnalysisCount={profile.recentAnalysisCount}
        />

        {/* ── 통계 카드 3개 (가로 균등 배치) ── */}
        <View className="flex-row mx-5 mb-4" style={{ gap: 10 }}>
          <StatCard
            value={String(profile.totalSessions)}
            label="총 세션"
            icon={<SessionIcon />}
          />
          <StatCard
            value={`${profile.bestScore}%`}
            label="최고 점수"
            icon={<ScoreIcon />}
          />
          <StatCard
            value={String(profile.thisMonthSessions)}
            label="이번 달"
            icon={<MonthIcon />}
          />
        </View>

        {/* ── 구종 분포 카드 ── */}
        <PitchDistributionCard
          data={MOCK_PITCH_DISTRIBUTION}
          totalSessions={profile.totalSessions * 4} // 총 세션 x 평균 구종 수 (예시)
        />

        {/* ── 성장 추이 카드 ── */}
        <GrowthChartCard data={MOCK_GROWTH_DATA} />

        {/* 하단 여백 (TabBar 위 공간) */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
