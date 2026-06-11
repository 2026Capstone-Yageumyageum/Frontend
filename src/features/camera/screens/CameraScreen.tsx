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
 *                               PREVIEW_SAVE_MODAL          PREVIEW ◀─────────────────────┐
 *                                          │             ┌──────┴──────┐                  │
 *                                    (취소/저장)       (편집)        (다음)                │
 *                                          │             │              │                  │
 *                                          │          EDITING     PITCH_SELECTION  [공통_3]│
 *                                          │             │(완료)        │(다음)            │
 *                                          │             └──────────────┘──────▶ SUCCESS  │
 *                                          │                                   [공통_5/5-1]│
 *                                          └────────────────────────────────────────────── ┘
 *
 * 핵심 변경사항:
 *   - 편집 버튼: PREVIEW → EDITING (편집 먼저 선택적으로 진행)
 *   - 편집 완료: EDITING → PREVIEW (다시 프리뷰로 복귀)
 *   - 다음 버튼: PREVIEW → PITCH_SELECTION → SUCCESS (편집 없이도 진행 가능)
 *
 * ── 카메라 라이브러리 ────────────────────────────────────────────────────────
 *   react-native-vision-camera: 카메라 뷰파인더 + 영상 녹화
 *   expo-av: 녹화 영상 프리뷰 재생
 *   ⚠️ 반드시 `npx expo run:android` 또는 `npx expo run:ios`로 빌드 후 사용
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  CameraDevice,
  useVideoOutput,
  CameraRef,
  Recorder,
} from 'react-native-vision-camera';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
// Expo SDK 54부터 기존 API가 deprecated 되어 legacy 경로로 import해야 합니다.
// 새 API(File/Directory 클래스)로 마이그레이션하기 전까지 이 경로를 사용합니다.
import * as FileSystem from 'expo-file-system/legacy';

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
import CameraTimer from '../components/CameraTimer';
import PitcherGuideBox from '../components/PitcherGuideBox';
import BestPitchRegisterSheet from '../components/BestPitchRegisterSheet';
import PitchSelectionSheet from '../components/PitchSelectionSheet';
import VideoTrimmerTimeline from '../components/VideoTrimmerTimeline';
import PastVideoSelectionSheet, { PastVideo } from '../components/PastVideoSelectionSheet';
import { useCameraFlow } from '../hooks/useCameraFlow';
import { usePitchAnalysis } from '../hooks/usePitchAnalysis';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';

