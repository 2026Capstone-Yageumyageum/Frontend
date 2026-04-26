import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

// ─────────────────────────────────────────────
//  타입 정의
// ─────────────────────────────────────────────

/** size:
 *  - long  : 전체 너비 버튼 (로그인, Google OAuth 등)
 *  - short : 콘텐츠 너비에 맞는 짧은 버튼 (보조 액션)
 *  - icon  : 원형 버튼 (카메라 촬영 시작/종료, FAB 등)
 */
export type ButtonSize = 'long' | 'short' | 'icon';

/** variant:
 *  - primary  : 채워진 주요 색상 (가장 중요한 행동)
 *  - secondary: 채워진 회색 (중간 중요도)
 *  - outlined : 테두리만 있는 버튼 (보조, 취소 역할)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outlined';

type ButtonProps = {
  size: ButtonSize;
  variant: ButtonVariant;
  /** 버튼 내부 텍스트 - icon size에서는 생략 가능 */
  label?: string;
  /** 아이콘 요소 - React 컴포넌트 (Ionicons 등) */
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

// ─────────────────────────────────────────────
//  스타일 맵 (Tailwind 클래스 문자열)
// ─────────────────────────────────────────────

// 사이즈별 레이아웃 스타일
const SIZE_STYLES: Record<ButtonSize, string> = {
  // w-full로 부모 너비 100%, h-14로 높이 고정
  long: 'w-full h-14 rounded-2xl flex-row items-center justify-center px-6',
  // 콘텐츠에 맞게 px로 좌우 패딩, 높이 고정
  short: 'h-11 px-7 rounded-xl flex-row items-center justify-center',
  // w-16 h-16으로 원형 버튼 (rounded-full)
  icon: 'w-16 h-16 rounded-full items-center justify-center',
};

// variant별 활성/비활성 컨테이너 색상
const CONTAINER_STYLES: Record<ButtonVariant, { active: string; disabled: string }> = {
  primary: {
    active: 'bg-blue-600',
    disabled: 'bg-blue-300',
  },
  secondary: {
    active: 'bg-gray-100',
    disabled: 'bg-gray-50',
  },
  outlined: {
    // border-2로 테두리 강조, 배경은 흰색
    active: 'bg-white border-2 border-blue-600',
    disabled: 'bg-white border-2 border-gray-200',
  },
};

// variant별 텍스트 색상
const TEXT_STYLES: Record<ButtonVariant, { active: string; disabled: string }> = {
  primary: { active: 'text-white font-semibold', disabled: 'text-white font-semibold' },
  secondary: { active: 'text-gray-800 font-semibold', disabled: 'text-gray-300 font-semibold' },
  outlined: { active: 'text-blue-600 font-semibold', disabled: 'text-gray-300 font-semibold' },
};

// 로딩 스피너 색상 (primary는 흰색, 나머지는 파란색)
function getSpinnerColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return '#9CA3AF';
  return variant === 'primary' ? '#FFFFFF' : '#2563EB';
}

// ─────────────────────────────────────────────
//  컴포넌트
// ─────────────────────────────────────────────

export default function Button({
  size,
  variant,
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerClass = [
    SIZE_STYLES[size],
    isDisabled ? CONTAINER_STYLES[variant].disabled : CONTAINER_STYLES[variant].active,
  ].join(' ');

  const textClass = [
    'text-sm',
    isDisabled ? TEXT_STYLES[variant].disabled : TEXT_STYLES[variant].active,
  ].join(' ');

  return (
    <TouchableOpacity
      className={containerClass}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        // 로딩 중일 때 스피너 표시
        <ActivityIndicator color={getSpinnerColor(variant, disabled)} size="small" />
      ) : (
        <>
          {/* 아이콘 - 라벨이 있을 경우 오른쪽 마진 추가 */}
          {icon && <View className={label ? 'mr-2' : ''}>{icon}</View>}
          {/* 라벨 */}
          {label && <Text className={textClass}>{label}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}
