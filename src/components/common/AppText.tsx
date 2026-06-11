import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

// ─────────────────────────────────────────────
//  타입 정의
// ─────────────────────────────────────────────

/**
 * weight:
 *  - regular   : Pretendard-Regular  (기본값, 본문)
 *  - medium    : Pretendard-Medium   (중간 강조)
 *  - semibold  : Pretendard-SemiBold (소제목, 레이블)
 *  - bold      : Pretendard-Bold     (제목, 강조)
 */
type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

type AppTextProps = TextProps & {
  weight?: FontWeight;
  children?: React.ReactNode;
};

// ─────────────────────────────────────────────
//  weight → fontFamily 매핑
// ─────────────────────────────────────────────
// App.tsx의 useFonts에서 등록한 키 이름과 반드시 일치해야 합니다.
const FONT_FAMILY: Record<FontWeight, string> = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

// ─────────────────────────────────────────────
//  컴포넌트
// ─────────────────────────────────────────────

/**
 * Pretendard 폰트가 기본 적용된 Text 컴포넌트.
 *
 * 사용 예시:
 *   <AppText>기본 텍스트 (Regular)</AppText>
 *   <AppText weight="bold" style={{ fontSize: 24 }}>제목</AppText>
 *   <AppText weight="semibold" className="text-lg text-gray-900">소제목</AppText>
 *
 * 주의: React Native에서 fontWeight 속성은 커스텀 폰트와 함께 사용하면
 *       플랫폼별로 동작이 다를 수 있으므로, weight prop을 사용하세요.
 */
export default function AppText({
  weight = 'regular',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        // 기본 fontFamily를 먼저 적용하고,
        { fontFamily: FONT_FAMILY[weight] },
        // 호출부에서 전달한 style로 override 가능하게 합니다.
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
