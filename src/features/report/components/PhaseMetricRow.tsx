/**
 * [PhaseMetricRow.tsx]
 * 구간 상세 지표 한 줄.
 *
 * 판정(양호/주의)을 하지 않는다. 판정하려면 "이 정도 차이면 문제"라는 기준이 있어야 하는데,
 * 그 기준이 없기 때문이다 — 규칙 테이블의 임계값은 검증된 값이 아니라 판단으로 정한 상수였고,
 * 프로들의 실측 편차로 바꿔보니 같은 지표에서 21°~174°로 벌어져 기준이 되지 못했다.
 *
 * 더 근본적으로, 프로와 다른 것은 나쁜 것이 아니다. 사이드암과 오버핸드는 둘 다 맞는 폼이다.
 * 근거 없는 숫자로 '주의'를 붙이면 없는 권위를 만들어내는 셈이라, 값과 차이만 보여주고
 * 판단은 사용자에게 남긴다.
 *
 * 값 자체(0.42)는 body-frame 정규화 좌표라 그것만으로는 읽기 어렵다. 그래서 "이 순간 보기"로
 * 측정 순간의 관절과 각도를 스켈레톤 위에 그려, 숫자가 무엇을 잰 것인지 눈으로 보게 한다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { PhaseMetric } from '../types/report.types';
import { describeDifference, formatValue } from '../utils/formatMetric';

interface PhaseMetricRowProps {
  metric: PhaseMetric;
  /** 지표가 측정된 순간으로 이동하고 그 측정을 스켈레톤에 표시한다. */
  onSeekFrame?: (frame: number, metric: PhaseMetric) => void;
}

export default function PhaseMetricRow({ metric, onSeekFrame }: PhaseMetricRowProps) {
  const measured = metric.userValue !== null && metric.proValue !== null;
  const canSeek = onSeekFrame !== undefined && metric.userFrame !== null;

  return (
    <View className="border-t border-border py-3">
      <AppText weight="bold" className="text-text-primary text-sm mb-1.5">
        {metric.label}
      </AppText>

      {measured ? (
        <AppText className="text-text-secondary text-xs mb-1">
          나 {formatValue(metric.userValue as number, metric.unit)}  ·  기준{' '}
          {formatValue(metric.proValue as number, metric.unit)}
        </AppText>
      ) : (
        <AppText className="text-text-secondary text-xs mb-1">
          관절이 가려져 이 구간에서는 값을 재지 못했어요.
        </AppText>
      )}

      {measured && metric.difference !== null ? (
        <AppText weight="medium" className="text-text-primary text-xs mb-1">
          {describeDifference(metric.difference, metric.unit)}
        </AppText>
      ) : null}

      {metric.why ? (
        <AppText className="text-text-secondary text-xs leading-4">ⓘ {metric.why}</AppText>
      ) : null}

      {canSeek ? (
        <TouchableOpacity
          onPress={() => onSeekFrame?.(metric.userFrame as number, metric)}
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
