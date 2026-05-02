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

import React, { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { GrowthTab, GrowthData, ProPlayerOption } from '../types/my.types';
import ProPlayerDropdown from './ProPlayerDropdown';
import { MOCK_PRO_PLAYERS } from '../data/my.mockdata';

// ─── 차트 너비: 화면 너비 - 카드 좌우 패딩 - 화면 좌우 패딩 ───────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 40 - 40; // mx-5(20*2) + p-5(20*2)

interface GrowthChartCardProps {
  data: GrowthData;
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
            <Text
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-brand text-white overflow-hidden'
                  : 'text-text-secondary'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: '#3BC1A8',
                      color: '#fff',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }
                  : {}
              }
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function GrowthChartCard({ data }: GrowthChartCardProps) {
  const [activeTab, setActiveTab] = useState<GrowthTab>('pro');
  const [selectedPlayer, setSelectedPlayer] = useState<ProPlayerOption>(
    data.pro.selectedPlayer,
  );

  // 현재 탭에 따른 차트 데이터 선택
  const chartData =
    activeTab === 'pro' ? data.pro.chartData : data.consistency.chartData;

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
        <Text className="text-text-primary text-base font-bold">성장 추이</Text>
        <GrowthToggle activeTab={activeTab} onChange={setActiveTab} />
      </View>

      {/* ── 프로 비교 탭: 선수 드롭다운 표시 ── */}
      {activeTab === 'pro' && (
        <ProPlayerDropdown
          players={MOCK_PRO_PLAYERS}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
        />
      )}

      {/* ── 꺾은선 그래프 ── */}
      <View style={{ marginLeft: -10 }}>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={160}
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
          // 애니메이션
          isAnimated
          animationDuration={600}
          // 커브 스타일 (부드러운 선)
          curved
        />
      </View>
    </View>
  );
}
