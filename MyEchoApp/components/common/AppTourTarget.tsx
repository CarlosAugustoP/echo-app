import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { removeAppTourTargetLayout, updateAppTourTargetLayout } from "../../stores/appTourStore";

type AppTourTargetProps = {
  targetId: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppTourTarget({ targetId, children, className, style }: AppTourTargetProps) {
  const targetRef = useRef<View>(null);

  const measureTarget = useCallback(() => {
    requestAnimationFrame(() => {
      targetRef.current?.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) {
          return;
        }

        updateAppTourTargetLayout(targetId, { x, y, width, height });
      });
    });
  }, [targetId]);

  useEffect(() => {
    const timeoutId = setTimeout(measureTarget, 60);

    return () => {
      clearTimeout(timeoutId);
      removeAppTourTargetLayout(targetId);
    };
  }, [measureTarget, targetId]);

  return (
    <View
      ref={targetRef}
      collapsable={false}
      onLayout={measureTarget}
      className={className}
      style={style}
    >
      {children}
    </View>
  );
}
