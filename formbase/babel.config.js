/*
  Babel configuration for Expo project.
  - Uses Expo preset and Reanimated plugin
  - Kept minimal to avoid plugin conflicts
*/
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};


