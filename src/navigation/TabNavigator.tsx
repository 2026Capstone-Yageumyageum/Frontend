/**
 * [TabNavigator.tsx]
 * 앱 하단 탭 네비게이터: [피드 | 카메라 | 마이]
 *
 * 왜 createBottomTabNavigator를 쓰나요?
 * - React Navigation의 기본 탭 네비게이터로 각 탭의 화면 상태를 유지합니다.
 * - 카메라 탭은 중앙 원형 버튼 스타일로 별도 처리합니다.
 *
 * 주의: @react-navigation/bottom-tabs 패키지가 필요합니다.
 * → 아직 없다면: npx expo install @react-navigation/bottom-tabs
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../features/feed/screens/FeedScreen';
import MyScreen from '../features/my/screens/MyScreen';
import CameraScreen from '../features/camera/screens/CameraScreen';

// CameraScreen은 src/features/camera/screens/CameraScreen.tsx에서 import합니다.
// MyScreen은 src/features/my/screens/MyScreen.tsx에서 import합니다.

// ─── 탭 파라미터 타입 ────────────────────────────────────────────────────────
type TabParamList = {
  피드: undefined;
  카메라: undefined;
  마이: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// ─── 브랜드 컬러 (tailwind 커스텀 토큰과 동일한 값) ────────────────────────
const BRAND_COLOR = '#3BC1A8';
const INACTIVE_COLOR = '#8E949A';

export default function TabNavigator() {
  return (
    <Tab.Navigator
      // 초기 진입 탭: 피드
      initialRouteName="피드"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EAEC',
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: BRAND_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      {/* ── 피드 탭 ── */}
      <Tab.Screen
        name="피드"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── 카메라 탭 (중앙 강조 버튼) ── */}
      <Tab.Screen
        name="카메라"
        component={CameraScreen}
        options={{
          // 카메라 탭 아이콘은 원형 브랜드 버튼으로 강조
          tabBarIcon: ({ focused }) => (
            <View style={styles.cameraButton}>
              <Ionicons
                name="camera"
                size={26}
                color={'#FFFFFF'}
              />
            </View>
          ),
          // 탭 레이블은 아이콘 아래 표시
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                color: focused ? BRAND_COLOR : INACTIVE_COLOR,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              카메라
            </Text>
          ),
          // 카메라 화면에서는 탭바 숨김 (전체 화면 모드)
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* ── 마이 탭 ── */}
      <Tab.Screen
        name="마이"
        component={MyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── 카메라 버튼 스타일 ──────────────────────────────────────────────────────
// NativeWind가 tabBarIcon 내부에 미적용되어 StyleSheet 사용
const styles = StyleSheet.create({
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    // 버튼이 탭바를 살짝 넘어 올라오는 효과
    marginBottom: 12,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
