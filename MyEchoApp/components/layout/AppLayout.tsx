import type { ReactNode } from 'react';

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthFooter, type AuthFooterTab } from './AuthFooter';
import { Header, type HeaderVariant } from './Header';

type AppLayoutProps = {
  children: ReactNode;
  headerVariant?: HeaderVariant;
  withHeader?: boolean;
  authFooterTab?: AuthFooterTab;
};

export function AppLayout({
  children,
  headerVariant = 'logo-left',
  withHeader = true,
  authFooterTab,
}: AppLayoutProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bgStandard">
      <StatusBar style="dark" />
      {withHeader ? <Header variant={headerVariant} /> : null}
      <View className="flex-1 px-6 py-8">
        <View className="flex-1 w-full max-w-md self-center">{children}</View>
      </View>
      {authFooterTab ? <AuthFooter activeTab={authFooterTab} /> : null}
    </SafeAreaView>
  );
}
