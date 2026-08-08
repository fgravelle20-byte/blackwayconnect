import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.blackwayconnect.app",
  appName: "BlackWay Connect",
  webDir: "dist",
  server: {
    androidScheme: "https",
    allowNavigation: [
      "blackwayconnect.com",
      "*.blackwayconnect.com",
      "buy.stripe.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#000000",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
  },
};

export default config;
