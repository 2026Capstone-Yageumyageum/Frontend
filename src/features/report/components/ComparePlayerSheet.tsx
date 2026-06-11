import React from 'react';
import { View, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import AppText from '../../../components/common/AppText';
import { ComparePlayer } from '../types/report.types';

interface ComparePlayerSheetProps {
  visible: boolean;
  onClose: () => void;
  players: ComparePlayer[];
  selectedId: string;
  onSelect: (player: ComparePlayer) => void;
}

export default function ComparePlayerSheet({ visible, onClose, players, selectedId, onSelect }: ComparePlayerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View className="bg-white rounded-t-3xl pt-3 px-5 pb-10">
            {/* 핸들 */}
            <View className="w-10 h-1 bg-border rounded-full self-center mb-6" />
            
            <AppText weight="bold" className="text-xl text-text-primary mb-1">비교 선수 선택</AppText>
            <AppText className="text-text-secondary text-sm mb-6">비교할 프로 선수를 선택하세요</AppText>

            {players.map(player => {
              const isSelected = player.id === selectedId;
              const isGoodScore = player.similarity >= 70;
              const scoreColor = isGoodScore ? '#A3C8BC' : '#D3735D';
              
              return (
                <TouchableOpacity
                  key={player.id}
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${isSelected ? 'border-[#A3C8BC] bg-[#E8F8F5]' : 'border-transparent bg-surface-page'}`}
                  onPress={() => {
                    onSelect(player);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-[#A3C8BC]' : 'bg-[#C4C9CF]'}`}>
                      <AppText weight="bold" className="text-white text-base">{player.initial}</AppText>
                    </View>
                    <AppText weight="bold" className="text-text-primary text-base">{player.name}</AppText>
                  </View>
                  <View className="flex-row items-baseline">
                    <AppText weight="bold" className="text-2xl" style={{ color: scoreColor }}>{player.similarity}</AppText>
                    <AppText weight="bold" className="text-sm ml-0.5" style={{ color: scoreColor }}>점</AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}
