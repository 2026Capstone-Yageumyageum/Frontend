/**
 * [ProPlayerDropdown.tsx]
 * 성장 추이 카드 내 프로 선수 선택 드롭다운
 *
 * 구성:
 *   [P]  류현진  ∨
 *       ↓ 펼치면
 *   [P]  류현진
 *   [P]  오승환
 *   [P]  고우석
 *
 * 왜 Modal이 아닌 인라인 드롭다운인가요?
 * - 디자인 이미지가 카드 내부에 목록이 펼쳐지는 형태라
 *   인라인 방식이 더 자연스럽습니다.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProPlayerOption } from '../types/my.types';

interface ProPlayerDropdownProps {
  players: ProPlayerOption[];
  selected: ProPlayerOption;
  onSelect: (player: ProPlayerOption) => void;
}

export default function ProPlayerDropdown({
  players,
  selected,
  onSelect,
}: ProPlayerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (player: ProPlayerOption) => {
    onSelect(player);
    setIsOpen(false);
  };

  return (
    <View className="mb-3">
      {/* ── 선택된 선수 표시 버튼 ── */}
      <TouchableOpacity
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3"
      >
        <View className="flex-row items-center" style={{ gap: 10 }}>
          {/* 선수 이니셜 원형 배지 */}
          <View className="w-8 h-8 rounded-full bg-brand items-center justify-center">
            <Text className="text-white text-xs font-bold">{selected.initial}</Text>
          </View>
          <Text className="text-text-primary text-sm font-medium">
            {selected.name}
          </Text>
        </View>

        {/* 열림/닫힘 화살표 */}
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#8E949A"
        />
      </TouchableOpacity>

      {/* ── 드롭다운 목록 (펼쳐졌을 때) ── */}
      {isOpen && (
        <View
          className="bg-surface border border-border rounded-2xl mt-1 overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {players.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              onPress={() => handleSelect(player)}
              activeOpacity={0.7}
              className={`flex-row items-center px-4 py-3 ${
                index < players.length - 1 ? 'border-b border-border' : ''
              } ${selected.id === player.id ? 'bg-brand-light' : 'bg-surface'}`}
            >
              <View className="w-8 h-8 rounded-full bg-brand items-center justify-center mr-3">
                <Text className="text-white text-xs font-bold">
                  {player.initial}
                </Text>
              </View>
              <Text
                className={`text-sm font-medium ${
                  selected.id === player.id
                    ? 'text-brand'
                    : 'text-text-primary'
                }`}
              >
                {player.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
