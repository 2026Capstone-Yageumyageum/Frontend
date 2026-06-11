import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../types/navigation';
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
  const route = useRoute<RouteProp<RootStackParamList, 'Report'>>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'insight'>('timeline');
  const [selectedPlayer, setSelectedPlayer] = useState(MOCK_COMPARE_PLAYERS[0]);
  const [isSheetVisible, setSheetVisible] = useState(false);

  // 라우트 파라미터에서 정보 읽기
  const isBestPitch = route.params?.isBestPitch ?? false;
  const reportType = route.params?.reportType ?? 'pro'; // 기본값 'pro'

  // 현재 선택된 선수에 맞춰 데이터 갱신 (실제 연동시엔 API에서 재호출 또는 스토어 사용)
  const currentData = {
    ...MOCK_REPORT_DATA,
    isBestPitch,
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
          reportType={reportType}
          onPressPlayer={() => setSheetVisible(true)} 
        />

        {/* 비디오 및 타임라인 컨트롤 (공통) */}
        <VideoCompareArea 
          score={currentData.overallSimilarity} 
          isSingleVideo={activeTab === 'insight'} 
        />

        {/* 탭별 콘텐츠 */}
        {activeTab === 'timeline' ? (
          <View className="mt-2">
            {/* 구간별 피드백 리스트 */}
            {currentData.feedbacks.map((feedback, index) => (
              <PhaseFeedback key={index} data={feedback} reportType={reportType} />
            ))}
          </View>
        ) : (
          <View>
            {/* 인사이트 탭의 새로운 콘텐츠 */}
            <PhaseScoreCard scores={currentData.insight.phaseScores} />
            <ReleaseAnalysisCard 
              timing={currentData.insight.releaseTiming} 
              point={currentData.insight.releasePoint} 
              reportType={reportType}
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
