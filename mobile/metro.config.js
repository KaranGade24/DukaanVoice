const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const nativewindConfig = withNativewind(config);
const nativewindResolver = nativewindConfig.resolver.resolveRequest;

nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const isExpoAsset = /[\\/]node_modules[\\/]expo-asset[\\/]/.test(
    context.originModulePath,
  );

  if (moduleName === "react-native" && isExpoAsset) {
    return context.resolveRequest(context, moduleName, platform);
  }

  return nativewindResolver(context, moduleName, platform);
};

module.exports = nativewindConfig;
