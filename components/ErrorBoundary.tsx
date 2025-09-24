import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error', error);
    console.error('[ErrorBoundary] Error info', errorInfo);
    
    // Log specific error types for debugging
    if (error.message.includes('Maximum update depth exceeded')) {
      console.error('[ErrorBoundary] Infinite re-render detected. Check useEffect dependencies and state updates.');
    }
    
    if (error.message.includes('timeout') || error.message.includes('signal timed out')) {
      console.error('[ErrorBoundary] Network timeout detected. Check network connection and API endpoints.');
    }
    
    if (error.message.includes('Cannot update a component while rendering')) {
      console.error('[ErrorBoundary] State update during render detected. Check for setState calls in render methods.');
    }
    
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
  
  getErrorMessage = () => {
    const error = this.state.error;
    if (!error) return "We encountered an unexpected error. Don't worry, it's not your fault.";
    
    if (error.message.includes('timeout') || error.message.includes('signal timed out')) {
      return 'Connection timeout. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Maximum update depth exceeded')) {
      return 'The app encountered a rendering issue. Please try refreshing.';
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.message.includes('Cannot update a component')) {
      return 'The app encountered a state management issue. Please try again.';
    }
    
    return "We encountered an unexpected error. Don't worry, it's not your fault.";
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <View style={styles.iconContainer}>
            <AlertTriangle size={48} color={Colors.light.error} />
          </View>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.getErrorMessage()}
          </Text>
          
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorStack}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <RefreshCw size={20} color="white" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children as React.ReactNode;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: Colors.light.secondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});