import { View } from 'react-native';

import { Logo } from '../logo/logo';

type LoginHeaderProps = {
  variant: 'logo-left' | 'logo-middle';
};

export function LoginHeader({ variant }: LoginHeaderProps) {
  const logoPosition =
    variant === 'logo-left' ? 'justify-start' : 'justify-center';

  return (
    <View
      className={`w-full flex-row items-center ${logoPosition} bg-headerMint px-4 py-7`}
    >
      <Logo />
    </View>
  );
}
