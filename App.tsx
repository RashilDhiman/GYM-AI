/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  ViewStyle,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CameraView } from './src/components/CameraView';
import { DietPlannerCard } from './src/components/DietPlannerCard';

type Screen = 'splash' | 'login' | 'home';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>('splash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginError, setLoginError] = useState('');
  const [displayName, setDisplayName] = useState('Athlete');
  const [tab, setTab] = useState<'coach' | 'diet'>('coach');
  const screenOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setScreen('login'), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    screenOpacity.value = 0;
    screenOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [screen, tab, screenOpacity]);

  const canLogin = useMemo(() => phoneNumber.trim().length >= 10, [phoneNumber]);

  const onLogin = () => {
    const onlyDigits = phoneNumber.replace(/\D/g, '');
    if (onlyDigits.length < 10) {
      setLoginError('Enter a valid phone number.');
      return;
    }
    setLoginError('');
    setDisplayName(`User ${onlyDigits.slice(-4)}`);
    setScreen('home');
  };

  const animatedScreenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: (1 - screenOpacity.value) * 12 }],
  }));

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {screen === 'splash' ? (
          <Animated.View style={[styles.centerWrap, animatedScreenStyle]}>
            <Text style={styles.brand}>GYM AI</Text>
            <Text style={styles.subtitle}>Premium Real-Time AI Coach</Text>
            <ActivityIndicator color="#38bdf8" style={styles.loader} />
          </Animated.View>
        ) : null}

        {screen === 'login' ? (
          <Animated.View style={[styles.loginWrap, animatedScreenStyle]}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginCaption}>Continue with your phone number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748b"
              style={styles.input}
            />
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
            <AnimatedButton
              onPress={onLogin}
              style={[styles.loginBtn, !canLogin && styles.loginBtnDisabled]}
              disabled={!canLogin}>
              <Text style={styles.loginBtnText}>Continue</Text>
            </AnimatedButton>
          </Animated.View>
        ) : null}

        {screen === 'home' ? (
          <>
            <View style={styles.topBar}>
              <View style={styles.glassTopBar}>
                <Text style={styles.welcome}>Welcome, {displayName}</Text>
                <Text style={styles.small}>Train smart. Stay consistent.</Text>
              </View>
            </View>
            <View style={styles.tabRow}>
              <TabButton
                label="AI Coach"
                active={tab === 'coach'}
                onPress={() => setTab('coach')}
              />
              <TabButton
                label="Diet Planner"
                active={tab === 'diet'}
                onPress={() => setTab('diet')}
              />
            </View>
            <Animated.View style={[styles.content, animatedScreenStyle]}>
              {tab === 'coach' ? <CameraView isActive /> : <DietPlannerCard />}
            </Animated.View>
          </>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
        }}
        onPress={onPress}
        style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brand: {
    color: '#e0f2fe',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 8,
  },
  loader: {
    marginTop: 24,
  },
  loginWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  loginCaption: {
    color: '#94a3b8',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.32)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.7)',
    color: '#f8fafc',
    marginBottom: 10,
  },
  errorText: {
    color: '#f87171',
    marginBottom: 10,
  },
  loginBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginBtnDisabled: {
    opacity: 0.45,
  },
  loginBtnText: {
    color: '#082f49',
    fontWeight: '800',
  },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  glassTopBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  welcome: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  small: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.92)',
  },
  tabBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(14,165,233,0.28)',
  },
  tabText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
});

export default App;
