import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import AppText from './AppText';

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
  /**
   * outlined variant의 테두리·텍스트 색상을 호출부에서 직접 지정할 때 사용.
   * 미입력 시 기본값(파란색 #2563EB) 유지 → 기존 버튼에 영향 없음.
   */
  accentColor?: string;
};

// ─────────────────────────────────────────────
//  스타일 맵 (Tailwind 클래스 문자열)
// ─────────────────────────────────────────────

// 사이즈별 레이아웃 스타일
const SIZE_STYLES: Record<ButtonSize, string> = {
  // w-full로 부모 너비 100%, h-14로 높이 고정
  long: 'w-full h-14 rounded-2xl flex-row items-center justify-center',
  // 콘텐츠에 맞게 px로 좌우 패딩, 높이 고정
  short: 'h-11 px-7 rounded-xl flex-row items-center justify-center',
  // w-16 h-16으로 원형 버튼 (rounded-full)
  icon: 'w-16 h-16 rounded-full items-center justify-center',
};

// variant별 활성/비활성 컨테이너 색상
const CONTAINER_STYLES: Record<ButtonVariant, { active: string; disabled: string }> = {
  primary: {
    active: 'bg-brand',
    disabled: 'bg-[#E8EAEC]',
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
  primary: { active: 'text-white font-semibold', disabled: 'text-[#9CA3AF] font-semibold' },
  secondary: { active: 'text-gray-800 font-semibold', disabled: 'text-gray-300 font-semibold' },
  outlined: { active: 'text-blue-600 font-semibold', disabled: 'text-gray-300 font-semibold' },
};

// 로딩 스피너 색상 (primary는 흰색, 나머지는 브랜드 컬러)
function getSpinnerColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return '#9CA3AF';
  return variant === 'primary' ? '#FFFFFF' : '#3BC1A8';
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
  accentColor,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // ─── accentColor 처리 ───────────────────────────────────────────────────
  // NativeWind(Tailwind)의 className은 style prop보다 높은 우선순위로 적용됨.
  // 따라서 style={{ borderColor }} 만으로는 border-blue-600 클래스를 이길 수 없음.
  // 해결책: accentColor가 있을 때 className에서 border-blue-600을 직접 제거하고,
  //         borderColor는 style prop으로만 제어해 충돌을 없앰.
  const shouldUseAccent = Boolean(accentColor && variant === 'outlined' && !isDisabled);

  const baseVariantClass = isDisabled
    ? CONTAINER_STYLES[variant].disabled
    : CONTAINER_STYLES[variant].active;

  // accentColor 사용 시 Tailwind의 border-2(굵기)와 border-blue-600(색상) 클래스를 모두 제거.
  // 굵기·색상 모두 style prop으로만 단독 제어해야 NativeWind와 충돌이 없음.
  const resolvedVariantClass = shouldUseAccent
    ? baseVariantClass.replace('border-1', '').replace('border-blue-600', '').trim()
    : baseVariantClass;

  const containerClass = [SIZE_STYLES[size], resolvedVariantClass].join(' ');

  const textClass = [
    'text-sm',
    isDisabled ? TEXT_STYLES[variant].disabled : TEXT_STYLES[variant].active,
  ].join(' ');

  // borderWidth: 1 → 기본 border-2(2px)보다 얇은 1px 테두리
  // borderColor: accentColor → 지정된 색상 적용
  const accentBorderStyle =
    shouldUseAccent ? { borderWidth: 1, borderColor: accentColor } : undefined;

  const accentTextStyle =
    shouldUseAccent ? { color: accentColor } : undefined;

  return (
    <TouchableOpacity
      className={containerClass}
      style={accentBorderStyle}
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
          {/* 아이콘 - 가이드라인에 맞춰 상하좌우 18dp 여백 고정 */}
          {icon && <View style={{ margin: 18 }}>{icon}</View>}
          {/* 라벨 - 가이드라인에 맞춰 좌우 8dp 여백 고정 */}
          {/* weight="semibold": 버튼 라벨은 Pretendard-SemiBold로 시각적 세기가 적절함 */}
          {label && (
            <AppText
              weight="semibold"
              className={textClass}
              style={{ marginHorizontal: 8, ...accentTextStyle }}
            >
              {label}
            </AppText>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
