import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SpeedometerScreen() {
  const [speed, setSpeed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastSpeedRef = useRef(0);

  // Speed thresholds to trigger voice alert
  const thresholds = [50, 60, 90, 120];

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Cần quyền truy cập vị trí để đo tốc độ.');
        return;
      }

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500, // Update every 500ms
          distanceInterval: 0,
        },
        (location) => {
          // location.coords.speed is in meters/second. 
          // If speed is -1, it means invalid/stationary in some contexts, but usually handled as 0.
          let speedMs = location.coords.speed || 0;
          if (speedMs < 0) speedMs = 0;

          // Convert to km/h
          const speedKmh = Math.round(speedMs * 3.6);

          handleSpeedChange(speedKmh);
        }
      );
    };

    startLocationTracking();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  const handleSpeedChange = (currentSpeed: number) => {
    const prevSpeed = lastSpeedRef.current;

    // Check if we crossed any threshold upwards
    thresholds.forEach((t) => {
      if (prevSpeed < t && currentSpeed >= t) {
        speakSpeed(t);
      }
    });

    setSpeed(currentSpeed);
    lastSpeedRef.current = currentSpeed;
  };

  const speakSpeed = (num: number) => {
    // Speak the number in Vietnamese if possible, otherwise default
    // We explicitly try 'vi-VN' first.
    Speech.speak(num.toString(), { language: 'vi-VN' });
  };

  // Determine color based on speed for visual feedback
  const getSpeedColor = (s: number) => {
    if (s >= 120) return '#FF3B30'; // Red - Danger
    if (s >= 90) return '#FF9500';  // Orange - Warning
    if (s >= 60) return '#FFCC00';  // Yellow - Caution
    return '#34C759';               // Green - Safe
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

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
    fontFamily: 'System', // Use default system font
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

