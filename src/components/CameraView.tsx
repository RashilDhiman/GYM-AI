import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useRepCounter } from '../hooks/useRepCounter';
import { useGymStore } from '../store/useGymStore';
import { SkeletonOverlay } from './SkeletonOverlay';
import { BentoStats } from './BentoStats';

type Props = {
  /** When false, camera pipeline pauses (e.g. app background). */
  isActive?: boolean;
};

export function CameraView({ isActive = true }: Props) {
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const [isForeground, setIsForeground] = useState(true);
  const device = useCameraDevice(position);
  const format = useMemo(() => {
    if (device == null) {
      return undefined;
    }
    const preferredFps = 30;
    const supporting = device.formats.filter(
      (f) => f.minFps <= preferredFps && f.maxFps >= preferredFps,
    );
    if (supporting.length > 0) {
      return supporting[0];
    }
    return device.formats[0];
  }, [device]);
  const cameraFps = useMemo(() => {
    if (format == null) {
      return 30;
    }
    const preferred = 30;
    const minFps = format.minFps;
    const maxFps = format.maxFps;
    if (preferred < minFps) {
      return minFps;
    }
    if (preferred > maxFps) {
      return maxFps;
    }
    return preferred;
  }, [format]);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [warnBackStraight, setWarnBackStraight] = useState(false);
  const exerciseMode = useGymStore((s) => s.exerciseMode);
  const incrementRep = useGymStore((s) => s.incrementRep);
  const setBackWarning = useGymStore((s) => s.setBackWarning);

  const landmarks = useSharedValue<number[] | null>(null);
  const { processFrame } = usePoseDetection();
  const { updateRepPhase } = useRepCounter(incrementRep);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setIsForeground(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const onPoseAnalyzed = useCallback(
    (warn: boolean, phase: 'up' | 'down' | 'neutral') => {
      setWarnBackStraight(warn);
      setBackWarning(warn);
      updateRepPhase(phase);
    },
    [setBackWarning, updateRepPhase],
  );
  const onPoseAnalyzedOnJS = Worklets.createRunOnJS(onPoseAnalyzed);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      processFrame(frame, exerciseMode, (result) => {
        'worklet';
        landmarks.value = result.landmarks;
        onPoseAnalyzedOnJS(result.warnBack, result.repPhase);
      });
    },
    [processFrame, exerciseMode, landmarks, onPoseAnalyzedOnJS],
  );

  const cameraTimingProps =
    format != null
      ? {
          format,
          fps: cameraFps,
        }
      : {};

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Camera access is required for pose tracking.</Text>
        <Text style={styles.link} onPress={() => requestPermission()}>
          Grant permission
        </Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7dd3fc" />
        <Text style={styles.hint}>Loading camera…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isForeground}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
        {...cameraTimingProps}
      />
      <SkeletonOverlay landmarks={landmarks} />
      <BentoStats />
      <Pressable
        style={styles.cameraSwitch}
        onPress={() => setPosition((p) => (p === 'back' ? 'front' : 'back'))}>
        <Text style={styles.cameraSwitchText}>
          {position === 'back' ? 'Use Front Camera' : 'Use Back Camera'}
        </Text>
      </Pressable>
      {warnBackStraight ? (
        <View style={styles.warning} pointerEvents="none">
          <Text style={styles.warningText}>Keep Back Straight</Text>
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    padding: 24,
  },
  hint: {
    color: '#e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  link: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(254, 202, 202, 0.6)',
  },
  warningText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cameraSwitch: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cameraSwitchText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
  },
});
