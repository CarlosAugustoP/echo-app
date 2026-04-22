const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { resolve } = require("metro-resolver");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  buffer: path.resolve(__dirname, "node_modules/buffer"),
  crypto: path.resolve(__dirname, "node_modules/react-native-crypto"),
  events: path.resolve(__dirname, "node_modules/events"),
  process: path.resolve(__dirname, "node_modules/process/browser.js"),
  stream: path.resolve(__dirname, "node_modules/stream"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const normalizedModuleName = moduleName === "node:crypto" ? "crypto" : moduleName;
  return resolve(context, normalizedModuleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