export default function CameraScreen() {
  useDoubleBackExit();

  // ── 뒤로가기 네비게이션 ───────────────────────────────────────────────────────
  // goBack(): 이전 스택 화면 또는 탭으로 이동
  const navigation = useNavigation();

  // ── 권한 관리 (카메라 및 마이크) ──────────────────────────────────────────
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const hasAllPermissions = hasCameraPermission && hasMicrophonePermission;

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

  // ── 영상 소스 구분 ────────────────────────────────────────────────────────
  // true: 갤러리에서 업로드한 영상 / false: 직접 촬영한 영상
  // 갤러리 영상은 이미 저장된 파일이므로 저장 버튼을 비활성화해야 함
  const [isFromGallery, setIsFromGallery] = useState(false);

  // ── 편집 화면 상단 타이머 (트리밍 현재 시간 표시) ─────────────────────────
  const [editCurrentTime, setEditCurrentTime] = useState(0);

  // ── 프리뷰 현재 재생 시간 (프로그레스바 연동용) ───────────────────────────
  // onPlaybackStatusUpdate로 실시간 업데이트되어 타임라인을 채우는 주체
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  // ── 편집 화면 비디오 ref (seek, 재생 제어용) ──────────────────────────────
  // isEditing 상태에서만 마운트되므로, EDITING이 아닐 때는 null
  const editingVideoRef = useRef<Video>(null);
  // PREVIEW / SUCCESS 화면 비디오 ref (트림 구간 루프 제어용)
  const previewVideoRef = useRef<Video>(null);
  const successVideoRef = useRef<Video>(null);

  // trimRange를 ref로도 관리 (onPlaybackStatusUpdate 클로저 내 최신값 참조)
  // 렌더마다 동기화하여 stale closure 방지
  const trimRangeRef = useRef(trimRange);
  trimRangeRef.current = trimRange;

  // ── 녹화 타이머 훅 ────────────────────────────────────────────────────────
  const { formattedTime, startTimer, stopTimer, resetTimer } = useRecordingTimer();

  // ────────────────────────────────────────────────────────────────────────────
  // 이벤트 핸들러
  // ────────────────────────────────────────────────────────────────────────────

  /** 권한 요청 */
  const handleRequestPermission = useCallback(async () => {
    const cameraGranted = await requestCameraPermission();
    const microphoneGranted = await requestMicrophonePermission();
    
    if (!cameraGranted || !microphoneGranted) {
      Alert.alert(
        '권한 필요',
        '투구 영상을 촬영하려면 카메라 및 마이크 권한이 모두 필요합니다.\n설정에서 권한을 허용해주세요.'
      );
    }
  }, [requestCameraPermission, requestMicrophonePermission]);

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
          // [디버그] vision-camera가 반환하는 실제 파일 경로 확인
          // 이 로그로 URI 형태(확장자 유무, file:// 여부 등)를 파악합니다
          console.log('[녹화 완료] filePath 원본:', filePath);
          console.log('[녹화 완료] filePath 타입:', typeof filePath);
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

  /** 녹화 버튼 탭 (IDLE → RECORDING / RECORDING → stop)
   *  내 베스트 투구 모드에서 과거 영상을 선택하지 않으면 핸들러 자체를 차단
   *  (UI의 disabled prop과 이중으로 막아 어떤 경로로도 녹화 시작 불가) */
  const handleRecordButtonPress = useCallback(() => {
    // 내 베스트 투구 모드에서 과거 영상 미선택 시 녹화 차단
    if (cameraMode === 'my' && selectedPastVideo === null) return;

    if (flowState === 'IDLE') handleStartRecording();
    else if (flowState === 'RECORDING') handleStopRecording();
  }, [flowState, cameraMode, selectedPastVideo, handleStartRecording, handleStopRecording]);

  /** 과거 영상 선택 다음 버튼 (Flow B) */
  const handlePastVideoNext = useCallback((video: PastVideo) => {
    setSelectedPastVideo(video);
    setFlowState('IDLE');
  }, []);

  /** 재촬영: IDLE 리셋 */
  const handleRetake = useCallback(() => {
    setRecordedVideo(null);
    setSelectedPitch(null);
    setPreviewCurrentTime(0); // 프리뷰 시간 초기화
    setIsFromGallery(false);  // 영상 소스 초기화
    resetTimer();
    setFlowState('IDLE');
  }, [resetTimer]);

  /** 저장 아이콘 → 저장 모달 */
  const handleSaveIconPress = useCallback(() => setFlowState('PREVIEW_SAVE_MODAL'), []);
  const handleSaveCancel = useCallback(() => setFlowState('PREVIEW'), []);
  const handleSaveConfirm = useCallback(async () => {
    if (!recordedVideo?.uri) return;

    let tempCopiedUri: string | null = null;

    try {
      // 1. 미디어 라이브러리 접근 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '영상을 저장하려면 사진/동영상 접근 권한이 필요합니다.\n설정에서 권한을 허용해주세요.'
        );
        setFlowState('PREVIEW');
        return;
      }

      const originalUri = recordedVideo.uri;

      // [디버그] 저장 시도 전 URI 정보 출력 — 에러 원인 추적용
      console.log('[영상 저장] 원본 URI:', originalUri);

      // 2. vision-camera가 반환하는 URI는 OS/버전마다 형태가 다릅니다.
      //    saveToLibraryAsync()는 file:// 프리픽스가 없는 절대 경로를 요구하는 경우가 있어
      //    프리픽스를 제거한 순수 경로로 정규화합니다.
      const normalizedUri = originalUri.startsWith('file://')
        ? originalUri
        : `file://${originalUri}`;

      // 3. 파일이 실제로 존재하는지 먼저 확인 (없으면 copyAsync도 실패)
      const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
      console.log('[영상 저장] 파일 정보:', JSON.stringify(fileInfo));

      if (!fileInfo.exists) {
        throw new Error(`파일이 존재하지 않습니다: ${normalizedUri}`);
      }

      // 4. 확장자가 없으면 .mp4 확장자를 붙인 임시 경로로 복사
      //    saveToLibraryAsync()가 확장자를 파싱해 파일 타입을 결정하기 때문에 필수
      const lowerUri = normalizedUri.toLowerCase();
      const hasExtension =
        lowerUri.includes('.mp4') ||
        lowerUri.includes('.mov') ||
        lowerUri.includes('.m4v');

      let uriToSave = normalizedUri;

      if (!hasExtension) {
        const timestamp = Date.now();
        tempCopiedUri = `${FileSystem.cacheDirectory}recorded_video_${timestamp}.mp4`;
        await FileSystem.copyAsync({
          from: normalizedUri,
          to: tempCopiedUri,
        });
        uriToSave = tempCopiedUri;
        console.log('[영상 저장] 확장자 없는 URI → .mp4로 복사 완료:', tempCopiedUri);
      }

      console.log('[영상 저장] saveToLibraryAsync 호출 URI:', uriToSave);

      // 5. 갤러리에 저장
      await MediaLibrary.saveToLibraryAsync(uriToSave);

      Alert.alert('저장 완료', '영상이 갤러리에 저장되었습니다.');
      setFlowState('PREVIEW');
    } catch (error) {
      // 상세 에러 정보 출력 — Expo 개발자 도구나 adb logcat에서 확인 가능
      console.error('[영상 저장 오류] 에러 타입:', typeof error);
      console.error('[영상 저장 오류] 상세:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      Alert.alert('저장 실패', '영상을 저장하는 중 문제가 발생했습니다.\n콘솔 로그를 확인해주세요.');
      setFlowState('PREVIEW');
    } finally {
      // 임시 복사본은 성공/실패와 무관하게 항상 정리
      if (tempCopiedUri) {
        await FileSystem.deleteAsync(tempCopiedUri, { idempotent: true }).catch(
          (e) => console.warn('[임시 파일 삭제 실패]', e)
        );
      }
    }
  }, [recordedVideo]);

  /** 편집 툴팁 닫기 */
  const handleDismissTooltip = useCallback(() => setFlowState('PREVIEW'), []);

  /** 프리뷰 "편집" 버튼 → 영상 편집 화면으로 이동 */
  const handleEditPress = useCallback(() => setFlowState('EDITING'), []);

  /** 프리뷰 "다음" → 구종 선택
   *  (편집 없이도 다음으로 진행 가능, 편집을 먼저 해도 여기서 다음을 눌러야 함) */
  const handlePreviewNext = useCallback(() => setFlowState('PITCH_SELECTION'), []);

  /** 구종 선택 "다음" → 바로 최고의 1구 등록 (SUCCESS)
   *  편집은 PREVIEW 단계에서 선택적으로 먼저 수행하므로, 여기서는 바로 SUCCESS로 */
  const handlePitchNext = useCallback(() => {
    if (!selectedPitch) return;
    setFlowState('SUCCESS');
  }, [selectedPitch]);

  /** 트리밍 편집 "완료" → 프리뷰로 복귀
   *  편집 완료 후 다시 프리뷰 화면으로 돌아와서 "다음" 버튼으로 구종 선택까지 이동 */
  const handleEditingComplete = useCallback(() => setFlowState('PREVIEW'), []);

  /** 트리밍 편집 "X" → 프리뷰로 복귀 (편집 취소) */
  const handleEditingClose = useCallback(() => setFlowState('PREVIEW'), []);

  /** 트리밍 핸들 드래그로 범위 변경
   *  VideoTrimmerTimeline → CameraScreen으로 최신 trimRange 전달 */
  const handleTrimChange = useCallback((startSec: number, endSec: number) => {
    setTrimRange({ startSec, endSec });
  }, []);

  /** 핸들 드래그 중 비디오 특정 시간으로 탐색
   *  editingVideoRef.setPositionAsync: expo-av Video ref의 seek API */
  const handleEditSeekRequest = useCallback(async (seconds: number) => {
    if (editingVideoRef.current) {
      await editingVideoRef.current.setPositionAsync(seconds * 1000);
    }
  }, []);

  /** 편집 화면 재생 상태 업데이트 핸들러
   *  - 현재 재생 시간 → editCurrentTime 업데이트
   *  - trimEnd 도달 시 trimStart로 루프 (선택 구간 내에서만 반복 재생)
   *  - trimRangeRef 사용으로 stale closure 완전 방지 */
  const handleEditPlaybackStatus = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const currentSec = (status.positionMillis ?? 0) / 1000;
    setEditCurrentTime(currentSec);

    // 트림 끝 지점 도달 시 시작점으로 루프
    if (status.isPlaying && currentSec >= trimRangeRef.current.endSec) {
      await editingVideoRef.current?.setPositionAsync(
        trimRangeRef.current.startSec * 1000
      );
    }
  }, []);

  /** 프리뷰 영상 재생 상태 업데이트 — 트림 구간 적용
   *  ① 트림 시작점 기준 상대 시간으로 프로그레스바 업데이트
   *  ② 트림 범위 벗어나면 startSec으로 즉시 이동 (루프 + 범위 이탈 방지)
   *  trimRangeRef 사용으로 stale closure 완전 방지 */
  const handlePreviewPlaybackStatus = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const absoluteSec = (status.positionMillis ?? 0) / 1000;
    // 트림 시작점 기준 상대 시간 계산 (프로그레스바가 0부터 시작하도록)
    const relativeSec = Math.max(0, absoluteSec - trimRangeRef.current.startSec);
    setPreviewCurrentTime(relativeSec);

    // 트림 끝 초과 or 시작 이전 → trimStart로 이동
    if (status.isPlaying &&
        (absoluteSec >= trimRangeRef.current.endSec ||
         absoluteSec < trimRangeRef.current.startSec)) {
      await previewVideoRef.current?.setPositionAsync(
        trimRangeRef.current.startSec * 1000
      );
    }
  }, []);

  /** 성공 화면 영상 재생 상태 업데이트 — 트림 구간 내 루프 */
  const handleSuccessPlaybackStatus = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const absoluteSec = (status.positionMillis ?? 0) / 1000;
    if (status.isPlaying &&
        (absoluteSec >= trimRangeRef.current.endSec ||
         absoluteSec < trimRangeRef.current.startSec)) {
      await successVideoRef.current?.setPositionAsync(
        trimRangeRef.current.startSec * 1000
      );
    }
  }, []);

  // PREVIEW 계열 진입 시 trimStart에서 재생 시작 (편집 완료 후 바로 반영)
  // onPlaybackStatusUpdate의 범위 이탈 감지도 있지만,
  // Video 마운트 직후 즉시 올바른 위치에서 시작하도록 useEffect로 이중 보장
  useEffect(() => {
    if (flowState === 'PREVIEW' || flowState === 'PREVIEW_EDIT_TIP') {
      const timer = setTimeout(() => {
        previewVideoRef.current?.setPositionAsync(trimRangeRef.current.startSec * 1000);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  // SUCCESS 진입 시 trimStart에서 재생 시작
  useEffect(() => {
    if (flowState === 'SUCCESS') {
      const timer = setTimeout(() => {
        successVideoRef.current?.setPositionAsync(trimRangeRef.current.startSec * 1000);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  /** 최고의 1구 등록 "완료" → 분석 대기 화면으로 이동 */
  const handleSuccess = useCallback(() => {
    handleRetake();
    // @ts-ignore - AnalysisLoading 스크린이 Root 스택에 정의되어 있음
    navigation.navigate('AnalysisLoading', { isBestPitch: true });
  }, [handleRetake, navigation]);

  /**
   * 갤러리에서 영상 선택 후 프리뷰 플로우로 진입
   *
   * 처리 흐름:
   *   1. GALLERY_PICKING 상태로 전환 (로딩 표시)
   *   2. expo-image-picker로 갤러리 영상 피커 열기
   *   3. 선택 완료 → recordedVideo 세팅 → PREVIEW_EDIT_TIP 전환
   *   4. 취소 또는 오류 → IDLE 복귀
   *
   * ⚠️ expo-image-picker는 duration을 밀리초(ms) 단위로 반환함
   *    → recordedVideo.duration은 초(sec) 단위이므로 /1000 변환 필요
   */
  const handlePickVideoFromGallery = useCallback(async () => {
    // 갤러리 피커 열기 전 상태 전환 (뷰파인더 유지하면서 로딩 표시)
    setFlowState('GALLERY_PICKING');

    try {
      // 갤러리 미디어 접근 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          '갤러리 권한 필요',
          '갤러리에서 영상을 선택하려면 사진 라이브러리 접근 권한이 필요합니다.\n설정에서 권한을 허용해주세요.'
        );
        setFlowState('IDLE');
        return;
      }

      // 갤러리 영상 선택 피커 실행
      // mediaTypes: 'videos' — 영상 파일만 표시
      // allowsEditing: false — 선택 후 자체 편집 화면 없이 바로 가져옴
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 1,
      });

      // 사용자가 선택을 취소한 경우
      if (result.canceled) {
        setFlowState('IDLE');
        return;
      }

      const asset = result.assets[0];

      // duration: expo-image-picker는 밀리초(ms) 단위로 반환
      // → 초(sec) 단위로 변환해서 RecordedVideo에 저장
      const durationSec = asset.duration != null ? asset.duration / 1000 : 0;

      // recordedVideo 세팅 — 기존 녹화 완료 시와 동일한 구조
      setRecordedVideo({ uri: asset.uri, duration: durationSec });

      // 트리밍 범위 초기값 = 갤러리 영상 전체 구간
      setTrimRange({ startSec: 0, endSec: durationSec });

      // 갤러리에서 온 영상임을 표시 → 저장 버튼 비활성화 + 재선택 텍스트 적용
      setIsFromGallery(true);

      // 녹화 완료 시와 동일하게 PREVIEW_EDIT_TIP으로 전환
      // → 기존 프리뷰 → 편집 → 구종선택 → 등록 플로우 그대로 사용 가능
      setFlowState('PREVIEW_EDIT_TIP');
    } catch (error) {
      console.error('[갤러리 영상 선택 오류]', error);
      Alert.alert('오류', '영상을 불러오는 중 오류가 발생했습니다.');
      setFlowState('IDLE');
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // 렌더링 분기
  // ────────────────────────────────────────────────────────────────────────────

  /** 권한 없을 때 */
  if (!hasAllPermissions) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <Ionicons name="camera-outline" size={48} color="white" />
        <Text className="text-white text-lg font-bold mt-4 mb-2">
          카메라 및 마이크 권한이 필요합니다
        </Text>
        <Text className="text-white/60 text-sm text-center mb-6">
          투구 영상을 촬영하고 소리를 녹음하려면 카메라와 마이크 접근 권한을 모두 허용해주세요.
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
  // GALLERY_PICKING: 갤러리 피커가 열려있는 동안 카메라 뷰파인더는 유지
  const isViewfinder = flowState === 'IDLE' || flowState === 'RECORDING' || flowState === 'SELECTING_PITCH' || flowState === 'GALLERY_PICKING';
  const isPreview =
    flowState === 'PREVIEW' ||
    flowState === 'PREVIEW_EDIT_TIP' ||
    flowState === 'PREVIEW_SAVE_MODAL' ||
    flowState === 'PITCH_SELECTION'; // 구종 선택 시에도 프리뷰 영상은 유지
  const isEditing = flowState === 'EDITING';
  const isSuccess = flowState === 'SUCCESS';

  // ── 녹화 버튼 비활성화 조건 ──────────────────────────────────────────────
  // '내 베스트 투구' 모드에서 과거 영상을 선택하지 않으면 녹화를 막아
  // (Flow B: 승인 없이 덕직 의미 없는 로 아이콘 생성 방지)
  const isRecordDisabled = cameraMode === 'my' && selectedPastVideo === null;

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

          {/* 투수 포지셔닝 가이드 박스:
              카메라 위에 절대 위치로 오버레이, 터치 이벤트는 통과시킴
              IDLE(촬영 전) + RECORDING(촬영 중) 모두에서 표시 */}
          <PitcherGuideBox isRecording={flowState === 'RECORDING'} />
          <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'bottom']}>
            {/* 상단 UI */}
            <View className="px-4 pt-2">
              {flowState === 'IDLE' && (
                <>
                  {/* X 버튼: 카메라 화면을 닫고 이전 탭/화면으로 뒤로가기 */}
                  <TouchableOpacity
                    className="w-9 h-9 rounded-full bg-black/40 items-center justify-center mb-3"
                    onPress={() => navigation.goBack()}
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
                {/* 앨범 버튼: 갤러리에서 영상을 선택해 기존 프리뷰 플로우로 진입 */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickVideoFromGallery}
                >
                  <Ionicons name="image-outline" size={28} color="white" />
                </TouchableOpacity>
                <RecordButton
                  isRecording={flowState === 'RECORDING'}
                  onPress={handleRecordButtonPress}
                  // '내 베스트 투구' 모드에서 과거 영상 미선택 시 비활성화
                  disabled={isRecordDisabled}
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

          {/* ── 갤러리 영상 선택 중 로딩 오버레이 ── */}
          {/* 피커가 열리기 직전 잠깐 표시되며, 피커가 열리면 네이티브 UI가 덮어씀 */}
          {flowState === 'GALLERY_PICKING' && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <ActivityIndicator size="large" color="#3BC1A8" />
              <Text style={{ color: 'white', marginTop: 12, fontSize: 14 }}>
                갤러리를 불러오는 중...
              </Text>
            </View>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          B. 영상 프리뷰 계열 (PREVIEW / PREVIEW_EDIT_TIP / PREVIEW_SAVE_MODAL / PITCH_SELECTION)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isPreview && recordedVideo && (
        <>
          {/* 영상 재생: 트림 구간 내에서만 재생 + 루프
              ref: seek 제어 / handlePreviewPlaybackStatus: 트림 루프 + 상대 시간 추적 */}
          <Video
            ref={previewVideoRef}
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={handlePreviewPlaybackStatus}
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
              {/* 편집 버튼: PREVIEW → EDITING 상태로 전환 */}
              <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
                <Text className="text-white text-base font-semibold">편집</Text>
              </TouchableOpacity>
            </View>

            {/* 저장 아이콘
                갤러리에서 업로드한 영상은 이미 기기에 저장되어 있으므로 저장 불필요
                → isFromGallery일 때 투명도를 낮추고 터치를 차단하여 비활성화 표시 */}
            <View className="px-4 mt-2">
              <TouchableOpacity
                onPress={isFromGallery ? undefined : handleSaveIconPress}
                disabled={isFromGallery}
                className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                style={{ opacity: isFromGallery ? 0.3 : 1 }}
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
                  // 트림 구간 기준 상대 시간 (0부터 시작)
                  currentTime={previewCurrentTime}
                  // 실제 재생 구간 길이 (트림된 범위)
                  totalDuration={Math.max(0, trimRange.endSec - trimRange.startSec)}
                />
                <View className="flex-row mt-3" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleRetake}
                    activeOpacity={0.8}
                    className="flex-1 bg-white/10 rounded-2xl py-4 items-center"
                  >
                    {/* 갤러리 업로드 영상이면 '재선택', 직접 촬영이면 '재촬영' */}
                    <Text className="text-white text-sm font-semibold">
                      {isFromGallery ? '재선택' : '재촬영'}
                    </Text>
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

          {/* ── 구종 선택 바텀시트 (공통_3): 드래그로 내리면 PREVIEW로 복귀 ── */}
          {flowState === 'PITCH_SELECTION' && (
            <PitchSelectionSheet
              selectedPitch={selectedPitch}
              onSelectPitch={setSelectedPitch}
              onNext={handlePitchNext}
              onClose={() => setFlowState('PREVIEW')}
            />
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          C. 영상 트리밍 편집 (EDITING — 프로_4)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isEditing && recordedVideo && (
        <>
          {/* 트리밍할 영상 전체 화면 재생
              ref: seek 제어 / shouldPlay: 자동 재생 / isLooping 제거 → 수동 루프 처리 */}
          <Video
            ref={editingVideoRef}
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={handleEditPlaybackStatus}
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
                // 핸들 드래그 → trimRange 업데이트 + 비디오 seek
                onTrimChange={handleTrimChange}
                onSeekRequest={handleEditSeekRequest}
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
          {/* 결과 영상: 트림 구간 내에서 루프 재생 (편집 완료 후 적용된 구간만 보여줌) */}
          <Video
            ref={successVideoRef}
            source={{ uri: recordedVideo.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={handleSuccessPlaybackStatus}
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

          {/* 최고의 1구 등록 바텀시트: 드래그로 내리면 PITCH_SELECTION으로 복귀 */}
          <BestPitchRegisterSheet
            pitchType={selectedPitch ?? '직구'}
            onComplete={handleSuccess}
            onClose={() => setFlowState('PITCH_SELECTION')}
          />
        </>
      )}
    </View>
  );
}
