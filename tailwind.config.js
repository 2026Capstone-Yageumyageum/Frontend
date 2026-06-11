/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v2: 스타일을 적용할 파일 경로 목록
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── 야금야금 브랜드 컬러 ───────────────────────────────────
        // 메인 포인트 컬러 (버튼, 활성 탭, 뱃지 등에 사용)
        brand: {
          DEFAULT: '#3BC1A8',
          light: '#E8F8F5',   // 배경 tint용 (연한 초록)
          dark: '#2A9D8F',    // 눌렀을 때 darken 효과
        },

        // ─── 텍스트 컬러 ────────────────────────────────────────────
        text: {
          primary: '#1A1C20',    // 기본 텍스트 (카드 제목, 선수명 등)
          secondary: '#8E949A',  // 보조 텍스트 (날짜, 부제목 등)
          disabled: '#C4C9CF',   // 비활성 텍스트
        },

        // ─── 배경 컬러 ──────────────────────────────────────────────
        surface: {
          DEFAULT: '#FFFFFF',    // 카드 배경
          page: '#F2F4F6',       // 전체 페이지 배경 (연한 회색)
          overlay: '#1A1C20',    // 다크 필터칩 배경
        },

        // ─── 구분선 ─────────────────────────────────────────────────
        border: {
          DEFAULT: '#E8EAEC',
        },
      },
      borderRadius: {
        // 카드의 큰 둥근 모서리
        card: '24px',
        chip: '999px', // 완전 원형 (pill)
      },

      // ─── Pretendard 커스텀 폰트 ─────────────────────────────────────────
      // 사용법 예시:
      //   className="font-pretendard"        → Pretendard-Regular
      //   className="font-pretendard-medium"  → Pretendard-Medium
      //   className="font-pretendard-semibold" → Pretendard-SemiBold
      //   className="font-pretendard-bold"    → Pretendard-Bold
      // App.tsx의 useFonts에서 등록한 키 이름과 반드시 일치해야 합니다.
      fontFamily: {
        'pretendard': ['Pretendard-Regular'],
        'pretendard-medium': ['Pretendard-Medium'],
        'pretendard-semibold': ['Pretendard-SemiBold'],
        'pretendard-bold': ['Pretendard-Bold'],
      },
    },
  },
  plugins: [],
};
