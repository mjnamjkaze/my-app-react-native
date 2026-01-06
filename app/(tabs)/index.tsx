import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppSettings, DEFAULT_SETTINGS, loadSettings } from '@/constants/settings';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SpeedometerScreen() {
  const router = useRouter();
  const [speed, setSpeed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const lastSpeedRef = useRef(0);
  const locationSubscriber = useRef<Location.LocationSubscription | null>(null);

  // Load settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const initInfo = async () => {
        const s = await loadSettings();
        setSettings(s);
        restartTracking(s);
      };
      initInfo();

      return () => {
        // Cleanup on blur if needed, or keep running?
        // Usually we keep speedometer running, but let's re-subscribe if settings change.
      };
    }, [])
  );

  const restartTracking = async (currentSettings: AppSettings) => {
    if (locationSubscriber.current) {
      locationSubscriber.current.remove();
      locationSubscriber.current = null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Cần quyền truy cập vị trí để đo tốc độ.');
      return;
    }

    locationSubscriber.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: currentSettings.sampleRateMs,
        distanceInterval: 0,
      },
      (location) => {
        let speedMs = location.coords.speed || 0;
        if (speedMs < 0) speedMs = 0;

        const speedKmh = Math.round(speedMs * 3.6);
        handleSpeedChange(speedKmh, currentSettings);
      }
    );
  };

  const handleSpeedChange = (currentSpeed: number, currentSettings: AppSettings) => {
    const prevSpeed = lastSpeedRef.current;

    // Check thresholds
    currentSettings.voiceThresholds.forEach((t) => {
      // Trigger if we cross from below to equal/above
      if (prevSpeed < t && currentSpeed >= t) {
        speakSpeed(t, currentSettings.voiceTemplate);
      }
    });

    setSpeed(currentSpeed);
    lastSpeedRef.current = currentSpeed;
  };

  const speakSpeed = (num: number, template: string) => {
    const textToSpeak = template.replace('{speed}', num.toString());
    Speech.speak(textToSpeak, { language: 'vi-VN' });
  };

  // Determine color based on speed for visual feedback
  // Using hardcoded visual ranges for safety colors, independent of voice thresholds
  const getSpeedColor = (s: number) => {
    if (s >= 120) return '#FF3B30';
    if (s >= 90) return '#FF9500';
    if (s >= 60) return '#FFCC00';
    return '#34C759';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <IconSymbol name="chevron.right" size={24} color="#666" style={{ transform: [{ rotate: '90deg' }] }} />
        {/* Using a placeholder icon or gear if available. MaterialIcons 'settings' is better but IconSymbol maps SF symbols. 
            Let's use a text or custom icon if IconSymbol doesn't have settings. 
            Actually IconSymbol has a mapping. Let's assume we can add 'gear' mapping or just use a text button for now to be safe,
            OR use the existing IconSymbol and map 'gear' to 'settings'.
        */}
        <Text style={styles.settingsText}>⚙️</Text>
      </TouchableOpacity>

      {errorMsg ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.label}>TỐC ĐỘ</Text>
          <Text style={[styles.speedText, { color: getSpeedColor(speed) }]}>
            {speed}
          </Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
    padding: 10,
  },
  settingsText: {
    fontSize: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#888',
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 20,
    fontFamily: 'System',
  },
  speedText: {
    fontSize: 180,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    lineHeight: 180,
    fontFamily: 'System',
  },
  unitText: {
    color: '#888',
    fontSize: 32,
    marginTop: 10,
    fontFamily: 'System',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

