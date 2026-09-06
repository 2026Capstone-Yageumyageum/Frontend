/**
 * [ReportScreen.tsx]
 * AI 분석 결과 리포트 화면.
 *
 * 화면 상태는 네 가지뿐이고, 그 밖의 경우는 없습니다.
 *   ① 로딩   — 결과를 불러오는 중
 *   ② 실패   — 조회가 실패함. 백엔드 ErrorCode의 message를 보여주고, 회복 가능하면 재시도를 준다
 *   ③ 비어있음 — 조회는 성공했지만 비교 결과가 하나도 없음(백엔드는 이때 200 + results: [] 를 준다)
 *   ④ 성공   — 실데이터로 렌더
 *
 * 주의: 어떤 상태에서도 mock 데이터를 대신 그리지 않습니다.
 * 예전에는 ①~③에서 MOCK_REPORT_DATA로 폴백해, 서버가 죽어 있어도 그럴듯한
 * 남의 피드백이 내 리포트인 것처럼 표시됐습니다.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../types/navigation';
import ReportHeader from '../components/ReportHeader';
import ReportTabs from '../components/ReportTabs';
import ReportSummaryCard from '../components/ReportSummaryCard';
import SkeletonOverlayPlayer, { PhaseSegment } from '../components/SkeletonOverlayPlayer';
import PhaseFeedback from '../components/PhaseFeedback';
import ComparePlayerSheet from '../components/ComparePlayerSheet';
import PhaseScoreCard from '../components/PhaseScoreCard';
import ReleaseAnalysisCard from '../components/ReleaseAnalysisCard';
import ReportNotice from '../components/ReportNotice';
import { buildComparePlayers, buildReportData } from '../utils/mapReport';
import {
  AnalysisResultResponse,
  getAnalysisResult,
  getReferenceData,
  getSkeleton,
  ReferenceData,
} from '../../../api/analysisApi';
import { getErrorMessage, isRetryable, requiresReLogin } from '../../../api/apiError';
import { parseSkeletonCsv } from '../utils/skeleton';

export default function ReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Report'>>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'insight'>('timeline');
  const [isSheetVisible, setSheetVisible] = useState(false);

  const isBestPitch = route.params?.isBestPitch ?? false;
  const reportType = route.params?.reportType ?? 'pro';
  const videoId = route.params?.videoId;
  const videoUri = route.params?.videoUri;
  // 최고의 1구 비교('me')일 때 오른쪽에 그릴 최고의 1구 골격을 가져올 영상 id
  const bestPitchVideoId = route.params?.bestPitchVideoId;

  // 결과: 분석 직후엔 params로 받고, 피드에서 진입하면 videoId로 조회한다.
  const passedResult = route.params?.result ?? null;
  const [result, setResult] = useState<AnalysisResultResponse | null>(passedResult);
  const [loading, setLoading] = useState(!passedResult && !!videoId);
  const [error, setError] = useState<unknown>(null);
  // 재시도 버튼이 조회를 다시 트리거하기 위한 카운터
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (passedResult || !videoId) return;
    let active = true;
    setLoading(true);
    setError(null);
    getAnalysisResult(videoId)
      .then((r) => {
        if (active) setResult(r);
      })
      .catch((e) => {
        // 실패를 삼키지 않는다. 삼키면 화면이 "데이터 없음"과 구분하지 못한다.
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoId, passedResult, retryCount]);

  const handleRetry = useCallback(() => setRetryCount((n) => n + 1), []);

  // 스켈레톤 오버레이용 데이터: 내 골격 CSV + (프로 레퍼런스 | 최고의 1구) 골격
  const [userSkeletonCsv, setUserSkeletonCsv] = useState<string | null>(null);
  const [refData, setRefData] = useState<ReferenceData[] | null>(null);
  // 최고의 1구 비교일 때 오른쪽에 그릴 최고의 1구 골격 CSV
  const [bestSkeletonCsv, setBestSkeletonCsv] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    getSkeleton(videoId)
      .then((s) => {
        if (active) setUserSkeletonCsv(s.skeletonData);
      })
      .catch(() => {
        /* 골격 미수신 시 오버레이만 비워둔다(리포트 본문은 그대로 유효하다) */
      });
    // 프로 비교일 때만 프로 레퍼런스 목록을 받는다.
    if (reportType !== 'me') {
      getReferenceData()
        .then((d) => {
          if (active) setRefData(d);
        })
        .catch(() => {
          /* 프로 레퍼런스 미수신 시 프로 스켈레톤만 비워둔다 */
        });
    }
    return () => {
      active = false;
    };
  }, [videoId, reportType, retryCount]);

  // 최고의 1구('me') 비교: 비교 대상 영상의 골격을 가져온다.
  useEffect(() => {
    if (reportType !== 'me' || typeof bestPitchVideoId !== 'number') return;
    let active = true;
    getSkeleton(bestPitchVideoId)
      .then((s) => {
        if (active) setBestSkeletonCsv(s.skeletonData);
      })
      .catch(() => {
        /* 최고의 1구 골격 미수신 시 오른쪽만 비워둔다 */
      });
    return () => {
      active = false;
    };
  }, [reportType, bestPitchVideoId, retryCount]);

  // 선택된 비교 선수는 id로만 들고, 목록에서 파생한다(목록이 비동기로 바뀌어도 안전).
  // 결과가 없으면 빈 목록이 되고, 아래 렌더에서 "비어있음" 상태로 처리한다.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const players = useMemo(() => (result ? buildComparePlayers(result) : []), [result]);
  const selectedPlayer = players.find((p) => p.id === selectedId) ?? players[0];
  const selectedPlayerId = selectedPlayer?.id;

  const userFrames = useMemo(() => parseSkeletonCsv(userSkeletonCsv), [userSkeletonCsv]);
  // 오른쪽 비교 골격: 'me'면 최고의 1구, 'pro'면 선택된 프로 (선수 변경 시 갱신)
  const proFrames = useMemo(() => {
    if (reportType === 'me') return parseSkeletonCsv(bestSkeletonCsv);
    if (!refData || !selectedPlayerId) return [];
    const match = refData.find((r) => String(r.proId) === selectedPlayerId);
    return parseSkeletonCsv(match?.skeleton_data);
  }, [reportType, bestSkeletonCsv, refData, selectedPlayerId]);

  // 선택된 프로 기준 단계 구간(프레임) — 재생 바를 단계별 색으로 나누는 데 사용
  const phaseSegments = useMemo<PhaseSegment[]>(() => {
    if (!result || !selectedPlayerId) return [];
    const match = result.results.find((r) => String(r.proId) === selectedPlayerId);
    return (match?.detail?.phaseScores ?? [])
      .filter((p) => p.userEndFrame > p.userStartFrame)
      .map((p) => ({
        phase: p.phase,
        label: p.label,
        startFrame: p.userStartFrame,
        endFrame: p.userEndFrame,
        proStartFrame: p.proStartFrame,
        proEndFrame: p.proEndFrame,
      }));
  }, [result, selectedPlayerId]);

  // ── ① 로딩 ────────────────────────────────────────────────────────────────
  if (loading && !result) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page items-center justify-center">
        <ActivityIndicator size="large" color="#3BC1A8" />
      </SafeAreaView>
    );
  }

  // ── ② 실패 ────────────────────────────────────────────────────────────────
  // 백엔드는 실패를 { code, message } 형식으로 내려준다. message는 사용자에게 보여줘도
  // 되도록 작성돼 있으므로 그대로 쓰고, 회복 가능한 실패일 때만 재시도를 제안한다.
  if (error && !result) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page">
        <ReportHeader />
        <View className="flex-1 justify-center">
          <ReportNotice
            icon="cloud-offline-outline"
            title="분석 결과를 불러오지 못했어요"
            description={getErrorMessage(error)}
            actionLabel={isRetryable(error) ? '다시 시도' : undefined}
            onAction={isRetryable(error) ? handleRetry : undefined}
          />
          {requiresReLogin(error) ? (
            <ReportNotice
              icon="log-in-outline"
              title="다시 로그인해 주세요"
              description="로그인 정보가 만료되어 결과를 볼 수 없어요."
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── ③ 비어있음 ────────────────────────────────────────────────────────────
  // videoId도 result도 없이 진입했거나(잘못된 경로), 조회는 됐지만 비교 결과가 0건인 경우.
  if (!result || !selectedPlayer) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page">
        <ReportHeader />
        <View className="flex-1 justify-center">
          <ReportNotice
            icon="document-text-outline"
            title="표시할 분석 결과가 없어요"
            description={
              result
                ? '이 영상에는 비교 결과가 저장되지 않았어요. 다시 분석해 주세요.'
                : '리포트를 열 수 없어요. 목록에서 다시 선택해 주세요.'
            }
            actionLabel={result && videoId ? '다시 시도' : undefined}
            onAction={result && videoId ? handleRetry : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── ④ 성공 ────────────────────────────────────────────────────────────────
  const currentData = { ...buildReportData(result, selectedPlayer, reportType), isBestPitch };

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
          phases={phaseSegments}
          isSingleVideo={activeTab === 'insight'}
          comparePlayerId={selectedPlayer.id}
          compareLabel={reportType === 'me' ? '최고의 1구' : '프로 스켈레톤'}
          compareShortLabel={reportType === 'me' ? '베스트' : '프로'}
        />

        {/*
          상세(detailJson)를 못 받은 경우. 분석 자체는 끝나 유사도는 유효하지만
          구간별 피드백·인사이트는 없다. 빈 카드를 그리거나 지어내지 않고 사실대로 알린다.
        */}
        {!currentData.hasDetail ? (
          <ReportNotice
            icon="information-circle-outline"
            title="구간별 상세 분석을 불러오지 못했어요"
            description="전체 유사도는 정상이지만 구간별 피드백이 저장되지 않았어요. 다시 분석하면 상세를 볼 수 있어요."
            actionLabel={videoId ? '다시 시도' : undefined}
            onAction={videoId ? handleRetry : undefined}
          />
        ) : activeTab === 'timeline' ? (
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
