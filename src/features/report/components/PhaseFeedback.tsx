import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { FeedbackMetric, PhaseFeedback as PhaseFeedbackType, PhaseMetric } from '../types/report.types';
import PhaseMetricRow from './PhaseMetricRow';

interface PhaseFeedbackProps {
  data: PhaseFeedbackType;
  reportType?: 'pro' | 'me';
  /** 지표가 측정된 순간으로 이동. 리포트 화면이 내려준다. */
  onSeekFrame?: (frame: number, metric: PhaseMetric) => void;
}

/** 나 vs 비교대상 측정값 비교 막대 그래프(스켈레톤 색과 동일: 나=초록, 비교=보라). */
function MetricCompareBar({ metric, proLabel = '선수' }: { metric: FeedbackMetric; proLabel?: string }) {
  const { userValue, proValue } = metric;
  const max = Math.max(Math.abs(userValue), Math.abs(proValue), 1e-4);
  const row = (label: string, value: number, color: string) => (
    <View className="flex-row items-center mb-1.5">
      <AppText className="text-text-secondary text-[11px]" style={{ width: 28 }}>
        {label}
      </AppText>
      <View className="flex-1 h-3 rounded-full bg-black/5 overflow-hidden mr-2">
        <View
          style={{
            width: `${(Math.abs(value) / max) * 100}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 999,
          }}
        />
      </View>
      <AppText weight="bold" className="text-text-primary text-[11px]" style={{ width: 42, textAlign: 'right' }}>
        {value.toFixed(2)}
      </AppText>
    </View>
  );
  return (
    <View className="mt-2 bg-[#F7F8F8] rounded-xl px-3 py-2.5">
      {row('나', userValue, '#3BC1A8')}
      {row(proLabel, proValue, '#C9A8FF')}
    </View>
  );
}

export default function PhaseFeedback({ data, reportType = 'pro', onSeekFrame }: PhaseFeedbackProps) {
  const [metricsOpen, setMetricsOpen] = useState(false);
  const isGood = data.status === '양호';
  // 그래프 두 번째 막대 라벨: 최고의 1구 비교에선 '베스트'(좁은 칸 폭에 맞춰 축약)
  const proLabel = reportType === 'me' ? '베스트' : '선수';
  const badgeBg = isGood ? 'bg-[#E8F8F5]' : 'bg-[#FAF4EB]';
  const badgeTextColor = isGood ? '#3BC1A8' : '#D3735D';
  const dotColor = isGood ? '#A3C8BC' : '#DDBA82';

  return (
    <View 
      className="bg-white rounded-3xl mx-5 mt-5 px-5 py-5 mb-10" 
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, shadowOffset: { width: 0, height: 2 } }}
    >
      {/* 헤더: 상태 원 + 구간 이름 + 점수 뱃지 */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: dotColor }} />
          <AppText weight="bold" className="text-text-primary text-sm">
            {data.phaseName}
            {reportType === 'me' ? ' · 현재 구간' : ''}
          </AppText>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${badgeBg}`}>
          <AppText weight="bold" className="text-sm" style={{ color: badgeTextColor }}>
            {data.score} {data.status}
          </AppText>
        </View>
      </View>

      {/* 피드백 항목들 */}
      <View className="mb-4">
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-[#8EC5B6] mr-1 text-xs">✦</AppText>
          <AppText weight="bold" className="text-[#8EC5B6] text-sm">잘된 점</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.goodPoint}
        </AppText>
        {data.goodMetric && <MetricCompareBar proLabel={proLabel} metric={data.goodMetric} />}
      </View>

      <View className="mb-4">
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-text-secondary mr-1 text-xs">•</AppText>
          <AppText weight="bold" className="text-text-secondary text-sm">피드백</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.feedback}
        </AppText>
      </View>

      <View>
        <View className="flex-row items-center mb-1.5">
          <AppText className="text-[#8EC5B6] mr-1 text-xs">✦</AppText>
          <AppText weight="bold" className="text-[#8EC5B6] text-sm">개선안</AppText>
        </View>
        <AppText weight="medium" className="text-text-primary text-sm leading-5">
          {data.improvement}
        </AppText>
        {data.improvementMetric && <MetricCompareBar proLabel={proLabel} metric={data.improvementMetric} />}
      </View>

      {/*
        상세 지표는 기본으로 접어둔다. 구간마다 1~2개씩이라 항상 펼쳐두면
        정성 피드백이 묻힌다. 서버가 지표를 주지 않으면 행 자체를 그리지 않는다.
      */}
      {data.metrics.length > 0 ? (
        <View className="mt-4">
          <TouchableOpacity
            onPress={() => setMetricsOpen((open) => !open)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: metricsOpen }}
            className="flex-row items-center justify-between border-t border-border pt-3"
          >
            <AppText weight="medium" className="text-text-secondary text-sm">
              상세 지표 {data.metrics.length}개
            </AppText>
            <Ionicons
              name={metricsOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#8E949A"
            />
          </TouchableOpacity>

          {metricsOpen
            ? data.metrics.map((metric) => (
                <PhaseMetricRow key={metric.key} metric={metric} onSeekFrame={onSeekFrame} />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
