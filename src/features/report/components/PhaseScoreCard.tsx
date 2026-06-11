import React from 'react';
import { View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { PhaseScore } from '../types/report.types';

interface PhaseScoreCardProps {
  scores: PhaseScore[];
}

export default function PhaseScoreCard({ scores }: PhaseScoreCardProps) {
  return (
    <View 
      className="bg-white rounded-3xl mx-5 mt-5 px-5 py-5 mb-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, shadowOffset: { width: 0, height: 2 } }}
    >
      <AppText weight="bold" className="text-lg text-text-primary mb-4">
        구간별 점수
      </AppText>
      
      {scores.map((item, index) => {
        // 점수를 비율로 계산 (최대 100 기준)
        const percentage = Math.min(Math.max(item.score, 0), 100);
        
        return (
          <View key={index} className="mb-4">
            <View className="flex-row justify-between items-center mb-1.5">
              <AppText weight="bold" className="text-text-primary text-sm">
                {item.phaseName}
              </AppText>
              <View className="flex-row items-baseline">
                <AppText weight="bold" className="text-text-secondary text-sm">
                  {item.score}
                </AppText>
                <AppText weight="bold" className="text-text-secondary text-[10px] ml-0.5">
                  점
                </AppText>
              </View>
            </View>
            <View className="h-2 w-full bg-[#F2F4F6] rounded-full overflow-hidden">
              <View 
                className="h-full bg-[#8EC5B6] rounded-full" 
                style={{ width: `${percentage}%` }} 
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
