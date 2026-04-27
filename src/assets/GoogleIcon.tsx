import React from 'react';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';

// ─────────────────────────────────────────────
//  GoogleIcon
//  - 공식 Google "G" 로고를 SVG로 구현
//  - react-native-svg를 사용해 Expo Go에서도 정상 동작
// ─────────────────────────────────────────────

type GoogleIconProps = {
  /** 아이콘 크기 (width = height, 기본값 24) */
  size?: number;
};

export default function GoogleIcon({ size = 24 }: GoogleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        {/* 24x24 영역 밖으로 삐져나오지 않도록 클리핑 */}
        <ClipPath id="googleClip">
          <Rect width="24" height="24" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#googleClip)">
        {/* 파란색: G 우측 상단 */}
        <Path
          d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          fill="#4285F4"
        />
        {/* 초록색: G 우측 하단 */}
        <Path
          d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
          fill="#34A853"
        />
        {/* 노란색: G 좌측 하단 */}
        <Path
          d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
          fill="#FBBC05"
        />
        {/* 빨간색: G 좌측 상단 */}
        <Path
          d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );
}
