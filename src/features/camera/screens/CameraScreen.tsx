/**
 * [CameraScreen.tsx]
 * 카메라 탭 메인 화면 — 전체 플로우의 상태 머신 오케스트레이터
 *
 * ── 완성된 상태 전환 다이어그램 ──────────────────────────────────────────────
 *
 *   IDLE ──(녹화시작)──▶ RECORDING ──(중지)──▶ PREVIEW_EDIT_TIP
 *                                                    │
 *                                          ┌─────────┴──────────┐
 *                                     (저장아이콘)          (닫기/자동)
 *                                          │                    │
 *                               PREVIEW_SAVE_MODAL          PREVIEW
 *                                          │                    │(다음)
 *                                    (취소/저장)                ▼
 *                                          │           PITCH_SELECTION  [공통_3]
 *                                          │                    │(다음)
 *                                          │                    ▼
 *                                          │              EDITING        [프로_4]
 *                                          │                    │(완료)
 *                                          └──────────────▶ SUCCESS     [공통_5/5-1]
 *
 * ── 카메라 라이브러리 ────────────────────────────────────────────────────────
 *   react-native-vision-camera: 카메라 뷰파인더 + 영상 녹화
 *   expo-av: 녹화 영상 프리뷰 재생
 *   ⚠️ 반드시 `npx expo run:android` 또는 `npx expo run:ios`로 빌드 후 사용
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  CameraDevice,
  useVideoOutput,
  CameraRef,
  Recorder,
} from 'react-native-vision-camera';
import { Video, ResizeMode } from 'expo-av';

import {
  CameraFlowState,
  CameraMode,
  RecordedVideo,
  PitchType,
  TrimRange,
} from '../types/camera.types';
import { useRecordingTimer } from '../hooks/useRecordingTimer';
import CameraToggle from '../components/CameraToggle';
import RecordButton from '../components/RecordButton';
import RecordingTimer from '../components/RecordingTimer';
import VideoPreviewTimeline from '../components/VideoPreviewTimeline';
import EditTooltip from '../components/EditTooltip';
import SaveVideoModal from '../components/SaveVideoModal';
import PitchSelectionSheet from '../components/PitchSelectionSheet';
import VideoTrimmerTimeline from '../components/VideoTrimmerTimeline';
import BestPitchRegisterSheet from '../components/BestPitchRegisterSheet';
import PastVideoSelectionSheet, { PastVideo } from '../components/PastVideoSelectionSheet';

export default function CameraScreen() {
  // ── 카메라 권한 ────────────────────────────────────────────────────────────
  const { hasPermission, requestPermission } = useCameraPermission();

  // ── 카메라 디바이스 (기본: 후면 카메라) ───────────────────────────────────
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<CameraRef>(null);
  const recorderRef = useRef<Recorder | null>(null);

  // ── 비디오 아웃풋 (녹화용) ──────────────────────────────────────────────────
  const videoOutput = useVideoOutput({ enableAudio: true });

  // ── 플로우 상태 머신 ────────────────────────────────────────────────────────
  const [flowState, setFlowState] = useState<CameraFlowState>('IDLE');

  // ── 카메라 모드 ────────────────────────────────────────────────────────────
  const [cameraMode, setCameraMode] = useState<CameraMode>('pro');

  // ── 녹화 완료 영상 ────────────────────────────────────────────────────────
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);

  // ── 선택된 구종 (PITCH_SELECTION 상태에서 관리) ───────────────────────────
  const [selectedPitch, setSelectedPitch] = useState<PitchType | null>(null);

  // ── 선택된 과거 영상 (Flow B - 내 베스트 투구용) ─────────────────────────────
  const [selectedPastVideo, setSelectedPastVideo] = useState<PastVideo | null>(null);

  // ── 트리밍 범위 (EDITING 상태에서 관리) ───────────────────────────────────
  const [trimRange, setTrimRange] = useState<TrimRange>({ startSec: 0, endSec: 0 });

  // ── 편집 화면 상단 타이머 (트리밍 현재 시간 표시) ─────────────────────────
  const [editCurrentTime, setEditCurrentTime] = useState(0);

  // ── 녹화 타이머 훅 ────────────────────────────────────────────────────────
  const { formattedTime, startTimer, stopTimer, resetTimer } = useRecordingTimer();

  // ────────────────────────────────────────────────────────────────────────────
  // 이벤트 핸들러
  // ────────────────────────────────────────────────────────────────────────────

  /** 권한 요청 */
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 권한을 허용해주세요.');
    }
  }, [requestPermission]);

  /** 카메라 전면/후면 전환 */
  const handleFlipCamera = useCallback(() => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  /** 녹화 시작 */
  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || !videoOutput) return;

    try {
      const recorder = await videoOutput.createRecorder({});
      recorderRef.current = recorder;

      setFlowState('RECORDING');
      startTimer();

      await recorder.startRecording(
        (filePath) => {
          stopTimer();
          const duration = recorder.recordedDuration;
          setRecordedVideo({ uri: filePath, duration });
          // 트리밍 범위 초기값 = 전체 영상
          setTrimRange({ startSec: 0, endSec: duration });
          setFlowState('PREVIEW_EDIT_TIP');
        },
        (error) => {
          console.error('[녹화 오류]', error);
          stopTimer();
          setFlowState('IDLE');
          Alert.alert('녹화 오류', '녹화 중 오류가 발생했습니다.');
        }
      );
    } catch (e) {
      console.error('[레코더 생성 오류]', e);
      stopTimer();
      setFlowState('IDLE');
      Alert.alert('녹화 시작 오류', '녹화를 시작할 수 없습니다.');
    }
  }, [startTimer, stopTimer, videoOutput]);

  /** 녹화 중지 */
  const handleStopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    await recorderRef.current.stopRecording();
    resetTimer();
  }, [resetTimer]);

  /** 녹화 버튼 탭 (IDLE → RECORDING / RECORDING → stop) */
  const handleRecordButtonPress = useCallback(() => {
    if (flowState === 'IDLE') handleStartRecording();
    else if (flowState === 'RECORDING') handleStopRecording();
  }, [flowState, handleStartRecording, handleStopRecording]);

  /** 과거 영상 선택 다음 버튼 (Flow B) */
  const handlePastVideoNext = useCallback((video: PastVideo) => {
    setSelectedPastVideo(video);
    setFlowState('IDLE');
  }, []);

  /** 재촬영: IDLE 리셋 */
  const handleRetake = useCallback(() => {
    setRecordedVideo(null);
    setSelectedPitch(null);
    resetTimer();
    setFlowState('IDLE');
  }, [resetTimer]);

  /** 저장 아이콘 → 저장 모달 */
  const handleSaveIconPress = useCallback(() => setFlowState('PREVIEW_SAVE_MODAL'), []);
  const handleSaveCancel = useCallback(() => setFlowState('PREVIEW'), []);
  const handleSaveConfirm = useCallback(async () => {
    Alert.alert('저장 완료', '영상이 갤러리에 저장되었습니다.');
    setFlowState('PREVIEW');
  }, []);

  /** 편집 툴팁 닫기 */
  const handleDismissTooltip = useCallback(() => setFlowState('PREVIEW'), []);

  /** 프리뷰 "다음" → 구종 선택 */
  const handlePreviewNext = useCallback(() => setFlowState('PITCH_SELECTION'), []);

  /** 구종 선택 "다음" → 트리밍 편집 */
  const handlePitchNext = useCallback(() => {
    if (!selectedPitch) return;
    setFlowState('EDITING');
  }, [selectedPitch]);

  /** 트리밍 편집 "완료" → 성공 화면 */
  const handleEditingComplete = useCallback(() => setFlowState('SUCCESS'), []);

  /** 트리밍 편집 "X" → 재촬영으로 돌아감 */
  const handleEditingClose = useCallback(() => setFlowState('PREVIEW'), []);

  /** 최고의 1구 등록 "완료" → IDLE 리셋 (다음에 분석 로딩 화면 추가 예정) */
  const handleSuccess = useCallback(() => {
    Alert.alert('등록 완료', '소중한 1구가 기록되었습니다!');
    handleRetake();
  }, [handleRetake]);

  // ────────────────────────────────────────────────────────────────────────────
  // 렌더링 분기
  // ────────────────────────────────────────────────────────────────────────────

  /** 권한 없을 때 */
  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <Ionicons name="camera-outline" size={48} color="white" />
        <Text className="text-white text-lg font-bold mt-4 mb-2">
          카메라 권한이 필요합니다
        </Text>
        <Text className="text-white/60 text-sm text-center mb-6">
          투구 영상을 촬영하려면 카메라 접근 권한을 허용해주세요.
        </Text>
        <TouchableOpacity
          onPress={handleRequestPermission}
          className="bg-brand px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">권한 허용하기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /** 카메라 디바이스 초기화 중 */
  if (!device) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white/60 text-sm">카메라를 초기화 중입니다...</Text>
      </SafeAreaView>
    );
  }

  // ── 상태 그룹 ─────────────────────────────────────────────────────────────
  const isViewfinder = flowState === 'IDLE' || flowState === 'RECORDING' || flowState === 'SELECTING_PITCH';
  const isPreview =
    flowState === 'PREVIEW' ||
    flowState === 'PREVIEW_EDIT_TIP' ||
    flowState === 'PREVIEW_SAVE_MODAL' ||
    flowState === 'PITCH_SELECTION'; // 구종 선택 시에도 프리뷰 영상은 유지
  const isEditing = flowState === 'EDITING';
  const isSuccess = flowState === 'SUCCESS';

  // ── 편집 화면 상단 타이머 텍스트 ─────────────────────────────────────────
  const editTimerText = `${String(Math.floor(editCurrentTime / 60)).padStart(2, '0')}:${String(Math.floor(editCurrentTime % 60)).padStart(2, '0')}`;

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">

      {/* ═══════════════════════════════════════════════════════════════════════
          A. 카메라 뷰파인더 (IDLE + RECORDING)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isViewfinder && (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device as CameraDevice}
            isActive={isViewfinder}
            outputs={[videoOutput]}
          />
          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'bottom']}>
            {/* 상단 UI */}
            <View className="px-4 pt-2">
              {flowState === 'IDLE' && (
                <>
                  <TouchableOpacity
                    className="w-9 h-9 rounded-full bg-black/40 items-center justify-center mb-3"
                    onPress={() => {}}
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                  <CameraToggle activeMode={cameraMode} onChange={setCameraMode} />
                </>
              )}
              {flowState === 'RECORDING' && (
                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                    onPress={handleStopRecording}
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                  <RecordingTimer formattedTime={formattedTime} />
                  <View className="w-9" />
                </View>
              )}
            </View>

            <View className="flex-1" />

            {/* 하단 컨트롤 */}
            <View className="pb-10">
              {flowState === 'IDLE' && (
                <View className="items-center mb-4">
                  {cameraMode === 'my' && !selectedPastVideo && (
                    <TouchableOpacity
                      onPress={() => setFlowState('SELECTING_PITCH')}
                      className="bg-brand px-5 py-2.5 rounded-full mb-3"
                    >
                      <Text className="text-white text-sm font-semibold">과거 영상 선택</Text>
                    </TouchableOpacity>
                  )}
                  {cameraMode === 'my' && selectedPastVideo && (
                    <TouchableOpacity
                      onPress={() => setFlowState('SELECTING_PITCH')}
                      className="bg-black/50 px-4 py-2 rounded-full mb-3 flex-row items-center"
                    >
                      <Ionicons name="videocam" size={14} color="white" />
                      <Text className="text-white text-sm ml-2 font-medium">
                        {selectedPastVideo.pitchType} ({selectedPastVideo.date})
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Text className="text-white/70 text-xs text-center">
                    탭하여 녹화 시작
                  </Text>
                </View>
              )}
              <View className="flex-row items-center justify-between px-10">
                <TouchableOpacity activeOpacity={0.7}>
                  <Ionicons name="image-outline" size={28} color="white" />
                </TouchableOpacity>
                <RecordButton
                  isRecording={flowState === 'RECORDING'}
                  onPress={handleRecordButtonPress}
                />
                <TouchableOpacity onPress={handleFlipCamera} activeOpacity={0.7}>
                  <Ionicons name="camera-reverse-outline" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* ── 과거 영상 선택 바텀시트 (Flow B) ── */}
          {flowState === 'SELECTING_PITCH' && (
            <PastVideoSelectionSheet
              onClose={() => setFlowState('IDLE')}
              onNext={handlePastVideoNext}
            />
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          B. 영상 프리뷰 계열 (PREVIEW / PREVIEW_EDIT_TIP / PREVIEW_SAVE_MODAL / PITCH_SELECTION)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isPreview && recordedVideo && (
        <>
          {/* 영상 재생 (프리뷰 + 구종선택 상태 모두 유지) */}
          <Video
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />

          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'bottom']}>
            {/* 상단: 닫기 + 편집 */}
            <View className="flex-row justify-between items-center px-4 pt-2">
              <TouchableOpacity
                onPress={handleRetake}
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white text-base font-semibold">편집</Text>
              </TouchableOpacity>
            </View>

            {/* 저장 아이콘 */}
            <View className="px-4 mt-2">
              <TouchableOpacity
                onPress={handleSaveIconPress}
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="download-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* 편집 툴팁 */}
            {flowState === 'PREVIEW_EDIT_TIP' && (
              <EditTooltip onDismiss={handleDismissTooltip} />
            )}

            {/* PREVIEW / PREVIEW_EDIT_TIP 상태에서만 하단 버튼 표시
                PITCH_SELECTION 상태에서는 바텀시트가 대신 표시됨 */}
            {(flowState === 'PREVIEW' || flowState === 'PREVIEW_EDIT_TIP') && (
              <View className="mt-auto pb-6 px-4">
                <VideoPreviewTimeline
                  startTime={0}
                  totalDuration={recordedVideo.duration}
                  progress={0}
                />
                <View className="flex-row mt-3" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleRetake}
                    activeOpacity={0.8}
                    className="flex-1 bg-white/10 rounded-2xl py-4 items-center"
                  >
                    <Text className="text-white text-sm font-semibold">재촬영</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePreviewNext}
                    activeOpacity={0.8}
                    className="flex-1 bg-white/90 rounded-2xl py-4 flex-row items-center justify-center"
                    style={{ gap: 4 }}
                  >
                    <Text className="text-gray-900 text-sm font-semibold">다음</Text>
                    <Ionicons name="chevron-forward" size={14} color="#1A1C20" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>

          {/* 저장 확인 모달 */}
          <SaveVideoModal
            visible={flowState === 'PREVIEW_SAVE_MODAL'}
            onCancel={handleSaveCancel}
            onSave={handleSaveConfirm}
          />

          {/* ── 구종 선택 바텀시트 (공통_3) ── */}
          {flowState === 'PITCH_SELECTION' && (
            <PitchSelectionSheet
              selectedPitch={selectedPitch}
              onSelectPitch={setSelectedPitch}
              onNext={handlePitchNext}
            />
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          C. 영상 트리밍 편집 (EDITING — 프로_4)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isEditing && recordedVideo && (
        <>
          {/* 트리밍할 영상 전체 화면 재생 */}
          <Video
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={(status) => {
              // 현재 재생 시간을 타이머에 반영
              if (status.isLoaded) {
                setEditCurrentTime((status.positionMillis ?? 0) / 1000);
              }
            }}
          />

          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'bottom']}>
            {/* ── 상단: X / 현재시간 / 완료 ── */}
            <View className="flex-row justify-between items-center px-4 pt-2">
              <TouchableOpacity
                onPress={handleEditingClose}
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>

              {/* 중앙 현재 재생 시간 */}
              <Text className="text-white text-base font-semibold">
                {editTimerText}
              </Text>

              {/* 완료 버튼 (브랜드 컬러) */}
              <TouchableOpacity onPress={handleEditingComplete} activeOpacity={0.7}>
                <Text style={{ color: '#3BC1A8', fontSize: 16, fontWeight: '600' }}>
                  완료
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1" />

            {/* ── 하단 트리밍 타임라인 ── */}
            <View className="pb-8">
              <VideoTrimmerTimeline
                totalDuration={recordedVideo.duration}
                trimStart={trimRange.startSec}
                trimEnd={trimRange.endSec}
                currentTime={editCurrentTime}
              />
            </View>
          </SafeAreaView>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          D. 최고의 1구 등록 (SUCCESS — 공통_5 / 5-1)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isSuccess && recordedVideo && (
        <>
          {/* 결과 영상 (배경으로 재생) */}
          <Video
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />

          {/* 상단: X + 편집 */}
          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
            <View className="flex-row justify-between items-center px-4 pt-2">
              <TouchableOpacity
                onPress={handleRetake}
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/60 text-base font-semibold">편집</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* 최고의 1구 등록 바텀시트 */}
          <BestPitchRegisterSheet
            pitchType={selectedPitch ?? '직구'}
            onComplete={handleSuccess}
          />
        </>
      )}
    </View>
  );
}
