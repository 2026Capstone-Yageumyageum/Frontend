// Metro 번들러 설정 파일
// 공식 문서: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 문제: Metro가 node_modules 안의 Gradle 빌드 캐시 폴더들을 감시(watch)하려다가
//          해당 폴더가 없을 경우 ENOENT 에러를 발생시킵니다.
//
// 해결: blockList를 사용해 Gradle이 생성하는 빌드 결과물 경로를
//       Metro 파일 감시 대상에서 완전히 제외합니다.
// ─────────────────────────────────────────────────────────────────────────────
config.resolver.blockList = [
  // expo-modules-core의 Gradle 플러그인 빌드 캐시 경로 제외
  /node_modules\/expo-modules-core\/expo-module-gradle-plugin\/build\/.*/,
  // 그 외 모든 node_modules 내부 Gradle build 폴더 제외 (예방적 조치)
  /node_modules\/.*\/android\/build\/.*/,
];

module.exports = config;
