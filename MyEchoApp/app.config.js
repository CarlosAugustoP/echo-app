const fs = require("fs");
const path = require("path");

const androidGoogleServicesFile = path.join(__dirname, "google-services.json");
const iosGoogleServicesFile = path.join(__dirname, "GoogleService-Info.plist");

module.exports = {
  expo: {
    name: "MyEchoApp",
    slug: "MyEchoApp",
    scheme: "myechoapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      ...(fs.existsSync(iosGoogleServicesFile)
        ? {
            googleServicesFile: "./GoogleService-Info.plist",
          }
        : {}),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      ...(fs.existsSync(androidGoogleServicesFile)
        ? {
            googleServicesFile: "./google-services.json",
          }
        : {}),
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-secure-store",
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
  },
};
