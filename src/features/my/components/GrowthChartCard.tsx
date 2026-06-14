/**
 * [GrowthChartCard.tsx]
 * 성장 추이 카드: Segmented Toggle + 드롭다운(프로 비교 시) + 꺾은선 그래프
 *
 * 구성:
 * ┌──────────────────────────────────────┐
 * │ 성장 추이       [프로 비교][일관성]   │
 * │ [P] 류현진  ∨  (프로 비교 탭일 때만) │
 * │                                      │
 * │  95 ─                                │
 * │  78 ─      •──•──•                   │
 * │  69 •──•─/                           │
 * │  60                                  │
 * │  3/20  4/1  4/8  4/15  4/22  4/28   │
 * └──────────────────────────────────────┘
 */

import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import AppText from '../../../components/common/AppText';
import { LineChart } from 'react-native-gifted-charts';
import { GrowthTab, GrowthData, ProPlayerOption, LineChartDataPoint } from '../types/my.types';
import ProPlayerDropdown from './ProPlayerDropdown';
import { getProGrowth } from '../../../api/userApi';

// ─── 차트 레이아웃 상수 ───────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
// 카드 내부 가용 폭 = 화면폭 - mx-5(20*2) - p-5(20*2)
const CARD_INNER_WIDTH = SCREEN_WIDTH - 40 - 40;
const Y_AXIS_WIDTH = 30; // Y축 라벨 영역(이 폭만큼 그래프 영역에서 빼야 박스를 안 넘침)
const INITIAL_SPACING = 12;
const END_SPACING = 16;
// 실제 꺾은선이 그려지는 영역 폭(Y축 라벨 제외) → 보이는 영역(viewport) 폭
const PLOT_WIDTH = CARD_INNER_WIDTH - Y_AXIS_WIDTH;
// 포인트 간 "고정" 간격. 데이터가 많으면 이 간격을 유지한 채 좌우로 스크롤된다.
const POINT_SPACING = 56;

interface GrowthChartCardProps {
  data: GrowthData;
  /** 실제 비교 프로 목록(드롭다운). 비어 있으면 프로 비교 탭 비활성. */
  proPlayers: ProPlayerOption[];
}

// ─── Segmented Toggle 내부 컴포넌트 ──────────────────────────────────────────
// GrowthChartCard 전용이므로 같은 파일에서 관리합니다.
function GrowthToggle({
  activeTab,
  onChange,
}: {
  activeTab: GrowthTab;
  onChange: (tab: GrowthTab) => void;
}) {
  return (
    <View className="flex-row bg-gray-100 rounded-full p-0.5">
      {(['pro', 'consistency'] as GrowthTab[]).map((tab) => {
        const isActive = tab === activeTab;
        const label = tab === 'pro' ? '프로 비교' : '일관성';
        return (
          <View key={tab} onTouchEnd={() => onChange(tab)}>
            <AppText
              weight={isActive ? 'semibold' : 'regular'}
              className={`px-3 py-1 rounded-full text-xs ${
                isActive ? 'text-white' : 'text-text-secondary'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: '#3BC1A8',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }
                  : {}
              }
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export default function GrowthChartCard({ data, proPlayers }: GrowthChartCardProps) {
  const [activeTab, setActiveTab] = useState<GrowthTab>('pro');
  const [selectedPlayer, setSelectedPlayer] = useState<ProPlayerOption | null>(
    proPlayers[0] ?? null,
  );
  const [proChart, setProChart] = useState<LineChartDataPoint[]>([]);

  // 프로 목록이 로드되면 기본 선택(첫 프로)
  useEffect(() => {
    if (!selectedPlayer && proPlayers.length > 0) setSelectedPlayer(proPlayers[0]);
  }, [proPlayers, selectedPlayer]);

  // 선택한 프로의 점수 변화 추이를 서버에서 조회
  useEffect(() => {
    if (!selectedPlayer) return;
    let active = true;
    getProGrowth(Number(selectedPlayer.id))
      .then((points) => {
        if (active) setProChart(points.map((p) => ({ value: p.value, label: p.label })));
      })
      .catch(() => {
        if (active) setProChart([]);
      });
    return () => {
      active = false;
    };
  }, [selectedPlayer]);

  // 현재 탭에 따른 차트 데이터 선택 (프로 비교 = 선택 프로 추이, 일관성 = 기존 데이터)
  const chartData = activeTab === 'pro' ? proChart : data.consistency.chartData;

  return (
    <View
      className="bg-surface rounded-3xl mx-5 mb-4 p-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* ── 카드 헤더 ── */}
      <View className="flex-row justify-between items-center mb-4">
        <AppText weight="bold" className="text-text-primary text-base">성장 추이</AppText>
        <GrowthToggle activeTab={activeTab} onChange={setActiveTab} />
      </View>

      {/* ── 프로 비교 탭: 실제 비교 프로 드롭다운 ── */}
      {activeTab === 'pro' && selectedPlayer && proPlayers.length > 0 && (
        <ProPlayerDropdown
          players={proPlayers}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
        />
      )}

      {/* ── 꺾은선 그래프 (고정 간격 + 좌우 스크롤) ── */}
      <View style={{ overflow: 'hidden' }}>
        <LineChart
          data={chartData}
          width={PLOT_WIDTH}
          height={160}
          // 포인트는 고정 간격, 데이터가 많으면 좌우로 스크롤
          spacing={POINT_SPACING}
          initialSpacing={INITIAL_SPACING}
          endSpacing={END_SPACING}
          yAxisLabelWidth={Y_AXIS_WIDTH}
          // 선 스타일
          color="#3BC1A8"
          thickness={2}
          // 데이터 포인트 스타일
          dataPointsColor="#3BC1A8"
          dataPointsRadius={5}
          // X축 레이블 스타일
          xAxisLabelTextStyle={{
            color: '#8E949A',
            fontSize: 10,
          }}
          // Y축 스타일
          yAxisTextStyle={{ color: '#8E949A', fontSize: 10 }}
          yAxisColor="transparent"
          xAxisColor="#E8EAEC"
          // 그리드 라인
          rulesColor="#F2F4F6"
          rulesType="solid"
          // 하단 그라데이션 채우기
          areaChart
          startFillColor="#3BC1A8"
          endFillColor="#3BC1A8"
          startOpacity={0.15}
          endOpacity={0}
          // 커브 스타일 (부드러운 선)
          curved
        />
      </View>
    </View>
  );
}
