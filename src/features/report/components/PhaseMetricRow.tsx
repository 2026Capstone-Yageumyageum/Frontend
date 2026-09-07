/**
 * [PhaseMetricRow.tsx]
 * 구간 상세 지표 한 줄.
 *
 * 값 자체(0.42)는 body-frame 정규화 좌표라 사용자에게 의미가 없다. 그래서
 * 기준 대비 차이를 임계값 게이지 위 "위치"로 보여준다. 숫자 두 개를 읽고 나눠야
 * 알던 "허용 대비 얼마나 벗어났나"를 눈으로 바로 읽게 하는 것이 목적이다.
 * 판정은 뱃지가 맡는다.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../components/common/AppText';
import { PhaseMetric } from '../types/report.types';
import { describeDifference, formatJudgment, formatValue } from '../utils/formatMetric';

const STATUS_STYLE: Record<PhaseMetric['status'], { label: string; color: string; bg: string }> = {
  good: { label: '양호', color: '#3BC1A8', bg: 'bg-[#E8F8F5]' },
  warn: { label: '주의', color: '#D3735D', bg: 'bg-[#FAF4EB]' },
  favorable: { label: '다르지만 유리', color: '#6366F1', bg: 'bg-[#EEF0FF]' },
  unavailable: { label: '측정 못함', color: '#8E949A', bg: 'bg-[#F2F3F4]' },
};

/**
 * 임계값 게이지. 트랙 가운데가 기준(차이 0)이고, 가운데 밝은 띠가 허용 범위(±threshold)다.
 * 마커가 띠 안이면 양호, 띠 밖으로 나간 거리가 곧 초과량이다.
 *
 * 반폭이 나타내는 값(span)은 |차이|와 임계값 중 큰 쪽을 기준으로 잡되, 임계값에 하한을 둔다.
 * 하한이 없으면 차이가 0에 가까울 때 허용 띠가 트랙을 가득 채워 "띠"로 보이지 않는다.
 * 여유 배수(1.15)는 마커가 트랙 끝에 붙어 잘리는 것을 막는다.
 */
function ThresholdGauge({
  difference,
  threshold,
  unit,
  color,
}: {
  difference: number;
  threshold: number;
  unit: string | null;
  color: string;
}) {
  const span = Math.max(Math.abs(difference) * 1.15, threshold * 2.2);
  // 트랙 반폭(50%p)이 span에 대응하므로, 허용 띠의 한쪽 폭도 같은 축척으로 환산한다.
  const bandHalf = (threshold / span) * 50;
  const markerPos = 50 + (difference / span) * 50;

  return (
    <View className="mb-1.5">
      <View className="h-3 w-full rounded-full bg-[#F2F4F6] overflow-hidden">
        <View
          style={{
            position: 'absolute',
            left: `${50 - bandHalf}%`,
            width: `${bandHalf * 2}%`,
            height: '100%',
            backgroundColor: '#E8F8F5',
          }}
        />
        {/* 기준선 */}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            width: 1,
            height: '100%',
            backgroundColor: '#C3CBD1',
          }}
        />
        {/* 현재 위치 */}
        <View
          style={{
            position: 'absolute',
            left: `${markerPos}%`,
            marginLeft: -3,
            width: 6,
            height: '100%',
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      </View>
      <View className="flex-row justify-between mt-1">
        <AppText className="text-text-secondary text-[10px]">작음</AppText>
        <AppText className="text-text-secondary text-[10px]">
          허용 ±{formatJudgment(threshold, unit)}
        </AppText>
        <AppText className="text-text-secondary text-[10px]">큼</AppText>
      </View>
    </View>
  );
}

interface PhaseMetricRowProps {
  metric: PhaseMetric;
  /** 지표가 측정된 순간으로 이동. 없으면 버튼을 그리지 않는다. */
  onSeekFrame?: (frame: number) => void;
}

export default function PhaseMetricRow({ metric, onSeekFrame }: PhaseMetricRowProps) {
  // status는 백엔드에서 plain String으로 내려온다. 알려진 4개 값이 아니어도(향후 추가된 값 등)
  // 화면이 죽지 않도록 '측정 못함' 스타일로 대체한다.
  const style = STATUS_STYLE[metric.status] ?? STATUS_STYLE.unavailable;
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

      {metric.userValue !== null && metric.proValue !== null ? (
        <View className="flex-row items-center mb-1">
          <AppText className="text-text-secondary text-xs">
            나 {formatValue(metric.userValue, metric.unit)}  ·  기준 {formatValue(metric.proValue, metric.unit)}
          </AppText>
        </View>
      ) : (
        <AppText className="text-text-secondary text-xs mb-1">
          관절이 가려져 이 구간에서는 값을 재지 못했어요.
        </AppText>
      )}

      {measured && metric.difference !== null && metric.threshold !== null && metric.threshold > 0 ? (
        <>
          <ThresholdGauge
            difference={metric.difference}
            threshold={metric.threshold}
            unit={metric.unit}
            color={style.color}
          />
          <AppText weight="medium" className="text-text-primary text-xs mb-1">
            {describeDifference(metric.difference, metric.unit)}
          </AppText>
        </>
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
