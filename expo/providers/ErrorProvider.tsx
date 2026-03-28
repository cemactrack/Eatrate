import React, { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import ErrorToast from '@/components/ErrorToast';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  visible: boolean;
}

interface ErrorContextValue {
  showError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  hideError: () => void;
}

export const [ErrorProvider, useError] = createContextHook<ErrorContextValue>(() => {
  const [errorState, setErrorState] = useState<ErrorState>({
    message: '',
    type: 'error',
    visible: false,
  });

  const showError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    if (!message || typeof message !== 'string') return;
    const sanitizedMessage = message.trim().slice(0, 500);
    if (!sanitizedMessage) return;
    
    console.log(`[ErrorProvider] Showing ${type}:`, sanitizedMessage);
    setErrorState({
      message: sanitizedMessage,
      type,
      visible: true,
    });
  }, []);

  const hideError = useCallback(() => {
    setErrorState(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    showError,
    hideError,
    // Render the toast as part of the provider
    ErrorToast: (
      <ErrorToast
        message={errorState.message}
        visible={errorState.visible}
        onDismiss={hideError}
        type={errorState.type}
      />
    ),
  };
});

// Helper function to format API errors nicely
export function formatApiError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Handle Zod validation errors
    if (error.message.includes('validation')) {
      return 'Please check your input and try again.';
    }
    
    // Handle network errors
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    
    // Handle authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'Please log in to continue.';
    }
    
    return error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  // Handle tRPC errors
  if (error?.shape?.message) {
    return error.shape.message;
  }

  return 'Something went wrong. Please try again.';
}

// Hook to handle API errors automatically
export function useApiErrorHandler() {
  const { showError } = useError();

  return useCallback((error: any) => {
    if (!error) return;
    const message = formatApiError(error);
    showError(message, 'error');
  }, [showError]);
}