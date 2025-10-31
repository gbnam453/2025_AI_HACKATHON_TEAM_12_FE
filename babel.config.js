// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,   // API_URL 비어있으면 undefined 허용 (런타임에서 체크)
      }],
      // ↓ reanimated를 쓰는 경우엔 항상 마지막!
      'react-native-reanimated/plugin',
    ],
  };
};
