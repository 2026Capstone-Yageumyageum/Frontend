import React, { useState } from 'react';
import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BottomNavigation from '../components/navigation/BottomNavigation';
import Button from '../components/common/Button';
import Dialog from '../components/common/Dialog';
import Thumbnail from '../components/common/Thumbnail';

// ─────────────────────────────────────────────
//  컴포넌트 쇼케이스 화면
//  → 모든 디자인 컴포넌트를 한눈에 확인하는 용도
// ─────────────────────────────────────────────

export default function ComponentShowcase() {
  const [activeTab, setActiveTab] = useState('home');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dangerDialogVisible, setDangerDialogVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* 스크롤 가능한 컨텐츠 영역 */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 섹션: Button ─── */}
        <SectionTitle title="Button" />

        {/* 긴 버튼 (Long) */}
        <SubTitle title="Long / Primary — 로그인, 확인 등 핵심 액션" />
        <Button size="long" variant="primary" label="시작하기" onPress={() => {}} />

        <SubTitle title="Long / Outlined — Google OAuth 등 제3자 인증" />
        <Button
          size="long"
          variant="outlined"
          label="Google로 계속하기"
          icon={<Ionicons name="logo-google" size={20} color="#2563EB" />}
          onPress={() => {}}
        />

        <SubTitle title="Long / Secondary — 보조 액션" />
        <Button size="long" variant="secondary" label="나중에 하기" onPress={() => {}} />

        {/* 짧은 버튼 (Short) */}
        <SubTitle title="Short / Primary & Outlined — 인라인 행동" />
        <View className="flex-row" style={{ gap: 12 }}>
          <Button size="short" variant="primary" label="저장" onPress={() => {}} />
          <Button size="short" variant="outlined" label="취소" onPress={() => {}} />
          <Button size="short" variant="secondary" label="더보기" onPress={() => {}} />
        </View>

        {/* 아이콘 버튼 (Icon) — 원형 */}
        <SubTitle title="Icon — 카메라 촬영 시작/종료, FAB" />
        <View className="flex-row items-center" style={{ gap: 16 }}>
          {/* 촬영 시작: 강조 (Primary) */}
          <Button
            size="icon"
            variant="primary"
            icon={<Ionicons name="videocam" size={28} color="#FFFFFF" />}
            onPress={() => {}}
          />
          {/* 촬영 종료: 덜 강조 (Outlined) */}
          <Button
            size="icon"
            variant="outlined"
            icon={<Ionicons name="stop" size={28} color="#2563EB" />}
            onPress={() => {}}
          />
          {/* 원형 보조 버튼 */}
          <Button
            size="icon"
            variant="secondary"
            icon={<Ionicons name="add" size={28} color="#374151" />}
            onPress={() => {}}
          />
          {/* 비활성화 상태 */}
          <Button
            size="icon"
            variant="primary"
            icon={<Ionicons name="send" size={24} color="#FFFFFF" />}
            onPress={() => {}}
            disabled
          />
        </View>

        {/* ─── 섹션: Dialog ─── */}
        <SectionTitle title="Dialog" />

        <SubTitle title="일반 확인 다이얼로그" />
        <Button
          size="long"
          variant="primary"
          label="일반 다이얼로그 열기"
          onPress={() => setDialogVisible(true)}
        />

        <SubTitle title="위험 행동 다이얼로그 (isDangerous)" />
        <Button
          size="long"
          variant="outlined"
          label="삭제 다이얼로그 열기"
          onPress={() => setDangerDialogVisible(true)}
        />

        {/* ─── 섹션: Thumbnail ─── */}
        <SectionTitle title="Thumbnail" />
        <SubTitle title="영상 썸네일 — 구종 + 영상 길이 배지" />
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <Thumbnail
            imageUri="https://picsum.photos/seed/pitch1/400/250"
            durationSeconds={92}
            pitchType="직구"
          />
          <Thumbnail
            imageUri="https://picsum.photos/seed/pitch2/400/250"
            durationSeconds={145}
            pitchType="커브볼"
          />
          {/* 흰 배경 이미지 가독성 테스트 */}
          <Thumbnail
            imageUri="https://picsum.photos/seed/white/400/250?grayscale"
            durationSeconds={63}
            pitchType="슬라이더"
          />
        </View>

        {/* ─── 섹션: Bottom Navigation 미리보기 ─── */}
        <SectionTitle title="Bottom Navigation" />
        <SubTitle title="현재 선택된 탭: {activeTab}" />
        <View className="rounded-2xl overflow-hidden border border-gray-100">
          <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
        </View>
      </ScrollView>

      {/* ─── 다이얼로그들 ─── */}

      {/* 일반 확인 */}
      <Dialog
        visible={dialogVisible}
        title="분석을 시작할까요?"
        description="영상을 업로드하면 피칭 폼 분석이 시작됩니다. 분석에는 약 1분이 소요됩니다."
        confirmLabel="시작"
        cancelLabel="취소"
        onConfirm={() => setDialogVisible(false)}
        onCancel={() => setDialogVisible(false)}
      />

      {/* 위험 행동 (isDangerous=true → 빨간 확인 버튼) */}
      <Dialog
        visible={dangerDialogVisible}
        title="영상을 삭제할까요?"
        description="삭제된 영상은 복구할 수 없습니다. 정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        isDangerous
        onConfirm={() => setDangerDialogVisible(false)}
        onCancel={() => setDangerDialogVisible(false)}
      />

      {/* ─── 실제 Bottom Navigation (화면 하단 고정) ─── */}
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
//  내부 헬퍼 컴포넌트 (쇼케이스 전용)
// ─────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <View className="mt-8 mb-4 border-b border-gray-200 pb-2">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>
    </View>
  );
}

function SubTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs text-gray-400 mb-2 mt-3">{title}</Text>
  );
}
