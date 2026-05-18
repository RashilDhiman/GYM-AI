import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { generateDietPlan } from '../services/gemini';
import { useGymStore } from '../store/useGymStore';

export function DietPlannerCard() {
  const { dietPlan, setDietPlan, isDietLoading, setDietLoading } = useGymStore();
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState('Fat loss while preserving muscle');
  const [dietaryPreference, setDietaryPreference] = useState('High protein vegetarian');
  const [error, setError] = useState('');
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onGenerate = async () => {
    try {
      setError('');
      setDietLoading(true);
      const text = await generateDietPlan({
        age,
        weightKg,
        goal,
        dietaryPreference,
      });
      setDietPlan(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan.');
    } finally {
      setDietLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Gemini Diet Planner</Text>
      <Text style={styles.caption}>
        All pose inference stays on-device. Gemini is used only for personalized meal planning.
      </Text>
      <Input label="Age" value={age} onChangeText={setAge} />
      <Input label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} />
      <Input label="Goal" value={goal} onChangeText={setGoal} />
      <Input
        label="Diet Preference"
        value={dietaryPreference}
        onChangeText={setDietaryPreference}
      />
      <Animated.View style={buttonStyle}>
        <Pressable
          style={styles.button}
          onPressIn={() => {
            buttonScale.value = withTiming(0.98, { duration: 90 });
          }}
          onPressOut={() => {
            buttonScale.value = withTiming(1, { duration: 140 });
          }}
          onPress={onGenerate}
          disabled={isDietLoading}>
          <Text style={styles.buttonText}>
            {isDietLoading ? 'Generating...' : 'Generate 7-Day Plan'}
          </Text>
        </Pressable>
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dietPlan ? (
        <View style={styles.planWrap}>
          <Text style={styles.planTitle}>Generated Plan</Text>
          <Text style={styles.plan}>{dietPlan}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  secret = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secret?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secret}
        style={styles.input}
        placeholderTextColor="#64748b"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, gap: 12 },
  heading: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  caption: { color: '#94a3b8', marginBottom: 4 },
  inputWrap: { gap: 6 },
  inputLabel: { color: '#cbd5e1', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.7)',
    color: '#f8fafc',
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#0f172a', fontWeight: '700' },
  error: { color: '#f87171' },
  planWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    backgroundColor: 'rgba(15,23,42,0.62)',
    padding: 12,
  },
  planTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  plan: { color: '#cbd5e1', lineHeight: 20 },
});

