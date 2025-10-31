// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],   // ✅ 이걸로 교체
  plugins: [
    // reanimated 안 쓰면 이 줄 두지 말 것:
    // 'react-native-reanimated/plugin',

    // @env 를 쓰는 중이면 유지
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      allowUndefined: false,
      // safe: false,           // 필요시 옵션
    }],
  ],
};
