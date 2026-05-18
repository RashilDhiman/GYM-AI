import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

/** BlazePose-style edges (indices into 33-landmark buffer). */
const BLAZE_EDGES: ReadonlyArray<readonly [number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32],
];

type Props = {
  landmarks: SharedValue<number[] | null>;
};

export function SkeletonOverlay({ landmarks }: Props) {
  const { width, height } = useWindowDimensions();

  const bonePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const lm = landmarks.value;
    if (lm == null || lm.length < 33 * 4) {
      return p;
    }
    for (const [a, b] of BLAZE_EDGES) {
      const ax = lm[a * 4] * width;
      const ay = lm[a * 4 + 1] * height;
      const bx = lm[b * 4] * width;
      const by = lm[b * 4 + 1] * height;
      p.moveTo(ax, ay);
      p.lineTo(bx, by);
    }
    return p;
  }, [width, height, landmarks]);

  const jointPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const lm = landmarks.value;
    if (lm == null || lm.length < 33 * 4) {
      return p;
    }
    for (let i = 0; i < 33; i++) {
      const x = lm[i * 4] * width;
      const y = lm[i * 4 + 1] * height;
      p.addCircle(x, y, 4);
    }
    return p;
  }, [width, height, landmarks]);

  const boneColor = useMemo(() => Skia.Color('rgba(0, 255, 200, 0.85)'), []);
  const jointColor = useMemo(() => Skia.Color('rgba(255, 255, 255, 0.95)'), []);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path
        path={bonePath}
        style="stroke"
        strokeWidth={3}
        color={boneColor}
        strokeCap="round"
      />
      <Path path={jointPath} style="fill" color={jointColor} />
    </Canvas>
  );
}
