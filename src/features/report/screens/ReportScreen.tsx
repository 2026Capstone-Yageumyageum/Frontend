import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../types/navigation';
import ReportHeader from '../components/ReportHeader';
import ReportTabs from '../components/ReportTabs';
import ReportSummaryCard from '../components/ReportSummaryCard';
import SkeletonOverlayPlayer from '../components/SkeletonOverlayPlayer';
import PhaseFeedback from '../components/PhaseFeedback';
import ComparePlayerSheet from '../components/ComparePlayerSheet';
import PhaseScoreCard from '../components/PhaseScoreCard';
import ReleaseAnalysisCard from '../components/ReleaseAnalysisCard';
import AppText from '../../../components/common/AppText';
import { MOCK_REPORT_DATA, MOCK_COMPARE_PLAYERS } from '../data/report.mockdata';
import { buildComparePlayers, buildReportData } from '../utils/mapReport';
import {
  AnalysisResultResponse,
  getAnalysisResult,
  getReferenceData,
  getSkeleton,
  ReferenceData,
} from '../../../api/analysisApi';
import { parseSkeletonCsv } from '../utils/skeleton';

export default function ReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Report'>>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'insight'>('timeline');
  const [isSheetVisible, setSheetVisible] = useState(false);

  const isBestPitch = route.params?.isBestPitch ?? false;
  const reportType = route.params?.reportType ?? 'pro';
  const videoId = route.params?.videoId;
  const videoUri = route.params?.videoUri;

  // 결과: 분석 직후엔 params로 받고, 피드에서 진입하면 videoId로 조회한다.
  const [result, setResult] = useState<AnalysisResultResponse | null>(
    route.params?.result ?? null,
  );
  const [loading, setLoading] = useState(!route.params?.result && !!videoId);

  useEffect(() => {
    if (route.params?.result || !videoId) return;
    let active = true;
    setLoading(true);
    getAnalysisResult(videoId)
      .then((r) => {
        if (active) setResult(r);
      })
      .catch(() => {
        // 실패 시 mock 폴백 (아래 렌더에서 처리)
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoId, route.params?.result]);

  // 선택된 비교 선수는 id로만 들고, 목록에서 파생한다(목록이 비동기로 바뀌어도 안전).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const players =
    result && result.results.length > 0 ? buildComparePlayers(result) : MOCK_COMPARE_PLAYERS;
  const selectedPlayer = players.find((p) => p.id === selectedId) ?? players[0];

  // 스켈레톤 오버레이용 데이터: 내 골격 CSV + 프로 레퍼런스 골격 목록
  const [userSkeletonCsv, setUserSkeletonCsv] = useState<string | null>(null);
  const [refData, setRefData] = useState<ReferenceData[] | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    getSkeleton(videoId)
      .then((s) => {
        if (active) setUserSkeletonCsv(s.skeletonData);
      })
      .catch(() => {
        /* 골격 미수신 시 오버레이만 비워둔다 */
      });
    getReferenceData()
      .then((d) => {
        if (active) setRefData(d);
      })
      .catch(() => {
        /* 프로 레퍼런스 미수신 시 프로 스켈레톤만 비워둔다 */
      });
    return () => {
      active = false;
    };
  }, [videoId]);

  const userFrames = useMemo(() => parseSkeletonCsv(userSkeletonCsv), [userSkeletonCsv]);
  // 선택된 프로의 skeleton만 파싱(선수 변경 시 갱신)
  const proFrames = useMemo(() => {
    if (!refData) return [];
    const match = refData.find((r) => String(r.proId) === selectedPlayer.id);
    return parseSkeletonCsv(match?.skeleton_data);
  }, [refData, selectedPlayer.id]);

  if (loading && !result) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page items-center justify-center">
        <ActivityIndicator size="large" color="#3BC1A8" />
      </SafeAreaView>
    );
  }

  const currentData = result
    ? { ...buildReportData(result, selectedPlayer), isBestPitch }
    : {
        ...MOCK_REPORT_DATA,
        isBestPitch,
        overallSimilarity: selectedPlayer.similarity,
        comparePlayer: selectedPlayer,
      };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <ReportHeader />

      <ReportTabs activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ReportSummaryCard
          data={currentData}
          reportType={reportType}
          onPressPlayer={() => setSheetVisible(true)}
        />

        <SkeletonOverlayPlayer
          score={currentData.overallSimilarity}
          userVideoUri={videoUri}
          userFrames={userFrames}
          proFrames={proFrames}
          isSingleVideo={activeTab === 'insight'}
        />

        {activeTab === 'timeline' ? (
          <View className="mt-2">
            {currentData.feedbacks.map((feedback, index) => (
              <PhaseFeedback key={index} data={feedback} reportType={reportType} />
            ))}
          </View>
        ) : (
          <View>
            <PhaseScoreCard scores={currentData.insight.phaseScores} />
            <ReleaseAnalysisCard
              timing={currentData.insight.releaseTiming}
              point={currentData.insight.releasePoint}
              reportType={reportType}
            />
          </View>
        )}
      </ScrollView>

      <ComparePlayerSheet
        visible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
        players={players}
        selectedId={selectedPlayer.id}
        onSelect={(player) => setSelectedId(player.id)}
      />
    </SafeAreaView>
  );
}
