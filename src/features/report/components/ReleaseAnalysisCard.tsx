import React from 'react';
import { View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { ReleaseTiming, ReleasePoint } from '../types/report.types';

interface ReleaseAnalysisCardProps {
  timing: ReleaseTiming;
  point: ReleasePoint;
  reportType?: 'pro' | 'me';
}

export default function ReleaseAnalysisCard({ timing, point, reportType = 'pro' }: ReleaseAnalysisCardProps) {
  
  // 발 착지~피니시 기준 릴리즈 위치 차이 허용폭(백엔드 RELEASE_TIMING_GOOD_THRESHOLD와 일치).
  const TIMING_DIFF_GOOD = 10;

  const renderRow = (label: string, value: string | number, tone: 'good' | 'bad' | 'neutral') => {
    const palette = {
      good: { bg: 'bg-[#E8F8F5]', text: '#3BC1A8' },
      bad: { bg: 'bg-[#FAF4EB]', text: '#D3735D' },
      neutral: { bg: 'bg-[#F2F3F4]', text: '#6B7280' },
    }[tone];
    const badgeBg = palette.bg;
    const badgeText = palette.text;

    return (
      <View className="flex-row justify-between items-center mb-3">
        <AppText weight="medium" className="text-text-secondary text-sm">
          {label}
        </AppText>
        <View className={`px-2.5 py-1 rounded-full ${badgeBg}`}>
          <AppText weight="bold" className="text-sm" style={{ color: badgeText }}>
            {value}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View 
      className="bg-white rounded-3xl mx-5 px-5 py-5 mb-10"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, shadowOffset: { width: 0, height: 2 } }}
    >
      <AppText weight="bold" className="text-lg text-text-primary mb-5">
        {reportType === 'pro' ? '릴리즈 분석' : '일관성 분석'}
      </AppText>
      
      {/* 타이밍 섹션 — 발 착지(스트라이드 착지)~피니시 구간에서 릴리즈가 차지하는 위치(%) */}
      <View className="mb-2">
        <AppText weight="bold" className="text-text-secondary text-sm mb-1">타이밍</AppText>
        <AppText className="text-text-secondary text-xs mb-3">발 착지~피니시 기준 릴리즈 시점</AppText>
        {renderRow('내 릴리즈 시점', `${timing.myTiming}%`, 'neutral')}
        {renderRow('선수 릴리즈 시점', `${timing.proTiming}%`, 'neutral')}
        {renderRow(
          '차이',
          `${timing.diff > 0 ? '+' : ''}${timing.diff}%`,
          Math.abs(timing.diff) <= TIMING_DIFF_GOOD ? 'good' : 'bad',
        )}
        
        <AppText weight="bold" className="text-text-primary text-sm mt-1 mb-5 leading-5">
          {timing.feedback}
        </AppText>
      </View>

      <View className="h-px bg-border w-full mb-5" />

      {/* 포인트 섹션 */}
      <View>
        <AppText weight="bold" className="text-text-secondary text-sm mb-3">릴리즈 포인트</AppText>
        {renderRow('전체 차이', point.totalDiff.toFixed(3), point.totalDiff < 0.1 ? 'good' : 'bad')}
        {renderRow('높이 차이', (point.heightDiff > 0 ? '+' : '') + point.heightDiff.toFixed(3), Math.abs(point.heightDiff) < 0.05 ? 'good' : 'bad')}
        {renderRow('좌우 차이', (point.widthDiff > 0 ? '+' : '') + point.widthDiff.toFixed(3), Math.abs(point.widthDiff) < 0.05 ? 'good' : 'bad')}
        
        <AppText weight="bold" className="text-text-primary text-sm mt-1 mb-1 leading-5">
          {point.feedback}
        </AppText>
      </View>
    </View>
  );
}
