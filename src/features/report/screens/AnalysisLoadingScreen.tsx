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
        Alert.alert(
          '분석 실패',
          error instanceof Error ? error.message : '분석 중 문제가 발생했습니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }],
        );
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
