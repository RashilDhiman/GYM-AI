import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGymStore } from '../store/useGymStore';

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function BentoStats() {
  const {
    repCount,
    elapsedSec,
    isSessionRunning,
    exerciseMode,
    setExerciseMode,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    tickSession,
    backWarning,
  } = useGymStore();

  useEffect(() => {
    const id = setInterval(() => tickSession(), 1000);
    return () => clearInterval(id);
  }, [tickSession]);

  return (
    <View style={styles.grid}>
      <GlassTile title="Reps" value={`${repCount}`} />
      <GlassTile title="Session" value={formatTime(elapsedSec)} />
      <GlassTile title="State" value={isSessionRunning ? 'Running' : 'Paused'} />
      <GlassTile title="Mode" value={modeLabel(exerciseMode)} />
      <GlassTile title="Form" value={backWarning ? 'Fix Back' : 'Good'} warn={backWarning} />
      <View style={[styles.tile, styles.wide]}>
        <Text style={styles.title}>Session Controls</Text>
        <View style={styles.row}>
          <ModeButton label="Start" active={false} onPress={startSession} />
          <ModeButton
            label={isSessionRunning ? 'Pause' : 'Resume'}
            active={isSessionRunning}
            onPress={isSessionRunning ? pauseSession : resumeSession}
          />
          <ModeButton label="Stop" active={false} onPress={stopSession} />
        </View>
      </View>
      <View style={[styles.tile, styles.wide]}>
        <Text style={styles.title}>Exercise Mode</Text>
        <View style={styles.row}>
          <ModeButton
            label="Squat"
            active={exerciseMode === 'squat'}
            onPress={() => setExerciseMode('squat')}
          />
          <ModeButton
            label="Bicep Curl"
            active={exerciseMode === 'bicepCurl'}
            onPress={() => setExerciseMode('bicepCurl')}
          />
          <ModeButton
            label="Lunge"
            active={exerciseMode === 'lunge'}
            onPress={() => setExerciseMode('lunge')}
          />
          <ModeButton
            label="Push-up"
            active={exerciseMode === 'pushup'}
            onPress={() => setExerciseMode('pushup')}
          />
        </View>
      </View>
    </View>
  );
}

function modeLabel(mode: 'squat' | 'bicepCurl' | 'lunge' | 'pushup') {
  if (mode === 'squat') {
    return 'Squat';
  }
  if (mode === 'bicepCurl') {
    return 'Bicep Curl';
  }
  if (mode === 'lunge') {
    return 'Lunge';
  }
  return 'Push-up';
}

function GlassTile({
  title,
  value,
  warn = false,
}: {
  title: string;
  value: string;
  warn?: boolean;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withTiming(warn ? 1.02 : 1, { duration: 220 });
  }, [warn, pulse]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.tile, animatedStyle]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, warn && styles.warn]}>{value}</Text>
    </Animated.View>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
        }}
        onPress={onPress}
        style={[styles.modeButton, active && styles.modeButtonActive]}>
        <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '47%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  wide: {
    width: '100%',
  },
  title: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  warn: {
    color: '#f87171',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  modeButton: {
    minWidth: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
  },
  modeButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  modeText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#e0f2fe',
  },
});

