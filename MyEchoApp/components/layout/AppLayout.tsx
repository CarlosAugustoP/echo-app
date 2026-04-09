import type { ReactNode } from 'react';

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, type HeaderVariant } from './Header';

type AppLayoutProps = {
  children: ReactNode;
  headerVariant?: HeaderVariant;
  withHeader?: boolean;
};

export function AppLayout({
  children,
  headerVariant = 'logo-left',
  withHeader = true,
}: AppLayoutProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bgStandard">
      <StatusBar style="dark" />
      {withHeader ? <Header variant={headerVariant} /> : null}
      <View className="flex-1 px-6 py-8">
        <View className="flex-1 w-full max-w-md self-center">{children}</View>
      </View>
    </SafeAreaView>
  );
}
