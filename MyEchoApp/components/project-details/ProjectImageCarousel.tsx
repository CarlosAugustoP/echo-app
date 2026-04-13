import { useMemo, useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from "react-native";

import { normalizeImageUrl } from "./projectDetailsUtils";

type ProjectImageCarouselProps = {
  images: readonly (string | null | undefined)[];
};

export function ProjectImageCarousel({ images }: ProjectImageCarouselProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const validImages = useMemo(
    () =>
      Array.from(
        new Set(
          images
            .map((image) => normalizeImageUrl(image))
            .filter((image): image is string => Boolean(image)),
        ),
      ),
    [images],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!cardWidth || validImages.length <= 1) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveIndex(Math.max(0, Math.min(validImages.length - 1, nextIndex)));
  };

  if (validImages.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View
        className="overflow-hidden rounded-[24px] bg-[#EEF2EE]"
        onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {validImages.map((imageUrl, index) => (
            <View key={`${imageUrl}-${index}`} style={cardWidth ? { width: cardWidth } : undefined}>
              <Image source={{ uri: imageUrl }} className="h-[232px] w-full" resizeMode="cover" />
            </View>
          ))}
        </ScrollView>

        <View className="absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1.5">
          <Text className="text-[11px] font-semibold text-white">
            {activeIndex + 1}/{validImages.length}
          </Text>
        </View>
      </View>

      {validImages.length > 1 ? (
        <View className="flex-row items-center justify-center gap-2">
          {validImages.map((imageUrl, index) => (
            <View
              key={`${imageUrl}-dot-${index}`}
              className={`h-2.5 rounded-full ${index === activeIndex ? "w-6 bg-[#2F7D32]" : "w-2.5 bg-[#D6DDD7]"}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
