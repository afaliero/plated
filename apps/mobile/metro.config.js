// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

// getDefaultConfig already detects the pnpm workspace root and sets up
// watchFolders / nodeModulesPaths for it, so don't hand-roll those here —
// overriding them is what usually breaks monorepo resolution.
const config = getDefaultConfig(__dirname);

// Route .svg through react-native-svg-transformer so an import returns a React
// component (<Icon width={24} color="…" />) instead of an image asset.
// It has to move from assetExts to sourceExts for that to happen.
config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = config;
