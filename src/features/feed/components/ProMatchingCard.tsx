/**
 * [ProMatchingCard.tsx]
 * "나의 투구 기록" (프로 선수 탭)에서 표시되는 개별 피드 카드
 *
 * 구성:
 * ┌────────────────────────────────┐
 * │   [썸네일 + 구종뱃지 + 재생시간]  │
 * ├────────────────────────────────┤
 * │ 2025.04.28           유사도 87%│
 * │ 류현진                          │
 * └────────────────────────────────┘
 *
 * 디자인 포인트:
 * - 유사도 숫자는 브랜드 컬러로 강조 표시
 * - 카드 전체에 그림자를 추가해 elevated 느낌 표현
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import VideoThumbnail from './VideoThumbnail';
import { ProFeedItem } from '../types/feed.types';

// ─── Props 타입 ─────────────────────────────────────────────────────────────
interface ProMatchingCardProps {
  /** 카드에 표시할 피드 데이터 */
  item: ProFeedItem;
  /** 카드 클릭 시 상세 화면으로 이동하는 콜백 */
  onPress?: (item: ProFeedItem) => void;
}

export default function ProMatchingCard({
  item,
  onPress,
}: ProMatchingCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      // rounded-card로 큰 모서리 곡률, 그림자로 카드 깊이감 표현
      className="bg-surface rounded-card mb-4 overflow-hidden"
      style={{
        // NativeWind v2가 shadow-* 클래스를 완전 지원하지 않아 inline으로 처리
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3, // Android용 그림자
      }}
    >
      {/* 상단: 영상 썸네일 영역 */}
      <VideoThumbnail
        uri={item.thumbnailUri}
        duration={item.duration}
        pitchType={item.pitchType}
        height={200}
      />

      {/* 하단: 텍스트 정보 영역 */}
      <View className="px-4 py-3">
        {/* 날짜 + 유사도를 양 끝 배치 */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-text-secondary text-xs">{item.date}</Text>
          {/* 유사도: 큰 숫자 + 브랜드 컬러로 강조 */}
          <View className="flex-row items-baseline">
            <Text className="text-brand text-2xl font-bold">
              {item.similarity}
            </Text>
            <Text className="text-brand text-sm font-bold ml-0.5">%</Text>
          </View>
        </View>

        {/* 선수 이름 */}
        <Text className="text-text-primary text-base font-bold">
          {item.playerName}
        </Text>

        {/* 하단 우측 '유사도' 레이블 */}
        <Text className="text-text-secondary text-xs text-right -mt-5">
          유사도
        </Text>
      </View>
    </TouchableOpacity>
  );
}
