/**
 * [MyScreen.tsx]
 * 마이 탭 메인 화면 (대시보드) — 실데이터 연동.
 * 화면 포커스 시 GET /api/users/me/stats 로 내 통계를 받아 렌더한다.
 */

import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ProfileHeader from '../components/ProfileHeader';
import StatCard from '../components/StatCard';
import PitchDistributionCard from '../components/PitchDistributionCard';
import GrowthChartCard from '../components/GrowthChartCard';
import AppText from '../../../components/common/AppText';
import { GrowthData, PitchDistributionItem, ProPlayerOption } from '../types/my.types';
import { getMyStats, getComparedPros, UserStats } from '../../../api/userApi';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';

// ─── 통계 카드 아이콘 ────────────────────────────────────────
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

// 구종 분포 도넛 색상 팔레트 (인덱스 순서로 배정)
const PITCH_COLORS = ['#3BC1A8', '#6ED8C8', '#A8EAE0', '#D4F5EF', '#BFE9E0'];

export default function MyScreen() {
  useDoubleBackExit();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [proPlayers, setProPlayers] = useState<ProPlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭에 들어올 때마다 최신 통계 + 비교 프로 목록 갱신 (분석 직후 복귀 시 반영)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      getMyStats()
        .then((data) => {
          if (active) setStats(data);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : '통계를 불러오지 못했습니다.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      // 그래프 드롭다운용 실제 비교 프로 목록
      getComparedPros()
        .then((pros) => {
          if (active) {
            setProPlayers(
              pros.map((p) => ({
                id: String(p.proId),
                name: p.pitcherName,
                initial: p.pitcherName?.charAt(0) ?? 'P',
              })),
            );
          }
        })
        .catch(() => {
          if (active) setProPlayers([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // ── 로딩 ──
  if (loading && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#3BC1A8" />
      </SafeAreaView>
    );
  }

  // ── 에러 ──
  if (error && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page items-center justify-center px-8" edges={['top']}>
        <AppText className="text-text-secondary text-sm text-center">{error}</AppText>
      </SafeAreaView>
    );
  }

  const s = stats!;
  const hasData = s.totalSessions > 0;

  const pitchData: PitchDistributionItem[] = s.pitchDistribution.map((item, index) => ({
    type: item.type as PitchDistributionItem['type'],
    percentage: item.percentage,
    color: PITCH_COLORS[index % PITCH_COLORS.length],
  }));

  const growthData: GrowthData = {
    pro: {
      selectedPlayer: { id: 'me', name: '프로 비교', initial: 'P' },
      chartData: s.growth,
    },
    consistency: { chartData: s.growth },
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader nickname={s.nickname} recentAnalysisCount={s.recentAnalysisCount} />

        {/* 통계 카드 3개 */}
        <View className="flex-row mx-5 mb-4" style={{ gap: 10 }}>
          <StatCard value={String(s.totalSessions)} label="총 세션" icon={<SessionIcon />} />
          <StatCard value={`${s.bestScore}%`} label="최고 점수" icon={<ScoreIcon />} />
          <StatCard value={String(s.thisMonthSessions)} label="이번 달" icon={<MonthIcon />} />
        </View>

        {hasData ? (
          <>
            {pitchData.length > 0 && (
              <PitchDistributionCard data={pitchData} totalSessions={s.totalSessions} />
            )}
            <GrowthChartCard data={growthData} proPlayers={proPlayers} />
          </>
        ) : (
          <View className="items-center justify-center py-16 px-8">
            <Ionicons name="baseball-outline" size={40} color="#C4C9CF" />
            <AppText weight="bold" className="text-text-primary text-base mt-4 mb-1">
              아직 분석 기록이 없어요
            </AppText>
            <AppText className="text-text-secondary text-sm text-center">
              카메라 탭에서 투구를 촬영하고 분석해보세요.
            </AppText>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
