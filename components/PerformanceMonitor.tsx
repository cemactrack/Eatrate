import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export default function PerformanceMonitor({ enabled = false }: PerformanceMonitorProps) {
  const [renderCount, setRenderCount] = useState<number>(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(Date.now());

  const renderCountRef = useRef<number>(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    setRenderCount(renderCountRef.current);
    setLastRenderTime(Date.now());
  });

  if (!enabled || __DEV__ === false) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Renders: {renderCount}</Text>
      <Text style={styles.text}>Last: {new Date(lastRenderTime).toLocaleTimeString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    zIndex: 9999,
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});