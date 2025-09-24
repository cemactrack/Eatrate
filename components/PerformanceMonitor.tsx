import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Wifi,
  X,
  RefreshCw,
  BarChart3,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorCount: number;
  cacheHitRate: number;
  apiResponseTime: number;
  renderCount: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export default function PerformanceMonitor({ enabled = false }: PerformanceMonitorProps) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAdmin();
  const [renderCount, setRenderCount] = useState<number>(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(Date.now());
  const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    renderCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const renderCountRef = useRef<number>(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    setRenderCount(renderCountRef.current);
    setLastRenderTime(Date.now());
  });

  const collectMetrics = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const startTime = performance.now();
      
      // Simulate performance data collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Mock performance metrics (in a real app, these would come from actual monitoring)
      const newMetrics: PerformanceMetrics = {
        renderTime: Math.round(renderTime),
        memoryUsage: Platform.OS === 'web' ? 
          Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || Math.random() * 100) :
          Math.round(Math.random() * 100),
        networkLatency: Math.round(Math.random() * 200 + 50),
        errorCount: Math.floor(Math.random() * 5),
        cacheHitRate: Math.round(Math.random() * 30 + 70),
        apiResponseTime: Math.round(Math.random() * 500 + 100),
        renderCount: renderCountRef.current,
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to collect metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return Colors.light.success;
    if (value <= thresholds.warning) return Colors.light.warning;
    return '#ef4444';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return CheckCircle;
    if (value <= thresholds.warning) return AlertTriangle;
    return AlertTriangle;
  };

  const renderMetricCard = (
    title: string,
    value: number | string,
    unit: string,
    icon: React.ComponentType<any>,
    thresholds?: { good: number; warning: number },
    invert = false
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const color = thresholds ? 
      getStatusColor(invert ? 100 - numValue : numValue, thresholds) : 
      Colors.light.tint;
    const StatusIcon = thresholds ? 
      getStatusIcon(invert ? 100 - numValue : numValue, thresholds) : 
      icon;

    return (
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <StatusIcon size={20} color={color} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={[styles.metricValue, { color }]}>
          {value}{unit}
        </Text>
      </View>
    );
  };

  if (!enabled || (!__DEV__ && !isAdmin)) {
    return null;
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={() => isAdmin && setShowDetailedView(true)}
        activeOpacity={isAdmin ? 0.7 : 1}
      >
        <Text style={styles.text}>Renders: {renderCount}</Text>
        <Text style={styles.text}>Last: {new Date(lastRenderTime).toLocaleTimeString()}</Text>
        {isAdmin && (
          <View style={styles.adminIndicator}>
            <BarChart3 size={12} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {isAdmin && (
        <Modal
          visible={showDetailedView}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailedView(false)}
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Performance Monitor</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={collectMetrics}
                  style={[styles.refreshButton, isRefreshing && styles.refreshing]}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={20} color={Colors.light.tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDetailedView(false)} style={styles.closeButton}>
                  <X size={24} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Application Performance</Text>
                <View style={styles.metricsGrid}>
                  {renderMetricCard(
                    'Render Count',
                    metrics.renderCount,
                    '',
                    Activity
                  )}
                  {renderMetricCard(
                    'Memory Usage',
                    metrics.memoryUsage,
                    'MB',
                    Activity,
                    { good: 50, warning: 80 }
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Network Performance</Text>
                <View style={styles.metricsGrid}>
                  {renderMetricCard(
                    'Network Latency',
                    metrics.networkLatency,
                    'ms',
                    Wifi,
                    { good: 100, warning: 200 }
                  )}
                  {renderMetricCard(
                    'API Response',
                    metrics.apiResponseTime,
                    'ms',
                    Database,
                    { good: 300, warning: 600 }
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Health</Text>
                <View style={styles.metricsGrid}>
                  {renderMetricCard(
                    'Cache Hit Rate',
                    metrics.cacheHitRate,
                    '%',
                    CheckCircle,
                    { good: 80, warning: 60 },
                    true
                  )}
                  {renderMetricCard(
                    'Error Count',
                    metrics.errorCount,
                    '',
                    AlertTriangle,
                    { good: 0, warning: 2 }
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Tips</Text>
                <View style={styles.tipsContainer}>
                  <Text style={styles.tip}>• Keep render times under 16ms for 60fps</Text>
                  <Text style={styles.tip}>• Monitor memory usage to prevent crashes</Text>
                  <Text style={styles.tip}>• Optimize network requests and caching</Text>
                  <Text style={styles.tip}>• Use React.memo() for expensive components</Text>
                  <Text style={styles.tip}>• Implement proper error boundaries</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
    marginRight: 4,
  },
  adminIndicator: {
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  refreshing: {
    opacity: 0.5,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tip: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
});