import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../types/navigation';
import AppText from '../../../components/common/AppText';
import {
  requestAnalysis,
  requestBestPitchAnalysis,
  registerBestPitch,
  pollAnalysisResult,
} from '../../../api/analysisApi';
import { ApiError, getErrorMessage } from '../../../api/apiError';

/**
 * 분석 대기 화면.
 * CameraScreen에서 받은 로컬 영상 uri를 ① 업로드해 videoId를 받고
 * ② 결과가 COMPLETED 될 때까지 폴링한 뒤 ③ Report 화면으로 결과를 넘긴다.
 */
export default function AnalysisLoadingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AnalysisLoading'>>();

  const [statusText, setStatusText] = useState('영상을 업로드하고 있어요');
  // 화면이 리렌더되어도 분석 파이프라인이 중복 실행되지 않도록 가드
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const videoUri = route.params?.videoUri;

    (async () => {
      try {
        if (!videoUri) {
          throw new Error('분석할 영상이 없습니다.');
        }

        const bestPitchVideoId = route.params?.bestPitchVideoId;
        const isBestPitchComparison = route.params?.reportType === 'me';

        /*
         * 최고의 1구 비교로 들어왔는데 비교 대상이 없으면 여기서 멈춘다.
         *
         * 예전에는 대상이 없으면 조용히 프로 분석(requestAnalysis)으로 넘어갔다.
         * 그런데 화면 라벨은 reportType으로만 정해지므로, 결과는 "일관성"이라고 적힌
         * 프로 비교 리포트가 됐다. 점수도 최고의 1구가 아닌 프로와의 유사도였고,
         * 저장된 기록은 PRO라 일관성 탭에는 나타나지 않았다.
         *
         * 화면이 무엇을 보여줄지(reportType)와 실제로 무엇을 분석할지(대상 유무)가
         * 서로 다른 값을 보고 갈라진 것이 원인이었다. 이제 어긋나면 진행하지 않는다.
         */
        if (isBestPitchComparison && typeof bestPitchVideoId !== 'number') {
          throw new ApiError({
            status: 0,
            code: 'BEST_PITCH_NOT_SELECTED',
            message: '비교할 최고의 1구를 먼저 선택해 주세요.',
          });
        }

        // 1) 업로드 → videoId 확보 (202 즉시 반환). 구종 + 트림 구간도 함께 전달.
        //    bestPitchVideoId가 있으면 프로 대신 내 최고의 1구와 비교한다.
        const { videoId } =
          typeof bestPitchVideoId === 'number'
            ? await requestBestPitchAnalysis(
                videoUri,
                bestPitchVideoId,
                route.params?.pitchType,
                route.params?.trimStartSec,
                route.params?.trimEndSec,
              )
            : await requestAnalysis(
                videoUri,
                route.params?.pitchType,
                route.params?.trimStartSec,
                route.params?.trimEndSec,
              );

        // 2) 결과 폴링 (status COMPLETED 까지)
        setStatusText('AI가 투구 자세를 분석하고 있어요');
        const result = await pollAnalysisResult(videoId);

        // 2-1) 사용자가 이 영상을 최고의 1구로 등록하기로 했으면 등록한다(분석 완료 후).
        if (route.params?.registerBest) {
          try {
            await registerBestPitch(videoId);
          } catch (e) {
            // 등록 실패는 리포트 진입을 막지 않는다(로그만).
            console.warn('[최고의 1구 등록 실패]', e);
          }
        }

        // 3) 결과를 Report 화면으로 전달
        // @ts-ignore - Report 스크린은 Root 스택에 정의되어 있음
        navigation.replace('Report', {
          videoId,
          result,
          videoUri, // 내 로컬 영상 uri를 넘겨 결과 화면에서 스켈레톤 오버레이로 재생
          isBestPitch: route.params?.isBestPitch,
          reportType: route.params?.reportType,
          bestPitchVideoId,
        });
      } catch (error) {
        // 업로드·폴링 실패는 모두 ApiError로 올라온다. 백엔드 message는 사용자에게
        // 보여줘도 되도록 작성돼 있으므로 그대로 쓰고, 그 밖의 예외만 기본 문구로 덮는다.
        Alert.alert('분석 실패', getErrorMessage(error, '분석 중 문제가 발생했습니다.'), [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, [navigation, route.params]);

  return (
    <View className="flex-1 bg-surface-page items-center justify-center">
      <ActivityIndicator size="large" color="#D9D9D9" className="mb-6" />

      <AppText weight="bold" className="text-text-primary text-xl mb-4">
        분석 중이에요
      </AppText>

      <AppText className="text-text-secondary text-sm mb-1">{statusText}</AppText>
      <AppText className="text-text-secondary text-sm">잠시만 기다려주세요</AppText>
    </View>
  );
}
