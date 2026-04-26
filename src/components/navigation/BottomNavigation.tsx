import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 각 탭 정의 타입
type TabItem = {
  name: string;
  // Ionicons의 아이콘 이름 타입 참조
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
};

// 4개의 탭 구성 - 야금야금 앱 기준 (홈/탐색/카메라/프로필)
const TABS: TabItem[] = [
  { name: 'home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'search', icon: 'search-outline', activeIcon: 'search' },
  { name: 'camera', icon: 'camera-outline', activeIcon: 'camera' },
  { name: 'person', icon: 'person-outline', activeIcon: 'person' },
];

type BottomNavigationProps = {
  activeTab: string;
  onTabPress: (name: string) => void;
};

export default function BottomNavigation({
  activeTab,
  onTabPress,
}: BottomNavigationProps) {
  return (
    // border-t로 상단 구분선, pb-6으로 홈 인디케이터 여백 확보
    <View className="flex-row bg-white border-t border-gray-100 pt-2 pb-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <TouchableOpacity
            key={tab.name}
            // flex-1로 4개 탭이 동일한 너비를 가짐
            className="flex-1 items-center justify-center py-2"
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.name}
            accessibilityState={{ selected: isActive }}
          >
            {/* Active면 채워진 아이콘 + 파란색, Inactive면 outline + 회색 */}
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={26}
              color={isActive ? '#2563EB' : '#9CA3AF'}
            />
            {/* Active 표시 점: 선택된 탭임을 명확히 구분 */}
            <View
              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                isActive ? 'bg-blue-600' : 'bg-transparent'
              }`}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
