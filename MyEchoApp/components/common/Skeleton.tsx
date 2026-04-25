import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, type StyleProp, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type SkeletonBlockProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({
  width = "100%",
  height,
  borderRadius = 16,
  className,
  style,
}: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-measuredWidth || -220, measuredWidth || 220],
      }),
    [measuredWidth, shimmer],
  );

  return (
    <View
      className={`overflow-hidden bg-[#E8EEEA] ${className ?? ""}`.trim()}
      style={[{ width, height, borderRadius }, style]}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;

        if (nextWidth !== measuredWidth) {
          setMeasuredWidth(nextWidth);
        }
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: Math.max(96, measuredWidth * 0.45 || 96),
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={["rgba(232,238,234,0)", "rgba(255,255,255,0.82)", "rgba(232,238,234,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
