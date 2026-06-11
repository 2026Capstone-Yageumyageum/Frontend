import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import AppText from '../../../components/common/AppText';

interface ReportTabsProps {
  activeTab: 'timeline' | 'insight';
  onChange: (tab: 'timeline' | 'insight') => void;
}

export default function ReportTabs({ activeTab, onChange }: ReportTabsProps) {
  return (
    <View className="flex-row px-5 border-b border-border bg-surface-page">
      {/* 타임라인 탭 */}
      <TouchableOpacity 
        className="mr-6 items-center" 
        onPress={() => onChange('timeline')}
        activeOpacity={0.7}
      >
        <AppText 
          weight={activeTab === 'timeline' ? 'bold' : 'medium'}
          className={`text-lg pb-2 ${activeTab === 'timeline' ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          타임라인
        </AppText>
        <View className={`h-1 w-full rounded-full ${activeTab === 'timeline' ? 'bg-brand' : 'bg-transparent'}`} />
      </TouchableOpacity>

      {/* 인사이트 탭 */}
      <TouchableOpacity 
        className="items-center" 
        onPress={() => onChange('insight')}
        activeOpacity={0.7}
      >
        <AppText 
          weight={activeTab === 'insight' ? 'bold' : 'medium'}
          className={`text-lg pb-2 ${activeTab === 'insight' ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          인사이트
        </AppText>
        <View className={`h-1 w-full rounded-full ${activeTab === 'insight' ? 'bg-brand' : 'bg-transparent'}`} />
      </TouchableOpacity>
    </View>
  );
}
