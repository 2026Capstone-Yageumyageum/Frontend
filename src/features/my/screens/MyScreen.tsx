/**
 * [MyScreen.tsx]
 * 마이 탭 메인 화면 (대시보드) — 실데이터 연동.
 * 화면 포커스 시 GET /api/users/me/stats 로 내 통계를 받아 렌더한다.
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
import { getErrorMessage, isRetryable } from '../../../api/apiError';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';
import { endSession } from '../../auth/session';

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
  // 예외 객체를 그대로 보관한다. 백엔드가 내려준 code로 재시도 여부를 가릅하기 위해서다.
  const [error, setError] = useState<unknown>(null);

  /**
   * 내 통계 + 비교 프로 목록을 불러온다.
   * 탭 포커스와 '다시 시도' 버튼이 같은 함수를 쓰므로 재조회 경로가 하나로 유지된다.
   *
   * requestIdRef: 응답이 도착했을 때 더 최신 요청이 이미 시작됐다면 그 결과는 버린다.
   */
  const requestIdRef = useRef(0);

  const loadStats = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    setLoading(true);
    setError(null);
    getMyStats()
      .then((data) => {
        if (!isStale()) setStats(data);
      })
      .catch((e) => {
        if (!isStale()) setError(e);
      })
      .finally(() => {
        if (!isStale()) setLoading(false);
      });

    // 그래프 드롭다운용 실제 비교 프로 목록.
    // 이 목록이 없으면 드롭다운만 비고 통계 본문은 그대로 유효하므로, 실패해도 화면을 막지 않는다.
    getComparedPros()
      .then((pros) => {
        if (isStale()) return;
        setProPlayers(
          pros.map((p) => ({
            id: String(p.proId),
            name: p.pitcherName,
            initial: p.pitcherName?.charAt(0) ?? 'P',
          })),
        );
      })
      .catch(() => {
        if (!isStale()) setProPlayers([]);
      });
  }, []);

  /**
   * 로그아웃. 되돌릴 수 없는 동작이므로 확인을 한 번 받는다.
   *
   * 실제 정리(구글 세션 해제 + 토큰 삭제 + 로그인 화면 복귀)는 endSession이 담당한다.
   * 세션 만료로 자동 로그아웃될 때와 같은 경로를 쓰기 위해서다.
   */
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void endSession() },
    ]);
  }, []);

  // 탭에 들어올 때마다 최신 통계 + 비교 프로 목록 갱신 (분석 직후 복귀 시 반영)
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
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
  // 백엔드는 실패 사유를 { code, message }로 내려준다. message를 그대로 보여주고,
  // 일시적 장애(네트워크/5xx)일 때만 다시 시도를 제안한다.
  if (error && !stats) {
    return (
      <SafeAreaView
        className="flex-1 bg-surface-page items-center justify-center px-8"
        edges={['top']}
      >
        <Ionicons name="cloud-offline-outline" size={40} color="#C4C9CF" />
        <AppText className="text-text-secondary text-sm text-center mt-4">
          {getErrorMessage(error)}
        </AppText>
        {isRetryable(error) ? (
          <TouchableOpacity
            onPress={loadStats}
            activeOpacity={0.8}
            className="mt-5 px-6 py-2.5 rounded-full bg-brand"
          >
            <AppText weight="bold" className="text-white text-sm">
              다시 시도
            </AppText>
          </TouchableOpacity>
        ) : null}

        {/*
          이 화면에서도 로그아웃할 수 있어야 한다.
          통계 조회가 실패하면 상단 헤더(로그아웃 버튼이 있는 곳)가 렌더되지 않으므로,
          여기에 길이 없으면 사용자는 서버가 복구될 때까지 이 화면에 갇힌다.
        */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          className="mt-3 px-6 py-2.5"
        >
          <AppText weight="medium" className="text-text-secondary text-sm">
            로그아웃
          </AppText>
        </TouchableOpacity>
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
        <ProfileHeader
          nickname={s.nickname}
          recentAnalysisCount={s.recentAnalysisCount}
          onLogoutPress={handleLogout}
        />

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
