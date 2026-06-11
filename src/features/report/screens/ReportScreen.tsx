import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReportHeader from '../components/ReportHeader';
import ReportTabs from '../components/ReportTabs';
import ReportSummaryCard from '../components/ReportSummaryCard';
import VideoCompareArea from '../components/VideoCompareArea';
import PhaseFeedback from '../components/PhaseFeedback';
import ComparePlayerSheet from '../components/ComparePlayerSheet';
import PhaseScoreCard from '../components/PhaseScoreCard';
import ReleaseAnalysisCard from '../components/ReleaseAnalysisCard';
import AppText from '../../../components/common/AppText';
import { MOCK_REPORT_DATA, MOCK_COMPARE_PLAYERS } from '../data/report.mockdata';

export default function ReportScreen() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'insight'>('timeline');
  const [selectedPlayer, setSelectedPlayer] = useState(MOCK_COMPARE_PLAYERS[0]);
  const [isSheetVisible, setSheetVisible] = useState(false);

  // 현재 선택된 선수에 맞춰 데이터 갱신 (실제 연동시엔 API에서 재호출 또는 스토어 사용)
  const currentData = {
    ...MOCK_REPORT_DATA,
    overallSimilarity: selectedPlayer.similarity,
    comparePlayer: selectedPlayer,
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      {/* 헤더 */}
      <ReportHeader />

      {/* 탭 */}
      <ReportTabs activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 상단 요약 카드 */}
        <ReportSummaryCard 
          data={currentData} 
          onPressPlayer={() => setSheetVisible(true)} 
        />

        {/* 탭별 콘텐츠 */}
        {activeTab === 'timeline' ? (
          <View>
            {/* 비디오 및 타임라인 컨트롤 */}
            <VideoCompareArea score={currentData.overallSimilarity} />

            {/* 구간별 피드백 리스트 */}
            <View className="mt-2">
              {currentData.feedbacks.map((feedback, index) => (
                <PhaseFeedback key={index} data={feedback} />
              ))}
            </View>
          </View>
        ) : (
          <View>
            {/* 비디오 및 타임라인 컨트롤 (단일 영상 모드) */}
            <VideoCompareArea score={currentData.overallSimilarity} isSingleVideo={true} />
            
            {/* 인사이트 탭의 새로운 콘텐츠 */}
            <PhaseScoreCard scores={currentData.insight.phaseScores} />
            <ReleaseAnalysisCard 
              timing={currentData.insight.releaseTiming} 
              point={currentData.insight.releasePoint} 
            />
          </View>
        )}
      </ScrollView>

      {/* 바텀 시트 */}
      <ComparePlayerSheet
        visible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
        players={MOCK_COMPARE_PLAYERS}
        selectedId={selectedPlayer.id}
        onSelect={setSelectedPlayer}
      />
    </SafeAreaView>
  );
}
