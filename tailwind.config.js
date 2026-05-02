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
    },
  },
  plugins: [],
};
