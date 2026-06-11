import React from 'react';
import { View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { ReleaseTiming, ReleasePoint } from '../types/report.types';

interface ReleaseAnalysisCardProps {
  timing: ReleaseTiming;
  point: ReleasePoint;
}

export default function ReleaseAnalysisCard({ timing, point }: ReleaseAnalysisCardProps) {
  
  const renderRow = (label: string, value: string | number, isGood: boolean) => {
    const badgeBg = isGood ? 'bg-[#E8F8F5]' : 'bg-[#FAF4EB]';
    const badgeText = isGood ? '#3BC1A8' : '#D3735D';
    
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
        릴리즈 분석
      </AppText>
      
      {/* 타이밍 섹션 */}
      <View className="mb-2">
        <AppText weight="bold" className="text-text-secondary text-sm mb-3">타이밍</AppText>
        {renderRow('내 릴리즈 타이밍', `${timing.myTiming}%`, timing.myTiming >= 90)}
        {renderRow('선수 릴리즈 타이밍', `${timing.proTiming}%`, timing.proTiming >= 90)}
        {renderRow('차이', `${timing.diff > 0 ? '+' : ''}${timing.diff}%`, Math.abs(timing.diff) < 5)}
        
        <AppText weight="bold" className="text-text-primary text-sm mt-1 mb-5 leading-5">
          {timing.feedback}
        </AppText>
      </View>

      <View className="h-px bg-border w-full mb-5" />

      {/* 포인트 섹션 */}
      <View>
        <AppText weight="bold" className="text-text-secondary text-sm mb-3">릴리즈 포인트</AppText>
        {renderRow('전체 차이', point.totalDiff.toFixed(3), point.totalDiff < 0.1)}
        {renderRow('높이 차이', (point.heightDiff > 0 ? '+' : '') + point.heightDiff.toFixed(3), Math.abs(point.heightDiff) < 0.05)}
        {renderRow('좌우 차이', (point.widthDiff > 0 ? '+' : '') + point.widthDiff.toFixed(3), Math.abs(point.widthDiff) < 0.05)}
        
        <AppText weight="bold" className="text-text-primary text-sm mt-1 mb-1 leading-5">
          {point.feedback}
        </AppText>
      </View>
    </View>
  );
}
