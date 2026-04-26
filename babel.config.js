module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NativeWind v2: Tailwind 클래스를 React Native 스타일로 변환해주는 플러그인
    plugins: ['nativewind/babel'],
  };
};
