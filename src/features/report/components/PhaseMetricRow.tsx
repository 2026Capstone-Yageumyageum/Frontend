/**
 * [PhaseMetricRow.tsx]
 * 구간 상세 지표 한 줄.
 *
 * 값 자체(0.42)는 body-frame 정규화 좌표라 사용자에게 의미가 없다. 그래서
 * "차이 / 허용"을 나란히 보여 임계 대비로 읽히게 한다. 판정은 뱃지가 맡는다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { PhaseMetric } from '../types/report.types';

const STATUS_STYLE: Record<PhaseMetric['status'], { label: string; color: string; bg: string }> = {
  good: { label: '양호', color: '#3BC1A8', bg: 'bg-[#E8F8F5]' },
  warn: { label: '주의', color: '#D3735D', bg: 'bg-[#FAF4EB]' },
  favorable: { label: '다르지만 유리', color: '#6366F1', bg: 'bg-[#EEF0FF]' },
  unavailable: { label: '측정 못함', color: '#8E949A', bg: 'bg-[#F2F3F4]' },
};

interface PhaseMetricRowProps {
  metric: PhaseMetric;
  /** 지표가 측정된 순간으로 이동. 없으면 버튼을 그리지 않는다. */
  onSeekFrame?: (frame: number) => void;
}

export default function PhaseMetricRow({ metric, onSeekFrame }: PhaseMetricRowProps) {
  const style = STATUS_STYLE[metric.status];
  const measured = metric.userValue !== null && metric.proValue !== null;
  const canSeek = onSeekFrame !== undefined && metric.userFrame !== null;

  return (
    <View className="border-t border-border py-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <AppText weight="bold" className="text-text-primary text-sm">
          {metric.label}
        </AppText>
        <View className={`px-2 py-0.5 rounded-full ${style.bg}`}>
          <AppText weight="bold" className="text-xs" style={{ color: style.color }}>
            {style.label}
          </AppText>
        </View>
      </View>

      {measured ? (
        <View className="flex-row items-center mb-1">
          <AppText className="text-text-secondary text-xs">
            나 {metric.userValue}  ·  기준 {metric.proValue}
          </AppText>
        </View>
      ) : (
        <AppText className="text-text-secondary text-xs mb-1">
          관절이 가려져 이 구간에서는 값을 재지 못했어요.
        </AppText>
      )}

      {measured && metric.difference !== null && metric.threshold !== null ? (
        <AppText weight="medium" className="text-text-primary text-xs mb-1">
          차이 {Math.abs(metric.difference).toFixed(2)} / 허용 {metric.threshold.toFixed(2)}
        </AppText>
      ) : null}

      {metric.why ? (
        <AppText className="text-text-secondary text-xs leading-4">ⓘ {metric.why}</AppText>
      ) : null}

      {canSeek ? (
        <TouchableOpacity
          onPress={() => onSeekFrame?.(metric.userFrame as number)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${metric.label}이 측정된 순간으로 이동`}
          className="flex-row items-center self-end mt-2 px-3 py-1.5 rounded-full bg-brand-light"
        >
          <Ionicons name="play-skip-forward-outline" size={12} color="#3BC1A8" />
          <AppText weight="bold" className="text-brand text-xs ml-1">
            이 순간 보기
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
